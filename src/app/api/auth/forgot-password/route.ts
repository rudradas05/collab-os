import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOTP, generateOTP } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // For security, always return success even if user doesn't exist
    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists with this email, you will receive a password reset OTP.",
      });
    }

    // Check if user signed up with Google (no password)
    if (!user.passwordHash && user.googleId) {
      return NextResponse.json(
        {
          error:
            "This account uses Google Sign-In. Please sign in with Google.",
        },
        { status: 400 },
      );
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Generate OTP and token
    const otp = generateOTP();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        otp,
        expiresAt,
      },
    });

    // Send OTP email
    const emailResult = await sendPasswordResetOTP(email, otp, user.name);

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:
        "If an account exists with this email, you will receive a password reset OTP.",
      token, // Send token to client for verification step
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
