import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments } from '../test-utils';
import { GET, POST, GET_STATS } from '@/app/api/kumbara/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteDonations: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? Number.parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? Number.parseInt(params.get('limit')!) : 50,
  })),
}));

// Mock QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
  appwriteConfig: {
    databaseId: 'test-db',
    collections: {
      donations: 'donations',
    },
  },
}));

// Mock auth
vi.mock('@/lib/api/auth-utils');

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));


describe('GET /api/kumbara - List donations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValue({
      session: { userId: 'test-user-id', isValid: true } as any,
      user: { id: 'test-user-id', role: 'admin', permissions: [] } as any,
    });
  });

  it('returns kumbara donations list successfully', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test Donor',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Location 1',
        kumbara_institution: 'Institution 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test Donor 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Location 2',
        kumbara_institution: 'Institution 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.donations).toEqual(mockDonations);
    expect(data.pagination.total).toBe(2);
  });

  it('filters by search term - donor name', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'John Doe',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Location 1',
        kumbara_institution: 'Institution 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
        receipt_number: 'RCP-001',
      },
      {
        _id: '2',
        donor_name: 'Jane Smith',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Location 2',
        kumbara_institution: 'Institution 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
        receipt_number: 'RCP-002',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?search=John');
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(1);
    expect(data.donations[0].donor_name).toBe('John Doe');
  });

  it('filters by search term - location', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'John Doe',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Istanbul',
        kumbara_institution: 'Institution 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Jane Smith',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Ankara',
        kumbara_institution: 'Institution 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?search=istanbul');
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(1);
    expect(data.donations[0].kumbara_location).toBe('Istanbul');
  });

  it('filters by location parameter', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test 1',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Istanbul',
        kumbara_institution: 'Inst 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Istanbul',
        kumbara_institution: 'Inst 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '3',
        donor_name: 'Test 3',
        amount: 750,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Ankara',
        kumbara_institution: 'Inst 3',
        collection_date: '2024-01-03T00:00:00Z',
        status: 'completed',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?location=Istanbul');
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(2);
    expect(data.donations.every((d: any) => d.kumbara_location === 'Istanbul')).toBe(true);
  });

  it('filters by status parameter', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test 1',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 1',
        kumbara_institution: 'Inst 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 2',
        kumbara_institution: 'Inst 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
      },
      {
        _id: '3',
        donor_name: 'Test 3',
        amount: 750,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 3',
        kumbara_institution: 'Inst 3',
        collection_date: '2024-01-03T00:00:00Z',
        status: 'pending',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?status=pending');
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(2);
    expect(data.donations.every((d: any) => d.status === 'pending')).toBe(true);
  });

  it('filters by currency parameter', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test 1',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 1',
        kumbara_institution: 'Inst 1',
        collection_date: '2024-01-01T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test 2',
        amount: 500,
        currency: 'USD',
        is_kumbara: true,
        kumbara_location: 'Loc 2',
        kumbara_institution: 'Inst 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?currency=TRY');
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(1);
    expect(data.donations[0].currency).toBe('TRY');
  });

  it('filters by date range', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test 1',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 1',
        kumbara_institution: 'Inst 1',
        collection_date: '2024-01-15T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 2',
        kumbara_institution: 'Inst 2',
        collection_date: '2024-02-20T00:00:00Z',
        status: 'completed',
      },
      {
        _id: '3',
        donor_name: 'Test 3',
        amount: 750,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 3',
        kumbara_institution: 'Inst 3',
        collection_date: '2024-03-10T00:00:00Z',
        status: 'pending',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest(
      'http://localhost/api/kumbara?startDate=2024-02-01&endDate=2024-02-28'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(1);
    expect(data.donations[0].collection_date).toBe('2024-02-20T00:00:00Z');
  });

  it('handles pagination - page 1', async () => {
    const mockDonations = Array.from({ length: 20 }, (_, i) => ({
      _id: String(i + 1),
      donor_name: `Donor ${i + 1}`,
      amount: 1000 + i * 100,
      currency: 'TRY',
      is_kumbara: true,
      kumbara_location: `Location ${i + 1}`,
      kumbara_institution: `Institution ${i + 1}`,
      collection_date: '2024-01-01T00:00:00Z',
      status: 'pending',
    }));

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 50,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?page=1&limit=20');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
    expect(data.pagination.total).toBe(50);
    expect(data.pagination.totalPages).toBe(3);
  });

  it('handles pagination - page 2', async () => {
    const mockDonations = Array.from({ length: 20 }, (_, i) => ({
      _id: String(i + 21),
      donor_name: `Donor ${i + 21}`,
      amount: 1000 + i * 100,
      currency: 'TRY',
      is_kumbara: true,
      kumbara_location: `Location ${i + 21}`,
      kumbara_institution: `Institution ${i + 21}`,
      collection_date: '2024-01-01T00:00:00Z',
      status: 'pending',
    }));

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 50,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?page=2&limit=20');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(20);
  });

  it('filters only kumbara donations', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        is_kumbara: true,
        donor_name: 'Test',
        amount: 1000,
        currency: 'TRY',
        kumbara_location: 'Loc',
        kumbara_institution: 'Inst',
        collection_date: '2024-01-01T00:00:00Z',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations.filter((d) => d.is_kumbara),
      total: 1,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.donations.length).toBe(1);
    expect(data.donations[0].is_kumbara).toBe(true);
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.donations).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışları getirilemedi');
  });

  it('handles module access denial', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockRejectedValue(
      new Error('Access denied')
    );
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue({
      status: 403,
      body: { error: 'Access denied' },
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara');
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('filters by receipt number in search', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test 1',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 1',
        kumbara_institution: 'Inst 1',
        collection_date: '2024-01-01T00:00:00Z',
        receipt_number: 'RCP-001',
      },
      {
        _id: '2',
        donor_name: 'Test 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 2',
        kumbara_institution: 'Inst 2',
        collection_date: '2024-01-02T00:00:00Z',
        receipt_number: 'RCP-002',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara?search=RCP-002');
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(1);
    expect(data.donations[0].receipt_number).toBe('RCP-002');
  });

  it('handles date without collection_date field', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        donor_name: 'Test 1',
        amount: 1000,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 1',
        kumbara_institution: 'Inst 1',
        collection_date: undefined,
        status: 'pending',
      },
      {
        _id: '2',
        donor_name: 'Test 2',
        amount: 500,
        currency: 'TRY',
        is_kumbara: true,
        kumbara_location: 'Loc 2',
        kumbara_institution: 'Inst 2',
        collection_date: '2024-01-02T00:00:00Z',
        status: 'completed',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 2,
    } as any);

    const request = new NextRequest(
      'http://localhost/api/kumbara?startDate=2024-01-01&endDate=2024-02-01'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.donations.length).toBe(1);
    expect(data.donations[0]._id).toBe('2');
  });
});

describe('GET_STATS /api/kumbara/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValue({
      session: { userId: 'test-user-id', isValid: true } as any,
      user: { id: 'test-user-id', role: 'admin', permissions: [] } as any,
    });
  });

  it('returns overview stats by default', async () => {
    const now = new Date();
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        amount: 1000,
        kumbara_location: 'Istanbul',
        collection_date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        status: 'pending',
        payment_method: 'Cash',
      },
      {
        _id: '2',
        amount: 2000,
        kumbara_location: 'Ankara',
        collection_date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        status: 'completed',
        payment_method: 'Bank Transfer',
      },
      {
        _id: '3',
        amount: 500,
        kumbara_location: 'Istanbul',
        collection_date: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
        status: 'pending',
        payment_method: 'Cash',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara/stats');
    const response = await GET_STATS(request);
    const data = await response.json();

    expect(data.total_kumbara).toBe(3);
    expect(data.total_amount).toBe(3500);
    expect(data.active_locations).toBe(2);
    expect(data.pending_collections).toBe(2);
    expect(data.completed_collections).toBe(1);
    expect(typeof data.monthly_growth).toBe('number');
  });

  it('returns monthly stats', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        amount: 1000,
        kumbara_location: 'Istanbul',
        collection_date: new Date(2024, 0, 15).toISOString(),
        status: 'pending',
      },
      {
        _id: '2',
        amount: 2000,
        kumbara_location: 'Ankara',
        collection_date: new Date(2024, 1, 20).toISOString(),
        status: 'completed',
      },
      {
        _id: '3',
        amount: 500,
        kumbara_location: 'Istanbul',
        collection_date: new Date(2024, 2, 10).toISOString(),
        status: 'pending',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara/stats?type=monthly');
    const response = await GET_STATS(request);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('month');
    expect(data[0]).toHaveProperty('amount');
    expect(data[0]).toHaveProperty('count');
  });

  it('returns location-based stats', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        amount: 1000,
        kumbara_location: 'Istanbul',
        collection_date: '2024-01-15T00:00:00Z',
        status: 'pending',
      },
      {
        _id: '2',
        amount: 2000,
        kumbara_location: 'Ankara',
        collection_date: '2024-01-20T00:00:00Z',
        status: 'completed',
      },
      {
        _id: '3',
        amount: 500,
        kumbara_location: 'Istanbul',
        collection_date: '2024-01-25T00:00:00Z',
        status: 'pending',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara/stats?type=location');
    const response = await GET_STATS(request);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    const istanbulStats = data.find((s: any) => s.location === 'Istanbul');
    expect(istanbulStats).toBeDefined();
    expect(istanbulStats?.count).toBe(2);
    expect(istanbulStats?.amount).toBe(1500);
  });

  it('returns payment method stats', async () => {
    const mockDonations = createMockDocuments([
      {
        _id: '1',
        amount: 1000,
        kumbara_location: 'Istanbul',
        collection_date: '2024-01-15T00:00:00Z',
        payment_method: 'Cash',
      },
      {
        _id: '2',
        amount: 2000,
        kumbara_location: 'Ankara',
        collection_date: '2024-01-20T00:00:00Z',
        payment_method: 'Bank Transfer',
      },
      {
        _id: '3',
        amount: 500,
        kumbara_location: 'Istanbul',
        collection_date: '2024-01-25T00:00:00Z',
        payment_method: 'Cash',
      },
    ]);

    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: mockDonations,
      total: 3,
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara/stats?type=payment');
    const response = await GET_STATS(request);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    const cashStats = data.find((s: any) => s.method === 'Cash');
    expect(cashStats).toBeDefined();
    expect(cashStats?.count).toBe(2);
    expect(cashStats?.value).toBe(1500);
  });

  it('handles empty donations in stats', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/kumbara/stats');
    const response = await GET_STATS(request);
    const data = await response.json();

    expect(data.total_kumbara).toBe(0);
    expect(data.total_amount).toBe(0);
    expect(data.active_locations).toBe(0);
  });

  it('handles stats error gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.list).mockRejectedValue(new Error('Database error'));
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue(null);

    const request = new NextRequest('http://localhost/api/kumbara/stats');
    const response = await GET_STATS(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('İstatistikler getirilemedi');
  });

  it('handles module access denial in stats', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockRejectedValue(
      new Error('Access denied')
    );
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue({
      status: 403,
      body: { error: 'Access denied' },
    } as any);

    const request = new NextRequest('http://localhost/api/kumbara/stats');
    const response = await GET_STATS(request);

    expect(response.status).toBe(403);
  });
});


describe('POST /api/kumbara - Create donation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValue({
      session: { userId: 'test-user-id', isValid: true } as any,
      user: { id: 'test-user-id', role: 'admin', permissions: [] } as any,
    });
    vi.mocked(authUtils.verifyCsrfToken).mockResolvedValue(undefined);
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue(null);
  });

  it('creates kumbara donation with QR code successfully', async () => {
    const newDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY' as const,
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const donationId = 'new-donation-id';
    vi.mocked(appwriteApi.appwriteDonations.create).mockResolvedValue(donationId);

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(newDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(donationId);
    expect(data.data.qr_code).toBe('data:image/png;base64,mock-qr-code');
    expect(data.message).toContain('QR kod oluşturuldu');
  });

  it('validates required fields - donor name too short', async () => {
    const invalidDonation = {
      donor_name: 'T', // Too short
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Location',
      kumbara_institution: 'Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Bağışçı adı en az 2 karakter olmalıdır');
  });

  it('validates required fields - empty donor name', async () => {
    const invalidDonation = {
      donor_name: '', // Empty
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Location',
      kumbara_institution: 'Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates amount is positive', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: -100, // Negative amount
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Bağış tutarı pozitif olmalıdır');
  });

  it('validates amount is not zero', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      amount: 0,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Bağış tutarı pozitif olmalıdır');
  });

  it('validates amount is undefined', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Bağış tutarı pozitif olmalıdır');
  });

  it('validates currency is valid', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'GBP', // Invalid currency
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz para birimi');
  });

  it('validates kumbara location is minimum 2 chars', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'I', // Too short
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Kumbara lokasyonu en az 2 karakter olmalıdır');
  });

  it('validates kumbara institution is required', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: '', // Empty
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Kumbara kurum/adres bilgisi gereklidir');
  });

  it('validates collection date is required', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Toplama tarihi gereklidir');
  });

  it('validates location coordinates if provided', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      location_coordinates: { lat: NaN, lng: 28.5 },
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz koordinat bilgisi');
  });

  it('validates location coordinates longitude', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      location_coordinates: { lat: 41.0, lng: NaN },
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz koordinat bilgisi');
  });

  it('validates route points if provided', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      route_points: [
        { lat: 41.0, lng: 28.0 },
        { lat: NaN, lng: 29.0 },
      ],
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Geçersiz rota noktası koordinatı');
  });

  it('validates route distance is positive if provided', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      route_distance: -5,
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Rota mesafesi pozitif bir sayı olmalıdır');
  });

  it('validates route duration is positive if provided', async () => {
    const invalidDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      route_duration: -30,
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(invalidDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Rota süresi pozitif bir sayı olmalıdır');
  });

  it('handles CSRF token verification failure', async () => {
    vi.mocked(authUtils.verifyCsrfToken).mockRejectedValue(new Error('CSRF token invalid'));
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue({
      status: 403,
      body: { error: 'Invalid CSRF token' },
    } as any);

    const validDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('handles module access denial on POST', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockRejectedValue(new Error('Access denied'));
    vi.mocked(authUtils.buildErrorResponse).mockReturnValue({
      status: 403,
      body: { error: 'Access denied' },
    } as any);

    const validDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteDonations.create).mockRejectedValue(new Error('Database error'));

    const validDonation = {
      donor_name: 'Test Donor',
      donor_phone: '+905551234567',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
      receipt_number: 'REC-001',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Kumbara bağışı oluşturulamadı');
  });

  it('allows TRY currency', async () => {
    vi.mocked(appwriteApi.appwriteDonations.create).mockResolvedValue('donation-123');

    const validDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'TRY',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it('allows USD currency', async () => {
    vi.mocked(appwriteApi.appwriteDonations.create).mockResolvedValue('donation-123');

    const validDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'USD',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it('allows EUR currency', async () => {
    vi.mocked(appwriteApi.appwriteDonations.create).mockResolvedValue('donation-123');

    const validDonation = {
      donor_name: 'Test Donor',
      amount: 1000,
      currency: 'EUR',
      kumbara_location: 'Test Location',
      kumbara_institution: 'Test Institution',
      collection_date: '2024-01-01T00:00:00Z',
    };

    const request = new NextRequest('http://localhost/api/kumbara', {
      method: 'POST',
      body: JSON.stringify(validDonation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
  });
});
