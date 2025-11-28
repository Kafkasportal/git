import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/communication-logs/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteCommunicationLogs: {
    list: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => {
    const result: Record<string, unknown> = {};
    if (params.get('limit')) {
      result.limit = parseInt(params.get('limit') || '100', 10);
    }
    return result;
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn(),
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
}));

describe('GET /api/communication-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: ['messages:read'],
      },
    } as any);
  });

  it('returns communication logs successfully', async () => {
    const mockLogs = [
      {
        _id: '1',
        type: 'email',
        status: 'sent',
        recipient: 'test@example.com',
        message: 'Test email',
      },
      {
        _id: '2',
        type: 'sms',
        status: 'sent',
        recipient: '905551234567',
        message: 'Test SMS',
      },
    ];

    vi.mocked(appwriteApi.appwriteCommunicationLogs.list).mockResolvedValue({
      documents: mockLogs,
    } as any);

    const request = new NextRequest('http://localhost/api/communication-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockLogs);
  });

  it('filters by type', async () => {
    const mockLogs = [
      {
        _id: '1',
        type: 'email',
        status: 'sent',
      },
    ];

    vi.mocked(appwriteApi.appwriteCommunicationLogs.list).mockResolvedValue({
      documents: mockLogs,
    } as any);

    const request = new NextRequest('http://localhost/api/communication-logs?type=email');
    const response = await GET(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteCommunicationLogs.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          type: 'email',
        }),
      })
    );
  });

  it('filters by status', async () => {
    const mockLogs = [
      {
        _id: '1',
        type: 'sms',
        status: 'failed',
      },
    ];

    vi.mocked(appwriteApi.appwriteCommunicationLogs.list).mockResolvedValue({
      documents: mockLogs,
    } as any);

    const request = new NextRequest('http://localhost/api/communication-logs?status=failed');
    const response = await GET(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteCommunicationLogs.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: 'failed',
        }),
      })
    );
  });

  it('handles limit parameter', async () => {
    const mockLogs = [
      {
        _id: '1',
        type: 'email',
      },
    ];

    vi.mocked(appwriteApi.appwriteCommunicationLogs.list).mockResolvedValue({
      documents: mockLogs,
    } as any);

    const request = new NextRequest('http://localhost/api/communication-logs?limit=50');
    const response = await GET(request);
    await response.json();

    expect(response.status).toBe(200);
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteCommunicationLogs.list).mockResolvedValue({
      documents: [],
    } as any);

    const request = new NextRequest('http://localhost/api/communication-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it('requires messages module access', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockRejectedValue(new Error('Access denied'));

    const request = new NextRequest('http://localhost/api/communication-logs');
    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteCommunicationLogs.list).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/communication-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('İletişim kayıtları alınamadı');
  });
});
