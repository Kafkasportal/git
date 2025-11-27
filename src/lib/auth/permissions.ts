/**
 * Permission Utilities
 * Centralized permission handling logic
 */

import { MODULE_PERMISSIONS, SPECIAL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

/**
 * Normalize and deduplicate permissions
 */
export function normalizePermissions(permissions: PermissionValue[]): PermissionValue[] {
  if (!Array.isArray(permissions)) {
    return [];
  }

  // Remove duplicates and wildcard
  const normalized = permissions.filter((p) => p !== '*' && p !== '');
  return Array.from(new Set(normalized));
}

/**
 * Get permissions for a user based on role and explicit permissions
 * Admin roles get full permissions automatically
 */
export function getEffectivePermissions(
  role: string,
  explicitPermissions: PermissionValue[]
): PermissionValue[] {
  const roleUpper = (role || '').toString().toUpperCase();
  const baseModulePermissions = Object.values(MODULE_PERMISSIONS);

  // Normalize explicit permissions
  let effectivePermissions = normalizePermissions(explicitPermissions);

  // Admin-level roles get all base module permissions + user management
  const isAdminRole =
    roleUpper.includes('ADMIN') ||
    roleUpper.includes('BAŞKAN') ||
    roleUpper.includes('PRESIDENT') ||
    roleUpper.includes('DIRECTOR');

  if (isAdminRole) {
    const withAdmin = new Set<PermissionValue>([
      ...effectivePermissions,
      ...baseModulePermissions,
      SPECIAL_PERMISSIONS.USERS_MANAGE,
      SPECIAL_PERMISSIONS.SETTINGS_MANAGE,
    ]);
    effectivePermissions = Array.from(withAdmin);
  }

  return effectivePermissions;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userPermissions: PermissionValue[],
  permission: PermissionValue | string
): boolean {
  if (!Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(permission as PermissionValue);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: PermissionValue[],
  permissions: Array<PermissionValue | string>
): boolean {
  if (!Array.isArray(userPermissions) || !Array.isArray(permissions)) {
    return false;
  }
  return permissions.some((p) => userPermissions.includes(p as PermissionValue));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: PermissionValue[],
  permissions: Array<PermissionValue | string>
): boolean {
  if (!Array.isArray(userPermissions) || !Array.isArray(permissions)) {
    return false;
  }
  return permissions.every((p) => userPermissions.includes(p as PermissionValue));
}
