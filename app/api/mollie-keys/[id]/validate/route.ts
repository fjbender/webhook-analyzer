import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import createMollieClient from "@mollie/api-client";
import dbConnect from "@/lib/db/connection";
import { MollieApiKey } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { decrypt } from "@/lib/crypto";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/mollie-keys/:id/validate - Validate API key with Mollie
export async function POST(
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

    // Decrypt the API key
    const decryptedKey = decrypt(apiKey.encryptedKey);

    // Test the API key by making a simple request to Mollie
    try {
      const mollieClient = createMollieClient({ apiKey: decryptedKey });
      
      // Try to get the methods list (this works for both test and live keys)
      await mollieClient.methods.list();

      // Update validation status
      apiKey.isValid = true;
      apiKey.lastValidatedAt = new Date();
      await apiKey.save();

      return NextResponse.json({
        message: "API key is valid",
        isValid: true,
        lastValidatedAt: apiKey.lastValidatedAt,
      });
    } catch (mollieError: any) {
      // API key is invalid
      apiKey.isValid = false;
      apiKey.lastValidatedAt = new Date();
      await apiKey.save();

      return NextResponse.json({
        message: "API key is invalid",
        isValid: false,
        error: mollieError.message || "Failed to validate with Mollie API",
        lastValidatedAt: apiKey.lastValidatedAt,
      });
    }
  } catch (error) {
    console.error("Failed to validate API key:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
