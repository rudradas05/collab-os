// API: Get coin statistics
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCoinStats } from "@/lib/coins";

export async function GET() {
  try {
    const user = await requireAuth();
    const stats = await getCoinStats(user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting coin stats:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get stats",
      },
      { status: 500 }
    );
  }
}