// Edge Runtime declaration for Cloudflare Pages compatibility
// Note: Use 'edge' for production Cloudflare deployments
// Next.js 16 local builds may show warnings but Edge runtime is required for Cloudflare
export const runtime = 'edge';

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

// Auth routes that should redirect to dashboard if already authenticated

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
  { path: "/settings", requiredPermission: MODULE_PERMISSIONS.SETTINGS },
  { path: "/ayarlar", requiredPermission: MODULE_PERMISSIONS.SETTINGS },
  {
    path: "/ayarlar/parametreler",
    requiredPermission: MODULE_PERMISSIONS.SETTINGS,
  },
];

/**
 * Main middleware function (Edge Runtime compatible)
 * 
 * Note: Edge middleware is lightweight and cannot call external APIs like Appwrite.
 * Permission checks are deferred to API routes and server components.
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // CSRF protection for mutating API requests
  if (pathname.startsWith("/api")) {
    const method = request.method.toUpperCase();
    if (
      method === "POST" ||
      method === "PUT" ||
      method === "PATCH" ||
      method === "DELETE"
    ) {
      // Skip CSRF validation for exempt routes
      const isCsrfExempt = csrfExemptRoutes.some((route) =>
        pathname.startsWith(route),
      );
      
      if (!isCsrfExempt) {
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
      }
    }
  }

  // Check if it's a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if it's a protected page route
  const matchingRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route.path),
  );

  // If it's not a protected route, allow access
  if (!isProtectedApiRoute && !matchingRoute) {
    return NextResponse.next();
  }

  // Get user session (Edge-compatible)
  const session = await getAuthSessionFromRequestEdge(request);

  // If no session or session expired, redirect to login (for pages) or return 401 (for API)
  if (!session || isSessionExpired(session)) {
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

  // For Edge middleware, we defer permission checks to API routes and server components
  // This is because Edge middleware cannot call external APIs like Appwrite
  // The session validation above is sufficient for basic auth

  // Add session info to request headers for API routes
  if (isProtectedApiRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-session-id", session.sessionId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
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
