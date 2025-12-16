import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { appwriteUsers, normalizeQueryParams } from '@/lib/appwrite/api';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import {
  requireAuthenticatedUser,
  verifyCsrfToken,
  buildErrorResponse,
} from '@/lib/api/auth-utils';
import { dataModificationRateLimit, readOnlyRateLimit } from '@/lib/rate-limit';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, password: _password, ...rest } = user as T & {
    password?: unknown;
    passwordHash?: unknown;
  };
  return rest as Omit<T, 'passwordHash'>;
}

function parseIsActive(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function normalizePermissions(value: unknown): PermissionValue[] {
  if (!Array.isArray(value)) return [];
  return value.filter((permission): permission is PermissionValue => typeof permission === 'string');
}

function validatePermissions(permissions: PermissionValue[]): boolean {
  const allowed = ALL_PERMISSIONS as readonly string[];
  return permissions.every((permission) => allowed.includes(permission));
}

async function getUsersHandler(request: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu kaynağa erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const response = await appwriteUsers.list({
      search: params.search,
      limit: params.limit,
      role: searchParams.get('role') || undefined,
      isActive: parseIsActive(searchParams.get('isActive')),
    });

    return NextResponse.json({
      success: true,
      data: (response.documents || []).map((doc) => sanitizeUser(doc as Record<string, unknown>)),
      total: response.total || 0,
    });
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List users error', error, {
      endpoint: '/api/users',
      method: 'GET',
    });
    return NextResponse.json(
      { success: false, error: 'Kullanıcılar alınamadı' },
      { status: 500 }
    );
  }
}

async function createUserHandler(request: NextRequest) {
  try {
    await verifyCsrfToken(request);
    const { user } = await requireAuthenticatedUser();

    if (!user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu kaynağa erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek verisi' },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 3) {
      errors.push('İsim en az 3 karakter olmalıdır');
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.push('Geçerli bir e-posta adresi gerekli');
    }

    const role = typeof body.role === 'string' ? body.role.trim() : '';
    if (role.length < 2) {
      errors.push('Rol en az 2 karakter olmalıdır');
    }

    const permissions = normalizePermissions(body.permissions);
    if (permissions.length === 0 || !validatePermissions(permissions)) {
      errors.push('Geçerli en az bir modül erişimi seçilmelidir');
    }

    const password = typeof body.password === 'string' ? body.password : '';
    if (!password || password.trim().length === 0) {
      errors.push('Şifre zorunludur');
    } else {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.error || 'Şifre yeterince güçlü değil');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: errors },
        { status: 400 }
      );
    }

    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;

    const passwordHash = await hashPassword(password);

    const created = await appwriteUsers.create({
      name,
      email,
      role,
      permissions,
      passwordHash,
      isActive,
      phone: phone && phone.length > 0 ? phone : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: sanitizeUser(created as unknown as Record<string, unknown>),
        message: 'Kullanıcı oluşturuldu',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Create user error', error, {
      endpoint: '/api/users',
      method: 'POST',
    });

    return NextResponse.json(
      { success: false, error: 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getUsersHandler);
export const POST = dataModificationRateLimit(createUserHandler);
