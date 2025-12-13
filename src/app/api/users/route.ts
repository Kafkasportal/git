import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import {
  requireAuthenticatedUser,
  verifyCsrfToken,
  buildErrorResponse,
} from '@/lib/api/auth-utils';
import { parseBody, handleApiError } from '@/lib/api/route-helpers';
import { dataModificationRateLimit, readOnlyRateLimit } from '@/lib/rate-limit';
import { Users, ID, Query } from 'node-appwrite';
import { getServerClient } from '@/lib/appwrite/server';

async function getUsersHandler(request: NextRequest) {
  try {
    await requireAuthenticatedUser();
    // Note: Using Appwrite Auth - list users from Appwrite
    const serverClient = getServerClient();
    const users = new Users(serverClient);

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

    try {
      const response = await users.list([Query.limit(limit)]);
      
      // Transform Appwrite users to our format
      const userList = response.users.map((user) => ({
        id: user.$id,
        email: user.email,
        name: user.name,
        createdAt: user.$createdAt,
        updatedAt: user.$updatedAt,
        emailVerification: user.emailVerification,
        phoneVerification: user.phoneVerification,
      }));

      return NextResponse.json({
        success: true,
        data: userList,
        total: response.total,
      });
    } catch (listError) {
      logger.error('Failed to list users from Appwrite', { error: listError } as Record<string, unknown>);
      return NextResponse.json(
        { success: false, error: 'Kullanıcılar listelenemedi' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List users error', error, {
      endpoint: '/api/users',
      method: 'GET',
    });
    return NextResponse.json({ success: false, error: 'Veri alınamadı' }, { status: 500 });
  }
}

async function createUserHandler(request: NextRequest) {
  let _bodyForLog: Record<string, unknown> | null = null;
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();
    // Note: Permission check removed - using Appwrite Auth directly
    // You can add role-based checks here if needed

    const { data: body, error: parseError } = await parseBody(request);
    const bodyData = body as Record<string, unknown>;
    _bodyForLog = bodyData;
    if (parseError) {
      return NextResponse.json({ success: false, error: parseError }, { status: 400 });
    }

    const email = typeof bodyData.email === 'string' ? bodyData.email.trim().toLowerCase() : '';
    const password = typeof bodyData.password === 'string' ? bodyData.password : '';
    const name = typeof bodyData.name === 'string' ? bodyData.name.trim() : '';
    const role = typeof bodyData.role === 'string' ? bodyData.role.trim() : 'Personel';
    const permissions = Array.isArray(bodyData.permissions) 
      ? bodyData.permissions.filter((p): p is string => typeof p === 'string')
      : [];

    // Basic validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi gerekli' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Şifre en az 8 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Ad Soyad en az 2 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Create user in Appwrite Auth
    const serverClient = getServerClient();
    const users = new Users(serverClient);
    const userId = ID.unique();

    try {
      // Create user
      const appwriteUser = await users.create(
        userId,
        email,
        undefined, // phone
        password,
        name
      );

      // Set role and permissions in user preferences
      const preferences: Record<string, string> = {
        role,
        permissions: JSON.stringify(permissions),
      };

      await users.updatePrefs(appwriteUser.$id, preferences);

      logger.info('User created successfully in Appwrite Auth with permissions', {
        userId: appwriteUser.$id,
        email: appwriteUser.email,
        role,
        permissionsCount: permissions.length,
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            id: appwriteUser.$id,
            email: appwriteUser.email,
            name: appwriteUser.name,
            role,
            permissions,
            createdAt: appwriteUser.$createdAt,
          },
          message: 'Kullanıcı oluşturuldu',
        },
        { status: 201 }
      );
    } catch (createError: unknown) {
      const errorMessage =
        createError instanceof Error ? createError.message : 'Kullanıcı oluşturulamadı';
      
      // Check if user already exists
      if (errorMessage.includes('already') || errorMessage.includes('exists')) {
        return NextResponse.json(
          { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' },
          { status: 409 }
        );
      }

      logger.error('Failed to create user in Appwrite Auth', {
        error: createError,
        email,
      });

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    return await handleApiError(
      error,
      logger,
      {
        endpoint: '/api/users',
        method: 'POST',
        email: _bodyForLog?.email as string | undefined,
      },
      'Kullanıcı oluşturulamadı'
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getUsersHandler);
export const POST = dataModificationRateLimit(createUserHandler);
