import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { appwriteUsers } from '@/lib/appwrite/api';
import { InputSanitizer } from '@/lib/security';
import { extractParams } from '@/lib/api/route-helpers';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import {
  buildErrorResponse,
  requireAuthenticatedUser,
  verifyCsrfToken,
} from '@/lib/api/auth-utils';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

const PERMISSION_SET = new Set(ALL_PERMISSIONS);

const normalizeOptionalPermissions = (permissions: unknown): PermissionValue[] | undefined => {
  if (!Array.isArray(permissions)) return undefined;
  const normalized = permissions.filter(
    (permission): permission is PermissionValue =>
      typeof permission === 'string' && PERMISSION_SET.has(permission as PermissionValue)
  );
  return normalized.length ? Array.from(new Set(normalized)) : [];
};

/**
 * GET /api/users/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);
  try {
    const { user: currentUser } = await requireAuthenticatedUser();
    if (!currentUser.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu kaynağa erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    const user = await appwriteUsers.get(id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (_error) {
    logger.error('Get user error', _error, {
      endpoint: '/api/users/[id]',
      method: 'GET',
      userId: id,
    });
    return NextResponse.json({ success: false, _error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id]
 */
async function updateUserHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı güncelleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (body.email && typeof body.email === 'string' && !InputSanitizer.validateEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz e-posta adresi' },
        { status: 400 }
      );
    }

    if (body.name && typeof body.name === 'string' && body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Ad Soyad en az 2 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (body.role && typeof body.role === 'string' && body.role.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Rol bilgisi en az 2 karakter olmalıdır' },
        { status: 400 }
      );
    }

    const permissions = normalizeOptionalPermissions(body.permissions);

    if (body.permissions && (!permissions || permissions.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli en az bir modül erişimi seçilmelidir' },
        { status: 400 }
      );
    }

    let passwordHash: string | undefined;
    if (body.password && typeof body.password === 'string' && body.password.trim().length > 0) {
      const passwordValidation = validatePasswordStrength(body.password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { success: false, error: passwordValidation.error || 'Şifre yeterince güçlü değil' },
          { status: 400 }
        );
      }
      passwordHash = await hashPassword(body.password.trim());
    }

    const userData: Parameters<typeof appwriteUsers.update>[1] = {
      name: typeof body.name === 'string' ? body.name.trim() : undefined,
      email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined,
      role: typeof body.role === 'string' ? (body.role.trim() as any) : undefined,
      permissions,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      phone:
        typeof body.phone === 'string' && body.phone.trim().length > 0
          ? body.phone.trim()
          : undefined,
      avatar: typeof body.avatar === 'string' ? body.avatar : undefined,
      labels: Array.isArray(body.labels)
        ? body.labels.filter((item): item is string => typeof item === 'string')
        : undefined,
      ...(passwordHash && { passwordHash }),
    };

    const updated = await appwriteUsers.update(id, userData);

    return NextResponse.json({
      success: true,
      data: updated,
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

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ success: false, _error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, _error: 'Güncelleme işlemi başarısız' },
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
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı silme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    await appwriteUsers.remove(id);

    return NextResponse.json({
      success: true,
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

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json({ success: false, _error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, _error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

export const PATCH = updateUserHandler;
export const DELETE = deleteUserHandler;
