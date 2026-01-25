import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";
import { Role } from "@/generated/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "collabos_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
  userId: string;
  role: Role;
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

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
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
