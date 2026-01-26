import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validations";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return ApiErrors.badRequest("Workspace ID is required");
    }

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
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Get last 50 messages ordered by createdAt
    const messages = await prisma.chatMessage.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
      },
    });

    // Get user info for each message
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const messagesWithUsers = messages.map((m) => {
      const messageUser = userMap.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        userName: messageUser?.name || "Unknown",
        userAvatar: messageUser?.avatar || undefined,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ messages: messagesWithUsers });
  } catch (error) {
    console.error("Get chat messages error:", error);
    return ApiErrors.internalError("Failed to fetch messages");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for chat (general rate limit)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `chat:messages:${clientId}`,
      RATE_LIMITS.GENERAL,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = chatMessageSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { workspaceId, content } = parseResult.data;

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
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Get full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, avatar: true },
    });

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        workspaceId,
        content: content.trim(),
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        userId: user.id,
        userName: fullUser?.name || user.name,
        userAvatar: fullUser?.avatar || undefined,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create chat message error:", error);
    return ApiErrors.internalError("Failed to send message");
  }
}
