/**
 * Permissions Utility Tests
 * Tests for permission handling functions
 */

import { describe, it, expect } from 'vitest';
import {
    normalizePermissions,
    getEffectivePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
} from '@/lib/auth/permissions';
import { MODULE_PERMISSIONS, SPECIAL_PERMISSIONS, type PermissionValue } from '@/types/permissions';

describe('normalizePermissions', () => {
    it('should remove duplicates', () => {
        const permissions: PermissionValue[] = [
            MODULE_PERMISSIONS.DONATIONS,
            MODULE_PERMISSIONS.DONATIONS,
            MODULE_PERMISSIONS.BENEFICIARIES,
        ];

        const result = normalizePermissions(permissions);

        expect(result).toHaveLength(2);
        expect(result).toContain(MODULE_PERMISSIONS.DONATIONS);
        expect(result).toContain(MODULE_PERMISSIONS.BENEFICIARIES);
    });

    it('should filter out wildcard permissions', () => {
        const permissions = [MODULE_PERMISSIONS.DONATIONS, '*', MODULE_PERMISSIONS.BENEFICIARIES] as PermissionValue[];

        const result = normalizePermissions(permissions);

        expect(result).not.toContain('*');
        expect(result).toHaveLength(2);
    });

    it('should filter out empty strings', () => {
        const permissions = [MODULE_PERMISSIONS.DONATIONS, '', MODULE_PERMISSIONS.BENEFICIARIES] as PermissionValue[];

        const result = normalizePermissions(permissions);

        expect(result).not.toContain('');
        expect(result).toHaveLength(2);
    });

    it('should handle non-array input', () => {
        const result = normalizePermissions(null as unknown as PermissionValue[]);
        expect(result).toEqual([]);
    });

    it('should return empty array for empty input', () => {
        const result = normalizePermissions([]);
        expect(result).toEqual([]);
    });
});

describe('getEffectivePermissions', () => {
    it('should return normalized explicit permissions for regular roles', () => {
        const permissions: PermissionValue[] = [MODULE_PERMISSIONS.DONATIONS, MODULE_PERMISSIONS.BENEFICIARIES];

        const result = getEffectivePermissions('Personel', permissions);

        expect(result).toContain(MODULE_PERMISSIONS.DONATIONS);
        expect(result).toContain(MODULE_PERMISSIONS.BENEFICIARIES);
        expect(result).not.toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
    });

    it('should grant full permissions for admin role', () => {
        const permissions: PermissionValue[] = [MODULE_PERMISSIONS.DONATIONS];

        const result = getEffectivePermissions('Admin', permissions);

        expect(result).toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
        expect(result).toContain(SPECIAL_PERMISSIONS.SETTINGS_MANAGE);
        expect(result).toContain(MODULE_PERMISSIONS.DONATIONS);
        expect(result).toContain(MODULE_PERMISSIONS.BENEFICIARIES);
    });

    it('should grant full permissions for Dernek Başkanı role', () => {
        const result = getEffectivePermissions('Dernek Başkanı', []);

        expect(result).toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
        expect(result).toContain(MODULE_PERMISSIONS.SCHOLARSHIPS);
    });

    it('should grant full permissions for President role', () => {
        const result = getEffectivePermissions('President', []);

        expect(result).toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
    });

    it('should grant full permissions for Director role', () => {
        const result = getEffectivePermissions('Director', []);

        expect(result).toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
    });

    it('should be case-insensitive for role matching', () => {
        const resultLower = getEffectivePermissions('admin', []);
        const resultUpper = getEffectivePermissions('ADMIN', []);

        expect(resultLower).toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
        expect(resultUpper).toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
    });

    it('should handle null/undefined role', () => {
        const result = getEffectivePermissions(null as unknown as string, [MODULE_PERMISSIONS.DONATIONS]);

        expect(result).toContain(MODULE_PERMISSIONS.DONATIONS);
        expect(result).not.toContain(SPECIAL_PERMISSIONS.USERS_MANAGE);
    });
});

describe('hasPermission', () => {
    const userPermissions: PermissionValue[] = [MODULE_PERMISSIONS.DONATIONS, MODULE_PERMISSIONS.BENEFICIARIES];

    it('should return true for existing permission', () => {
        expect(hasPermission(userPermissions, MODULE_PERMISSIONS.DONATIONS)).toBe(true);
    });

    it('should return false for missing permission', () => {
        expect(hasPermission(userPermissions, SPECIAL_PERMISSIONS.USERS_MANAGE)).toBe(false);
    });

    it('should handle empty permissions array', () => {
        expect(hasPermission([], MODULE_PERMISSIONS.DONATIONS)).toBe(false);
    });

    it('should handle non-array input', () => {
        expect(hasPermission(null as unknown as PermissionValue[], MODULE_PERMISSIONS.DONATIONS)).toBe(false);
    });
});

describe('hasAnyPermission', () => {
    const userPermissions: PermissionValue[] = [MODULE_PERMISSIONS.DONATIONS, MODULE_PERMISSIONS.BENEFICIARIES];

    it('should return true if user has at least one permission', () => {
        expect(hasAnyPermission(userPermissions, [MODULE_PERMISSIONS.DONATIONS, 'nonexistent' as PermissionValue])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
        expect(hasAnyPermission(userPermissions, ['nonexistent1' as PermissionValue, 'nonexistent2' as PermissionValue])).toBe(false);
    });

    it('should handle empty required permissions', () => {
        expect(hasAnyPermission(userPermissions, [])).toBe(false);
    });

    it('should handle non-array inputs', () => {
        expect(hasAnyPermission(null as unknown as PermissionValue[], [MODULE_PERMISSIONS.DONATIONS])).toBe(false);
        expect(hasAnyPermission(userPermissions, null as unknown as PermissionValue[])).toBe(false);
    });
});

describe('hasAllPermissions', () => {
    const userPermissions: PermissionValue[] = [MODULE_PERMISSIONS.DONATIONS, MODULE_PERMISSIONS.BENEFICIARIES];

    it('should return true if user has all permissions', () => {
        expect(hasAllPermissions(userPermissions, [MODULE_PERMISSIONS.DONATIONS, MODULE_PERMISSIONS.BENEFICIARIES])).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
        expect(hasAllPermissions(userPermissions, [MODULE_PERMISSIONS.DONATIONS, 'nonexistent' as PermissionValue])).toBe(false);
    });

    it('should return true for empty required permissions', () => {
        expect(hasAllPermissions(userPermissions, [])).toBe(true);
    });

    it('should handle non-array inputs', () => {
        expect(hasAllPermissions(null as unknown as PermissionValue[], [MODULE_PERMISSIONS.DONATIONS])).toBe(false);
        expect(hasAllPermissions(userPermissions, null as unknown as PermissionValue[])).toBe(false);
    });
});
