import { NextRequest, NextResponse } from 'next/server';
import { appwriteDonations } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireModuleAccess, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/kumbara/stats
 * Get kumbara statistics
 * Requires authentication and donations module access
 */
async function getKumbaraStatsHandler(request: NextRequest) {
  try {
    await requireModuleAccess('donations');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    // Fetch all kumbara donations for stats calculation
    const result = await appwriteDonations.list({
      is_kumbara: true, // Only fetch kumbara donations
      limit: 10000, // Get all records for stats
    });

    const donations = result.documents as Record<string, unknown>[];

    if (type === 'monthly') {
      // Calculate monthly stats for charts
      const monthlyStats = calculateMonthlyStats(donations);
      return NextResponse.json({
        success: true,
        data: monthlyStats,
      });
    }

    if (type === 'location') {
      // Calculate location-based stats
      const locationStats = calculateLocationStats(donations);
      return NextResponse.json({
        success: true,
        data: locationStats,
      });
    }

    if (type === 'payment') {
      // Calculate payment method stats
      const paymentStats = calculatePaymentStats(donations);
      return NextResponse.json({
        success: true,
        data: paymentStats,
      });
    }

    // Default overview stats
    const stats = calculateOverviewStats(donations);
    return NextResponse.json({
      success: true,
      data: stats,
    });
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

// Export handler with rate limiting
export const GET = readOnlyRateLimit(getKumbaraStatsHandler);


