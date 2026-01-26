import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get coin history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin history" },
      { status: 500 },
    );
  }
}
