import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getNextTierInfo } from "@/lib/coins";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        coins: true,
        tier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tierInfo = getNextTierInfo(user.coins);

    return NextResponse.json({
      coins: user.coins,
      tier: user.tier,
      nextTier: tierInfo.nextTier,
      coinsToNext: tierInfo.coinsToNext,
      progressToNextTier: tierInfo.progressPercent,
    });
  } catch (error) {
    console.error("Get coin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin stats" },
      { status: 500 },
    );
  }
}
