import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, createAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { handleZodError, ApiErrors } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `auth:login:${clientId}`,
      RATE_LIMITS.AUTH,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return handleZodError(result.error);
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = createToken({ userId: user.id, role: user.role });
    const cookie = createAuthCookie(token);

    const response = NextResponse.json(
      {
        message: "Login successful",
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
    console.error("Login error:", error);
    return ApiErrors.internalError();
  }
}
