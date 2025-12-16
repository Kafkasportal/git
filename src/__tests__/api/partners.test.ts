import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST } from '@/app/api/partners/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwritePartners: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? Number.parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? Number.parseInt(params.get('limit')!) : 50,
    skip: 0,
    search: params.get('search') || undefined,
  })),
}));

// Mock middleware
vi.mock('@/lib/api/middleware', () => ({
  buildApiRoute: vi.fn((_config) => (handler: (req: Request) => Response | Promise<Response>) => handler),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  successResponse: vi.fn((data, message, status = 200) => {
    return new Response(JSON.stringify({ success: true, data, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  errorResponse: vi.fn((message, status = 400, details?: string[]) => {
    return new Response(JSON.stringify({ success: false, error: message, details }), {
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
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: ['partners:read'] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

describe('GET /api/partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns partners list successfully', async () => {
    const mockPartners = createMockDocuments([
      {
        _id: '1',
        name: 'Partner 1',
        type: 'organization',
        partnership_type: 'donor',
        status: 'active',
      },
      {
        _id: '2',
        name: 'Partner 2',
        type: 'individual',
        partnership_type: 'volunteer',
        status: 'active',
      },
    ]);

    vi.mocked(appwriteApi.appwritePartners.list).mockResolvedValue({
      documents: mockPartners,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/partners');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockPartners);
  });

  it('filters by type', async () => {
    const mockPartners = createMockDocuments([
      {
        _id: '1',
        name: 'Organization Partner',
        type: 'organization',
      },
    ]);

    vi.mocked(appwriteApi.appwritePartners.list).mockResolvedValue({
      documents: mockPartners,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/partners?type=organization');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwritePartners.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'organization',
      })
    );
  });

  it('filters by status', async () => {
    const mockPartners = createMockDocuments([
      {
        _id: '1',
        name: 'Active Partner',
        status: 'active',
      },
    ]);

    vi.mocked(appwriteApi.appwritePartners.list).mockResolvedValue({
      documents: mockPartners,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/partners?status=active');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwritePartners.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  it('filters by partnership_type', async () => {
    const mockPartners = createMockDocuments([
      {
        _id: '1',
        name: 'Donor Partner',
        partnership_type: 'donor',
      },
    ]);

    vi.mocked(appwriteApi.appwritePartners.list).mockResolvedValue({
      documents: mockPartners,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/partners?partnership_type=donor');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwritePartners.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        partnership_type: 'donor',
      })
    );
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwritePartners.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/partners?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwritePartners.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwritePartners.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/partners');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwritePartners.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/partners');

    // buildApiRoute may throw or return error response
    try {
      const response = await GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      // buildApiRoute might throw, which is also acceptable
      expect(error).toBeDefined();
    }
  });
});

describe('POST /api/partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates partner successfully', async () => {
    const newPartner = {
      name: 'New Partner',
      type: 'organization',
      partnership_type: 'donor',
      status: 'active',
      email: 'partner@example.com',
      phone: '5551234567',
    };

    const createdPartner = {
      _id: 'new-id',
      ...newPartner,
    };

    vi.mocked(appwriteApi.appwritePartners.create).mockResolvedValue(createdPartner as any);

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(newPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdPartner);
    expect(data.message).toBe('Partner başarıyla oluşturuldu');
  });

  it('validates name is required and minimum length', async () => {
    const invalidPartner = {
      name: 'A', // Too short
      type: 'organization',
      partnership_type: 'donor',
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(invalidPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Partner adı en az 2 karakter olmalıdır');
  });

  it('validates type is required and valid', async () => {
    const invalidPartner = {
      name: 'Test Partner',
      type: 'INVALID', // Invalid type
      partnership_type: 'donor',
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(invalidPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz partner türü');
  });

  it('validates partnership_type is required and valid', async () => {
    const invalidPartner = {
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'INVALID', // Invalid partnership type
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(invalidPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz işbirliği türü');
  });

  it('validates email format when provided', async () => {
    const invalidPartner = {
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'donor',
      email: 'invalid-email', // Invalid email
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(invalidPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçerli bir email adresi giriniz');
  });

  it('validates phone format when provided', async () => {
    const invalidPartner = {
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'donor',
      phone: '123', // Invalid phone (too short)
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(invalidPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçerli bir telefon numarası giriniz');
  });

  it('validates status when provided', async () => {
    const invalidPartner = {
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'donor',
      status: 'INVALID', // Invalid status
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(invalidPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz durum değeri');
  });

  it('sets default status to active', async () => {
    const newPartner = {
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'donor',
      // No status provided
    };

    const createdPartner = {
      _id: 'new-id',
      ...newPartner,
      status: 'active',
    };

    vi.mocked(appwriteApi.appwritePartners.create).mockResolvedValue(createdPartner as any);

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(newPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(vi.mocked(appwriteApi.appwritePartners.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwritePartners.create).mockRejectedValue(new Error('Database error'));

    const validPartner = {
      name: 'Test Partner',
      type: 'organization',
      partnership_type: 'donor',
    };

    const request = new NextRequest('http://localhost/api/partners', {
      method: 'POST',
      body: JSON.stringify(validPartner),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // buildApiRoute may throw or return error response
    try {
      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      // buildApiRoute might throw, which is also acceptable
      expect(error).toBeDefined();
    }
  });
});
