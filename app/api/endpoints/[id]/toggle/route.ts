import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import dbConnect from "@/lib/db/connection";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/endpoints/:id/toggle - Toggle endpoint enabled/disabled
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const endpoint = await WebhookEndpoint.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    // Toggle the enabled status
    endpoint.isEnabled = !endpoint.isEnabled;
    await endpoint.save();

    return NextResponse.json({
      endpoint: endpoint.toObject(),
      isEnabled: endpoint.isEnabled,
    });
  } catch (error) {
    console.error("Error toggling endpoint:", error);
    return NextResponse.json(
      { error: "Failed to toggle endpoint" },
      { status: 500 }
    );
  }
}
