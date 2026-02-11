import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import WebhookLog from "@/lib/db/models/WebhookLog";
import MollieApiKey from "@/lib/db/models/MollieApiKey";
import { MollieClient, getResourceType } from "@/lib/mollie/client";
import { decrypt } from "@/lib/crypto";
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
    // Get content-type from original request
    const contentType = originalHeaders["content-type"] || "application/x-www-form-urlencoded";
    
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
      type: "classic",
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

    // Extract headers and body
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get the raw body first for forwarding
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";
    
    // Parse the body for processing
    let body: any;
    if (contentType.includes("application/json")) {
      body = JSON.parse(rawBody);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form data manually
      body = {};
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => {
        body[key] = value;
      });
    } else {
      body = rawBody;
    }

    // Extract resource ID from the webhook payload
    // Mollie classic webhooks send either { id: "xxx" } or id=xxx in form data
    const resourceId = typeof body === "object" ? body.id : body;

    if (!resourceId || typeof resourceId !== "string") {
      // Log the invalid webhook
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
        status: "invalid",
      });

      return NextResponse.json(
        { error: "Invalid webhook payload: missing 'id' field" },
        { status: 400 }
      );
    }

    // Determine resource type from ID
    const resourceType = getResourceType(resourceId);

    // Check if resource type matches filter (if set)
    if (endpoint.resourceTypeFilter && endpoint.resourceTypeFilter.length > 0) {
      if (!endpoint.resourceTypeFilter.includes(resourceType)) {
        // Silently ignore webhooks that don't match the filter
        return NextResponse.json({ ok: true, filtered: true });
      }
    }

    // Get the API key for fetching the resource
    if (!endpoint.mollieApiKeyId) {
      // Log without fetched resource
      const processingTime = Date.now() - startTime;
      await WebhookLog.create({
        endpointId: endpointId,
        userId: userId,
        receivedAt: new Date(),
        processingTimeMs: processingTime,
        requestHeaders: headers,
        requestBody: body,
        ipAddress,
        userAgent,
        resourceType,
        resourceId,
        status: "fetch_failed",
        fetchError: "No API key configured for endpoint",
      });

      return NextResponse.json({ ok: true });
    }

    const apiKeyDoc = await MollieApiKey.findById(endpoint.mollieApiKeyId);
    
    if (!apiKeyDoc) {
      const processingTime = Date.now() - startTime;
      await WebhookLog.create({
        endpointId: endpointId,
        userId: userId,
        receivedAt: new Date(),
        processingTimeMs: processingTime,
        requestHeaders: headers,
        requestBody: body,
        ipAddress,
        userAgent,
        resourceType,
        resourceId,
        status: "fetch_failed",
        fetchError: "API key not found",
      });

      return NextResponse.json({ ok: true });
    }

    // Decrypt the API key
    const decryptedApiKey = decrypt(apiKeyDoc.encryptedKey);
    const mollieClient = new MollieClient(decryptedApiKey);

    // Fetch the resource from Mollie
    let fetchedResource: any;
    let fetchError: string | undefined;
    let status: "success" | "fetch_failed" = "success";

    try {
      fetchedResource = await mollieClient.fetchResource(resourceId);
    } catch (error: any) {
      fetchError = error.message || "Failed to fetch resource from Mollie";
      status = "fetch_failed";
    }

    // Store the webhook log
    const processingTime = Date.now() - startTime;
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
      resourceType,
      resourceId,
      fetchedResource,
      fetchError,
      status,
    });

    // Update endpoint statistics
    endpoint.totalReceived += 1;
    endpoint.lastReceivedAt = new Date();
    await endpoint.save();

    // Forward webhook if enabled (async, don't block response)
    if (endpoint.forwardingEnabled && endpoint.forwardingUrl) {
      forwardWebhookAsync(webhookLog._id.toString(), endpoint, rawBody, headers).catch((err) => {
        console.error("Forwarding error:", err);
      });
    }

    // Return 200 OK to Mollie
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Error processing classic webhook:", error);
    
    // Still return 200 to prevent Mollie from retrying
    // But log the error
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
        fetchError: error instanceof Error ? error.message : "Unknown error",
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
    message: "Classic webhook endpoint is active",
    method: "POST",
  });
}
