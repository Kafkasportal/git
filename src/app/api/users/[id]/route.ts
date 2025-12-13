import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { extractParams, successResponse, errorResponse } from '@/lib/api/route-helpers';
import { validatePasswordStrength } from '@/lib/auth/password';
import {
  buildErrorResponse,
  requireAuthenticatedUser,
  verifyCsrfToken,
} from '@/lib/api/auth-utils';
import { Users } from 'node-appwrite';
import { getServerClient } from '@/lib/appwrite/server';
import {
  transformAppwriteUser,
  normalizeOptionalPermissions,
  buildUserPreferences,
} from '@/lib/appwrite/user-transform';

/**
 * GET /api/users/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);
  try {
    const { user: currentUser } = await requireAuthenticatedUser();
    if (!currentUser.permissions.includes('users:manage')) {
      return errorResponse('Bu kaynağa erişim yetkiniz yok', 403);
    }

    // Get user from Appwrite Auth
    const serverClient = getServerClient();
    const users = new Users(serverClient);
    const appwriteUser = await users.get(id);

    const userData = transformAppwriteUser(appwriteUser);

    return successResponse(userData);
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

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('not found')) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    return errorResponse('Kullanıcı bilgisi alınamadı', 500);
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
      return errorResponse('Kullanıcı güncelleme yetkiniz bulunmuyor', 403);
    }

    const body = (await request.json()) as Record<string, unknown>;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.email && typeof body.email === 'string' && !emailRegex.test(body.email)) {
      return errorResponse('Geçersiz e-posta adresi', 400);
    }

    if (body.name && typeof body.name === 'string' && body.name.trim().length < 2) {
      return errorResponse('Ad Soyad en az 2 karakter olmalıdır', 400);
    }

    if (body.role && typeof body.role === 'string' && body.role.trim().length < 2) {
      return errorResponse('Rol bilgisi en az 2 karakter olmalıdır', 400);
    }

    const permissions = normalizeOptionalPermissions(body.permissions);

    if (body.permissions && (!permissions || permissions.length === 0)) {
      return errorResponse('Geçerli en az bir modül erişimi seçilmelidir', 400);
    }

    // Update user in Appwrite Auth
    const serverClient = getServerClient();
    const users = new Users(serverClient);

    // Update basic user info
    if (body.name && typeof body.name === 'string') {
      await users.updateName(id, body.name.trim());
    }
    if (body.email && typeof body.email === 'string') {
      await users.updateEmail(id, body.email.trim().toLowerCase());
    }

    // Update password if provided
    if (body.password && typeof body.password === 'string' && body.password.trim().length > 0) {
      const passwordValidation = validatePasswordStrength(body.password);
      if (!passwordValidation.valid) {
        return errorResponse(passwordValidation.error || 'Şifre yeterince güçlü değil', 400);
      }
      await users.updatePassword(id, body.password.trim());
    }

    // Update role and permissions in preferences
    const currentUser = await users.get(id);
    const newPrefs = buildUserPreferences(currentUser.prefs || {}, {
      role: body.role && typeof body.role === 'string' ? body.role.trim() : undefined,
      permissions,
    });

    await users.updatePrefs(id, newPrefs);

    // Get updated user
    const updatedUser = await users.get(id);
    const updatedData = transformAppwriteUser(updatedUser);

    return successResponse(updatedData, 'Kullanıcı başarıyla güncellendi');
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
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    return errorResponse('Güncelleme işlemi başarısız', 500);
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
      return errorResponse('Kullanıcı silme yetkiniz bulunmuyor', 403);
    }

    // Delete user from Appwrite Auth
    const serverClient = getServerClient();
    const users = new Users(serverClient);
    await users.delete(id);

    return successResponse(null, 'Kullanıcı başarıyla silindi');
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
    if (errorMessage.includes('not found')) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    return errorResponse('Silme işlemi başarısız', 500);
  }
}

export const PATCH = updateUserHandler;
export const DELETE = deleteUserHandler;
