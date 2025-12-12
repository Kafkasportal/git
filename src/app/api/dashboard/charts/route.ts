import { NextRequest } from 'next/server';
import { appwriteDonations, appwriteAidApplications } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/route-helpers';
import logger from '@/lib/logger';
import type { DonationDocument } from '@/types/database';

/**
 * GET /api/dashboard/charts
 * Get aggregated chart data for dashboard
 * Returns donation trends and category distribution
 */
export const GET = buildApiRoute({
  requireModule: 'dashboard',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (_request: NextRequest) => {
  try {
    // Fetch donations for trend analysis
    const donationsResponse = await appwriteDonations.list({
      limit: 10000, // Get all donations for accurate aggregation
    });

    const donations = donationsResponse.documents || [];

    // Aggregate donation trends by month (last 6 months)
    const monthlyData = new Map<string, { amount: number; beneficiaries: Set<string>; month: string }>();
    const now = new Date();
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[date.getMonth()];
      monthlyData.set(monthKey, { amount: 0, beneficiaries: new Set(), month: monthLabel });
    }

    // Aggregate donations by month
    (donations as unknown as DonationDocument[]).forEach((donation) => {
      if (donation.status === 'completed') {
        const createdDate = new Date(donation.$createdAt || donation._creationTime || Date.now());
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey)!;
          data.amount += donation.amount || 0;
          // Track unique donors as proxy for beneficiaries
          if (donation.donor_name) {
            data.beneficiaries.add(donation.donor_name);
          }
        }
      }
    });

    // Convert to array format for charts
    const donationTrend = Array.from(monthlyData.values()).map((data) => ({
      month: data.month,
      amount: Math.round(data.amount),
      beneficiaries: data.beneficiaries.size,
    }));

    // Aggregate category data from aid applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let categoryData: unknown[] = [];

    try {
      const aidApplicationsResponse = await appwriteAidApplications.list({
        limit: 10000,
      });

      const aidApplications = aidApplicationsResponse.documents || [];
      const categoryMap = new Map<string, number>();

      // Count aid applications by purpose
      aidApplications.forEach((app) => {
        const purpose = app.aid_purpose || app.application_type || 'Diğer';
        categoryMap.set(purpose, (categoryMap.get(purpose) || 0) + 1);
      });

      // If we have aid application data, use it
      if (categoryMap.size > 0) {
        const total = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0080', '#8dd1e1'];
        let colorIndex = 0;

        categoryData = Array.from(categoryMap.entries())
          .map(([name, count]) => ({
            name,
            value: Math.round((count / total) * 100),
            color: colors[colorIndex++ % colors.length],
          }))
          .sort((a, b) => b.value - a.value);
      } else {
        // Fallback: Aggregate by donation purpose
        const purposeMap = new Map<string, number>();

        (donations as unknown as DonationDocument[]).forEach((donation) => {
          if (donation.status === 'completed') {
            const purpose = donation.donation_purpose || 'Diğer';
            purposeMap.set(purpose, (purposeMap.get(purpose) || 0) + 1);
          }
        });

        if (purposeMap.size > 0) {
          const total = Array.from(purposeMap.values()).reduce((a, b) => a + b, 0);
          const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0080', '#8dd1e1'];
          let colorIndex = 0;

          categoryData = Array.from(purposeMap.entries())
            .map(([name, count]) => ({
              name,
              value: Math.round((count / total) * 100),
              color: colors[colorIndex++ % colors.length],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 categories
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch aid applications for category data', { error });
      // Continue with empty category data or fallback to donations
    }

    // If no category data available, provide default structure
    if (categoryData.length === 0) {
      categoryData = [
        { name: 'Genel Bağış', value: 100, color: '#8884d8' },
      ];
    }

    return successResponse({
      donationTrend,
      categoryData,
    }, 'Chart data fetched successfully');
  } catch (error) {
    logger.error('Failed to fetch chart data', { error });
    return errorResponse('Failed to fetch chart data', 500);
  }
});
