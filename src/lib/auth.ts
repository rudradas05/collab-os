import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";
import { Role } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "collabos_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function createToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Additional expiry check (belt and suspenders)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createAuthCookie(token: string): string {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookie(): string {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function getTokenFromCookies(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  return cookies[COOKIE_NAME] || null;
}

export async function getCurrentUser(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookies(cookieHeader);

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      coins: true,
    },
  });

  return user;
}

/**
 * Create an unauthorized response that clears the auth cookie
 * Use this when token is invalid or expired
 */
export function unauthorizedResponse(
  message: string = "Unauthorized",
): NextResponse {
  const response = NextResponse.json({ error: message }, { status: 401 });
  response.headers.set("Set-Cookie", clearAuthCookie());
  return response;
}

/**
 * Validate request authentication and return user or error response
 * Returns user object if valid, or NextResponse with 401 status
 */
export async function requireAuth(
  request: NextRequest,
): Promise<
  | {
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      error: null;
    }
  | { user: null; error: NextResponse }
> {
  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookies(cookieHeader);

  if (!token) {
    return {
      user: null,
      error: unauthorizedResponse("No authentication token"),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      user: null,
      error: unauthorizedResponse("Invalid or expired token"),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      coins: true,
    },
  });

  if (!user) {
    return { user: null, error: unauthorizedResponse("User not found") };
  }

  return { user, error: null };
}
