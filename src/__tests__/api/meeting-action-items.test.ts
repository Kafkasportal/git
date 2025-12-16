import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/meeting-action-items/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMeetingActionItems: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? Number.parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? Number.parseInt(params.get('limit')!) : 50,
    skip: 0,
    search: params.get('search') || undefined,
  })),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['workflow:read'] },
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

describe('GET /api/meeting-action-items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns action items list successfully', async () => {
    const mockActionItems = createMockDocuments([
      {
        _id: '1',
        meeting_id: 'meeting-1',
        title: 'Action Item 1',
        assigned_to: 'user1',
        status: 'beklemede',
      },
      {
        _id: '2',
        meeting_id: 'meeting-1',
        title: 'Action Item 2',
        assigned_to: 'user2',
        status: 'devam',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingActionItems.list).mockResolvedValue({
      documents: mockActionItems,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/meeting-action-items');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.documents || data.data).toEqual(mockActionItems);
  });

  it('filters by meeting_id', async () => {
    const mockActionItems = createMockDocuments([
      {
        _id: '1',
        meeting_id: 'meeting-1',
        title: 'Action Item',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingActionItems.list).mockResolvedValue({
      documents: mockActionItems,
      total: 1,
    });

    const request = new NextRequest(
      'http://localhost/api/meeting-action-items?meeting_id=meeting-1'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetingActionItems.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        meeting_id: 'meeting-1',
      })
    );
  });

  it('filters by assigned_to', async () => {
    const mockActionItems = createMockDocuments([
      {
        _id: '1',
        assigned_to: 'user1',
        title: 'Action Item',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingActionItems.list).mockResolvedValue({
      documents: mockActionItems,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/meeting-action-items?assigned_to=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetingActionItems.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        assigned_to: 'user1',
      })
    );
  });

  it('filters by status', async () => {
    const mockActionItems = createMockDocuments([
      {
        _id: '1',
        status: 'hazir',
        title: 'Completed Action Item',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingActionItems.list).mockResolvedValue({
      documents: mockActionItems,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/meeting-action-items?status=hazir');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetingActionItems.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'hazir',
      })
    );
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/meeting-action-items');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.documents || data.data).toEqual([]);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.list).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/meeting-action-items');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Toplantı görevleri alınamadı');
  });
});

describe('POST /api/meeting-action-items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates action item successfully', async () => {
    const newActionItem = {
      meeting_id: 'meeting-1',
      title: 'New Action Item',
      assigned_to: 'user1',
      created_by: 'test-user',
    };

    const createdActionItem = {
      _id: 'new-id',
      ...newActionItem,
      status: 'beklemede',
    };

    vi.mocked(appwriteApi.appwriteMeetingActionItems.create).mockResolvedValue(
      createdActionItem as any
    );

    const request = new NextRequest('http://localhost/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify(newActionItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdActionItem);
    expect(data.message).toBe('Toplantı görevi oluşturuldu');
  });

  it('validates meeting_id is required', async () => {
    const invalidActionItem = {
      title: 'Action Item',
      assigned_to: 'user1',
      created_by: 'test-user',
      // Missing meeting_id
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify(invalidActionItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Toplantı ID zorunludur');
  });

  it('validates title is required and minimum length', async () => {
    const invalidActionItem = {
      meeting_id: 'meeting-1',
      title: 'AB', // Too short
      assigned_to: 'user1',
      created_by: 'test-user',
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify(invalidActionItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Görev başlığı en az 3 karakter olmalıdır');
  });

  it('validates assigned_to is required', async () => {
    const invalidActionItem = {
      meeting_id: 'meeting-1',
      title: 'Action Item',
      created_by: 'test-user',
      // Missing assigned_to
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify(invalidActionItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Sorumlu kişi seçilmelidir');
  });

  it('validates status values', async () => {
    const invalidActionItem = {
      meeting_id: 'meeting-1',
      title: 'Action Item',
      assigned_to: 'user1',
      created_by: 'test-user',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify(invalidActionItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz görev durumu');
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingActionItems.create).mockRejectedValue(
      new Error('Database error')
    );

    const validActionItem = {
      meeting_id: 'meeting-1',
      title: 'Action Item',
      assigned_to: 'user1',
      created_by: 'test-user',
    };

    const request = new NextRequest('http://localhost/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify(validActionItem),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Toplantı görevi oluşturulamadı');
  });
});
