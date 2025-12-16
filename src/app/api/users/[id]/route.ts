import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import {
  buildErrorResponse,
  requireAuthenticatedUser,
  verifyCsrfToken,
} from '@/lib/api/auth-utils';
import { appwriteUsers } from '@/lib/appwrite/api';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, password: _password, ...rest } = user as T & {
    password?: unknown;
    passwordHash?: unknown;
  };
  return rest as Omit<T, 'passwordHash'>;
}

function normalizePermissions(value: unknown): PermissionValue[] {
  if (!Array.isArray(value)) return [];
  return value.filter((permission): permission is PermissionValue => typeof permission === 'string');
}

function validatePermissions(permissions: PermissionValue[]): boolean {
  const allowed = ALL_PERMISSIONS as readonly string[];
  return permissions.every((permission) => allowed.includes(permission));
}

/**
 * Validate user update request body
 */
function validateUpdateBody(body: Record<string, unknown>): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (body.email && typeof body.email === 'string' && !EMAIL_REGEX.test(body.email)) {
    errors.push('Geçerli bir e-posta adresi gerekli');
  }

  if (body.name && typeof body.name === 'string' && body.name.trim().length < 3) {
    errors.push('İsim en az 3 karakter olmalıdır');
  }

  if (body.role && typeof body.role === 'string' && body.role.trim().length < 2) {
    errors.push('Rol en az 2 karakter olmalıdır');
  }

  if (body.permissions !== undefined) {
    const permissions = normalizePermissions(body.permissions);
    if (permissions.length === 0 || !validatePermissions(permissions)) {
      errors.push('Geçerli en az bir modül erişimi seçilmelidir');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * GET /api/users/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user: currentUser } = await requireAuthenticatedUser();
    if (!currentUser.permissions.includes('users:manage')) {
      return NextResponse.json({ success: false, error: 'Bu kaynağa erişim yetkiniz yok' }, { status: 403 });
    }

    const user = await appwriteUsers.get(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sanitizeUser(user as Record<string, unknown>) });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Get user error', error, {
      endpoint: '/api/users/[id]',
      method: 'GET',
      userId: id,
    });
    return NextResponse.json(
      { success: false, error: 'Kullanıcı bilgisi alınamadı' },
      { status: 500 }
    );
  }
}

/**
 * PUT/PATCH /api/users/[id]
 */
async function updateUserHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Validate request body
    const validation = validateUpdateBody(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name && typeof body.name === 'string') {
      updateData.name = body.name.trim();
    }

    if (body.email && typeof body.email === 'string') {
      updateData.email = body.email.trim().toLowerCase();
    }

    if (body.role && typeof body.role === 'string') {
      updateData.role = body.role.trim();
    }

    if (body.permissions !== undefined) {
      updateData.permissions = normalizePermissions(body.permissions);
    }

    if (body.isActive !== undefined && typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    if (body.phone !== undefined && typeof body.phone === 'string') {
      const phone = body.phone.trim();
      updateData.phone = phone.length > 0 ? phone : undefined;
    }

    if (body.password !== undefined && typeof body.password === 'string') {
      const password = body.password.trim();
      if (password.length > 0) {
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Doğrulama hatası',
              details: [passwordValidation.error || 'Şifre yeterince güçlü değil'],
            },
            { status: 400 }
          );
        }
        updateData.passwordHash = await hashPassword(password);
      }
    }

    const updated = await appwriteUsers.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: sanitizeUser(updated as Record<string, unknown>),
      message: 'Kullanıcı başarıyla güncellendi',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Update user error', error, {
      endpoint: '/api/users/[id]',
      method: 'PATCH',
      userId: id,
    });
    return NextResponse.json(
      { success: false, error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 */
async function deleteUserHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await verifyCsrfToken(request);
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu kaynağa erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    await appwriteUsers.remove(id);

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Kullanıcı başarıyla silindi',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Delete user error', error, {
      endpoint: '/api/users/[id]',
      method: 'DELETE',
      userId: id,
    });
    return NextResponse.json(
      { success: false, error: 'Silme işlemi başarısız' },
      { status: 500 }
    );
  }
}

export const PUT = updateUserHandler;
export const PATCH = updateUserHandler;
export const DELETE = deleteUserHandler;
