/**
 * Permission Property Tests
 * Property-based tests for permission checking functions
 * 
 * @module properties/permissions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { useAuthStore } from '@/stores/authStore';
import { ALL_PERMISSIONS, type PermissionValue } from '@/types/permissions';
import type { User } from '@/types/auth';
import {
  validPermission,
  validPermissionSet,
} from '../test-utils/generators';

// Helper to create a test user with specific permissions
function createTestUser(permissions: PermissionValue[]): User {
  return {
    id: 'test-user-001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    avatar: null,
    permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Permission Property Tests', () => {
  // Reset store before each test
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
      _hasHydrated: true,
      showLoginModal: false,
      rememberMe: false,
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
    });
  });


  /**
   * **Feature: code-quality-improvement, Property 4: Permission Check Correctness**
   * **Validates: Requirements 3.3**
   * 
   * For any user with a set of permissions P, `hasPermission(p)` SHALL return
   * true if and only if p ∈ P.
   */
  describe('Property 4: Permission Check Correctness', () => {
    test.prop([validPermissionSet, validPermission], { numRuns: 100 })(
      'hasPermission returns true iff permission is in user permissions',
      (userPermissions, permissionToCheck) => {
        // Set up authenticated user with specific permissions
        const testUser = createTestUser(userPermissions);
        useAuthStore.setState({
          user: testUser,
          isAuthenticated: true,
        });

        const { hasPermission } = useAuthStore.getState();
        const result = hasPermission(permissionToCheck);
        const expected = userPermissions.includes(permissionToCheck);

        expect(result).toBe(expected);
      }
    );

    it('should return false when user is not authenticated', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      const { hasPermission } = useAuthStore.getState();
      
      ALL_PERMISSIONS.forEach(permission => {
        expect(hasPermission(permission)).toBe(false);
      });
    });

    it('should return false when user has no permissions', () => {
      const testUser = createTestUser([]);
      useAuthStore.setState({
        user: testUser,
        isAuthenticated: true,
      });

      const { hasPermission } = useAuthStore.getState();
      
      ALL_PERMISSIONS.forEach(permission => {
        expect(hasPermission(permission)).toBe(false);
      });
    });
  });

  /**
   * **Feature: code-quality-improvement, Property 5: Permission Composition Correctness**
   * **Validates: Requirements 3.3**
   * 
   * For any user with permissions P and permission set S:
   * - `hasAnyPermission(S)` SHALL return true iff P ∩ S ≠ ∅
   * - `hasAllPermissions(S)` SHALL return true iff S ⊆ P
   */
  describe('Property 5: Permission Composition Correctness', () => {
    test.prop([validPermissionSet, validPermissionSet], { numRuns: 100 })(
      'hasAnyPermission returns true iff intersection is non-empty',
      (userPermissions, permissionsToCheck) => {
        const testUser = createTestUser(userPermissions);
        useAuthStore.setState({
          user: testUser,
          isAuthenticated: true,
        });

        const { hasAnyPermission } = useAuthStore.getState();
        const result = hasAnyPermission(permissionsToCheck);
        
        // Check if there's any intersection
        const hasIntersection = permissionsToCheck.some(p => 
          userPermissions.includes(p)
        );

        expect(result).toBe(hasIntersection);
      }
    );

    test.prop([validPermissionSet, validPermissionSet], { numRuns: 100 })(
      'hasAllPermissions returns true iff all permissions are subset',
      (userPermissions, permissionsToCheck) => {
        const testUser = createTestUser(userPermissions);
        useAuthStore.setState({
          user: testUser,
          isAuthenticated: true,
        });

        const { hasAllPermissions } = useAuthStore.getState();
        const result = hasAllPermissions(permissionsToCheck);
        
        // Check if all permissions to check are in user permissions
        const isSubset = permissionsToCheck.every(p => 
          userPermissions.includes(p)
        );

        expect(result).toBe(isSubset);
      }
    );

    it('should return false for hasAnyPermission when not authenticated', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      const { hasAnyPermission } = useAuthStore.getState();
      expect(hasAnyPermission(ALL_PERMISSIONS as unknown as PermissionValue[])).toBe(false);
    });

    it('should return false for hasAllPermissions when not authenticated', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      const { hasAllPermissions } = useAuthStore.getState();
      expect(hasAllPermissions(['beneficiaries:access'])).toBe(false);
    });

    it('should handle empty permission arrays', () => {
      const testUser = createTestUser(['beneficiaries:access']);
      useAuthStore.setState({
        user: testUser,
        isAuthenticated: true,
      });

      const { hasAnyPermission, hasAllPermissions } = useAuthStore.getState();
      
      // Empty array for hasAnyPermission should return false (no intersection possible)
      expect(hasAnyPermission([])).toBe(false);
      
      // Empty array for hasAllPermissions should return true (empty set is subset of any set)
      expect(hasAllPermissions([])).toBe(true);
    });
  });

  /**
   * **Feature: code-quality-improvement, Property 6: Logout State Clearing**
   * **Validates: Requirements 3.2**
   * 
   * For any authenticated user state, after logout, the authStore SHALL have
   * `user: null`, `session: null`, `isAuthenticated: false`.
   */
  describe('Property 6: Logout State Clearing', () => {
    test.prop([validPermissionSet], { numRuns: 50 })(
      'logout clears all user state regardless of initial permissions',
      async (userPermissions) => {
        // Set up authenticated user
        const testUser = createTestUser(userPermissions);
        useAuthStore.setState({
          user: testUser,
          session: {
            userId: testUser.id,
            accessToken: 'test-token',
            expire: new Date(Date.now() + 3600000).toISOString(),
          },
          isAuthenticated: true,
        });

        // Verify user is authenticated
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user).not.toBeNull();

        // Call logout with a callback to prevent redirect
        const { logout } = useAuthStore.getState();
        await logout(() => {});

        // Verify state is cleared
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.session).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      }
    );

    it('should clear error state on logout', async () => {
      const testUser = createTestUser(['beneficiaries:access']);
      useAuthStore.setState({
        user: testUser,
        isAuthenticated: true,
        error: 'Some previous error',
      });

      const { logout } = useAuthStore.getState();
      await logout(() => {});

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  /**
   * Additional permission tests
   */
  describe('Role Checking', () => {
    it('should correctly check user role', () => {
      const testUser = createTestUser(['beneficiaries:access']);
      testUser.role = 'admin';
      
      useAuthStore.setState({
        user: testUser,
        isAuthenticated: true,
      });

      const { hasRole } = useAuthStore.getState();
      
      expect(hasRole('admin')).toBe(true);
      expect(hasRole('Admin')).toBe(true); // Case insensitive
      expect(hasRole('ADMIN')).toBe(true);
      expect(hasRole('user')).toBe(false);
      expect(hasRole('')).toBe(false);
    });

    it('should return false for role check when not authenticated', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      const { hasRole } = useAuthStore.getState();
      expect(hasRole('admin')).toBe(false);
    });
  });
});
