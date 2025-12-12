import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteStorage: {
    getFileView: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

// Mock Appwrite config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    buckets: {
      documents: 'documents-bucket',
    },
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
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
  uploadRateLimit: vi.fn((fn) => fn),
  readOnlyRateLimit: vi.fn((fn) => fn),
  dataModificationRateLimit: vi.fn((fn) => fn),
}));

// Mock ID
vi.mock('appwrite', () => ({
  ID: {
    unique: vi.fn(() => 'unique-file-id'),
  },
}));

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
      },
    } as unknown);
  });

  it('generates file ID successfully', async () => {
    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fileId).toBe('unique-file-id');
    expect(data.message).toBe('Use this fileId with Appwrite SDK to upload the file');
  });

  it('requires authentication', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue(null);
    const { ID } = await import('appwrite');
    vi.mocked(ID.unique).mockImplementation(() => {
      throw new Error('ID generation failed');
    });

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Dosya yükleme için ID oluşturulamadı');
  });
});

describe('GET /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
      },
    } as unknown);
  });

  it('returns file download URL successfully', async () => {
    const mockUrl = 'https://example.com/file';
    vi.mocked(appwriteApi.appwriteStorage.getFileView).mockReturnValue(mockUrl);

    const request = new NextRequest('http://localhost/api/upload?storageId=test-storage-id');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBe('https://example.com/file');
    expect(vi.mocked(appwriteApi.appwriteStorage.getFileView)).toHaveBeenCalledWith(
      'documents-bucket',
      'test-storage-id'
    );
  });

  it('validates storageId is required', async () => {
    const request = new NextRequest('http://localhost/api/upload');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Storage ID gerekli');
  });

  it('requires authentication', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/upload?storageId=test-id');
    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteStorage.getFileView).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const request = new NextRequest('http://localhost/api/upload?storageId=test-id');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Dosya URL'si alınamadı");
  });
});

describe('DELETE /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'test-user',
      },
    } as unknown);
  });

  it('deletes file successfully', async () => {
    vi.mocked(appwriteApi.appwriteStorage.deleteFile).mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/upload?storageId=test-storage-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Dosya başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteStorage.deleteFile)).toHaveBeenCalledWith(
      'documents-bucket',
      'test-storage-id'
    );
  });

  it('validates storageId is required', async () => {
    const request = new NextRequest('http://localhost/api/upload', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Storage ID gerekli');
  });

  it('requires authentication', async () => {
    vi.mocked(authUtils.requireAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/upload?storageId=test-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteStorage.deleteFile).mockRejectedValue(new Error('Storage error'));

    const request = new NextRequest('http://localhost/api/upload?storageId=test-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Dosya silinemedi');
  });
});
