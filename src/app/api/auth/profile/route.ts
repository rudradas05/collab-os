import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";
import { ApiErrors, handleZodError } from "@/lib/api-errors";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        coins: true,
        tier: true,
        createdAt: true,
      },
    });

    if (!userData) {
      return ApiErrors.notFound("User");
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Get profile error:", error);
    return ApiErrors.internalError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `profile:update:${clientId}`,
      RATE_LIMITS.GENERAL,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { name, avatar } = parseResult.data;

    // Build update data - email cannot be changed
    const updateData: { name?: string; avatar?: string | null } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.badRequest("No fields to update");
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        coins: true,
        tier: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return ApiErrors.internalError();
  }
}
