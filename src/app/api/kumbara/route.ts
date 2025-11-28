import { NextRequest, NextResponse } from 'next/server';
import { appwriteDonations } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import QRCode from 'qrcode';
import type { DonationDocument } from '@/types/database';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

// Type for QR data
interface QRData {
  type: string;
  id: string;
  location: string;
  institution: string;
  collection_date: string;
  scan_url: string;
  coordinates?: { lat: number; lng: number };
  address?: string;
}

// Type for validation result
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedData?: Partial<DonationDocument>;
}

/**
 * Generate QR code for kumbara donation
 */
async function generateKumbaraQR(data: {
  id: string;
  location: string;
  institution: string;
  collection_date: string;
  location_coordinates?: { lat: number; lng: number } | null;
  location_address?: string;
}): Promise<string> {
  const qrData: QRData = {
    type: 'KUMBARA',
    id: data.id,
    location: data.location,
    institution: data.institution,
    collection_date: data.collection_date,
    scan_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bagis/kumbara/${data.id}`,
  };

  // Add location data if available
  if (data.location_coordinates) {
    qrData.coordinates = data.location_coordinates;
  }
  if (data.location_address) {
    qrData.address = data.location_address;
  }

  const qrString = JSON.stringify(qrData);
  return await QRCode.toDataURL(qrString, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Validate kumbara donation payload
 */
function validateKumbaraDonation(data: Partial<DonationDocument>): ValidationResult {
  const errors: string[] = [];

  // Validate basic donation fields
  if (!data.donor_name || data.donor_name.trim().length < 2) {
    errors.push('Bağışçı adı en az 2 karakter olmalıdır');
  }
  if (data.amount === undefined || data.amount === null || Number(data.amount) <= 0) {
    errors.push('Bağış tutarı pozitif olmalıdır');
  }
  if (!data.currency || !['TRY', 'USD', 'EUR'].includes(data.currency)) {
    errors.push('Geçersiz para birimi');
  }

  // Validate kumbara-specific fields
  if (!data.kumbara_location || data.kumbara_location.trim().length < 2) {
    errors.push('Kumbara lokasyonu en az 2 karakter olmalıdır');
  }
  if (!data.kumbara_institution || data.kumbara_institution.trim().length < 2) {
    errors.push('Kumbara kurum/adres bilgisi gereklidir');
  }
  if (!data.collection_date) {
    errors.push('Toplama tarihi gereklidir');
  }

  // Validate map location data (optional but recommended)
  if (data.location_coordinates) {
    if (
      typeof data.location_coordinates.lat !== 'number' ||
      typeof data.location_coordinates.lng !== 'number' ||
      isNaN(data.location_coordinates.lat) ||
      isNaN(data.location_coordinates.lng)
    ) {
      errors.push('Geçersiz koordinat bilgisi');
    }
  }

  // Validate route points (optional)
  if (data.route_points && Array.isArray(data.route_points)) {
    for (const point of data.route_points) {
      if (
        typeof point.lat !== 'number' ||
        typeof point.lng !== 'number' ||
        isNaN(point.lat) ||
        isNaN(point.lng)
      ) {
        errors.push('Geçersiz rota noktası koordinatı');
        break;
      }
    }
  }

  // Validate route metrics (optional)
  if (
    data.route_distance !== undefined &&
    (typeof data.route_distance !== 'number' || data.route_distance < 0)
  ) {
    errors.push('Rota mesafesi pozitif bir sayı olmalıdır');
  }
  if (
    data.route_duration !== undefined &&
    (typeof data.route_duration !== 'number' || data.route_duration < 0)
  ) {
    errors.push('Rota süresi pozitif bir sayı olmalıdır');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Normalize data with kumbara defaults
  const normalizedData = {
    ...data,
    status: (data.status as 'pending' | 'completed' | 'cancelled') || 'pending',
    is_kumbara: true, // Always true for kumbara donations
    donation_type: data.donation_type || 'Kumbara',
    donation_purpose: data.donation_purpose || 'Kumbara Bağışı',
    // Kumbara-specific fields - ensure they are included
    kumbara_location: data.kumbara_location || '',
    kumbara_institution: data.kumbara_institution || '',
    collection_date: data.collection_date || '',
    // Map and route data
    location_coordinates: data.location_coordinates || null,
    location_address: data.location_address || '',
    route_points: data.route_points || [],
    route_distance: data.route_distance || null,
    route_duration: data.route_duration || null,
  } as Partial<DonationDocument>;

  return { isValid: true, errors: [], normalizedData };
}

/**
 * GET /api/kumbara
 * List kumbara donations
 */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess('donations');

    const { searchParams } = new URL(request.url);
    const {
      location,
      status,
      currency,
      startDate,
      endDate,
      page = '1',
      limit = '20',
      search,
    } = Object.fromEntries(searchParams.entries());

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Fetch donations - only kumbara donations
    const result = await appwriteDonations.list({
      is_kumbara: true, // Only fetch kumbara donations
      limit: limitNum,
      skip: offset,
    });

    // Filter by search and additional filters if provided
    let filteredData = result.documents;

    // Apply client-side filters
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        (donation) =>
          (donation as unknown as DonationDocument).donor_name
            ?.toLowerCase()
            .includes(searchLower) ||
          (donation as unknown as DonationDocument).kumbara_location
            ?.toLowerCase()
            .includes(searchLower) ||
          (donation as unknown as DonationDocument).kumbara_institution
            ?.toLowerCase()
            .includes(searchLower) ||
          (donation as unknown as DonationDocument).receipt_number
            ?.toLowerCase()
            .includes(searchLower)
      );
    }

    if (location && location !== 'all') {
      filteredData = filteredData.filter(
        (d) => (d as unknown as DonationDocument).kumbara_location === location
      );
    }

    if (status && status !== 'all') {
      filteredData = filteredData.filter(
        (d) => (d as unknown as DonationDocument).status === status
      );
    }

    if (currency && currency !== 'all') {
      filteredData = filteredData.filter(
        (d) => (d as unknown as DonationDocument).currency === currency
      );
    }

    // Date range filtering
    if (startDate || endDate) {
      filteredData = filteredData.filter((d) => {
        const collectionDate = (d as unknown as DonationDocument).collection_date;
        if (!collectionDate) return false;
        const date = new Date(collectionDate);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      });
    }

    logger.info('Fetched kumbara donations', {
      count: filteredData.length,
      location: location || 'all',
      status: status || 'all',
    });

    return NextResponse.json({
      success: true,
      donations: filteredData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error fetching kumbara donations', _error);
    return NextResponse.json(
      { success: false, error: 'Kumbara bağışları getirilemedi' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kumbara/stats
 * Get kumbara statistics
 */
export async function GET_STATS(request: NextRequest) {
  try {
    await requireModuleAccess('donations');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    // Fetch all kumbara donations for stats calculation
    const result = await appwriteDonations.list({
      is_kumbara: true, // Only fetch kumbara donations
      limit: 10000, // Get all records for stats
    });

    const donations = result.documents as Array<Record<string, unknown>>;

    if (type === 'monthly') {
      // Calculate monthly stats for charts
      const monthlyStats = calculateMonthlyStats(donations);
      return NextResponse.json(monthlyStats);
    }

    if (type === 'location') {
      // Calculate location-based stats
      const locationStats = calculateLocationStats(donations);
      return NextResponse.json(locationStats);
    }

    if (type === 'payment') {
      // Calculate payment method stats
      const paymentStats = calculatePaymentStats(donations);
      return NextResponse.json(paymentStats);
    }

    // Default overview stats
    const stats = calculateOverviewStats(donations);
    return NextResponse.json(stats);
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error fetching kumbara stats', _error);
    return NextResponse.json(
      { success: false, error: 'İstatistikler getirilemedi' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overview statistics
 */
function calculateOverviewStats(donations: Array<Record<string, unknown>>) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const total_kumbara = donations.length;
  const total_amount = donations.reduce((sum, d) => sum + ((d.amount as number) || 0), 0);

  // Active locations (unique locations)
  const uniqueLocations = new Set(
    donations.map((d) => d.kumbara_location as string).filter(Boolean)
  );
  const active_locations = uniqueLocations.size;

  // This month stats
  const thisMonthDonations = donations.filter((d) => {
    const date = new Date((d.collection_date as string) || '');
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const this_month_amount = thisMonthDonations.reduce(
    (sum, d) => sum + ((d.amount as number) || 0),
    0
  );

  // Last month for comparison
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthDonations = donations.filter((d) => {
    const date = new Date((d.collection_date as string) || '');
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });
  const last_month_amount = lastMonthDonations.reduce(
    (sum, d) => sum + ((d.amount as number) || 0),
    0
  );

  const monthly_growth =
    last_month_amount > 0 ? ((this_month_amount - last_month_amount) / last_month_amount) * 100 : 0;

  // Collection status
  const pending_collections = donations.filter((d) => d.status === 'pending').length;
  const completed_collections = donations.filter((d) => d.status === 'completed').length;

  return {
    total_kumbara,
    total_amount,
    active_locations,
    this_month_amount,
    monthly_growth,
    pending_collections,
    completed_collections,
  };
}

/**
 * Calculate monthly statistics for charts
 */
function calculateMonthlyStats(donations: Array<Record<string, unknown>>) {
  const now = new Date();
  const months: { month: string; amount: number; count: number }[] = [];

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });

    const monthDonations = donations.filter((d) => {
      const donationDate = new Date((d.collection_date as string) || '');
      return (
        donationDate.getMonth() === date.getMonth() &&
        donationDate.getFullYear() === date.getFullYear()
      );
    });

    const amount = monthDonations.reduce((sum, d) => sum + ((d.amount as number) || 0), 0);
    const count = monthDonations.length;

    months.push({
      month: monthName,
      amount,
      count,
    });
  }

  return months;
}

/**
 * Calculate location-based statistics
 */
function calculateLocationStats(donations: Array<Record<string, unknown>>) {
  const locationMap = new Map<string, { amount: number; count: number }>();

  donations.forEach((d) => {
    const location = (d.kumbara_location as string) || 'Bilinmeyen';
    const current = locationMap.get(location) || { amount: 0, count: 0 };
    current.amount += (d.amount as number) || 0;
    current.count += 1;
    locationMap.set(location, current);
  });

  return Array.from(locationMap.entries()).map(([location, data]) => ({
    location,
    amount: data.amount,
    count: data.count,
  }));
}

/**
 * Calculate payment method statistics
 */
function calculatePaymentStats(donations: Array<Record<string, unknown>>) {
  const paymentMap = new Map<string, { value: number; count: number }>();

  donations.forEach((d) => {
    const method = (d.payment_method as string) || 'Bilinmeyen';
    const current = paymentMap.get(method) || { value: 0, count: 0 };
    current.value += (d.amount as number) || 0;
    current.count += 1;
    paymentMap.set(method, current);
  });

  return Array.from(paymentMap.entries()).map(([method, data]) => ({
    method,
    value: data.value,
    count: data.count,
  }));
}

/**
 * POST /api/kumbara
 * Create new kumbara donation
 */
export async function POST(request: NextRequest) {
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('donations');

    const body = (await request.json()) as Partial<DonationDocument>;

    // Validate kumbara donation
    const validation = validateKumbaraDonation(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doğrulama hatası',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create donation in Appwrite
    const donationId = (await appwriteDonations.create((validation.normalizedData || {}) as any)) as string;

    // Generate QR code for the kumbara
    const qrCode = await generateKumbaraQR({
      id: donationId,
      location: body.kumbara_location || '',
      institution: body.kumbara_institution || '',
      collection_date: body.collection_date || '',
      location_coordinates: body.location_coordinates || null,
      location_address: body.location_address || '',
    });

    logger.info('Created kumbara donation', {
      donationId,
      amount: body.amount,
      location: body.kumbara_location,
      institution: body.kumbara_institution,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: donationId,
          qr_code: qrCode,
        },
        message: 'Kumbara bağışı başarıyla kaydedildi ve QR kod oluşturuldu',
      },
      { status: 201 }
    );
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error creating kumbara donation', _error);
    return NextResponse.json(
      { success: false, error: 'Kumbara bağışı oluşturulamadı' },
      { status: 500 }
    );
  }
}
