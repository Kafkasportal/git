import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/meetings/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMeetings: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
  })),
}));

// Mock middleware
vi.mock('@/lib/api/middleware', () => ({
  buildApiRoute: vi.fn((_options) => (handler: any) => handler),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  successResponse: vi.fn((data, message, status = 200) => {
    return new Response(JSON.stringify({ success: true, data, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  errorResponse: vi.fn((error, status = 400, details?: string[]) => {
    return new Response(JSON.stringify({ success: false, error, details }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  parseBody: vi.fn(async (request) => {
    const body = await request.json();
    return { data: body, error: null };
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(undefined),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: 'test-user', role: 'Personel' },
  }),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

describe('GET /api/meetings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns meetings list successfully', async () => {
    const mockMeetings = [
      {
        _id: '1',
        title: 'Test Meeting 1',
        meeting_date: '2024-01-01T10:00:00Z',
        organizer: 'user1',
        status: 'scheduled',
        meeting_type: 'general',
      },
      {
        _id: '2',
        title: 'Test Meeting 2',
        meeting_date: '2024-01-02T14:00:00Z',
        organizer: 'user2',
        status: 'completed',
        meeting_type: 'board',
      },
    ];

    vi.mocked(appwriteApi.appwriteMeetings.list).mockResolvedValue({
      documents: mockMeetings,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/meetings');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockMeetings);
  });

  it('filters by organizer', async () => {
    const mockMeetings = [
      {
        _id: '1',
        title: 'Test Meeting',
        organizer: 'user1',
      },
    ];

    vi.mocked(appwriteApi.appwriteMeetings.list).mockResolvedValue({
      documents: mockMeetings,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/meetings?organizer=user1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetings.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        organizer: 'user1',
      })
    );
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/meetings?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMeetings.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteMeetings.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/meetings');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });
});

describe('POST /api/meetings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates meeting successfully', async () => {
    const newMeeting = {
      title: 'New Test Meeting',
      meeting_date: '2024-01-15T10:00:00Z',
      organizer: 'user1',
      description: 'Test Description',
      location: 'Test Location',
      participants: ['user1', 'user2'],
      status: 'scheduled',
      meeting_type: 'general',
    };

    const createdMeeting = {
      _id: 'new-id',
      ...newMeeting,
    };

    vi.mocked(appwriteApi.appwriteMeetings.create).mockResolvedValue(createdMeeting as any);

    const request = new NextRequest('http://localhost/api/meetings', {
      method: 'POST',
      body: JSON.stringify(newMeeting),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdMeeting);
    expect(data.message).toBe('Toplantı başarıyla oluşturuldu');
  });

  it('validates title is required and minimum length', async () => {
    const invalidMeeting = {
      title: 'AB', // Too short (less than 3 characters)
      meeting_date: '2024-01-15T10:00:00Z',
      organizer: 'user1',
    };

    const request = new NextRequest('http://localhost/api/meetings', {
      method: 'POST',
      body: JSON.stringify(invalidMeeting),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Toplantı başlığı en az 3 karakter olmalıdır');
  });

  it('validates meeting_date is required', async () => {
    const invalidMeeting = {
      title: 'Valid Title',
      organizer: 'user1',
      // Missing meeting_date
    };

    const request = new NextRequest('http://localhost/api/meetings', {
      method: 'POST',
      body: JSON.stringify(invalidMeeting),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Toplantı tarihi zorunludur');
  });

  it('validates status values', async () => {
    const invalidMeeting = {
      title: 'Valid Title',
      meeting_date: '2024-01-15T10:00:00Z',
      organizer: 'user1',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/meetings', {
      method: 'POST',
      body: JSON.stringify(invalidMeeting),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz durum');
  });

  it('sets default status to scheduled', async () => {
    const newMeeting = {
      title: 'New Test Meeting',
      meeting_date: '2024-01-15T10:00:00Z',
      organizer: 'user1',
    };

    const createdMeeting = {
      _id: 'new-id',
      ...newMeeting,
      status: 'scheduled',
    };

    vi.mocked(appwriteApi.appwriteMeetings.create).mockResolvedValue(createdMeeting as any);

    const request = new NextRequest('http://localhost/api/meetings', {
      method: 'POST',
      body: JSON.stringify(newMeeting),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
