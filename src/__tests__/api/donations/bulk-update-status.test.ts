import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/donations/bulk-update-status/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteDonations: {
    update: vi.fn(),
  },
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  parseBody: vi.fn(async (req) => {
    try {
      const data = await req.json();
      return { data, error: null };
    } catch {
      return { data: null, error: 'Invalid JSON' };
    }
  }),
  successResponse: vi.fn((data, message, status) => {
    return new Response(JSON.stringify({ success: true, data, message }), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  errorResponse: vi.fn((error, status, details) => {
    return new Response(JSON.stringify({ success: false, error, details }), {
      status: status || 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: 'test-user', role: 'ADMIN' },
    session: { userId: 'test-user' },
  }),
  requireModuleAccess: vi.fn().mockResolvedValue(true),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('POST /api/donations/bulk-update-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update status of multiple donations', async () => {
    const ids = ['id1', 'id2', 'id3'];
    const status = 'completed';
    (appwriteApi.appwriteDonations.update as any).mockResolvedValue({ $id: 'id1', status });

    const request = new NextRequest('http://localhost/api/donations/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.updated).toBe(3);
    expect(data.data.failed).toBe(0);
  });

  it('should validate status value', async () => {
    const request = new NextRequest('http://localhost/api/donations/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({ ids: ['id1'], status: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle partial failures', async () => {
    const ids = ['id1', 'id2', 'id3'];
    const status = 'completed';
    (appwriteApi.appwriteDonations.update as any)
      .mockResolvedValueOnce({ $id: 'id1', status })
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce({ $id: 'id3', status });

    const request = new NextRequest('http://localhost/api/donations/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.updated).toBe(2);
    expect(data.data.failed).toBe(1);
  });
});

