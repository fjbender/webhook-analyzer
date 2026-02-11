/**
 * Webhook forwarding utility
 * Forwards webhook payloads to configured external URLs
 */

export interface ForwardingConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ForwardingResult {
  success: boolean;
  status?: number;
  timeMs: number;
  error?: string;
}

/**
 * Forward webhook payload to external URL
 * @param rawBody - The raw body string from the original request
 * @param contentType - The original Content-Type header
 * @param config - Forwarding configuration
 */
export async function forwardWebhook(
  rawBody: string,
  contentType: string,
  config: ForwardingConfig
): Promise<ForwardingResult> {
  const startTime = Date.now();
  const timeout = config.timeout || 30000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use fetch with manual redirect handling to preserve POST method
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "User-Agent": "Webhook-Analyzer/1.0",
        ...config.headers,
      },
      body: rawBody,
      signal: controller.signal,
      redirect: "manual", // Handle redirects manually to preserve POST
    });

    clearTimeout(timeoutId);

    const timeMs = Date.now() - startTime;

    // Handle redirects manually by following them with POST
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        console.log(`Following redirect to: ${location}`);
        
        // Make a new request with POST to the redirect location
        const redirectController = new AbortController();
        const redirectTimeoutId = setTimeout(
          () => redirectController.abort(),
          timeout - timeMs
        );

        const redirectResponse = await fetch(location, {
          method: "POST",
          headers: {
            "Content-Type": contentType,
            "User-Agent": "Webhook-Analyzer/1.0",
            ...config.headers,
          },
          body: rawBody,
          signal: redirectController.signal,
        });

        clearTimeout(redirectTimeoutId);

        const finalTimeMs = Date.now() - startTime;

        if (!redirectResponse.ok) {
          const errorText = await redirectResponse.text().catch(() => "");
          return {
            success: false,
            status: redirectResponse.status,
            timeMs: finalTimeMs,
            error: `HTTP ${redirectResponse.status} (after redirect): ${errorText.substring(0, 200)}`,
          };
        }

        return {
          success: true,
          status: redirectResponse.status,
          timeMs: finalTimeMs,
        };
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        success: false,
        status: response.status,
        timeMs,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    return {
      success: true,
      status: response.status,
      timeMs,
    };
  } catch (error: any) {
    const timeMs = Date.now() - startTime;

    if (error.name === "AbortError") {
      return {
        success: false,
        timeMs,
        error: `Timeout after ${timeout}ms`,
      };
    }

    return {
      success: false,
      timeMs,
      error: error.message || "Unknown forwarding error",
    };
  }
}
