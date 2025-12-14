import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockAuthResponse } from '../test-utils';
import { GET, PATCH, DELETE } from '@/app/api/users/[id]/route';
import * as authUtils from '@/lib/api/auth-utils';
import {
  createTestRequest,
  createTestParams,
  parseJsonResponse,
  expectStatus,
  expectSuccessResponse,
  expectErrorResponse,
} from '../test-utils/api-test-helpers';

// Hoist mock functions so they can be used in vi.mock
const { mockUsersGet, mockUsersUpdate, mockUsersDelete, mockUsersUpdatePrefs, mockUsersUpdatePassword, mockUsersUpdateName, mockUsersUpdateEmail } = vi.hoisted(() => ({
  mockUsersGet: vi.fn(),
  mockUsersUpdate: vi.fn(),
  mockUsersDelete: vi.fn(),
  mockUsersUpdatePrefs: vi.fn(),
  mockUsersUpdatePassword: vi.fn(),
  mockUsersUpdateName: vi.fn(),
  mockUsersUpdateEmail: vi.fn(),
}));

vi.mock('@/lib/appwrite/server', () => ({
  getServerClient: vi.fn(() => ({ endpoint: 'http://localhost', project: 'test' } as any)),
}));

vi.mock('node-appwrite', () => {
  class MockUsers {
    get = mockUsersGet;
    update = mockUsersUpdate;
    delete = mockUsersDelete;
    updatePrefs = mockUsersUpdatePrefs;
    updatePassword = mockUsersUpdatePassword;
    updateName = mockUsersUpdateName;
    updateEmail = mockUsersUpdateEmail;
  }

  return {
    Users: MockUsers,
  };
});

// Mock route helpers - use actual implementation
vi.mock('@/lib/api/route-helpers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/route-helpers')>('@/lib/api/route-helpers');
  return {
    ...actual,
    extractParams: vi.fn(async (params: Promise<Record<string, string>>) => {
      const resolved = await params;
      return resolved;
    }),
  };
});

// Mock user-transform
vi.mock('@/lib/appwrite/user-transform', () => ({
  transformAppwriteUser: vi.fn((user: unknown) => {
    const u = user as any;
    return {
      id: u.$id || 'test-id',
      email: u.email || 'test@example.com',
      name: u.name || 'Test User',
      role: u.prefs?.role || 'Personel',
      permissions: u.prefs?.permissions ? JSON.parse(u.prefs.permissions) : [],
      createdAt: u.$createdAt || new Date().toISOString(),
      updatedAt: u.$updatedAt || new Date().toISOString(),
      emailVerification: u.emailVerification ?? true,
      phoneVerification: u.phoneVerification ?? false,
    };
  }),
  normalizeOptionalPermissions: vi.fn((perms: unknown) => perms),
  buildUserPreferences: vi.fn((current: unknown, updates: unknown) => ({
    ...(current as object),
    ...(updates as object),
  })),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    session: { sessionId: 'test-session', userId: 'test-user-id' },
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['users:manage'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn(function (error: unknown) {
    if (error instanceof Error && error.message === 'User not found') {
      return { status: 404, body: { success: false, error: 'Kullanıcı bulunamadı' } };
    }
    return null;
  }),
}));

// Mock password utilities
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  validatePasswordStrength: vi.fn().mockReturnValue({ valid: true }),
}));

// Mock permissions
vi.mock('@/types/permissions', () => ({
  ALL_PERMISSIONS: ['users:manage', 'beneficiaries:access', 'donations:access'],
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns users by ID successfully', async () => {
    mockUsersGet.mockResolvedValue({
      $id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
      $createdAt: '2024-01-01',
      $updatedAt: '2024-01-01',
      emailVerification: true,
      phoneVerification: false,
      prefs: { role: 'Admin', permissions: '[]' },
    });

    const request = createTestRequest('http://localhost/api/users/test-id');
    const params = createTestParams({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; data?: unknown }>(response);

    expectStatus(response, 200);
    expectSuccessResponse(data);
    expect(data.data).toBeDefined();
  });

  it('returns 404 when users not found', async () => {
    mockUsersGet.mockRejectedValue(new Error('User not found'));

    const request = createTestRequest('http://localhost/api/users/test-id');
    const params = createTestParams({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response);

    expectStatus(response, 404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kullanıcı bulunamadı');
  });

  it('handles errors gracefully', async () => {
    mockUsersGet.mockRejectedValue(new Error('Database error'));

    const request = createTestRequest('http://localhost/api/users/test-id');
    const params = createTestParams({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response);

    expectStatus(response, 500);
    expect(data.success).toBe(false);
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockRejectedValueOnce(
      new Error('Forbidden')
    );
    vi.mocked(authUtils.buildErrorResponse).mockReturnValueOnce({
      body: { success: false, error: 'Bu işlem için erişim yetkiniz yok' },
      status: 403,
    });

    const request = createTestRequest('http://localhost/api/users/test-id');
    const params = createTestParams({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response);

    expectStatus(response, 403);
    expect(data.error).toContain('erişim yetkiniz yok');
  });
});

// Use test pattern for PATCH update
describe('PATCH /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      session: { sessionId: 'test-session', userId: 'test-user-id' },
      user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['users:manage'] },
    });
  });

  it('updates users successfully', async () => {
    const updateData = { name: 'Updated User', email: 'updated@example.com' };
    const updatedUser = { $id: 'test-id', ...updateData, prefs: { role: 'Admin' } };
    mockUsersGet.mockResolvedValue(updatedUser);

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: updateData,
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; data?: unknown; message?: string }>(response);

    expectStatus(response, 200);
    expectSuccessResponse(data);
    expect(data.message).toBe('Kullanıcı başarıyla güncellendi');
  });

  it('handles update errors gracefully', async () => {
    mockUsersGet.mockRejectedValue(new Error('Database error'));

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: { name: 'Updated User' },
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response);

    expectStatus(response, 500);
    expect(data.success).toBe(false);
  });
});

// Use test pattern for DELETE
describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      session: { sessionId: 'test-session', userId: 'test-user-id' },
      user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['users:manage'] },
    });
  });

  it('deletes users successfully', async () => {
    mockUsersDelete.mockResolvedValue(undefined);

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'DELETE',
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; data?: unknown; message?: string }>(response);

    expectStatus(response, 200);
    expectSuccessResponse(data);
    expect(data.message).toBe('Kullanıcı başarıyla silindi');
  });

  it('handles delete errors gracefully', async () => {
    mockUsersDelete.mockRejectedValue(new Error('Database error'));

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'DELETE',
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response);

    expectStatus(response, 500);
    expect(data.success).toBe(false);
  });
});
