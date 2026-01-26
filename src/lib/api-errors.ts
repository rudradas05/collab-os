import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: Record<string, string[]>,
): NextResponse<ApiError> {
  const response: ApiError = { error };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: (message?: string) =>
    errorResponse(message || "Unauthorized", 401),

  forbidden: (message?: string) =>
    errorResponse(message || "Access denied", 403),

  notFound: (resource?: string) =>
    errorResponse(resource ? `${resource} not found` : "Not found", 404),

  badRequest: (message: string, details?: Record<string, string[]>) =>
    errorResponse(message, 400, details),

  conflict: (message: string) => errorResponse(message, 409),

  tooManyRequests: (retryAfter?: number) =>
    NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter,
      },
      { status: 429 },
    ),

  internalError: (message?: string) =>
    errorResponse(
      message || "An unexpected error occurred. Please try again.",
      500,
    ),

  serviceUnavailable: (service?: string) =>
    errorResponse(
      service ? `${service} is not available` : "Service unavailable",
      503,
    ),
};

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ApiError> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return errorResponse("Validation failed", 400, details);
}

/**
 * Safe error handler that never exposes stack traces
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Log the full error for debugging (server-side only)
  console.error("API Error:", error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes("Unauthorized")) {
      return ApiErrors.unauthorized();
    }
    if (error.message.includes("Not found")) {
      return ApiErrors.notFound();
    }
    if (error.message.includes("duplicate")) {
      return ApiErrors.conflict("Resource already exists");
    }
  }

  // Default to internal error (never expose details)
  return ApiErrors.internalError();
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>,
): Promise<NextResponse<T | ApiError>> {
  return handler().catch(handleApiError);
}
