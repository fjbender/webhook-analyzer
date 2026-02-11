import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import dbConnect from "@/lib/db/connection";
import WebhookLog from "@/lib/db/models/WebhookLog";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";

// GET /api/webhook-logs - List webhook logs with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filters
    const endpointId = searchParams.get("endpointId");
    const status = searchParams.get("status");
    const resourceType = searchParams.get("resourceType");
    const eventType = searchParams.get("eventType");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const search = searchParams.get("search");

    // Build query
    const query: any = { userId: session.user.id };

    if (endpointId) {
      query.endpointId = endpointId;
    }

    if (status) {
      query.status = status;
    }

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (fromDate || toDate) {
      query.receivedAt = {};
      if (fromDate) {
        query.receivedAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.receivedAt.$lte = new Date(toDate);
      }
    }

    if (search) {
      // Search in resource ID or request body
      query.$or = [
        { resourceId: { $regex: search, $options: "i" } },
        { "requestBody.id": { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await WebhookLog.countDocuments(query);

    // Fetch logs
    const logs = await WebhookLog.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("endpointId", "name type")
      .lean();

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 }
    );
  }
}
