import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, createAuthCookie } from "@/lib/auth";
import { googleAuthSchema } from "@/lib/validations";
import { verifyGoogleToken } from "@/lib/google";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = googleAuthSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { credential } = result.data;

    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser) {
      return NextResponse.json(
        { error: "Invalid Google credential" },
        { status: 401 },
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
