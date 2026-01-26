import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

/**
 * Security headers to be applied to all responses
 */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Apply security headers to a response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes - apply security headers but skip auth check (handled in route)
  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // Static files - skip all processing
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("collabos_token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!token) {
    if (isPublicRoute) {
      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }
    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    return applySecurityHeaders(response);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);

    if (isAuthRoute) {
      const response = NextResponse.redirect(new URL("/", request.url));
      return applySecurityHeaders(response);
    }

    const response = NextResponse.next();
    return applySecurityHeaders(response);
  } catch {
    // Invalid or expired token - clear cookie and redirect
    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    response.cookies.delete("collabos_token");
    return applySecurityHeaders(response);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
