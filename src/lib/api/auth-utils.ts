import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import {
  getAuthSessionFromCookies,
  getUserFromSession,
  type AuthSession,
  type SessionUser,
} from '@/lib/auth/session';
import { getCsrfTokenHeader, validateCsrfToken } from '@/lib/csrf';
import { SPECIAL_PERMISSIONS } from '@/types/permissions';
import type { PermissionValue } from '@/types/permissions';

export class ApiAuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = 'UNAUTHORIZED') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface RequireUserOptions {
  requiredPermission?: PermissionValue | string;
  requiredAnyPermission?: Array<PermissionValue | string>;
  requiredRole?: string;
}

const hasPermission = (user: SessionUser, permission?: PermissionValue | string): boolean => {
  if (!permission) {
    return true;
  }
  const roleUpper = (user.role || '').toUpperCase();
  const isAdminByRole = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
  const isAdminByPermission = (user.permissions || []).includes(SPECIAL_PERMISSIONS.USERS_MANAGE);
  if (isAdminByRole || isAdminByPermission) {
    return true;
  }

  return (user.permissions || []).includes(permission as PermissionValue);
};

const hasAnyPermission = (
  user: SessionUser,
  permissions?: Array<PermissionValue | string>
): boolean => {
  if (!permissions || permissions.length === 0) {
    return true;
  }
  const roleUpper = (user.role || '').toUpperCase();
  const isAdminByRole = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
  const isAdminByPermission = (user.permissions || []).includes(SPECIAL_PERMISSIONS.USERS_MANAGE);
  if (isAdminByRole || isAdminByPermission) {
    return true;
  }

  return permissions.some((perm) => (user.permissions || []).includes(perm as PermissionValue));
};

const hasRole = (user: SessionUser, role?: string): boolean => {
  if (!role) {
    return true;
  }

  if (!user.role) {
    return false;
  }

  return user.role.toLowerCase() === role.toLowerCase();
};

const appendAccessSuffix = (module: string) => {
  if (!module) return module;
  return module.endsWith(':access') ? module : `${module}:access`;
};

export async function verifyCsrfToken(request: NextRequest): Promise<void> {
  const headerName = getCsrfTokenHeader();
  const headerToken = request.headers.get(headerName);
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('csrf-token')?.value || '';

  if (!headerToken || !validateCsrfToken(headerToken, cookieToken)) {
    throw new ApiAuthError('CSRF doğrulaması başarısız', 403, 'INVALID_CSRF');
  }
}

export async function requirePermission(permission: string): Promise<{
  session: AuthSession;
  user: SessionUser;
}> {
  const { session, user } = await requireAuthenticatedUser();
  if (!hasPermission(user, permission)) {
    throw new ApiAuthError('İzin bulunamadı', 403, 'FORBIDDEN');
  }
  return { session, user };
}

export async function requireModuleAccess(module: string): Promise<{
  session: AuthSession;
  user: SessionUser;
}> {
  if (!module) {
    throw new ApiAuthError('Geçersiz modül erişimi', 400, 'INVALID_MODULE');
  }
  return requirePermission(appendAccessSuffix(module));
}

export async function requireAnyPermission(permissions: string[]): Promise<{
  session: AuthSession;
  user: SessionUser;
}> {
  const { session, user } = await requireAuthenticatedUser();
  if (!hasAnyPermission(user, permissions)) {
    throw new ApiAuthError('İzin bulunamadı', 403, 'FORBIDDEN');
  }
  return { session, user };
}

export async function requireAuthenticatedUser(
  options: RequireUserOptions = {}
): Promise<{ session: AuthSession; user: SessionUser }> {
  const session = await getAuthSessionFromCookies();
  if (!session) {
    throw new ApiAuthError('Oturum bulunamadı', 401, 'UNAUTHORIZED');
  }

  const user = await getUserFromSession(session);
  if (!user) {
    throw new ApiAuthError('Geçersiz veya süresi dolmuş oturum', 401, 'UNAUTHORIZED');
  }

  if (!hasRole(user, options.requiredRole)) {
    throw new ApiAuthError('Yetkisiz erişim', 403, 'FORBIDDEN');
  }

  if (!hasPermission(user, options.requiredPermission)) {
    throw new ApiAuthError('İzin bulunamadı', 403, 'FORBIDDEN');
  }

  if (!hasAnyPermission(user, options.requiredAnyPermission)) {
    throw new ApiAuthError('İzin bulunamadı', 403, 'FORBIDDEN');
  }

  return { session, user };
}

export function buildErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return {
      status: error.status,
      body: {
        success: false,
        error: error.message,
        code: error.code,
      },
    };
  }

  return null;
}
