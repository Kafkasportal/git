import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';
import { createMockDocuments, createMockAuthResponse } from '../test-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteUsers: {
    list: vi.fn(),
    create: vi.fn(),
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
    // Return a proper error response structure
    if (error instanceof Error && error.message === 'User not found') {
      return { status: 404, body: { success: false, error: 'Kullanıcı bulunamadı' } };
    }
    return { status: 500, body: { success: false, error: 'İç sunucu hatası' } };
  }),
}));

// Mock password utilities
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  validatePasswordStrength: vi.fn().mockReturnValue({ valid: true }),
}));

// Email validation is now done inline, no mock needed

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  parseBody: vi.fn(async (request) => {
    const body = await request.json();
    return { data: body, error: null };
  }),
  handleApiError: vi.fn(async (_error, _logger, _context, message) => {
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn((handler) => handler),
  dataModificationRateLimit: vi.fn((handler) => handler),
}));

// Mock permissions
vi.mock('@/types/permissions', () => ({
  ALL_PERMISSIONS: ['users:manage', 'beneficiaries:read', 'donations:read'],
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns users list successfully', async () => {
    const mockUsersData = [
      {
        _id: '1',
        name: 'Test User 1',
        email: 'test1@example.com',
        role: 'Personel',
        permissions: ['users:manage'],
        isActive: true,
      },
      {
        _id: '2',
        name: 'Test User 2',
        email: 'test2@example.com',
        role: 'Admin',
        permissions: ['users:manage', 'beneficiaries:read'],
        isActive: true,
      },
    ];
    const mockUsers = createMockDocuments(mockUsersData);

    vi.mocked(appwriteApi.appwriteUsers.list).mockResolvedValue({
      documents: mockUsers,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUsers);
    expect(data.total).toBe(2);
  });

  it('filters by search', async () => {
    const mockUsers = createMockDocuments([
      {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
      },
    ]);

    vi.mocked(appwriteApi.appwriteUsers.list).mockResolvedValue({
      documents: mockUsers,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/users?search=test');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteUsers.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test',
      })
    );
  });

  it('filters by role', async () => {
    const mockUsers = createMockDocuments([
      {
        _id: '1',
        name: 'Admin User',
        role: 'Admin',
      },
    ]);

    vi.mocked(appwriteApi.appwriteUsers.list).mockResolvedValue({
      documents: mockUsers,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/users?role=Admin');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteUsers.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Admin',
      })
    );
  });

  it('filters by isActive', async () => {
    const mockUsers = createMockDocuments([
      {
        _id: '1',
        name: 'Active User',
        isActive: true,
      },
    ]);

    vi.mocked(appwriteApi.appwriteUsers.list).mockResolvedValue({
      documents: mockUsers,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/users?isActive=true');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteUsers.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
      })
    );
  });

  it('handles limit parameter', async () => {
    vi.mocked(appwriteApi.appwriteUsers.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/users?limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteUsers.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
      })
    );
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('yetkiniz yok');
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteUsers.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Veri alınamadı');
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates user successfully', async () => {
    const newUser = {
      name: 'New User',
      email: 'newuser@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      password: 'StrongPassword123!',
      isActive: true,
    };

    const createdUser = {
      _id: 'new-id',
      ...newUser,
      passwordHash: 'hashed-password',
    };

    vi.mocked(appwriteApi.appwriteUsers.create).mockResolvedValue(createdUser as any);

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdUser);
    expect(data.message).toBe('Kullanıcı oluşturuldu');
  });

  it('validates name is required and minimum length', async () => {
    const invalidUser = {
      name: 'A', // Too short
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      password: 'StrongPassword123!',
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(invalidUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Ad Soyad en az 2 karakter olmalıdır');
  });

  it('validates email is required and valid', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'invalid-email', // Invalid email
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      password: 'StrongPassword123!',
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(invalidUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçerli bir e-posta zorunludur');
  });

  it('validates role is required and minimum length', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'A', // Too short
      permissions: ['beneficiaries:read'],
      password: 'StrongPassword123!',
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(invalidUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Rol bilgisi en az 2 karakter olmalıdır');
  });

  it('validates permissions are required and valid', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: [], // Empty permissions
      password: 'StrongPassword123!',
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(invalidUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('En az bir modül erişimi seçilmelidir');
  });

  it('validates password is required', async () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      // Missing password
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(invalidUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Şifre zorunludur');
  });

  it('validates password strength', async () => {
    const { validatePasswordStrength } = await import('@/lib/auth/password');
    vi.mocked(validatePasswordStrength).mockReturnValueOnce({
      valid: false,
      error: 'Şifre en az 8 karakter olmalıdır',
    });

    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      password: 'weak', // Weak password
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(invalidUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Şifre');
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      password: 'StrongPassword123!',
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Kullanıcı oluşturma yetkiniz bulunmuyor');
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.create).mockRejectedValue(new Error('Database error'));

    const validUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      password: 'StrongPassword123!',
    };

    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify(validUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kullanıcı oluşturulamadı');
  });
});
