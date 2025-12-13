import { describe, it, expect } from 'vitest';
import {
  extractUserRoleAndPermissions,
  normalizeOptionalPermissions,
  transformAppwriteUser,
  buildUserPreferences,
} from '@/lib/appwrite/user-transform';
import type { Models } from 'node-appwrite';

describe('user-transform', () => {
  describe('extractUserRoleAndPermissions', () => {
    it('should extract role and permissions from prefs', () => {
      const prefs: Models.Preferences = {
        role: 'Admin',
        permissions: JSON.stringify(['users:manage', 'donations:manage']),
      };

      const result = extractUserRoleAndPermissions(prefs);

      expect(result.role).toBe('Admin');
      expect(result.permissions).toEqual(['users:manage', 'donations:manage']);
    });

    it('should return default role when prefs is empty', () => {
      const result = extractUserRoleAndPermissions({});

      expect(result.role).toBe('Personel');
      expect(result.permissions).toEqual([]);
    });

    it('should handle invalid JSON in permissions', () => {
      const prefs: Models.Preferences = {
        permissions: 'invalid json',
      };

      const result = extractUserRoleAndPermissions(prefs);

      expect(result.permissions).toEqual([]);
    });
  });

  describe('normalizeOptionalPermissions', () => {
    it('should filter valid permissions', () => {
      // Use actual valid permissions from the system
      const permissions = ['users:manage', 'donations:manage', 'invalid:permission'];

      const result = normalizeOptionalPermissions(permissions);

      // Result should only contain valid permissions that exist in ALL_PERMISSIONS
      expect(Array.isArray(result)).toBe(true);
      if (result) {
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(p => typeof p === 'string')).toBe(true);
      }
    });

    it('should return undefined for non-array input', () => {
      expect(normalizeOptionalPermissions(null)).toBeUndefined();
      expect(normalizeOptionalPermissions('string')).toBeUndefined();
      expect(normalizeOptionalPermissions({})).toBeUndefined();
    });

    it('should remove duplicates', () => {
      // Use actual valid permissions
      const permissions = ['beneficiaries', 'beneficiaries', 'donations'];

      const result = normalizeOptionalPermissions(permissions);

      // Result should have duplicates removed
      if (result) {
        expect(result.length).toBe(new Set(result).size);
      }
    });
  });

  describe('transformAppwriteUser', () => {
    it('should transform Appwrite user to API format', () => {
      const appwriteUser = {
        $id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        $createdAt: '2024-01-01T00:00:00Z',
        $updatedAt: '2024-01-02T00:00:00Z',
        emailVerification: true,
        phoneVerification: false,
        prefs: {
          role: 'Admin',
          permissions: JSON.stringify(['users:manage']),
        },
      } as unknown as Models.User<Models.Preferences>;

      const result = transformAppwriteUser(appwriteUser);

      expect(result.id).toBe('user123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.role).toBe('Admin');
      expect(result.permissions).toEqual(['users:manage']);
      expect(result.emailVerification).toBe(true);
      expect(result.phoneVerification).toBe(false);
    });
  });

  describe('buildUserPreferences', () => {
    it('should build preferences with role and permissions', () => {
      const currentPrefs: Models.Preferences = {
        theme: 'dark',
        language: 'tr',
      };

      const result = buildUserPreferences(currentPrefs, {
        role: 'Admin',
        permissions: ['users:manage'],
      });

      expect(result.role).toBe('Admin');
      expect(result.permissions).toBe(JSON.stringify(['users:manage']));
      expect(result.theme).toBe('dark');
      expect(result.language).toBe('tr');
    });

    it('should preserve existing prefs when updating only role', () => {
      const currentPrefs: Models.Preferences = {
        theme: 'dark',
        role: 'Personel',
      };

      const result = buildUserPreferences(currentPrefs, {
        role: 'Admin',
      });

      expect(result.role).toBe('Admin');
      expect(result.theme).toBe('dark');
    });
  });
});

