import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { parseAuthSession } from './session';
import { appwriteServerAuth } from '@/lib/appwrite/auth';

/**
 * Get current user ID from auth session
 * Use this in API routes to get the authenticated user ID
 * @param request - NextRequest object (optional, will use cookies() if not provided)
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(request?: NextRequest): Promise<string | null> {
  try {
    let sessionCookie: string | undefined;

    if (request) {
      // Use request cookies if provided
      sessionCookie = request.cookies.get('auth-session')?.value;
    } else {
      // Use server-side cookies() function
      const cookieStore = await cookies();
      sessionCookie = cookieStore.get('auth-session')?.value;
    }

    if (!sessionCookie) {
      return null;
    }

    const sessionData = parseAuthSession(sessionCookie);
    if (!sessionData?.userId) {
      return null;
    }

    // Validate session expiration
    if (sessionData.expire) {
      const expireDate = new Date(sessionData.expire);
      if (expireDate < new Date()) {
        return null;
      }
    }

    return sessionData.userId as string;
  } catch (_error) {
    return null;
  }
}

/**
 * Get current user data from auth session
 * @param request - NextRequest object (optional)
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(request?: NextRequest) {
  const userId = await getCurrentUserId(request);

  if (!userId) {
    return null;
  }

  try {
    // Fetch user from Appwrite
    const { user } = await appwriteServerAuth.getUser(userId);
    return user;
  } catch (_error) {
    return null;
  }
}
