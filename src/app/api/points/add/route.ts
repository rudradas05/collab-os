// API: Add points/coins
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { earnCoins } from "@/lib/coins";
import { COIN_TRANSACTION_TYPES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { amount, type, description, metadata } = body;

    if (!amount || !type) {
      return NextResponse.json(
        { error: "Amount and type are required" },
        { status: 400 }
      );
    }

    if (!(type in COIN_TRANSACTION_TYPES)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    const result = await earnCoins({
      userId: user.id,
      amount: parseInt(amount),
      type: type as keyof typeof COIN_TRANSACTION_TYPES,
      description,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error adding points:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add points",
      },
      { status: 500 }
    );
  }
}