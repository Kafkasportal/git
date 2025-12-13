import type { Models } from 'node-appwrite';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

const PERMISSION_SET = new Set(ALL_PERMISSIONS);

/**
 * Extract role and permissions from Appwrite user preferences
 */
export function extractUserRoleAndPermissions(
  prefs?: Models.Preferences
): { role: string; permissions: string[] } {
  let role = 'Personel';
  let permissions: string[] = [];

  if (prefs && typeof prefs === 'object') {
    const prefsObj = prefs as Record<string, unknown>;
    role = (prefsObj.role as string) || 'Personel';
    const permissionsStr = prefsObj.permissions as string;
    if (permissionsStr) {
      try {
        permissions = JSON.parse(permissionsStr);
      } catch {
        permissions = [];
      }
    }
  }

  return { role, permissions };
}

/**
 * Normalize optional permissions array
 */
export function normalizeOptionalPermissions(permissions: unknown): PermissionValue[] | undefined {
  if (!Array.isArray(permissions)) return undefined;
  const normalized = permissions.filter(
    (permission): permission is PermissionValue =>
      typeof permission === 'string' && PERMISSION_SET.has(permission as PermissionValue)
  );
  return normalized.length ? Array.from(new Set(normalized)) : [];
}

/**
 * Transform Appwrite user to our API format
 */
export function transformAppwriteUser(user: Models.User<Models.Preferences>): {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  emailVerification: boolean;
  phoneVerification: boolean;
} {
  const { role, permissions } = extractUserRoleAndPermissions(user.prefs);

  return {
    id: user.$id,
    email: user.email,
    name: user.name,
    role,
    permissions,
    createdAt: user.$createdAt,
    updatedAt: user.$updatedAt,
    emailVerification: user.emailVerification,
    phoneVerification: user.phoneVerification,
  };
}

/**
 * Update user preferences with role and permissions
 */
export function buildUserPreferences(
  currentPrefs: Models.Preferences,
  updates: {
    role?: string;
    permissions?: PermissionValue[];
  }
): Record<string, string> {
  const newPrefs: Record<string, string> = {};

  // Copy existing prefs, converting values to strings
  for (const [key, value] of Object.entries(currentPrefs || {})) {
    newPrefs[key] = String(value);
  }

  if (updates.role) {
    newPrefs.role = updates.role.trim();
  }

  if (updates.permissions !== undefined) {
    newPrefs.permissions = JSON.stringify(updates.permissions);
  }

  return newPrefs;
}

