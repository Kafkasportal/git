import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/meeting-decisions/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMeetingDecisions: {
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

describe('GET /api/meeting-decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns decisions list successfully', async () => {
    const mockDecisions = createMockDocuments([
      {
        _id: '1',
        meeting_id: 'meeting-1',
        title: 'Decision 1',
        status: 'acik',
      },
      {
        _id: '2',
        meeting_id: 'meeting-1',
        title: 'Decision 2',
        status: 'devam',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingDecisions.list).mockResolvedValue({
      documents: mockDecisions,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/meeting-decisions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.documents || data.data).toEqual(mockDecisions);
  });

  it('filters by meeting_id', async () => {
    const mockDecisions = createMockDocuments([
      {
        _id: '1',
        meeting_id: 'meeting-1',
        title: 'Decision',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingDecisions.list).mockResolvedValue({
      documents: mockDecisions,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/meeting-decisions?meeting_id=meeting-1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetingDecisions.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        meeting_id: 'meeting-1',
      })
    );
  });

  it('filters by owner', async () => {
    const mockDecisions = createMockDocuments([
      {
        _id: '1',
        owner: 'user1',
        title: 'Decision',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingDecisions.list).mockResolvedValue({
      documents: mockDecisions,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/meeting-decisions?owner=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetingDecisions.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'user1',
      })
    );
  });

  it('filters by status', async () => {
    const mockDecisions = createMockDocuments([
      {
        _id: '1',
        status: 'kapatildi',
        title: 'Closed Decision',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMeetingDecisions.list).mockResolvedValue({
      documents: mockDecisions,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/meeting-decisions?status=kapatildi');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetingDecisions.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'kapatildi',
      })
    );
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/meeting-decisions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.documents || data.data).toEqual([]);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.list).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/meeting-decisions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Karar listesi alınamadı');
  });
});

describe('POST /api/meeting-decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates decision successfully', async () => {
    const newDecision = {
      meeting_id: 'meeting-1',
      title: 'New Decision',
      created_by: 'test-user',
    };

    const createdDecision = {
      _id: 'new-id',
      ...newDecision,
      status: 'acik',
    };

    vi.mocked(appwriteApi.appwriteMeetingDecisions.create).mockResolvedValue(
      createdDecision as any
    );

    const request = new NextRequest('http://localhost/api/meeting-decisions', {
      method: 'POST',
      body: JSON.stringify(newDecision),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdDecision);
    expect(data.message).toBe('Toplantı kararı oluşturuldu');
  });

  it('validates meeting_id is required', async () => {
    const invalidDecision = {
      title: 'Decision',
      created_by: 'test-user',
      // Missing meeting_id
    };

    const request = new NextRequest('http://localhost/api/meeting-decisions', {
      method: 'POST',
      body: JSON.stringify(invalidDecision),
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
    const invalidDecision = {
      meeting_id: 'meeting-1',
      title: 'AB', // Too short
      created_by: 'test-user',
    };

    const request = new NextRequest('http://localhost/api/meeting-decisions', {
      method: 'POST',
      body: JSON.stringify(invalidDecision),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Karar başlığı en az 3 karakter olmalıdır');
  });

  it('validates status values', async () => {
    const invalidDecision = {
      meeting_id: 'meeting-1',
      title: 'Decision',
      created_by: 'test-user',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/meeting-decisions', {
      method: 'POST',
      body: JSON.stringify(invalidDecision),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz karar durumu');
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMeetingDecisions.create).mockRejectedValue(
      new Error('Database error')
    );

    const validDecision = {
      meeting_id: 'meeting-1',
      title: 'Decision',
      created_by: 'test-user',
    };

    const request = new NextRequest('http://localhost/api/meeting-decisions', {
      method: 'POST',
      body: JSON.stringify(validDecision),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Toplantı kararı oluşturulamadı');
  });
});
