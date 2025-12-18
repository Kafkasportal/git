// Next.js 16 "proxy" file runs on the Node.js runtime (not Edge).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAuthSessionFromRequestEdge,
  isSessionExpired,
} from "@/lib/auth/session-edge";
import {
  MODULE_PERMISSIONS,
  SPECIAL_PERMISSIONS,
  type PermissionValue,
} from "@/types/permissions";
import { getCsrfTokenHeaderEdge, validateCsrfTokenEdge } from "@/lib/csrf-edge";

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/auth",
  "/_next",
  "/favicon.ico",
  "/api/csrf", // CSRF token endpoint is public
  "/api/auth/login", // Login endpoint is public (but requires CSRF token)
  "/api/auth/logout", // Logout endpoint is public
  "/api/errors", // Error tracking endpoint is public (protected by rate limiting)
];

// Routes that are exempt from CSRF validation
// These are endpoints that need to accept unauthenticated requests without CSRF tokens
const csrfExemptRoutes = [
  "/api/csrf", // CSRF token endpoint itself doesn't need CSRF validation
  "/api/errors", // Error tracking endpoint for client-side error reporting
];

// API routes that require authentication (protected endpoints)
const protectedApiRoutes = [
  "/api/users",
  "/api/beneficiaries",
  "/api/donations",
  "/api/tasks",
  "/api/meetings",
  "/api/messages",
  "/api/aid-applications",
  "/api/storage",
];

// Route definitions for role-based access control
interface RouteRule {
  path: string;
  requiredPermission?: PermissionValue;
  requiredRole?: string;
  requiredAnyPermission?: PermissionValue[];
}

// Protected routes with their permission requirements
const protectedRoutes: RouteRule[] = [
  // Dashboard routes
  { path: "/genel" },
  {
    path: "/financial-dashboard",
    requiredPermission: MODULE_PERMISSIONS.FINANCE,
  },

  // User management
  { path: "/kullanici", requiredPermission: SPECIAL_PERMISSIONS.USERS_MANAGE },

  // Beneficiaries
  { path: "/yardim", requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES },
  {
    path: "/yardim/basvurular",
    requiredPermission: MODULE_PERMISSIONS.AID_APPLICATIONS,
  },
  {
    path: "/yardim/liste",
    requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES,
  },
  {
    path: "/yardim/nakdi-vezne",
    requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES,
  },
  {
    path: "/yardim/ihtiyac-sahipleri",
    requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES,
  },

  // Donations
  { path: "/bagis", requiredPermission: MODULE_PERMISSIONS.DONATIONS },
  { path: "/bagis/liste", requiredPermission: MODULE_PERMISSIONS.DONATIONS },
  { path: "/bagis/kumbara", requiredPermission: MODULE_PERMISSIONS.DONATIONS },
  { path: "/bagis/raporlar", requiredPermission: MODULE_PERMISSIONS.REPORTS },

  // Scholarships
  { path: "/burs", requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS },
  {
    path: "/burs/basvurular",
    requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS,
  },
  {
    path: "/burs/ogrenciler",
    requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS,
  },
  { path: "/burs/yetim", requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS },

  // Tasks & Meetings
  { path: "/is", requiredPermission: MODULE_PERMISSIONS.WORKFLOW },
  { path: "/is/yonetim", requiredPermission: MODULE_PERMISSIONS.WORKFLOW },
  { path: "/is/gorevler", requiredPermission: MODULE_PERMISSIONS.WORKFLOW },
  { path: "/is/toplantilar", requiredPermission: MODULE_PERMISSIONS.WORKFLOW },

  // Messaging
  { path: "/mesaj", requiredPermission: MODULE_PERMISSIONS.MESSAGES },
  { path: "/mesaj/kurum-ici", requiredPermission: MODULE_PERMISSIONS.MESSAGES },
  { path: "/mesaj/toplu", requiredPermission: MODULE_PERMISSIONS.MESSAGES },

  // Partners
  { path: "/partner", requiredPermission: MODULE_PERMISSIONS.PARTNERS },
  { path: "/partner/liste", requiredPermission: MODULE_PERMISSIONS.PARTNERS },

  // Financial
  { path: "/fon", requiredPermission: MODULE_PERMISSIONS.FINANCE },
  { path: "/fon/gelir-gider", requiredPermission: MODULE_PERMISSIONS.FINANCE },
  { path: "/fon/raporlar", requiredPermission: MODULE_PERMISSIONS.REPORTS },

  // Settings (require admin role)
  { path: "/ayarlar", requiredPermission: MODULE_PERMISSIONS.SETTINGS },
  {
    path: "/ayarlar/parametreler",
    requiredPermission: MODULE_PERMISSIONS.SETTINGS,
  },
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/api/health")
  );
}

/**
 * Check if method requires CSRF protection
 */
function requiresCsrfProtection(method: string): boolean {
  const upperMethod = method.toUpperCase();
  return (
    upperMethod === "POST" ||
    upperMethod === "PUT" ||
    upperMethod === "PATCH" ||
    upperMethod === "DELETE"
  );
}

/**
 * Validate CSRF token for API requests
 */
function validateApiCsrf(request: NextRequest, pathname: string): NextResponse | null {
  if (!pathname.startsWith("/api")) {
    return null;
  }

  if (!requiresCsrfProtection(request.method)) {
    return null;
  }

  // Skip CSRF validation for exempt routes
  const isCsrfExempt = csrfExemptRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isCsrfExempt) {
    return null;
  }

  const headerName = getCsrfTokenHeaderEdge();
  const headerToken = request.headers.get(headerName) || "";
  const cookieToken = request.cookies.get("csrf-token")?.value || "";
  
  if (!validateCsrfTokenEdge(headerToken, cookieToken)) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "CSRF doğrulaması başarısız",
        code: "INVALID_CSRF",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  return null;
}

/**
 * Handle unauthenticated requests
 */
function handleUnauthenticated(
  request: NextRequest,
  pathname: string,
  isProtectedApiRoute: boolean
): NextResponse {
  if (isProtectedApiRoute) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Add session headers to request for API routes
 */
function addSessionHeaders(
  request: NextRequest,
  session: { userId: string; sessionId: string }
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-session-id", session.sessionId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Main proxy function (Edge Runtime compatible)
 *
 * Note: Edge proxy is lightweight and cannot call external APIs like Appwrite.
 * Permission checks are deferred to API routes and server components.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle root path
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // CSRF protection for mutating API requests
  const csrfError = validateApiCsrf(request, pathname);
  if (csrfError) {
    return csrfError;
  }

  // Check if it's a protected route
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const matchingRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route.path),
  );

  // If it's not a protected route, allow access
  if (!isProtectedApiRoute && !matchingRoute) {
    return NextResponse.next();
  }

  // Get user session (Edge-compatible)
  const session = await getAuthSessionFromRequestEdge(request);

  // If no session or session expired, handle unauthenticated
  if (!session || isSessionExpired(session)) {
    return handleUnauthenticated(request, pathname, isProtectedApiRoute);
  }

  // Add session info to request headers for API routes
  if (isProtectedApiRoute) {
    return addSessionHeaders(request, session);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
