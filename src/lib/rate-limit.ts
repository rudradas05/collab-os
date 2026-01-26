import { NextResponse } from "next/server";

/**
 * In-memory rate limiter using sliding window algorithm
 * In production, this should use Redis (Upstash) for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Upstash Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create a rate limit response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toString(),
        "Retry-After": Math.ceil(
          (result.resetTime - Date.now()) / 1000,
        ).toString(),
      },
    },
  );
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Auth routes: 10 requests per minute
  AUTH: { limit: 10, windowMs: 60 * 1000 },

  // AI routes: 20 requests per hour
  AI: { limit: 20, windowMs: 60 * 60 * 1000 },

  // Subscription routes: 5 requests per minute
  SUBSCRIPTION: { limit: 5, windowMs: 60 * 1000 },

  // Automation routes: 20 requests per minute
  AUTOMATIONS: { limit: 20, windowMs: 60 * 1000 },

  // General API: 100 requests per minute
  GENERAL: { limit: 100, windowMs: 60 * 1000 },
} as const;

/**
 * Get client identifier for rate limiting
 * Uses IP address or forwarded IP
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}
