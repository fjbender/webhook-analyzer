import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/connection";
import { MollieApiKey } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { updateMollieApiKeySchema } from "@/lib/validation/mollie-keys";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/mollie-keys/:id - Get single API key
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid API key ID" }, { status: 400 });
    }

    await dbConnect();

    const apiKey = await MollieApiKey.findOne({
      _id: id,
      userId: user.id,
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({
      apiKey: {
        id: apiKey._id.toString(),
        label: apiKey.label,
        lastFourChars: apiKey.lastFourChars,
        isDefault: apiKey.isDefault,
        isValid: apiKey.isValid,
        lastValidatedAt: apiKey.lastValidatedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch API key:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/mollie-keys/:id - Update API key
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid API key ID" }, { status: 400 });
    }

    const validation = updateMollieApiKeySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 422 }
      );
    }

    await dbConnect();

    const apiKey = await MollieApiKey.findOne({
      _id: id,
      userId: user.id,
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (validation.data.isDefault) {
      await MollieApiKey.updateMany(
        { userId: user.id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    // Update the key
    if (validation.data.label) apiKey.label = validation.data.label;
    if (validation.data.isDefault !== undefined) apiKey.isDefault = validation.data.isDefault;
    
    await apiKey.save();

    return NextResponse.json({
      message: "API key updated successfully",
      apiKey: {
        id: apiKey._id.toString(),
        label: apiKey.label,
        lastFourChars: apiKey.lastFourChars,
        isDefault: apiKey.isDefault,
        isValid: apiKey.isValid,
        updatedAt: apiKey.updatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to update API key:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/mollie-keys/:id - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid API key ID" }, { status: 400 });
    }

    await dbConnect();

    const apiKey = await MollieApiKey.findOneAndDelete({
      _id: id,
      userId: user.id,
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
