import { NextRequest, NextResponse } from 'next/server';
import { appwriteDonations } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireModuleAccess, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

// Type for donation document
interface DonationDocument {
  _id: string;
  _creationTime: number;
  amount: number;
  status?: string;
  payment_method?: string;
  donation_type?: string;
  donation_date?: string;
  donor_name?: string;
  [key: string]: unknown;
}

/**
 * GET /api/donations/stats
 * Get donation statistics
 * Requires authentication and donations module access
 *
 * SECURITY CRITICAL: Donation statistics contain sensitive financial data
 */
async function getDonationStatsHandler(request: NextRequest) {
  try {
    // Require authentication with donations module access
    // Donation statistics are sensitive financial information
    await requireModuleAccess('donations');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    // Fetch all donations for stats calculation
    const result = await appwriteDonations.list({
      limit: 10000, // Get all records for stats
    });

    const donations = result.documents as DonationDocument[];

    if (type === 'monthly') {
      // Calculate monthly stats for charts
      const monthlyStats = calculateMonthlyStats(donations);
      return NextResponse.json({
        success: true,
        data: monthlyStats,
      });
    }

    if (type === 'status') {
      // Calculate status-based stats
      const statusStats = calculateStatusStats(donations);
      return NextResponse.json({
        success: true,
        data: statusStats,
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
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Error fetching donation stats', error);
    return NextResponse.json(
      { success: false, error: 'İstatistikler getirilemedi' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overview statistics
 */
function calculateOverviewStats(donations: DonationDocument[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const total_donations = donations.length;
  const total_amount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  // This month stats
  const thisMonthDonations = donations.filter((d) => {
    const date = new Date(d._creationTime || '');
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const this_month_amount = thisMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Last month for comparison
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthDonations = donations.filter((d) => {
    const date = new Date(d._creationTime || '');
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });
  const last_month_amount = lastMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

  const monthly_growth =
    last_month_amount > 0 ? ((this_month_amount - last_month_amount) / last_month_amount) * 100 : 0;

  // Status breakdown
  const pending_donations = donations.filter((d) => d.status === 'pending').length;
  const completed_donations = donations.filter((d) => d.status === 'completed').length;
  const cancelled_donations = donations.filter((d) => d.status === 'cancelled').length;

  return {
    total_donations,
    total_amount,
    this_month_amount,
    monthly_growth,
    pending_donations,
    completed_donations,
    cancelled_donations,
  };
}

/**
 * Calculate monthly statistics for charts
 */
function calculateMonthlyStats(donations: DonationDocument[]) {
  const now = new Date();
  const months: { month: string; amount: number; count: number }[] = [];

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });

    const monthDonations = donations.filter((d) => {
      const donationDate = new Date(d._creationTime || '');
      return (
        donationDate.getMonth() === date.getMonth() &&
        donationDate.getFullYear() === date.getFullYear()
      );
    });

    const amount = monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
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
 * Calculate status-based statistics
 */
function calculateStatusStats(donations: DonationDocument[]) {
  const statusMap = new Map<string, { amount: number; count: number }>();

  donations.forEach((d) => {
    const status = d.status || 'pending';
    const current = statusMap.get(status) || { amount: 0, count: 0 };
    current.amount += d.amount || 0;
    current.count += 1;
    statusMap.set(status, current);
  });

  return Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    amount: data.amount,
    count: data.count,
  }));
}

/**
 * Calculate payment method statistics
 */
function calculatePaymentStats(donations: DonationDocument[]) {
  const paymentMap = new Map<string, { value: number; count: number }>();

  donations.forEach((d) => {
    const method = d.payment_method || 'Bilinmeyen';
    const current = paymentMap.get(method) || { value: 0, count: 0 };
    current.value += d.amount || 0;
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
export const GET = readOnlyRateLimit(getDonationStatsHandler);
