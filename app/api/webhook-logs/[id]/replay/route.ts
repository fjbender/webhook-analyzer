import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import dbConnect from "@/lib/db/connection";
import WebhookLog from "@/lib/db/models/WebhookLog";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import { forwardWebhook } from "@/lib/forwarding";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { target } = body; // 'endpoint' or 'forward'

    await dbConnect();

    // Get original webhook log
    const originalLog = await WebhookLog.findById(id);

    if (!originalLog) {
      return NextResponse.json(
        { error: "Webhook log not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (originalLog.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get endpoint configuration
    const endpoint = await WebhookEndpoint.findById(originalLog.endpointId);

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    // Determine target URL
    let targetUrl: string;
    let targetType: string;

    if (target === "forward" && endpoint.forwardingEnabled && endpoint.forwardingUrl) {
      targetUrl = endpoint.forwardingUrl;
      targetType = "forward";
    } else {
      // Replay to original endpoint
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      targetUrl = `${baseUrl}/api/webhooks/${endpoint.type}/${endpoint.userId}/${endpoint._id}`;
      targetType = "endpoint";
    }

    // Get the original content type
    const contentType = originalLog.requestHeaders?.["content-type"] || 
                       (endpoint.type === "classic" ? "application/x-www-form-urlencoded" : "application/json");

    // Use rawBody if available, otherwise fallback to requestBody
    const bodyToSend = originalLog.rawBody || JSON.stringify(originalLog.requestBody);

    // Forward the webhook
    const result = await forwardWebhook(bodyToSend, contentType, {
      url: targetUrl,
      headers: endpoint.forwardingHeaders,
      timeout: endpoint.forwardingTimeout,
    });

    // Create replay log entry
    const replayLog = await WebhookLog.create({
      endpointId: originalLog.endpointId,
      userId: originalLog.userId,
      receivedAt: new Date(),
      processingTimeMs: result.timeMs,
      requestHeaders: originalLog.requestHeaders,
      requestBody: originalLog.requestBody,
      rawBody: originalLog.rawBody,
      ipAddress: originalLog.ipAddress,
      userAgent: originalLog.userAgent,
      resourceType: originalLog.resourceType,
      resourceId: originalLog.resourceId,
      eventType: originalLog.eventType,
      status: result.success ? "success" : "invalid",
      isReplay: true,
      originalLogId: originalLog._id,
      replayedAt: new Date(),
      replayedBy: session.user.id,
      forwardedAt: new Date(),
      forwardingUrl: targetUrl,
      forwardingStatus: result.status,
      forwardingError: result.error,
      forwardingTimeMs: result.timeMs,
    });

    return NextResponse.json({
      success: result.success,
      replayLogId: replayLog._id,
      targetUrl,
      targetType,
      status: result.status,
      timeMs: result.timeMs,
      error: result.error,
    });
  } catch (error) {
    console.error("Error replaying webhook:", error);
    return NextResponse.json(
      { error: "Failed to replay webhook" },
      { status: 500 }
    );
  }
}
