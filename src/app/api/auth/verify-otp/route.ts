import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validations";
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
      `auth:verify-otp:${clientId}`,
      RATE_LIMITS.AUTH,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const parseResult = verifyOtpSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { token, otp } = parseResult.data;

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return ApiErrors.badRequest("Invalid or expired reset link");
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return ApiErrors.badRequest("OTP has expired. Please request a new one.");
    }

    // Check if token is already used
    if (resetToken.used) {
      return ApiErrors.badRequest("This OTP has already been used.");
    }

    // Verify OTP
    if (resetToken.otp !== otp) {
      return ApiErrors.badRequest("Invalid OTP. Please check and try again.");
    }

    // OTP is valid - return success
    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return ApiErrors.internalError();
  }
}
