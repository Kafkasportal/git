import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock logger before imports
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Appwrite server
vi.mock('@/lib/appwrite/server', () => ({
  serverDatabases: {
    list: vi.fn().mockResolvedValue({ databases: [] }),
  },
}));

// Mock Appwrite config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db-id',
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: 'test-project',
  },
}));

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-db';
    process.env.APPWRITE_API_KEY = 'test-api-key';
  });

  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const { GET } = await import('@/app/api/health/route');
      
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.provider).toBe('appwrite');
      expect(data.timestamp).toBeDefined();
    });

    it('should return detailed health status when requested', async () => {
      const { GET } = await import('@/app/api/health/route');
      
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.appwrite).toBeDefined();
      expect(data.appwrite.configured).toBe(true);
    });

    it('should indicate missing configuration', async () => {
      // Clear env vars
      delete process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      delete process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      delete process.env.APPWRITE_API_KEY;
      
      // Re-import to get fresh module
      vi.resetModules();
      const { GET } = await import('@/app/api/health/route');
      
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.appwrite.configured).toBe(false);
    });
  });
});
