import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, createAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
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
      `auth:signup:${clientId}`,
      RATE_LIMITS.AUTH,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return handleZodError(result.error);
    }

    const { email, password, name } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return ApiErrors.conflict("Email already registered");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    const token = createToken({ userId: user.id, role: user.role });
    const cookie = createAuthCookie(token);

    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 },
    );

    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return ApiErrors.internalError();
  }
}
