import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, createAuthCookie } from "@/lib/auth";
import { googleAuthSchema } from "@/lib/validations";
import { verifyGoogleToken } from "@/lib/google";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for auth (10/min)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `auth:google:${clientId}`,
      RATE_LIMITS.AUTH,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const result = googleAuthSchema.safeParse(body);

    if (!result.success) {
      return handleZodError(result.error);
    }

    const { credential } = result.data;

    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser) {
      return ApiErrors.unauthorized("Invalid Google credential");
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatar: googleUser.avatar || user.avatar,
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
        },
      });
    }

    const token = createToken({ userId: user.id, role: user.role });
    const cookie = createAuthCookie(token);

    const response = NextResponse.json(
      {
        message: "Google authentication successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 },
    );

    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return ApiErrors.internalError();
  }
}
