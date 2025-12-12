import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockAuthResponse } from '../test-utils';
import { GET, PATCH, DELETE } from '@/app/api/users/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteUsers: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  extractParams: vi.fn(async (params) => {
    const resolved = await params;
    return resolved;
  }),
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

// Email validation is now done inline, no mock needed

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

describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user by ID successfully', async () => {
    const mockUser = {
      _id: 'test-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      isActive: true,
    };

    vi.mocked(appwriteApi.appwriteUsers.get).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost/api/users/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUser);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(appwriteApi.appwriteUsers.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/users/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kullanıcı bulunamadı');
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const request = new NextRequest('http://localhost/api/users/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('erişim yetkiniz yok');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PATCH /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates user successfully', async () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    const updatedUser = {
      _id: 'test-id',
      ...updateData,
      role: 'Personel',
      permissions: ['beneficiaries:read'],
      isActive: true,
    };

    vi.mocked(appwriteApi.appwriteUsers.update).mockResolvedValue(updatedUser as unknown);

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updatedUser);
    expect(data.message).toBe('Kullanıcı başarıyla güncellendi');
  });

  it('validates email format', async () => {
    const invalidUpdate = {
      email: 'invalid-email', // Invalid email
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Geçersiz e-posta adresi');
  });

  it('validates name minimum length', async () => {
    const invalidUpdate = {
      name: 'A', // Too short
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Ad Soyad en az 2 karakter olmalıdır');
  });

  it('validates role minimum length', async () => {
    const invalidUpdate = {
      role: 'A', // Too short
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Rol bilgisi en az 2 karakter olmalıdır');
  });

  it('validates permissions are valid', async () => {
    const invalidUpdate = {
      permissions: ['invalid:permission'], // Invalid permission
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Geçerli en az bir modül erişimi seçilmelidir');
  });

  it('validates password strength when updating password', async () => {
    const { validatePasswordStrength } = await import('@/lib/auth/password');
    vi.mocked(validatePasswordStrength).mockReturnValueOnce({
      valid: false,
      error: 'Şifre en az 8 karakter olmalıdır',
    });

    const invalidUpdate = {
      password: 'weak', // Weak password
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Şifre');
  });

  it('updates password successfully when provided', async () => {
    const updateData = {
      password: 'NewStrongPassword123!',
    };

    const updatedUser = {
      _id: 'test-id',
      name: 'Test User',
      email: 'test@example.com',
    };

    vi.mocked(appwriteApi.appwriteUsers.update).mockResolvedValue(updatedUser as unknown);

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteUsers.update)).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        passwordHash: 'hashed-password',
      })
    );
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const updateData = {
      name: 'Updated Name',
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Kullanıcı güncelleme yetkiniz bulunmuyor');
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(appwriteApi.appwriteUsers.update).mockRejectedValue(new Error('Document not found'));

    const updateData = {
      name: 'Updated Name',
    };

    const request = new NextRequest('http://localhost/api/users/non-existent', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      name: 'Updated Name',
    };

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes user successfully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Kullanıcı başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteUsers.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 403 when user does not have users:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValueOnce(
      createMockAuthResponse({ permissions: [] })
    );

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Kullanıcı silme yetkiniz bulunmuyor');
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(appwriteApi.appwriteUsers.remove).mockRejectedValue(new Error('Document not found'));

    const request = new NextRequest('http://localhost/api/users/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteUsers.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
