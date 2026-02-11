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
    // Mollie uses X-Mollie-Signature or Mollie-Signature header
    const signatureHeader = request.headers.get("x-mollie-signature") || 
                           request.headers.get("mollie-signature") || 
                           "";

    if (!signatureHeader) {
      const processingTime = Date.now() - startTime;
      await WebhookLog.create({
        endpointId: endpointId,
        userId: userId,
        receivedAt: new Date(),
        processingTimeMs: processingTime,
        requestHeaders: headers,
        requestBody: body,
        rawBody: rawBody,
        ipAddress,
        userAgent,
        status: "signature_failed",
        signatureValid: false,
      });

      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 }
      );
    }

    // Verify the signature
    if (!endpoint.sharedSecret) {
      const processingTime = Date.now() - startTime;
      await WebhookLog.create({
        endpointId: endpointId,
        userId: userId,
        receivedAt: new Date(),
        processingTimeMs: processingTime,
        requestHeaders: headers,
        requestBody: body,
        rawBody: rawBody,
        ipAddress,
        userAgent,
        signatureHeader,
        status: "signature_failed",
        signatureValid: false,
      });

      return NextResponse.json(
        { error: "No shared secret configured" },
        { status: 500 }
      );
    }

    // Decrypt the shared secret
    const decryptedSecret = decrypt(endpoint.sharedSecret);

    // Verify the HMAC signature
    const isValidSignature = verifySignature(rawBody, signatureHeader, decryptedSecret);

    // Extract event type from payload if available
    const eventType = body.event || body.type || body.eventType || undefined;

    // Check if event type matches filter (if set)
    if (isValidSignature && endpoint.eventTypeFilter && endpoint.eventTypeFilter.length > 0) {
      if (eventType && !endpoint.eventTypeFilter.includes(eventType)) {
        // Silently ignore webhooks that don't match the filter
        return NextResponse.json({ ok: true, filtered: true });
      }
    }

    // Store the webhook log
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

    // Return appropriate response
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });

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
