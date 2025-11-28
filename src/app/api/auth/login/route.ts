import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { authRateLimit } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import { appwriteUsers } from '@/lib/appwrite/api';
import { verifyPassword } from '@/lib/auth/password';
import { serializeSessionCookie } from '@/lib/auth/session';
import {
  isAccountLocked,
  getRemainingLockoutTime,
  recordLoginAttempt,
  getFailedAttemptCount,
  LOCKOUT_CONFIG,
} from '@/lib/auth/account-lockout';

/**
 * POST /api/auth/login
 * Handle user login with Appwrite authentication
 *
 * Looks up user in Appwrite users collection and verifies password
 */
export const POST = authRateLimit(async (request: NextRequest) => {
  let email: string | undefined;

  try {
    const headerToken = request.headers.get('x-csrf-token') || '';
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('csrf-token')?.value || '';

    if (!validateCsrfToken(headerToken, cookieToken)) {
      return NextResponse.json(
        { success: false, error: 'Güvenlik doğrulaması başarısız' },
        { status: 403 }
      );
    }

    const body = await request.json();
    email = body.email;
    const { password, rememberMe = false } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Check if account is locked due to failed attempts
    if (isAccountLocked(email)) {
      const remainingSeconds = getRemainingLockoutTime(email);
      const minutes = Math.ceil(remainingSeconds / 60);

      logger.warn('Login blocked - account locked', {
        email: `${email?.substring(0, 3)}***`,
        remainingSeconds,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Hesap geçici olarak kilitlendi. ${minutes} dakika sonra tekrar deneyin.`,
          locked: true,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Appwrite-based authentication
    // Look up user by email in Appwrite
    // email is guaranteed to be a string here due to validation above
    const emailLower = email.toLowerCase();
    const user = await appwriteUsers.getByEmail(emailLower);

    if (!user) {
      // Record failed attempt
      recordLoginAttempt(email, false);
      const failedAttempts = getFailedAttemptCount(email);
      const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

      logger.warn('Login failed - user not found', {
        email: `${email?.substring(0, 3)}***`,
        failedAttempts,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz email veya şifre',
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login failed - inactive account', {
        email: `${email?.substring(0, 3)}***`,
      });
      return NextResponse.json({ success: false, error: 'Hesap aktif değil' }, { status: 403 });
    }

    // Verify password
    if (!user.passwordHash) {
      logger.warn('Login failed - no password hash', {
        email: `${email?.substring(0, 3)}***`,
      });
      return NextResponse.json(
        { success: false, error: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Record failed attempt
      recordLoginAttempt(email, false);
      const failedAttempts = getFailedAttemptCount(email);
      const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

      logger.warn('Login failed - invalid password', {
        email: `${email?.substring(0, 3)}***`,
        failedAttempts,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz email veya şifre',
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 }
      );
    }

    // Record successful login (clears failed attempts)
    recordLoginAttempt(email, true);

    const userId = user.$id || user._id || '';
    const userData = {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role || 'Personel',
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      isActive: user.isActive,
      createdAt: user.$createdAt || user._creationTime || new Date().toISOString(),
      updatedAt: user.$updatedAt || user._updatedAt || new Date().toISOString(),
      phone: user.phone,
      labels: user.labels ?? [],
    };

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Ensure SESSION_SECRET is configured (required for signed cookies)
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 16) {
      logger.error('SESSION_SECRET missing or too short');
      return NextResponse.json(
        {
          success: false,
          error: 'Sunucu yapılandırması eksik (SESSION_SECRET)',
        },
        { status: 500 }
      );
    }

    // Set session cookies (signed)

    // Create session
    const expireTime = new Date(
      Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    );
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const signedSession = serializeSessionCookie({
      sessionId,
      userId,
      expire: expireTime.toISOString(),
    });

    // Session cookie (HttpOnly)
    cookieStore.set('auth-session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });

    // CSRF token cookie
    cookieStore.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    // Update last login time
    try {
      await appwriteUsers.update(userId, {
        lastLogin: new Date().toISOString(),
      });
    } catch (_error) {
      // Log but don't fail login if this fails
      logger.warn('Failed to update last login time', {
        error: _error,
        userId,
      });
    }

    logger.info('User logged in successfully', {
      userId,
      email: `${email?.substring(0, 3)}***`,
      role: userData.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: {
          sessionId,
          expire: expireTime.toISOString(),
        },
      },
    });
  } catch (_error: unknown) {
    const errorMessage =
      _error instanceof Error ? _error.message : 'Giriş yapılırken bir hata oluştu';

    logger.error('Login error', _error, {
      endpoint: '/api/auth/login',
      method: 'POST',
      email: `${email?.substring(0, 3)}***`,
    });

    // Check for invalid credentials
    if (
      errorMessage.toLowerCase().includes('invalid') ||
      errorMessage.toLowerCase().includes('credential') ||
      errorMessage.toLowerCase().includes('not found')
    ) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
});
