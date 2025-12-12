import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/scholarships/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteScholarships: {
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
  requireModuleAccess: vi.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['scholarship:read'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock validations
vi.mock('@/lib/validations/scholarship', () => ({
  scholarshipUpdateSchema: {
    parse: vi.fn((data) => data),
  },
}));

// Mock Zod
vi.mock('zod', () => ({
  z: {
    ZodError: class ZodError extends Error {
      issues: Array<{ path: string[]; message: string }>;
      constructor(issues: Array<{ path: string[]; message: string }>) {
        super('Validation error');
        this.issues = issues;
      }
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/scholarships/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns scholarship by ID successfully', async () => {
    const mockScholarship = {
      _id: 'test-id',
      title: 'Test Scholarship',
      amount: 1000,
      currency: 'TRY',
      category: 'academic',
    };

    vi.mocked(appwriteApi.appwriteScholarships.get).mockResolvedValue(mockScholarship);

    const request = new NextRequest('http://localhost/api/scholarships/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockScholarship);
  });

  it('returns 404 when scholarship not found', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/scholarships/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Burs bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/scholarships/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/scholarships/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates scholarship successfully', async () => {
    const updateData = {
      title: 'Updated Scholarship',
      amount: 2000,
    };

    const updatedScholarship = {
      _id: 'test-id',
      ...updateData,
      currency: 'TRY',
      category: 'academic',
    };

    vi.mocked(appwriteApi.appwriteScholarships.update).mockResolvedValue(updatedScholarship as unknown);

    const request = new NextRequest('http://localhost/api/scholarships/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updatedScholarship);
    expect(data.message).toBe('Burs başarıyla güncellendi');
  });

  it('returns 404 when scholarship not found', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      title: 'Updated Scholarship',
    };

    const request = new NextRequest('http://localhost/api/scholarships/non-existent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.update).mockRejectedValue(
      new Error('Database error')
    );

    const updateData = {
      title: 'Updated Scholarship',
    };

    const request = new NextRequest('http://localhost/api/scholarships/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('DELETE /api/scholarships/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes scholarship successfully', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/scholarships/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Burs başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteScholarships.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when scholarship not found', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/scholarships/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteScholarships.remove).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/scholarships/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
