import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAuthSessionFromRequest,
  getUserFromSession,
} from "@/lib/auth/session";

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  "/genel",
  "/bagis",
  "/yardim",
  "/burs",
  "/fon",
  "/partner",
  "/kullanici",
  "/is",
  "/mesaj",
  "/ayarlar",
];

/**
 * Public routes (accessible without authentication)
 */
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

/**
 * API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/oauth/callback",
  "/api/auth/dev-login",
  "/api/auth/test-login",
  "/api/csrf",
];

/**
 * Check if a path matches any of the given patterns
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, images, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/,
    )
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (matchesRoute(pathname, PUBLIC_API_ROUTES)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (
    matchesRoute(pathname, PROTECTED_ROUTES) ||
    pathname.startsWith("/api/")
  ) {
    const session = getAuthSessionFromRequest(request);
    const user = await getUserFromSession(session);

    // No valid session - redirect to login
    if (!session || !user) {
      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 },
        );
      }

      // For page routes, redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - continue
    return NextResponse.next();
  }

  // Default: allow request
  return NextResponse.next();
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
