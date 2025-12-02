import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { appwriteUsers } from '@/lib/appwrite/api';
import { MODULE_PERMISSIONS, SPECIAL_PERMISSIONS, type PermissionValue } from '@/types/permissions';
import { getEffectivePermissions } from '@/lib/auth/permissions';

export interface AuthSession {
  sessionId: string;
  userId: string;
  expire?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions: PermissionValue[];
  isActive: boolean;
  labels?: string[];
}

const getSessionSecret = (): string | null => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return null;
  }
  return secret;
};

/**
 * Sign payload using Web Crypto API (Edge Runtime compatible)
 */
const signPayload = async (payload: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Constant-time string comparison (Edge Runtime compatible)
 */
const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Legacy JSON parser kept for backward compatibility with old cookies.
 */
const parseLegacySession = (cookieValue?: string): AuthSession | null => {
  if (!cookieValue) return null;
  try {
    const parsed = JSON.parse(cookieValue) as AuthSession;
    if (!parsed?.sessionId || !parsed?.userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Serialize & sign session using HMAC (base64url.payload + signature).
 */
export const serializeSessionCookie = async (session: AuthSession): Promise<string> => {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('SESSION_SECRET is missing or too short');
  }
  const encoder = new TextEncoder();
  const jsonData = JSON.stringify(session);
  const encoded = encoder.encode(jsonData);
  const payload = btoa(String.fromCharCode(...encoded))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const signature = await signPayload(payload, secret);
  return `${payload}.${signature}`;
};

/**
 * Parse serialized session cookie safely with signature verification.
 * Falls back to legacy JSON sessions for existing cookies.
 */
export async function parseAuthSession(cookieValue?: string): Promise<AuthSession | null> {
  if (!cookieValue) {
    return null;
  }

  // Signed format: payload.signature
  const [payload, signature] = cookieValue.split('.');
  const secret = getSessionSecret();

  if (payload && signature && secret) {
    try {
      const expectedSig = await signPayload(payload, secret);
      if (!safeEqual(signature, expectedSig)) {
        return null;
      }
      // Base64url decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = atob(base64 + padding);
      const parsed = JSON.parse(decoded) as AuthSession;
      if (!parsed?.sessionId || !parsed?.userId) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  // Legacy JSON (unsigned) fallback
  return parseLegacySession(cookieValue);
}

/**
 * Determine whether the provided session is expired.
 */
export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session?.expire) {
    return false;
  }

  const expireDate = new Date(session.expire);
  return Number.isNaN(expireDate.getTime()) ? false : expireDate.getTime() < Date.now();
}

/**
 * Extract auth-session cookie from a NextRequest.
 */
export async function getAuthSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  const cookieValue = request.cookies.get('auth-session')?.value;
  return parseAuthSession(cookieValue);
}

/**
 * Extract auth-session cookie using Next's cookies() helper.
 * Meant for API routes where NextRequest is not directly available.
 */
export async function getAuthSessionFromCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get('auth-session')?.value;
  return await parseAuthSession(cookieValue);
}

/**
 * Fetch the authenticated Appwrite user associated with the session.
 */
export async function getUserFromSession(session: AuthSession | null): Promise<SessionUser | null> {
  if (!session || isSessionExpired(session)) {
    return null;
  }

  // Handle development mock sessions
  if (session.userId.startsWith('mock-')) {
    const baseModulePermissions = Object.values(MODULE_PERMISSIONS);

    const mockUserMap: Record<
      string,
      { email: string; name: string; role: string; permissions: PermissionValue[] }
    > = {
      'mock-admin-1': {
        email: 'admin@test.com',
        name: 'Dernek Başkanı',
        role: 'Dernek Başkanı',
        permissions: [...baseModulePermissions, SPECIAL_PERMISSIONS.USERS_MANAGE],
      },
      'mock-admin-2': {
        email: 'admin@portal.com',
        name: 'Dernek Başkanı',
        role: 'Dernek Başkanı',
        permissions: [...baseModulePermissions, SPECIAL_PERMISSIONS.USERS_MANAGE],
      },
      'mock-manager-1': {
        email: 'manager@test.com',
        name: 'Yönetici Kullanıcı',
        role: 'Yönetici',
        permissions: baseModulePermissions,
      },
      'mock-member-1': {
        email: 'member@test.com',
        name: 'Üye Kullanıcı',
        role: 'Üye',
        permissions: [
          MODULE_PERMISSIONS.BENEFICIARIES,
          MODULE_PERMISSIONS.AID_APPLICATIONS,
          MODULE_PERMISSIONS.MESSAGES,
        ],
      },
      'mock-viewer-1': {
        email: 'viewer@test.com',
        name: 'İzleyici Kullanıcı',
        role: 'Görüntüleyici',
        permissions: [
          MODULE_PERMISSIONS.BENEFICIARIES,
          MODULE_PERMISSIONS.DONATIONS,
          MODULE_PERMISSIONS.REPORTS,
        ],
      },
    };

    const mockUser = mockUserMap[session.userId];
    if (!mockUser) {
      return null;
    }

    return {
      id: session.userId,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      permissions: mockUser.permissions,
      isActive: true,
      labels: [],
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await appwriteUsers.get(session.userId) as any;

    if (!user || !user.isActive) {
      return null;
    }

    const roleString = (user.role || '').toString();
    const explicitPermissions: PermissionValue[] = Array.isArray(user.permissions)
      ? (user.permissions as PermissionValue[])
      : [];

    // Get effective permissions (includes role-based auto-grants for admin roles)
    const effectivePermissions = getEffectivePermissions(roleString, explicitPermissions);

    const userId = user.$id || user._id || session.userId;
    return {
      id: userId,
      email: user.email || '',
      name: user.name || '',
      role: roleString || 'Personel',
      permissions: effectivePermissions,
      isActive: user.isActive,
      labels: user.labels || [],
    };
  } catch {
    return null;
  }
}

/**
 * Convenience helper to obtain session & user tuple for a request.
 */
export async function getRequestAuthContext(request: NextRequest): Promise<{
  session: AuthSession | null;
  user: SessionUser | null;
}> {
  const session = await getAuthSessionFromRequest(request);
  const user = await getUserFromSession(session);
  return { session, user };
}
