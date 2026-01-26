import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";
import { uploadAvatar } from "@/lib/upload-avatar";

import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

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

// export async function PATCH(request: NextRequest) {
//   try {
//     // Rate limiting
//     const clientId = getClientIdentifier(request);
//     const rateLimitResult = checkRateLimit(
//       `profile:update:${clientId}`,
//       RATE_LIMITS.GENERAL,
//     );
//     if (!rateLimitResult.success) {
//       return rateLimitResponse(rateLimitResult);
//     }

//     const user = await getCurrentUser(request);
//     if (!user) {
//       return unauthorizedResponse();
//     }

//     const formData = await request.formData();

//     const name = formData.get("name");
//     const avatarFile = formData.get("avatar") as File | null;

//     if (!parseResult.success) {
//       return handleZodError(parseResult.error);
//     }

//     const { name, avatar } = parseResult.data;

//     // Build update data - email cannot be changed
//     const updateData: { name?: string; avatar?: string | null } = {};

//     if (name !== undefined) {
//       updateData.name = name.trim();
//     }

//     if (avatar !== undefined) {
//       updateData.avatar = avatar;
//     }

//     if (Object.keys(updateData).length === 0) {
//       return ApiErrors.badRequest("No fields to update");
//     }

//     // Update user
//     const updated = await prisma.user.update({
//       where: { id: user.id },
//       data: updateData,
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         avatar: true,
//         coins: true,
//         tier: true,
//       },
//     });

//     return NextResponse.json({
//       message: "Profile updated successfully",
//       user: updated,
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     return ApiErrors.internalError();
//   }
// }

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `profile:update:${clientId}`,
      RATE_LIMITS.GENERAL,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) return unauthorizedResponse();

    const formData = await request.formData();

    const name = formData.get("name");
    const avatarFile = formData.get("avatar") as File | null;

    if (typeof name !== "string" || name.trim().length < 2) {
      return ApiErrors.badRequest("Name must be at least 2 characters");
    }

    let avatarUrl: string | undefined;

    if (avatarFile && avatarFile.size > 0) {
      if (!avatarFile.type.startsWith("image/")) {
        return ApiErrors.badRequest("Invalid image file");
      }

      if (avatarFile.size > 2 * 1024 * 1024) {
        return ApiErrors.badRequest("Avatar must be under 2MB");
      }

      avatarUrl = await uploadAvatar(avatarFile, user.id);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
      },
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
