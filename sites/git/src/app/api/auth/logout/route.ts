import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { validateCsrfToken } from '@/lib/csrf';

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
