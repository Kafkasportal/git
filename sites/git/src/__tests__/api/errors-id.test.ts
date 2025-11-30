import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/errors/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteErrors: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('GET /api/errors/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error by ID successfully', async () => {
    const mockError = {
      _id: 'test-id',
      error_code: 'ERR001',
      title: 'Test Error',
      category: 'runtime',
      severity: 'high',
      status: 'new',
    };

    vi.mocked(appwriteApi.appwriteErrors.get).mockResolvedValue(mockError);

    const request = new NextRequest('http://localhost/api/errors/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockError);
  });

  it('returns 404 when error not found', async () => {
    vi.mocked(appwriteApi.appwriteErrors.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/errors/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Error not found');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteErrors.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/errors/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch error details');
  });
});

describe('PATCH /api/errors/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates error successfully', async () => {
    const updateData = {
      title: 'Updated Error Title',
      status: 'assigned',
      severity: 'medium',
    };

    const updatedError = {
      _id: 'test-id',
      ...updateData,
      error_code: 'ERR001',
      category: 'runtime',
    };

    vi.mocked(appwriteApi.appwriteErrors.update).mockResolvedValue(updatedError as any);

    const request = new NextRequest('http://localhost/api/errors/test-id', {
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
    expect(data.data).toEqual(updatedError);
    expect(data.message).toBe('Error updated successfully');
  });

  it('validates status enum', async () => {
    const invalidUpdate = {
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/errors/test-id', {
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
    expect(data.error).toBe('Validation failed');
  });

  it('validates severity enum', async () => {
    const invalidUpdate = {
      severity: 'INVALID', // Invalid severity
    };

    const request = new NextRequest('http://localhost/api/errors/test-id', {
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
    expect(data.error).toBe('Validation failed');
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteErrors.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      title: 'Updated Error',
    };

    const request = new NextRequest('http://localhost/api/errors/test-id', {
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
    expect(data.error).toBe('Failed to update error');
  });
});
