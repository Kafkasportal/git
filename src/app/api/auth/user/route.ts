import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { getAuthSessionFromCookies, getUserFromSession } from '@/lib/auth/session';

/**
 * GET /api/auth/user
 * Get current authenticated user data
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getAuthSessionFromCookies();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session',
        },
        { status: 401 }
      );
    }

    const user = await getUserFromSession(session);

    if (!user) {
      // Clear invalid session
      const cookieStore = await cookies();
      cookieStore.delete('auth-session');

      return NextResponse.json(
        {
          success: false,
          error: 'User not found or inactive',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        labels: user.labels,
      },
    });
  } catch (error: unknown) {
    logger.error('Get user error', error, {
      endpoint: '/api/auth/user',
      method: 'GET',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user data',
      },
      { status: 500 }
    );
  }
}

