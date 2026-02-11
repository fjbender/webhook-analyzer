import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import dbConnect from "@/lib/db/connection";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import MollieApiKey from "@/lib/db/models/MollieApiKey";
import { createEndpointSchema } from "@/lib/validation/endpoints";
import { ZodError } from "zod";

// GET /api/endpoints - List all endpoints for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const endpoints = await WebhookEndpoint.find({ userId: session.user.id })
      .populate("mollieApiKeyId", "label lastFourChars")
      .sort({ createdAt: -1 })
      .lean();

    // Add userId to each endpoint for URL generation
    const endpointsWithUserId = endpoints.map(endpoint => ({
      ...endpoint,
      userId: session.user.id,
    }));

    return NextResponse.json({ endpoints: endpointsWithUserId });
  } catch (error) {
    console.error("Error fetching endpoints:", error);
    return NextResponse.json(
      { error: "Failed to fetch endpoints" },
      { status: 500 }
    );
  }
}

// POST /api/endpoints - Create a new endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEndpointSchema.parse(body);

    await dbConnect();

    // For classic endpoints, verify the API key exists and belongs to the user
    if (validatedData.type === "classic") {
      const apiKey = await MollieApiKey.findOne({
        _id: validatedData.mollieApiKeyId,
        userId: session.user.id,
      });

      if (!apiKey) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 }
        );
      }
    }

    // For next-gen endpoints, encrypt the shared secret
    if (validatedData.type === "nextgen" && validatedData.sharedSecret) {
      const { encrypt } = await import("@/lib/crypto");
      validatedData.sharedSecret = encrypt(validatedData.sharedSecret);
    }

    // Create the endpoint
    const endpoint = await WebhookEndpoint.create({
      ...validatedData,
      userId: session.user.id,
    });

    // Populate the API key info for response
    await endpoint.populate("mollieApiKeyId", "label lastFourChars");

    // Generate the webhook URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/${validatedData.type}/${session.user.id}/${endpoint._id}`;

    return NextResponse.json(
      {
        endpoint: endpoint.toObject(),
        webhookUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating endpoint:", error);
    return NextResponse.json(
      { error: "Failed to create endpoint" },
      { status: 500 }
    );
  }
}
