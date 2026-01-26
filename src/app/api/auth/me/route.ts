import { NextRequest, NextResponse } from "next/server";
import {
  getTokenFromCookies,
  verifyToken,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return unauthorizedResponse("Not authenticated");
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return unauthorizedResponse("Invalid token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      return ApiErrors.notFound("User");
    }

    return NextResponse.json({ user });
  } catch {
    return unauthorizedResponse("Authentication failed");
  }
}
