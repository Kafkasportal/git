import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { extractParams } from '@/lib/api/route-helpers';
import { validatePasswordStrength } from '@/lib/auth/password';
import {
  buildErrorResponse,
  requireAuthenticatedUser,
  verifyCsrfToken,
} from '@/lib/api/auth-utils';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';
import { Users } from 'node-appwrite';
import { getServerClient } from '@/lib/appwrite/server';

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

    // Get user from Appwrite Auth
    const serverClient = getServerClient();
    const users = new Users(serverClient);
    const appwriteUser = await users.get(id);

    // Extract role and permissions from preferences
    let role = "Personel";
    let permissions: string[] = [];
    
    if (appwriteUser.prefs) {
      role = (appwriteUser.prefs.role as string) || "Personel";
      const permissionsStr = appwriteUser.prefs.permissions as string;
      if (permissionsStr) {
        try {
          permissions = JSON.parse(permissionsStr);
        } catch {
          permissions = [];
        }
      }
    }

    const userData = {
      id: appwriteUser.$id,
      email: appwriteUser.email,
      name: appwriteUser.name,
      role,
      permissions,
      createdAt: appwriteUser.$createdAt,
      updatedAt: appwriteUser.$updatedAt,
      emailVerification: appwriteUser.emailVerification,
      phoneVerification: appwriteUser.phoneVerification,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });
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
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Kullanıcı bilgisi alınamadı' }, { status: 500 });
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.email && typeof body.email === 'string' && !emailRegex.test(body.email)) {
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
        return NextResponse.json(
          { success: false, error: passwordValidation.error || 'Şifre yeterince güçlü değil' },
          { status: 400 }
        );
      }
      await users.updatePassword(id, body.password.trim());
    }

    // Update role and permissions in preferences
    const currentUser = await users.get(id);
    const currentPrefs = (currentUser.prefs as Record<string, unknown>) || {};
    const newPrefs: Record<string, string> = {};
    
    // Copy existing prefs, converting values to strings
    for (const [key, value] of Object.entries(currentPrefs)) {
      newPrefs[key] = String(value);
    }

    if (body.role && typeof body.role === 'string') {
      newPrefs.role = body.role.trim();
    }

    if (permissions !== undefined) {
      newPrefs.permissions = JSON.stringify(permissions);
    }

    await users.updatePrefs(id, newPrefs);

    // Get updated user
    const updatedUser = await users.get(id);
    let updatedRole = "Personel";
    let updatedPermissions: string[] = [];
    
    if (updatedUser.prefs) {
      updatedRole = (updatedUser.prefs.role as string) || "Personel";
      const permissionsStr = updatedUser.prefs.permissions as string;
      if (permissionsStr) {
        try {
          updatedPermissions = JSON.parse(permissionsStr);
        } catch {
          updatedPermissions = [];
        }
      }
    }

    const updatedData = {
      id: updatedUser.$id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedRole,
      permissions: updatedPermissions,
      createdAt: updatedUser.$createdAt,
      updatedAt: updatedUser.$updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: updatedData,
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
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

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

    // Delete user from Appwrite Auth
    const serverClient = getServerClient();
    const users = new Users(serverClient);
    await users.delete(id);

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
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

export const PATCH = updateUserHandler;
export const DELETE = deleteUserHandler;
