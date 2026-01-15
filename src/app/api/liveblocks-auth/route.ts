// Liveblocks authorization endpoint
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authorizeUser } from "@/lib/liveblocks";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { status, body } = await authorizeUser(user.id);
    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}