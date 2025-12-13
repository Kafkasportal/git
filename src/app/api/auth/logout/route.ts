import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { validateCsrfToken } from '@/lib/csrf';
import { parseAuthSession } from '@/lib/auth/session';
import { Client, Account } from 'node-appwrite';

/**
 * POST /api/auth/logout
 * Handle user logout and session cleanup
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const headerToken = request.headers.get('x-csrf-token') || '';
    const cookieToken = cookieStore.get('csrf-token')?.value || '';

    if (!validateCsrfToken(headerToken, cookieToken)) {
      return NextResponse.json(
        { success: false, error: 'Güvenlik doğrulaması başarısız' },
        { status: 403 }
      );
    }

    // Delete Appwrite session if exists
    try {
      const authSessionCookie = cookieStore.get('auth-session')?.value;
      if (authSessionCookie) {
        const session = parseAuthSession(authSessionCookie);
        if (session?.sessionId) {
          // Delete Appwrite session
          const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

          const account = new Account(client);

          // Try to delete the session (may fail if already expired, that's ok)
          try {
            await account.deleteSession(session.sessionId);
          } catch (_deleteError) {
            // Session might already be deleted or expired, that's fine
            logger.debug('Appwrite session already deleted or expired', {
              sessionId: session.sessionId,
            });
          }
        }
      }
    } catch (sessionError) {
      // Log but don't fail logout if session parsing fails
      logger.warn('Failed to cleanup Appwrite session during logout', { error: sessionError });
    }

    // Clear all auth-related cookies
    cookieStore.set('auth-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    cookieStore.set('csrf-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı',
    });
  } catch (_error: unknown) {
    logger.error('Logout error', _error, {
      endpoint: '/api/auth/logout',
      method: 'POST',
    });

    // Even if there's an error, we should clear the cookies
    try {
      const cookieStore = await cookies();

      cookieStore.set('auth-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });

      cookieStore.set('csrf-token', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
    } catch (cleanupError) {
      logger.error('Error during cookie cleanup', cleanupError, {
        endpoint: '/api/auth/logout',
        method: 'POST',
      });
    }

    // Return success even if cleanup has issues
    return NextResponse.json({
      success: true,
      message: 'Çıkış işlemi tamamlandı',
    });
  }
}
