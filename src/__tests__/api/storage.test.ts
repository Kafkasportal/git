import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/appwrite/api', () => ({
  appwriteFiles: {
    list: vi.fn(),
    get: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { appwriteFiles } from '@/lib/appwrite/api';

describe('Storage API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/storage', () => {
    it('should require authentication', async () => {
      (requireAuthenticatedUser as Mock).mockRejectedValue(new Error('Unauthorized'));

      const { GET } = await import('@/app/api/storage/route');
      const request = new NextRequest('http://localhost:3000/api/storage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should list files for authenticated user', async () => {
      const mockFiles = {
        documents: [
          { $id: 'file-1', name: 'document.pdf', storageId: 'storage-1' },
          { $id: 'file-2', name: 'image.jpg', storageId: 'storage-2' },
        ],
        total: 2,
      };
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1' },
        sessionId: 'session-1',
      });
      (appwriteFiles.list as Mock).mockResolvedValue(mockFiles);

      const { GET } = await import('@/app/api/storage/route');
      const request = new NextRequest('http://localhost:3000/api/storage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter by beneficiaryId', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1' },
        sessionId: 'session-1',
      });
      (appwriteFiles.list as Mock).mockResolvedValue({ documents: [], total: 0 });

      const { GET } = await import('@/app/api/storage/route');
      const request = new NextRequest('http://localhost:3000/api/storage?beneficiaryId=ben-123');
      await GET(request);

      expect(appwriteFiles.list).toHaveBeenCalledWith(
        expect.objectContaining({ beneficiaryId: 'ben-123' })
      );
    });

    it('should filter by bucket', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1' },
        sessionId: 'session-1',
      });
      (appwriteFiles.list as Mock).mockResolvedValue({ documents: [], total: 0 });

      const { GET } = await import('@/app/api/storage/route');
      const request = new NextRequest('http://localhost:3000/api/storage?bucket=avatars');
      await GET(request);

      expect(appwriteFiles.list).toHaveBeenCalledWith(
        expect.objectContaining({ bucket: 'avatars' })
      );
    });

    it('should filter by documentType', async () => {
      (requireAuthenticatedUser as Mock).mockResolvedValue({
        user: { id: 'user-1' },
        sessionId: 'session-1',
      });
      (appwriteFiles.list as Mock).mockResolvedValue({ documents: [], total: 0 });

      const { GET } = await import('@/app/api/storage/route');
      const request = new NextRequest('http://localhost:3000/api/storage?documentType=receipt');
      await GET(request);

      expect(appwriteFiles.list).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'receipt' })
      );
    });
  });
});
