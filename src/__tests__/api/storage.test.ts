import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET } from '@/app/api/storage/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteFiles: {
    list: vi.fn(),
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
      },
    } as any);
  });

  it('returns file list successfully', async () => {
    const mockFiles = createMockDocuments([
      {
        _id: '1',
        storageId: 'storage-1',
        bucket: 'documents',
        documentType: 'pdf',
      },
      {
        _id: '2',
        storageId: 'storage-2',
        bucket: 'documents',
        documentType: 'image',
      },
    ]);

    vi.mocked(appwriteApi.appwriteFiles.list).mockResolvedValue({
      documents: mockFiles,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/storage');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it('filters by beneficiaryId', async () => {
    const mockFiles = createMockDocuments([
      {
        _id: '1',
        beneficiaryId: 'ben-1',
        storageId: 'storage-1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteFiles.list).mockResolvedValue({
      documents: mockFiles,
      total: 1,
    } as any);

    const request = new NextRequest('http://localhost/api/storage?beneficiaryId=ben-1');
    const response = await GET(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteFiles.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiaryId: 'ben-1',
      })
    );
  });

  it('filters by bucket', async () => {
    const mockFiles = createMockDocuments([
      {
        _id: '1',
        bucket: 'images',
        storageId: 'storage-1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteFiles.list).mockResolvedValue({
      documents: mockFiles,
      total: 1,
    } as any);

    const request = new NextRequest('http://localhost/api/storage?bucket=images');
    const response = await GET(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteFiles.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: 'images',
      })
    );
  });

  it('filters by documentType', async () => {
    const mockFiles = createMockDocuments([
      {
        _id: '1',
        documentType: 'pdf',
        storageId: 'storage-1',
      },
    ]);

    vi.mocked(appwriteApi.appwriteFiles.list).mockResolvedValue({
      documents: mockFiles,
      total: 1,
    } as any);

    const request = new NextRequest('http://localhost/api/storage?documentType=pdf');
    const response = await GET(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteFiles.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: 'pdf',
      })
    );
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteFiles.list).mockResolvedValue({
      documents: [],
      total: 0,
    } as any);

    const request = new NextRequest('http://localhost/api/storage');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('requires authentication', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/storage');
    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteFiles.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/storage');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Dosyalar alınamadı');
  });
});
