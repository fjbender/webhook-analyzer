import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import WebhookLog from "@/lib/db/models/WebhookLog";
import { decrypt, verifySignature } from "@/lib/crypto";
import { forwardWebhook } from "@/lib/forwarding";
import type { IWebhookEndpoint } from "@/lib/db/models/WebhookEndpoint";

type RouteParams = {
  params: Promise<{
    userId: string;
    endpointId: string;
  }>;
};

// Async forwarding function to not block webhook response
async function forwardWebhookAsync(
  logId: string,
  endpoint: IWebhookEndpoint,
  rawBody: string,
  originalHeaders: Record<string, string>
) {
  try {
    // Get content-type from original request, default to JSON for next-gen
    const contentType = originalHeaders["content-type"] || "application/json";
    
    const result = await forwardWebhook(rawBody, contentType, {
      url: endpoint.forwardingUrl!,
      headers: endpoint.forwardingHeaders,
      timeout: endpoint.forwardingTimeout,
    });

    await WebhookLog.findByIdAndUpdate(logId, {
      forwardedAt: new Date(),
      forwardingUrl: endpoint.forwardingUrl,
      forwardingStatus: result.status,
      forwardingError: result.error,
      forwardingTimeMs: result.timeMs,
    });
  } catch (error) {
    console.error("Failed to log forwarding result:", error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { userId, endpointId } = await params;
  
  try {
    await dbConnect();

    // Find the endpoint and verify it exists and is enabled
    const endpoint = await WebhookEndpoint.findOne({
      _id: endpointId,
      userId: userId,
      type: "nextgen",
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    if (!endpoint.isEnabled) {
      return NextResponse.json(
        { error: "Endpoint is disabled" },
        { status: 403 }
      );
    }

    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get the raw body for signature verification
    const rawBody = await request.text();
    let body: any;
    
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      await WebhookLog.create({
        endpointId: endpointId,
        userId: userId,
        receivedAt: new Date(),
        processingTimeMs: processingTime,
        requestHeaders: headers,
        requestBody: rawBody,
        rawBody: rawBody,
        ipAddress,
        userAgent,
        status: "invalid",
      });

      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Extract signature from headers
    // Mollie uses x-mollie-signature header (lowercase)
    const signatureHeader = request.headers.get("x-mollie-signature") || "";

    // Extract event type from payload if available
    // Mollie's actual field is "type" not "event"
    const eventType = body.type || body.event || body.eventType || undefined;

    let isValidSignature = false;
    let signatureError: string | undefined;

    // Verify the signature if we have both header and shared secret
    if (signatureHeader && endpoint.sharedSecret) {
      try {
        const decryptedSecret = decrypt(endpoint.sharedSecret);
        isValidSignature = verifySignature(rawBody, signatureHeader, decryptedSecret);
        
        if (!isValidSignature) {
          signatureError = "Signature verification failed";
        }
      } catch (error) {
        signatureError = error instanceof Error ? error.message : "Signature verification error";
      }
    } else if (!signatureHeader) {
      signatureError = "Missing signature header";
    } else if (!endpoint.sharedSecret) {
      signatureError = "No shared secret configured";
    }

    // Check if event type matches filter (if set and signature is valid)
    if (isValidSignature && endpoint.eventTypeFilter && endpoint.eventTypeFilter.length > 0) {
      if (eventType && !endpoint.eventTypeFilter.includes(eventType)) {
        // Silently ignore webhooks that don't match the filter
        return NextResponse.json({ ok: true, filtered: true });
      }
    }

    // Store the webhook log - ALWAYS store, regardless of signature validity
    const processingTime = Date.now() - startTime;
    const status = isValidSignature ? "success" : "signature_failed";

    const webhookLog = await WebhookLog.create({
      endpointId: endpointId,
      userId: userId,
      receivedAt: new Date(),
      processingTimeMs: processingTime,
      requestHeaders: headers,
      requestBody: body,
      rawBody: rawBody,
      ipAddress,
      userAgent,
      eventType,
      signatureValid: isValidSignature,
      signatureHeader,
      fetchError: signatureError, // Store signature error in fetchError field
      status,
    });

    // Update endpoint statistics (only for valid signatures)
    if (isValidSignature) {
      endpoint.totalReceived += 1;
      endpoint.lastReceivedAt = new Date();
      await endpoint.save();

      // Forward webhook if enabled (async, don't block response)
      if (endpoint.forwardingEnabled && endpoint.forwardingUrl) {
        forwardWebhookAsync(webhookLog._id.toString(), endpoint, rawBody, headers).catch((err) => {
          console.error("Forwarding error:", err);
        });
      }
    }

    // ALWAYS return 200 OK to prevent Mollie from retrying
    // This allows us to capture and inspect invalid webhooks
    return NextResponse.json({ 
      ok: true, 
      signatureValid: isValidSignature,
      ...(signatureError && { warning: signatureError })
    });

  } catch (error) {
    console.error("Error processing next-gen webhook:", error);
    
    // Still return 200 for valid-looking requests to prevent retries
    const processingTime = Date.now() - startTime;
    try {
      await WebhookLog.create({
        endpointId: endpointId,
        userId: userId,
        receivedAt: new Date(),
        processingTimeMs: processingTime,
        requestHeaders: {},
        requestBody: {},
        status: "invalid",
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json({ ok: true });
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Next-gen webhook endpoint is active",
    method: "POST",
  });
}
