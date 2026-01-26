import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getLiveblocks(): Liveblocks | null {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret || !secret.startsWith("sk_")) {
    return null;
  }
  return new Liveblocks({ secret });
}

export async function POST(request: NextRequest) {
  try {
    const liveblocks = getLiveblocks();
    if (!liveblocks) {
      return NextResponse.json(
        {
          error:
            "Liveblocks is not configured. Please set LIVEBLOCKS_SECRET_KEY.",
        },
        { status: 503 },
      );
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { room } = body;

    if (!room || !room.startsWith("workspace:")) {
      return NextResponse.json({ error: "Invalid room" }, { status: 400 });
    }

    // Extract workspaceId from room name
    const workspaceId = room.replace("workspace:", "");

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 },
      );
    }

    // Get full user data for avatar
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    // Prepare the session
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.name,
        avatar: fullUser?.avatar || undefined,
      },
    });

    // Allow access to this specific room
    session.allow(room, session.FULL_ACCESS);

    // Authorize and return token
    const { status, body: responseBody } = await session.authorize();
    return new NextResponse(responseBody, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json({ error: "Failed to authorize" }, { status: 500 });
  }
}
