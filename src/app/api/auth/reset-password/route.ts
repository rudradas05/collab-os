import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { resetPasswordSchema } from "@/lib/validations";
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
      `auth:reset-password:${clientId}`,
      RATE_LIMITS.AUTH,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { token, otp, password } = parseResult.data;

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
      return ApiErrors.badRequest(
        "Reset link has expired. Please request a new one.",
      );
    }

    // Check if token is already used
    if (resetToken.used) {
      return ApiErrors.badRequest("This reset link has already been used.");
    }

    // Verify OTP
    if (resetToken.otp !== otp) {
      return ApiErrors.badRequest("Invalid OTP");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      message:
        "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return ApiErrors.internalError();
  }
}
