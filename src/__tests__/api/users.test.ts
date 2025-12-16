import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/users/route';
import * as appwriteApi from '@/lib/appwrite/api';
import { createMockAuthResponse } from '../test-utils';
import * as authUtils from '@/lib/api/auth-utils';
import {
  runGetListTests,
  runFilteringTests,
} from '../test-utils/test-patterns';
import {
  createTestRequest,
  parseJsonResponse,
  expectStatus,
  expectSuccessResponse,
  expectErrorResponse,
} from '../test-utils/api-test-helpers';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteUsers: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params: URLSearchParams) => ({
    page: params.get('page') ? Number.parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? Number.parseInt(params.get('limit')!) : 50,
    skip: 0,
    search: params.get('search') || undefined,
  })),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    session: { sessionId: 'test-session', userId: 'test-user-id' },
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['users:manage'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock password utilities
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  validatePasswordStrength: vi.fn().mockReturnValue({ valid: true }),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn((handler) => handler),
  dataModificationRateLimit: vi.fn((handler) => handler),
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

// Use test pattern for GET list
runGetListTests(
  { GET },
  appwriteApi.appwriteUsers.list as (params?: unknown) => Promise<{ documents: unknown[]; total: number }>,
  'users',
  {
    baseUrl: 'http://localhost/api/users',
    errorMessage: 'Kullanıcılar alınamadı',
  }
);

// Test filtering
runFilteringTests(
  { GET },
  appwriteApi.appwriteUsers.list as (params?: unknown) => Promise<{ documents: unknown[]; total: number }>,
  'users',
  [
    {
      name: 'search',
      queryParams: { search: 'test' },
      expectedFilter: { search: 'test' },
    },
    {
      name: 'role',
      queryParams: { role: 'Admin' },
      expectedFilter: { role: 'Admin' },
    },
    {
      name: 'isActive',
      queryParams: { isActive: 'true' },
      expectedFilter: { isActive: true },
    },
  ],
  {
    baseUrl: 'http://localhost/api/users',
  }
);

describe('GET /api/users - Additional tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const request = createTestRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 403);
    expectErrorResponse(data, 403);
    expect(data.error).toContain('erişim yetkiniz yok');
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates users successfully', async () => {
    const validUser = {
      name: 'New User',
      email: 'newuser@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:access'],
      password: 'SecurePassword123!',
    };

    vi.mocked(appwriteApi.appwriteUsers.create).mockResolvedValue({
      _id: 'new-id',
      ...validUser,
      passwordHash: 'hashed-password',
      isActive: true,
    } as unknown);

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: validUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; data?: any; message?: string }>(
      response
    );

    expectStatus(response, 201);
    expectSuccessResponse(data, 201);
    expect(data.message).toBe('Kullanıcı oluşturuldu');
    expect(data.data?.passwordHash).toBeUndefined();
    expect(data.data?.password).toBeUndefined();
    expect(vi.mocked(appwriteApi.appwriteUsers.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validUser.name,
        email: validUser.email,
        role: validUser.role,
        permissions: validUser.permissions,
        passwordHash: 'hashed-password',
        isActive: true,
      })
    );
  });

  it('handles creation errors gracefully', async () => {
    const validUser = {
      name: 'New User',
      email: 'newuser@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:access'],
      password: 'SecurePassword123!',
    };

    vi.mocked(appwriteApi.appwriteUsers.create).mockRejectedValue(new Error('Database error'));

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: validUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(
      response
    );

    expectStatus(response, 500);
    expectErrorResponse(data, 500, 'Kullanıcı oluşturulamadı');
  });
});

describe('POST /api/users - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates name is required and minimum length', async () => {
    const invalidUser = {
      email: 'test@example.com',
      name: 'AB',
    };

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: invalidUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('İsim en az 3 karakter olmalıdır');
  });

  it('validates email is required and valid', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'invalid-email',
    };

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: invalidUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('Geçerli bir e-posta adresi gerekli');
  });

  it('validates role is required and minimum length', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'A',
    };

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: invalidUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('Rol en az 2 karakter olmalıdır');
  });

  it('validates permissions are required and valid', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['invalid:permission'],
    };

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: invalidUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
  });

  it('validates password is required', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:access'],
    };

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: invalidUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
    expect(data.details).toContain('Şifre zorunludur');
  });

  it('validates password strength', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:access'],
      password: 'weak',
    };

    const passwordUtils = await import('@/lib/auth/password');
    vi.mocked(passwordUtils.validatePasswordStrength).mockReturnValueOnce({
      valid: false,
      error: 'Şifre çok zayıf',
    });

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: invalidUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 400);
    expectErrorResponse(data, 400);
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const validUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:access'],
      password: 'SecurePassword123!',
    };

    const request = createTestRequest('http://localhost/api/users', {
      method: 'POST',
      body: validUser,
    });
    const response = await POST(request);
    const data = await parseJsonResponse<{ success?: boolean; error?: string; details?: string[] }>(response);

    expectStatus(response, 403);
    expectErrorResponse(data, 403);
    expect(data.error).toContain('erişim yetkiniz yok');
  });
});
