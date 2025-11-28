import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from '@/lib/logger';
import {
  getAuthSessionFromRequest,
  getUserFromSession as loadSessionUser,
  type SessionUser,
} from '@/lib/auth/session';
import { MODULE_PERMISSIONS, SPECIAL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/api/csrf', // CSRF token endpoint is public
  '/api/auth/login', // Login endpoint is public (but requires CSRF token)
  '/api/auth/logout', // Logout endpoint is public
];

// Auth routes that should redirect to dashboard if already authenticated

// API routes that require authentication (protected endpoints)
const protectedApiRoutes = [
  '/api/users',
  '/api/beneficiaries',
  '/api/donations',
  '/api/tasks',
  '/api/meetings',
  '/api/messages',
  '/api/aid-applications',
  '/api/storage',
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
  { path: '/genel' },
  { path: '/financial-dashboard', requiredPermission: MODULE_PERMISSIONS.FINANCE },

  // User management
  { path: '/kullanici', requiredPermission: SPECIAL_PERMISSIONS.USERS_MANAGE },

  // Beneficiaries
  { path: '/yardim', requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES },
  { path: '/yardim/basvurular', requiredPermission: MODULE_PERMISSIONS.AID_APPLICATIONS },
  { path: '/yardim/liste', requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES },
  { path: '/yardim/nakdi-vezne', requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES },
  { path: '/yardim/ihtiyac-sahipleri', requiredPermission: MODULE_PERMISSIONS.BENEFICIARIES },

  // Donations
  { path: '/bagis', requiredPermission: MODULE_PERMISSIONS.DONATIONS },
  { path: '/bagis/liste', requiredPermission: MODULE_PERMISSIONS.DONATIONS },
  { path: '/bagis/kumbara', requiredPermission: MODULE_PERMISSIONS.DONATIONS },
  { path: '/bagis/raporlar', requiredPermission: MODULE_PERMISSIONS.REPORTS },

  // Scholarships
  { path: '/burs', requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS },
  { path: '/burs/basvurular', requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS },
  { path: '/burs/ogrenciler', requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS },
  { path: '/burs/yetim', requiredPermission: MODULE_PERMISSIONS.SCHOLARSHIPS },

  // Tasks & Meetings
  { path: '/is', requiredPermission: MODULE_PERMISSIONS.WORKFLOW },
  { path: '/is/yonetim', requiredPermission: MODULE_PERMISSIONS.WORKFLOW },
  { path: '/is/gorevler', requiredPermission: MODULE_PERMISSIONS.WORKFLOW },
  { path: '/is/toplantilar', requiredPermission: MODULE_PERMISSIONS.WORKFLOW },

  // Messaging
  { path: '/mesaj', requiredPermission: MODULE_PERMISSIONS.MESSAGES },
  { path: '/mesaj/kurum-ici', requiredPermission: MODULE_PERMISSIONS.MESSAGES },
  { path: '/mesaj/toplu', requiredPermission: MODULE_PERMISSIONS.MESSAGES },

  // Partners
  { path: '/partner', requiredPermission: MODULE_PERMISSIONS.PARTNERS },
  { path: '/partner/liste', requiredPermission: MODULE_PERMISSIONS.PARTNERS },

  // Financial
  { path: '/fon', requiredPermission: MODULE_PERMISSIONS.FINANCE },
  { path: '/fon/gelir-gider', requiredPermission: MODULE_PERMISSIONS.FINANCE },
  { path: '/fon/raporlar', requiredPermission: MODULE_PERMISSIONS.REPORTS },

  // Settings (require admin role)
  { path: '/settings', requiredPermission: MODULE_PERMISSIONS.SETTINGS },
  { path: '/ayarlar', requiredPermission: MODULE_PERMISSIONS.SETTINGS },
  { path: '/ayarlar/parametreler', requiredPermission: MODULE_PERMISSIONS.SETTINGS },
];

/**
 * Check if user has required permission
 */
function hasRequiredPermission(user: SessionUser | null, route: RouteRule): boolean {
  if (!user) return false;

  // Admin-level bypass: allow ADMIN/SUPER_ADMIN or users with admin manage permission
  const roleUpper = (user.role || '').toUpperCase();
  const isAdminByRole = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
  const isAdminByPermission = (user.permissions || []).includes(SPECIAL_PERMISSIONS.USERS_MANAGE);
  if (isAdminByRole || isAdminByPermission) {
    return true;
  }

  // Check role requirement first
  if (route.requiredRole) {
    if (!user.role || user.role.toLowerCase() !== route.requiredRole.toLowerCase()) {
      return false;
    }
  }

  // Check permission requirement
  if (route.requiredPermission) {
    if (!user.permissions.includes(route.requiredPermission)) {
      return false;
    }
  }

  // Check any permission requirement
  if (route.requiredAnyPermission && route.requiredAnyPermission.length > 0) {
    const hasAny = route.requiredAnyPermission.some((perm) =>
      user.permissions.includes(perm as PermissionValue)
    );
    if (!hasAny) {
      return false;
    }
  }

  return true;
}

/**
 * Main proxy function (Next.js 16 middleware replacement)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }

  // Check if it's a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route));

  // Check if it's a protected page route
  const matchingRoute = protectedRoutes.find((route) => pathname.startsWith(route.path));

  // If it's not a protected route, allow access
  if (!isProtectedApiRoute && !matchingRoute) {
    return NextResponse.next();
  }

  // Get user session
  const session = getAuthSessionFromRequest(request);

  // If no session, redirect to login (for pages) or return 401 (for API)
  if (!session) {
    if (isProtectedApiRoute) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get user data
  const user = await loadSessionUser(session);

  if (!user) {
    if (isProtectedApiRoute) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For page routes, check permissions
  if (matchingRoute) {
    if (!hasRequiredPermission(user, matchingRoute)) {
      logger.warn('Access denied', {
        context: 'middleware',
        userId: user.id,
        path: pathname,
        route: matchingRoute.path,
      });

      // Redirect to dashboard if user doesn't have permission
      return NextResponse.redirect(new URL('/genel', request.url));
    }
  }

  // Add user info to request headers for API routes
  if (isProtectedApiRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    // Ensure header values are ASCII-safe to avoid ByteString errors
    const safeRole = encodeURIComponent(user.role ?? '');
    const safePermissions = encodeURIComponent((user.permissions ?? []).join(','));

    requestHeaders.set('x-user-role', safeRole);
    requestHeaders.set('x-user-permissions', safePermissions);

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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
