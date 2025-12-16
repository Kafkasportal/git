import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockAuthResponse } from '../test-utils';
import { GET, PUT, DELETE } from '@/app/api/users/[id]/route';
import * as authUtils from '@/lib/api/auth-utils';
import * as appwriteApi from '@/lib/appwrite/api';
import {
  runGetByIdTests,
} from '../test-utils/test-patterns';
import {
  createTestRequest,
  createTestParams,
  parseJsonResponse,
  expectStatus,
  expectSuccessResponse,
  expectErrorResponse,
} from '../test-utils/api-test-helpers';

vi.mock('@/lib/appwrite/api', () => ({
  appwriteUsers: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
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

// Use test pattern for GET by ID
runGetByIdTests(
  { GET },
  appwriteApi.appwriteUsers.get as (id: string) => Promise<unknown>,
  'users',
  {
    baseUrl: 'http://localhost/api/users',
    notFoundError: 'Kullanıcı bulunamadı',
    errorMessage: 'Kullanıcı bilgisi alınamadı',
  }
);

describe('GET /api/users/[id] - Additional tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const request = createTestRequest('http://localhost/api/users/test-id');
    const params = createTestParams({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 403);
    expectErrorResponse(data, 403);
    expect(data.error).toContain('erişim yetkiniz yok');
  });
});

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      session: { sessionId: 'test-session', userId: 'test-user-id' },
      user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['users:manage'] },
    });
  });

  it('updates users successfully', async () => {
    const updateData = { name: 'Updated User', email: 'updated@example.com' };
    const updatedUser = { _id: 'test-id', ...updateData };
    vi.mocked(appwriteApi.appwriteUsers.update).mockResolvedValue(updatedUser as unknown);

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'PUT',
      body: updateData,
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; data?: unknown; message?: string }>(response);

    expectStatus(response, 200);
    expectSuccessResponse(data);
    expect(data.message).toBe('Kullanıcı başarıyla güncellendi');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.update).mockRejectedValue(new Error('Database error'));

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'PUT',
      body: { name: 'Updated User' },
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 500);
    expectErrorResponse(data, 500, 'Güncelleme işlemi başarısız');
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
	    vi.mocked(appwriteApi.appwriteUsers.remove).mockResolvedValue(undefined);

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
    vi.mocked(appwriteApi.appwriteUsers.remove).mockRejectedValue(new Error('Database error'));

    const request = createTestRequest('http://localhost/api/users/test-id', {
      method: 'DELETE',
    });
    const params = createTestParams({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 500);
    expectErrorResponse(data, 500, 'Silme işlemi başarısız');
  });
});
