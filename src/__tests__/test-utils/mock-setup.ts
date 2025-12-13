/**
 * Common Mock Setup Utilities
 * Centralized mock configurations for test files to reduce duplication
 */

import { vi } from 'vitest';
import type { PermissionValue } from '@/types/permissions';
import { createMockSessionUser, type MockSessionUser } from '../test-utils';

export interface MockSetupOptions {
  appwriteApi?: Record<string, unknown>;
  authUser?: Partial<MockSessionUser>;
  permissions?: PermissionValue[];
  moduleAccess?: string[];
  routeHelpers?: boolean;
  logger?: boolean;
  passwordUtils?: boolean;
  permissionsModule?: boolean;
}

/**
 * Setup Appwrite API mocks
 */
export function setupAppwriteApiMocks(customMocks?: Record<string, unknown>) {
  vi.mock('@/lib/appwrite/api', () => ({
    normalizeQueryParams: vi.fn((params: URLSearchParams) => ({
      page: params.get('page') ? parseInt(params.get('page')!) : 1,
      limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
      skip: 0,
      search: params.get('search') || undefined,
    })),
    ...customMocks,
  }));
}

/**
 * Setup authentication mocks
 */
export function setupAuthMocks(options?: {
  user?: Partial<MockSessionUser>;
  permissions?: PermissionValue[];
  moduleAccess?: string[];
}) {
  const mockUser = createMockSessionUser({
    permissions: options?.permissions || ['workflow:access'],
    ...options?.user,
  });

  vi.mock('@/lib/api/auth-utils', () => ({
    requireModuleAccess: vi.fn().mockResolvedValue({
      user: mockUser,
    }),
    requireAuthenticatedUser: vi.fn().mockResolvedValue({
      session: { sessionId: 'test-session', userId: 'test-user-id' },
      user: mockUser,
    }),
    verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
    buildErrorResponse: vi.fn().mockReturnValue(null),
  }));
}

/**
 * Setup logger mocks
 */
export function setupLoggerMocks() {
  vi.mock('@/lib/logger', () => ({
    default: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
  }));
}

/**
 * Setup route helpers mocks
 */
export function setupRouteHelpersMocks() {
  vi.mock('@/lib/api/route-helpers', () => ({
    extractParams: vi.fn(async (params: Promise<Record<string, string>>) => {
      const resolved = await params;
      return resolved;
    }),
    successResponse: vi.fn(),
    errorResponse: vi.fn(),
    handleGetById: vi.fn(),
    handleUpdate: vi.fn(),
    handleDelete: vi.fn(),
  }));
}

/**
 * Setup password utilities mocks
 */
export function setupPasswordUtilsMocks() {
  vi.mock('@/lib/auth/password', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    validatePasswordStrength: vi.fn().mockReturnValue({ valid: true }),
  }));
}

/**
 * Setup permissions module mocks
 */
export function setupPermissionsMocks() {
  vi.mock('@/types/permissions', () => ({
    ALL_PERMISSIONS: ['users:manage', 'beneficiaries:read', 'donations:read', 'workflow:read'],
    MODULE_PERMISSIONS: {
      BENEFICIARIES: 'beneficiaries:access',
      DONATIONS: 'donations:access',
      WORKFLOW: 'workflow:access',
    },
    SPECIAL_PERMISSIONS: {
      USERS_MANAGE: 'users:manage',
    },
  }));
}

/**
 * Setup all common mocks at once
 */
export function setupCommonMocks(options: MockSetupOptions = {}) {
  if (options.appwriteApi !== undefined || !options.appwriteApi) {
    setupAppwriteApiMocks(options.appwriteApi);
  }

  setupAuthMocks({
    user: options.authUser,
    permissions: options.permissions,
    moduleAccess: options.moduleAccess,
  });

  if (options.logger !== false) {
    setupLoggerMocks();
  }

  if (options.routeHelpers) {
    setupRouteHelpersMocks();
  }

  if (options.passwordUtils) {
    setupPasswordUtilsMocks();
  }

  if (options.permissionsModule) {
    setupPermissionsMocks();
  }
}

