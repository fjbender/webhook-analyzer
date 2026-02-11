import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import dbConnect from "@/lib/db/connection";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import { updateEndpointSchema } from "@/lib/validation/endpoints";
import { ZodError } from "zod";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/endpoints/:id - Get a specific endpoint
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    })
      .populate("mollieApiKeyId", "label lastFourChars")
      .lean();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    // Generate the webhook URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/${endpoint.type}/${session.user.id}/${endpoint._id}`;

    return NextResponse.json({ endpoint, webhookUrl });
  } catch (error) {
    console.error("Error fetching endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch endpoint" },
      { status: 500 }
    );
  }
}

// PUT /api/endpoints/:id - Update an endpoint
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateEndpointSchema.parse(body);

    await dbConnect();

    // Find the endpoint
    const endpoint = await WebhookEndpoint.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    // If updating shared secret, encrypt it
    if (validatedData.sharedSecret) {
      const { encrypt } = await import("@/lib/crypto");
      validatedData.sharedSecret = encrypt(validatedData.sharedSecret);
    }

    // Update the endpoint
    Object.assign(endpoint, validatedData);
    await endpoint.save();

    // Populate the API key info
    await endpoint.populate("mollieApiKeyId", "label lastFourChars");

    return NextResponse.json({ endpoint: endpoint.toObject() });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating endpoint:", error);
    return NextResponse.json(
      { error: "Failed to update endpoint" },
      { status: 500 }
    );
  }
}

// DELETE /api/endpoints/:id - Delete an endpoint
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const endpoint = await WebhookEndpoint.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    // TODO: Optionally delete associated webhook logs
    // await WebhookLog.deleteMany({ endpointId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting endpoint:", error);
    return NextResponse.json(
      { error: "Failed to delete endpoint" },
      { status: 500 }
    );
  }
}
