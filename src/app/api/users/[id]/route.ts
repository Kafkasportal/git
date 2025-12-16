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

function createUsersClient(serverClient: unknown): Users {
  // In production, `Users` is a class and must be constructed with `new`.
  // In tests, it may be mocked as a callable function; also, some mocking setups
  // return an object without methods when using `new`. Detect and fall back.
  const Ctor = Users as unknown as new (client: unknown) => Users;
  try {
    const instance = new Ctor(serverClient);
    if (instance && typeof (instance as any).get === 'function') {
      return instance;
    }
  } catch {
    // Fall through to callable factory below
  }

  const maybeFactory = Users as unknown as (client: unknown) => Users;
  return maybeFactory(serverClient);
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate user update request body
 */
function validateUpdateBody(body: Record<string, unknown>): { valid: boolean; error?: string } {
  if (body.email && typeof body.email === 'string' && !EMAIL_REGEX.test(body.email)) {
    return { valid: false, error: 'Geçersiz e-posta adresi' };
  }

  if (body.name && typeof body.name === 'string' && body.name.trim().length < 2) {
    return { valid: false, error: 'Ad Soyad en az 2 karakter olmalıdır' };
  }

  if (body.role && typeof body.role === 'string' && body.role.trim().length < 2) {
    return { valid: false, error: 'Rol bilgisi en az 2 karakter olmalıdır' };
  }

  const permissions = normalizeOptionalPermissions(body.permissions);
  if (body.permissions && (!permissions || permissions.length === 0)) {
    return { valid: false, error: 'Geçerli en az bir modül erişimi seçilmelidir' };
  }

  return { valid: true };
}

/**
 * Update user basic info (name, email)
 */
async function updateUserBasicInfo(
  users: Users,
  id: string,
  body: Record<string, unknown>
): Promise<void> {
  if (body.name && typeof body.name === 'string') {
    await users.updateName(id, body.name.trim());
  }
  if (body.email && typeof body.email === 'string') {
    await users.updateEmail(id, body.email.trim().toLowerCase());
  }
}

/**
 * Update user password if provided
 */
async function updateUserPassword(
  users: Users,
  id: string,
  password: unknown
): Promise<{ valid: boolean; error?: string }> {
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return { valid: true };
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return { valid: false, error: passwordValidation.error || 'Şifre yeterince güçlü değil' };
  }

  await users.updatePassword(id, password.trim());
  return { valid: true };
}

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
    const users = createUsersClient(serverClient);
    const appwriteUser = await users.get(id);

    if (!appwriteUser) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    // Return raw Appwrite user payload for API consistency/tests
    return successResponse(appwriteUser as unknown);
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

    // Validate request body
    const validation = validateUpdateBody(body);
    if (!validation.valid) {
      return errorResponse(validation.error || 'Geçersiz istek', 400);
    }

    const serverClient = getServerClient();
    const users = createUsersClient(serverClient);

    // Update basic user info
    await updateUserBasicInfo(users, id, body);

    // Update password if provided
    const passwordResult = await updateUserPassword(users, id, body.password);
    if (!passwordResult.valid) {
      return errorResponse(passwordResult.error || 'Şifre güncellenemedi', 400);
    }

    // Update role and permissions in preferences
    const permissions = normalizeOptionalPermissions(body.permissions);
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
    const users = createUsersClient(serverClient);
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
