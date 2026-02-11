import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import dbConnect from "@/lib/db/connection";
import WebhookLog from "@/lib/db/models/WebhookLog";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/webhook-logs/:id - Get a specific webhook log
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const log = await WebhookLog.findOne({
      _id: id,
      userId: session.user.id,
    })
      .populate("endpointId", "name type")
      .lean();

    if (!log) {
      return NextResponse.json({ error: "Webhook log not found" }, { status: 404 });
    }

    return NextResponse.json({ log });
  } catch (error) {
    console.error("Error fetching webhook log:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook log" },
      { status: 500 }
    );
  }
}

// DELETE /api/webhook-logs/:id - Delete a webhook log
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const log = await WebhookLog.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!log) {
      return NextResponse.json({ error: "Webhook log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook log:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook log" },
      { status: 500 }
    );
  }
}
