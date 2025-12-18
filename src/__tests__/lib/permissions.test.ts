import { describe, it, expect } from 'vitest';
import {
  normalizePermissions,
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@/lib/auth/permissions';

describe('permissions utilities', () => {
  describe('normalizePermissions', () => {
    it('should return empty array for null input', () => {
      // @ts-expect-error - Testing with invalid input
      const result = normalizePermissions(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      // @ts-expect-error - Testing with invalid input
      const result = normalizePermissions(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      // @ts-expect-error - Testing with invalid input
      const result = normalizePermissions('not-an-array');
      expect(result).toEqual([]);
    });

    it('should remove wildcard permission', () => {
      const permissions = ['users:read', '*', 'tasks:write'];
      const result = normalizePermissions(permissions as any);
      expect(result).not.toContain('*');
      expect(result).toContain('users:read');
      expect(result).toContain('tasks:write');
    });

    it('should remove empty string permissions', () => {
      const permissions = ['users:read', '', 'tasks:write'];
      const result = normalizePermissions(permissions as any);
      expect(result).not.toContain('');
    });

    it('should remove duplicate permissions', () => {
      const permissions = ['beneficiaries:access', 'beneficiaries:access', 'donations:access', 'beneficiaries:access'];
      const result = normalizePermissions(permissions as any);
      expect(result).toEqual(expect.arrayContaining(['beneficiaries:access', 'donations:access']));
      expect(result.filter((p) => p === 'beneficiaries:access')).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = normalizePermissions([]);
      expect(result).toEqual([]);
    });

    it('should preserve valid permissions', () => {
      const permissions = ['users:read', 'tasks:write', 'reports:view'];
      const result = normalizePermissions(permissions as any);
      expect(result).toContain('users:read');
      expect(result).toContain('tasks:write');
      expect(result).toContain('reports:view');
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return explicit permissions for non-admin role', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = getEffectivePermissions('editor', permissions as any);
      expect(result).toContain('users:read');
      expect(result).toContain('tasks:write');
    });

    it('should add admin permissions for ADMIN role', () => {
      const result = getEffectivePermissions('ADMIN', []);
      expect(result).toContain('USERS_MANAGE');
      expect(result).toContain('SETTINGS_MANAGE');
    });

    it('should add admin permissions for admin role (lowercase)', () => {
      const result = getEffectivePermissions('admin', []);
      expect(result).toContain('USERS_MANAGE');
      expect(result).toContain('SETTINGS_MANAGE');
    });

    it('should add admin permissions for BAŞKAN role', () => {
      const result = getEffectivePermissions('BAŞKAN', []);
      expect(result).toContain('USERS_MANAGE');
      expect(result).toContain('SETTINGS_MANAGE');
    });

    it('should add admin permissions for PRESIDENT role', () => {
      const result = getEffectivePermissions('PRESIDENT', []);
      expect(result).toContain('USERS_MANAGE');
      expect(result).toContain('SETTINGS_MANAGE');
    });

    it('should add admin permissions for DIRECTOR role', () => {
      const result = getEffectivePermissions('DIRECTOR', []);
      expect(result).toContain('USERS_MANAGE');
      expect(result).toContain('SETTINGS_MANAGE');
    });

    it('should normalize explicit permissions', () => {
      const permissions = ['beneficiaries:access', '*', 'beneficiaries:access'];
      const result = getEffectivePermissions('editor', permissions as any);
      expect(result.filter((p) => p === 'beneficiaries:access')).toHaveLength(1);
      expect(result).not.toContain('*');
    });

    it('should combine explicit and admin permissions', () => {
      const permissions = ['custom:permission'];
      const result = getEffectivePermissions('ADMIN', permissions as any);
      expect(result).toContain('custom:permission');
      expect(result).toContain('USERS_MANAGE');
      expect(result).toContain('SETTINGS_MANAGE');
    });

    it('should handle null role gracefully', () => {
      // @ts-expect-error - Testing with invalid input
      const result = getEffectivePermissions(null, ['users:read']);
      expect(result).toContain('users:read');
    });

    it('should handle empty role string', () => {
      const result = getEffectivePermissions('', ['beneficiaries:access'] as any);
      expect(result).toContain('beneficiaries:access');
    });

    it('should handle null permissions gracefully', () => {
      // @ts-expect-error - Testing with invalid input
      const result = getEffectivePermissions('admin', null);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('USERS_MANAGE');
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasPermission(permissions as any, 'users:read');
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasPermission(permissions as any, 'reports:view');
      expect(result).toBe(false);
    });

    it('should return false for null permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasPermission(null, 'users:read');
      expect(result).toBe(false);
    });

    it('should return false for undefined permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasPermission(undefined, 'users:read');
      expect(result).toBe(false);
    });

    it('should return false for non-array permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasPermission('not-an-array', 'users:read');
      expect(result).toBe(false);
    });

    it('should return true for empty permission string', () => {
      const permissions = ['users:read', ''];
      const result = hasPermission(permissions as any, '');
      expect(result).toBe(true);
    });

    it('should handle string permission parameter', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasPermission(permissions as any, 'users:read');
      expect(result).toBe(true);
    });

    it('should be case-sensitive', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasPermission(permissions as any, 'USERS:READ');
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasAnyPermission(permissions as any, ['users:read', 'reports:view']);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasAnyPermission(permissions as any, ['reports:view', 'analytics:view']);
      expect(result).toBe(false);
    });

    it('should return false for null user permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasAnyPermission(null, ['users:read']);
      expect(result).toBe(false);
    });

    it('should return false for null required permissions', () => {
      const permissions = ['users:read'];
      // @ts-expect-error - Testing with invalid input
      const result = hasAnyPermission(permissions, null);
      expect(result).toBe(false);
    });

    it('should return false for non-array user permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasAnyPermission('not-an-array', ['users:read']);
      expect(result).toBe(false);
    });

    it('should return false for non-array required permissions', () => {
      const permissions = ['users:read'];
      // @ts-expect-error - Testing with invalid input
      const result = hasAnyPermission(permissions, 'not-an-array');
      expect(result).toBe(false);
    });

    it('should return true when user has multiple matching permissions', () => {
      const permissions = ['users:read', 'tasks:write', 'reports:view'];
      const result = hasAnyPermission(permissions as any, [
        'users:read',
        'tasks:write',
        'analytics:view',
      ]);
      expect(result).toBe(true);
    });

    it('should handle empty required permissions array', () => {
      const permissions = ['users:read'];
      const result = hasAnyPermission(permissions as any, []);
      expect(result).toBe(false);
    });

    it('should handle empty user permissions array', () => {
      const result = hasAnyPermission([] as any, ['users:read']);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const permissions = ['users:read', 'tasks:write', 'reports:view'];
      const result = hasAllPermissions(permissions as any, ['users:read', 'tasks:write']);
      expect(result).toBe(true);
    });

    it('should return false when user is missing one permission', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasAllPermissions(permissions as any, ['users:read', 'reports:view']);
      expect(result).toBe(false);
    });

    it('should return true when checking for no permissions', () => {
      const permissions = ['users:read'];
      const result = hasAllPermissions(permissions as any, []);
      expect(result).toBe(true);
    });

    it('should return false for null user permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasAllPermissions(null, ['users:read']);
      expect(result).toBe(false);
    });

    it('should return false for null required permissions', () => {
      const permissions = ['users:read'];
      // @ts-expect-error - Testing with invalid input
      const result = hasAllPermissions(permissions, null);
      expect(result).toBe(false);
    });

    it('should return false for non-array user permissions', () => {
      // @ts-expect-error - Testing with invalid input
      const result = hasAllPermissions('not-an-array', ['users:read']);
      expect(result).toBe(false);
    });

    it('should return false for non-array required permissions', () => {
      const permissions = ['users:read'];
      // @ts-expect-error - Testing with invalid input
      const result = hasAllPermissions(permissions, 'not-an-array');
      expect(result).toBe(false);
    });

    it('should return false when user has empty permissions', () => {
      const result = hasAllPermissions([] as any, ['users:read']);
      expect(result).toBe(false);
    });

    it('should require all permissions', () => {
      const permissions = ['users:read', 'tasks:write', 'reports:view'];
      const result = hasAllPermissions(
        permissions as any,
        ['users:read', 'tasks:write', 'reports:view', 'analytics:view']
      );
      expect(result).toBe(false);
    });

    it('should be case-sensitive', () => {
      const permissions = ['users:read', 'tasks:write'];
      const result = hasAllPermissions(permissions as any, ['USERS:READ', 'tasks:write']);
      expect(result).toBe(false);
    });
  });
});
