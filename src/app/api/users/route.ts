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
import { ALL_PERMISSIONS } from '@/types/permissions';

function jsonSuccess(data: unknown, status = 200, message?: string) {
  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status },
  );
}

function jsonError(error: string, status = 400, details?: string[]) {
  return NextResponse.json(
    { success: false, error, ...(details ? { details } : {}) },
    { status },
  );
}

async function getUsersHandler(request: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions?.includes('users:manage')) {
      return jsonError('Bu kaynağa erişim yetkiniz yok', 403);
    }

    const { searchParams } = new URL(request.url);
    const normalized = normalizeQueryParams(searchParams);

    const role = searchParams.get('role') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive =
      isActiveParam === null ? undefined : isActiveParam.toLowerCase() === 'true';

    const response = await appwriteUsers.list({
      search: typeof normalized.search === 'string' ? normalized.search : undefined,
      role: role || undefined,
      isActive,
      limit: typeof normalized.limit === 'number' ? normalized.limit : undefined,
    });

    return jsonSuccess(
      { documents: response.documents, total: response.total },
      200,
    );
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    // Check for Appwrite configuration errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not configured') || errorMessage.includes('Appwrite server client')) {
      logger.error('Appwrite configuration error', error, {
        endpoint: '/api/users',
        method: 'GET',
      });
      return jsonError('Sunucu yapılandırma hatası. Lütfen yönetici ile iletişime geçin.', 500);
    }

    logger.error('List users error', error, {
      endpoint: '/api/users',
      method: 'GET',
      errorMessage,
    });
    return jsonError('Kullanıcılar alınamadı', 500);
  }
}

async function createUserHandler(request: NextRequest) {
  try {
    await verifyCsrfToken(request);
    const { user } = await requireAuthenticatedUser();
    if (!user.permissions?.includes('users:manage')) {
      return jsonError('Bu kaynağa erişim yetkiniz yok', 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError('Geçersiz istek verisi', 400);
    }

    const bodyData = (body ?? {}) as Record<string, unknown>;
    const name = typeof bodyData.name === 'string' ? bodyData.name.trim() : '';
    const email =
      typeof bodyData.email === 'string' ? bodyData.email.trim().toLowerCase() : '';
    const role = typeof bodyData.role === 'string' ? bodyData.role.trim() : '';
    const password = typeof bodyData.password === 'string' ? bodyData.password : '';
    const permissions = Array.isArray(bodyData.permissions)
      ? bodyData.permissions.filter((p): p is string => typeof p === 'string')
      : [];

    const details: string[] = [];

    if (!name) {
      details.push('İsim zorunludur');
    } else if (name.length < 3) {
      details.push('İsim en az 3 karakter olmalıdır');
    }

    if (!email || !email.includes('@')) {
      details.push('Geçerli bir e-posta adresi gerekli');
    }

    if (!role) {
      details.push('Rol zorunludur');
    } else if (role.length < 2) {
      details.push('Rol en az 2 karakter olmalıdır');
    }

    if (!Array.isArray(bodyData.permissions)) {
      details.push('Yetkiler zorunludur');
    } else if (permissions.some((p) => !(ALL_PERMISSIONS as readonly string[]).includes(p))) {
      details.push('Geçersiz yetki');
    }

    if (!password) {
      details.push('Şifre zorunludur');
    }

    if (details.length > 0) {
      return jsonError('Validation failed', 400, details);
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return jsonError('Validation failed', 400, [
        strength.error || 'Şifre yeterince güçlü değil',
      ]);
    }

    const passwordHash = await hashPassword(password);
    const created = await appwriteUsers.create({
      name,
      email,
      role,
      permissions,
      passwordHash,
      isActive: true,
    } as any);

    return jsonSuccess(created, 201, 'Kullanıcı oluşturuldu');
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    // Check for Appwrite configuration errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not configured') || errorMessage.includes('Appwrite server client')) {
      logger.error('Appwrite configuration error', error, {
        endpoint: '/api/users',
        method: 'POST',
      });
      return jsonError('Sunucu yapılandırma hatası. Lütfen yönetici ile iletişime geçin.', 500);
    }

    logger.error('Create user error', error, {
      endpoint: '/api/users',
      method: 'POST',
      errorMessage,
    });
    return jsonError('Kullanıcı oluşturulamadı', 500);
  }
}

export const GET = readOnlyRateLimit(getUsersHandler);
export const POST = dataModificationRateLimit(createUserHandler);
