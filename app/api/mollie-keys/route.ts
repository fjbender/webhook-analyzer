import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db/connection";
import { MollieApiKey } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { encrypt } from "@/lib/crypto";
import { mollieApiKeySchema } from "@/lib/validation/mollie-keys";

// GET /api/mollie-keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await dbConnect();

    const apiKeys = await MollieApiKey.find({ userId: user.id }).sort({ createdAt: -1 });

    // Don't send encrypted keys to client
    const safeKeys = apiKeys.map((key) => ({
      id: key._id.toString(),
      label: key.label,
      lastFourChars: key.lastFourChars,
      isDefault: key.isDefault,
      isValid: key.isValid,
      lastValidatedAt: key.lastValidatedAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    return NextResponse.json({ apiKeys: safeKeys });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/mollie-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validation = mollieApiKeySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 422 }
      );
    }

    const { label, apiKey, isDefault } = validation.data;

    await dbConnect();

    // Check if label already exists for this user
    const existingLabel = await MollieApiKey.findOne({ 
      userId: user.id, 
      label 
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: "An API key with this label already exists" },
        { status: 409 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await MollieApiKey.updateMany(
        { userId: user.id },
        { $set: { isDefault: false } }
      );
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey);
    const lastFourChars = apiKey.slice(-4);

    const newKey = await MollieApiKey.create({
      userId: user.id,
      label,
      encryptedKey,
      lastFourChars,
      isDefault: isDefault || false,
      isValid: true, // Will be validated separately
    });

    return NextResponse.json(
      {
        message: "API key added successfully",
        apiKey: {
          id: newKey._id.toString(),
          label: newKey.label,
          lastFourChars: newKey.lastFourChars,
          isDefault: newKey.isDefault,
          isValid: newKey.isValid,
          createdAt: newKey.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create API key:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
