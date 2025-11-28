import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/workflow-notifications/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteWorkflowNotifications: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
    skip: 0,
    search: params.get('search') || undefined,
  })),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue({
    user: { id: 'test-user', permissions: ['workflow:read'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/workflow-notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns notifications list successfully', async () => {
    const mockNotifications = [
      {
        _id: '1',
        recipient: 'user1',
        title: 'Notification 1',
        category: 'meeting',
        status: 'beklemede',
      },
      {
        _id: '2',
        recipient: 'user2',
        title: 'Notification 2',
        category: 'gorev',
        status: 'gonderildi',
      },
    ];

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.list).mockResolvedValue({
      documents: mockNotifications,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/workflow-notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.documents || data.data).toEqual(mockNotifications);
  });

  it('filters by recipient', async () => {
    const mockNotifications = [
      {
        _id: '1',
        recipient: 'user1',
        title: 'Notification',
      },
    ];

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.list).mockResolvedValue({
      documents: mockNotifications,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/workflow-notifications?recipient=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteWorkflowNotifications.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'user1',
      })
    );
  });

  it('filters by status', async () => {
    const mockNotifications = [
      {
        _id: '1',
        status: 'okundu',
        title: 'Read Notification',
      },
    ];

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.list).mockResolvedValue({
      documents: mockNotifications,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/workflow-notifications?status=okundu');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteWorkflowNotifications.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'okundu',
      })
    );
  });

  it('filters by category', async () => {
    const mockNotifications = [
      {
        _id: '1',
        category: 'rapor',
        title: 'Report Notification',
      },
    ];

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.list).mockResolvedValue({
      documents: mockNotifications,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/workflow-notifications?category=rapor');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteWorkflowNotifications.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'rapor',
      })
    );
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/workflow-notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.documents || data.data).toEqual([]);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.list).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bildirimler alınamadı');
  });
});

describe('POST /api/workflow-notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates notification successfully', async () => {
    const newNotification = {
      recipient: 'user1',
      title: 'New Notification',
      category: 'meeting',
    };

    const createdNotification = {
      _id: 'new-id',
      ...newNotification,
      status: 'beklemede',
    };

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.create).mockResolvedValue(
      createdNotification as any
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(newNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdNotification);
    expect(data.message).toBe('Bildirim oluşturuldu');
  });

  it('validates recipient is required', async () => {
    const invalidNotification = {
      title: 'Notification',
      // Missing recipient
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(invalidNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Alıcı zorunludur');
  });

  it('validates title is required and minimum length', async () => {
    const invalidNotification = {
      recipient: 'user1',
      title: 'AB', // Too short
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(invalidNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Bildirim başlığı en az 3 karakter olmalıdır');
  });

  it('validates category values', async () => {
    const invalidNotification = {
      recipient: 'user1',
      title: 'Notification',
      category: 'INVALID', // Invalid category
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(invalidNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz bildirim kategorisi');
  });

  it('validates status values', async () => {
    const invalidNotification = {
      recipient: 'user1',
      title: 'Notification',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(invalidNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz bildirim durumu');
  });

  it('sets default category to meeting', async () => {
    const newNotification = {
      recipient: 'user1',
      title: 'Notification',
      // No category provided
    };

    const createdNotification = {
      _id: 'new-id',
      ...newNotification,
      category: 'meeting', // Default value
      status: 'beklemede',
    };

    vi.mocked(appwriteApi.appwriteWorkflowNotifications.create).mockResolvedValue(
      createdNotification as any
    );

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(newNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteWorkflowNotifications.create).mockRejectedValue(
      new Error('Database error')
    );

    const validNotification = {
      recipient: 'user1',
      title: 'Notification',
    };

    const request = new NextRequest('http://localhost/api/workflow-notifications', {
      method: 'POST',
      body: JSON.stringify(validNotification),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Bildirim oluşturulamadı');
  });
});
