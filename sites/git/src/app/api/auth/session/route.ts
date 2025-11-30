import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { parseAuthSession } from '@/lib/auth/session';

/**
 * GET /api/auth/session
 * Get current session (for client-side auth state initialization)
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth-session');
    const parsedSession = parseAuthSession(sessionCookie?.value);

    if (!parsedSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session',
        },
        { status: 401 }
      );
    }

    // Validate expiration
    const expiresAt = new Date(parsedSession.expire || '');

    // Check expiration
    if (expiresAt <= new Date()) {
      // Clear expired cookie
      cookieStore.delete('auth-session');

      return NextResponse.json(
        {
          success: false,
          error: 'Session expired',
        },
        { status: 401 }
      );
    }

    // Return session info (without sensitive tokens)
    return NextResponse.json({
      success: true,
      data: {
        userId: parsedSession.userId,
        expiresAt: parsedSession.expire,
      },
    });
  } catch (_error: unknown) {
    logger.error('Session validation error', _error, {
      endpoint: '/api/auth/session',
      method: 'GET',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid session',
      },
      { status: 401 }
    );
  }
}
