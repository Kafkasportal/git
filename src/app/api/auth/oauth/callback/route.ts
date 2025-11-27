import { NextRequest, NextResponse } from 'next/server';
import { Account } from 'appwrite';
import { client } from '@/lib/appwrite/client';
import { appwriteUsers } from '@/lib/appwrite/api';
import { generateCsrfToken } from '@/lib/csrf';
import { serializeSessionCookie } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

/**
 * GET /api/auth/oauth/callback
 * Handle OAuth callback and create custom session
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const error = url.searchParams.get('error');

    if (error) {
      logger.warn('OAuth authentication failed', { error });
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    if (!client) {
      throw new Error('Appwrite client not initialized');
    }

    // Get OAuth session from Appwrite
    const account = new Account(client);

    let appwriteUser;
    try {
      // Get current session (created by OAuth provider)
      const session = await account.getSession('current');

      if (!session) {
        throw new Error('No OAuth session found');
      }

      // Get user from Appwrite Auth
      appwriteUser = await account.get();

      if (!appwriteUser) {
        throw new Error('User not found in OAuth session');
      }
    } catch (sessionError) {
      logger.error('Failed to get OAuth session', { error: sessionError });
      return NextResponse.redirect(new URL('/login?error=session_failed', request.url));
    }

    // Find user in our users collection by email
    const emailLower = appwriteUser.email.toLowerCase();
    let user = await appwriteUsers.getByEmail(emailLower);

    // If user doesn't exist, create one
    if (!user) {
      logger.info('Creating new user from OAuth', { email: emailLower });

      // Create user in our collection (no password for OAuth users)
      const newUser = await appwriteUsers.create({
        email: emailLower,
        name: appwriteUser.name || appwriteUser.email.split('@')[0],
        role: 'Personel', // Default role
        permissions: [], // Default permissions
        isActive: true,
        passwordHash: '', // OAuth users don't have password
        labels: ['oauth'],
      });

      user = newUser;
    }

    // Check if user is active
    if (!user.isActive) {
      const maskedEmail = emailLower.substring(0, 3) + '***';
      logger.warn('OAuth login failed - inactive account', {
        email: maskedEmail,
      });

      // Delete Appwrite session since we won't use it
      try {
        await account.deleteSession('current');
      } catch {
        // Ignore cleanup errors
      }

      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url));
    }

    // Delete Appwrite session (we'll use our own custom session)
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore cleanup errors
    }

    // Create custom session
    const cookieStore = await cookies();
    const userId = user.$id || user._id || '';
    const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for OAuth
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const signedSession = serializeSessionCookie({
      sessionId,
      userId,
      expire: expireTime.toISOString(),
    });

    // Set session cookie (HttpOnly)
    cookieStore.set('auth-session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken();
    cookieStore.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Update last login
    try {
      await appwriteUsers.update(userId, {
        lastLogin: new Date().toISOString(),
      });
    } catch {
      // Ignore if this fails
    }

    const maskedEmail = emailLower.substring(0, 3) + '***';
    logger.info('OAuth login successful', {
      userId,
      email: maskedEmail,
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/genel', request.url));
  } catch (error) {
    logger.error('OAuth callback error', error, {
      endpoint: '/api/auth/oauth/callback',
      method: 'GET',
    });

    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }
}
