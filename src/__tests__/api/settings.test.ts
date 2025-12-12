import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/settings/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteSystemSettings: {
    getAll: vi.fn(),
    getByCategory: vi.fn(),
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn((fn) => fn),
  dataModificationRateLimit: vi.fn((fn) => fn),
}));

describe('GET /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: ['settings:manage'],
      },
    } as unknown);
  });

  it('returns all settings successfully', async () => {
    const mockSettings = {
      general: { theme: 'light' },
      notifications: { email: true },
    };

    vi.mocked(appwriteApi.appwriteSystemSettings.getAll).mockResolvedValue(mockSettings as unknown);

    const request = new NextRequest('http://localhost/api/settings');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockSettings);
  });

  it('returns settings by category', async () => {
    const mockSettings = {
      theme: 'light',
      language: 'tr',
    };

    vi.mocked(appwriteApi.appwriteSystemSettings.getByCategory).mockResolvedValue(
      mockSettings as unknown
    );

    const request = new NextRequest('http://localhost/api/settings?category=general');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockSettings);
    expect(vi.mocked(appwriteApi.appwriteSystemSettings.getByCategory)).toHaveBeenCalledWith(
      'general'
    );
  });

  it('requires settings:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: [], // No settings:manage permission
      },
    } as unknown);

    const request = new NextRequest('http://localhost/api/settings');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bu işlemi gerçekleştirmek için yetkiniz yok');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteSystemSettings.getAll).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/settings');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Ayarlar alınırken hata oluştu');
  });
});

describe('POST /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: ['settings:manage'],
      },
    } as unknown);
  });

  it('updates settings by category successfully', async () => {
    const updateData = {
      category: 'general',
      settings: {
        theme: 'dark',
        language: 'en',
      },
    };

    vi.mocked(appwriteApi.appwriteSystemSettings.updateSettings).mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Ayarlar başarıyla kaydedildi');
    expect(vi.mocked(appwriteApi.appwriteSystemSettings.updateSettings)).toHaveBeenCalledWith(
      'general',
      updateData.settings,
      'test-user'
    );
  });

  it('validates category and settings are required', async () => {
    const invalidData = {
      // Missing category and settings
    };

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify(invalidData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kategori ve ayarlar gerekli');
  });

  it('requires settings:manage permission', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: [],
      },
    } as unknown);

    const updateData = {
      category: 'general',
      settings: { theme: 'dark' },
    };

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteSystemSettings.updateSettings).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      category: 'general',
      settings: { theme: 'dark' },
    };

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Ayarlar kaydedilirken hata oluştu');
  });
});

describe('PUT /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: ['settings:manage'],
      },
    } as unknown);
  });

  it('updates all settings successfully', async () => {
    const updateData = {
      settings: {
        general: { theme: 'dark' },
        notifications: { email: false },
      },
    };

    vi.mocked(appwriteApi.appwriteSystemSettings.updateSettings).mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Tüm ayarlar başarıyla güncellendi');
  });

  it('validates settings format', async () => {
    const invalidData = {
      settings: 'not an object',
    };

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Geçersiz ayarlar formatı');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteSystemSettings.updateSettings).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      settings: {
        general: { theme: 'dark' },
      },
    };

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Ayarlar güncellenirken hata oluştu');
  });
});

describe('DELETE /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: ['settings:manage'],
      },
    } as unknown);
  });

  it('resets all settings successfully', async () => {
    vi.mocked(appwriteApi.appwriteSystemSettings.resetSettings).mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Tüm ayarlar sıfırlandı');
    expect(vi.mocked(appwriteApi.appwriteSystemSettings.resetSettings)).toHaveBeenCalledWith(
      undefined
    );
  });

  it('resets settings by category', async () => {
    vi.mocked(appwriteApi.appwriteSystemSettings.resetSettings).mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/settings?category=general', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('general kategorisi sıfırlandı');
    expect(vi.mocked(appwriteApi.appwriteSystemSettings.resetSettings)).toHaveBeenCalledWith(
      'general'
    );
  });

  it('handles reset errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteSystemSettings.resetSettings).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Ayarlar sıfırlanırken hata oluştu');
  });
});
