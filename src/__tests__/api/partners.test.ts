import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock auth utils
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ 
    id: 'user-123', 
    name: 'Test User',
    permissions: ['partners:read', 'partners:write', 'partners:delete']
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(true),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn().mockResolvedValue({ success: true }),
  dataModificationRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Appwrite server
vi.mock('@/lib/appwrite/server', () => ({
  serverDatabases: {
    listDocuments: vi.fn().mockResolvedValue({
      total: 2,
      documents: [
        { 
          $id: 'partner-1', 
          name: 'ABC Şirketi', 
          type: 'sponsor',
          contactEmail: 'contact@abc.com',
          isActive: true,
        },
        { 
          $id: 'partner-2', 
          name: 'XYZ Vakfı', 
          type: 'foundation',
          contactEmail: 'info@xyz.org',
          isActive: true,
        },
      ],
    }),
    createDocument: vi.fn().mockResolvedValue({
      $id: 'new-partner',
      name: 'Yeni Partner',
      type: 'sponsor',
      isActive: true,
    }),
    getDocument: vi.fn().mockResolvedValue({
      $id: 'partner-1',
      name: 'ABC Şirketi',
      type: 'sponsor',
      isActive: true,
    }),
    updateDocument: vi.fn().mockResolvedValue({
      $id: 'partner-1',
      name: 'ABC Şirketi (Güncel)',
      isActive: true,
    }),
    deleteDocument: vi.fn().mockResolvedValue(true),
  },
}));

// Mock Appwrite config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db-id',
    collections: {
      partners: 'partners-collection-id',
    },
  },
}));

describe('Partners API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/partners', () => {
    it('should return list of partners for authenticated user', async () => {
      const { GET } = await import('@/app/api/partners/route');
      
      const request = new NextRequest('http://localhost:3000/api/partners');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.partners).toBeDefined();
      expect(Array.isArray(data.partners)).toBe(true);
    });

    it('should filter partners by type', async () => {
      const { GET } = await import('@/app/api/partners/route');
      
      const request = new NextRequest('http://localhost:3000/api/partners?type=sponsor');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/partners', () => {
    it('should create new partner with valid data', async () => {
      const { POST } = await import('@/app/api/partners/route');
      
      const request = new NextRequest('http://localhost:3000/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          name: 'Yeni Partner',
          type: 'sponsor',
          contactEmail: 'contact@partner.com',
          contactPhone: '+905551234567',
          address: 'İstanbul, Türkiye',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.partner).toBeDefined();
    });

    it('should reject partner creation without name', async () => {
      const { POST } = await import('@/app/api/partners/route');
      
      const request = new NextRequest('http://localhost:3000/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          type: 'sponsor',
          contactEmail: 'contact@partner.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
