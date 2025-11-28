import { NextRequest, NextResponse } from 'next/server';
import { getServerDatabases } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';
import logger from '@/lib/logger';
import { requireModuleAccess, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';
import { createCachedResponse, CACHE_CONFIGS } from '@/lib/http-cache';

// Define strict types for finance records
interface FinanceRecord {
  amount?: number;
  record_type?: 'income' | 'expense';
  transaction_date?: string;
  category?: string;
  [key: string]: unknown;
}

interface MonthlyTrend {
  date: string; // YYYY-MM format
  income: number;
  expense: number;
}

interface CategoryBreakdown {
  income: Record<string, number>;
  expense: Record<string, number>;
}

interface MonthlyResponse {
  success: boolean;
  data: {
    trends: MonthlyTrend[];
    categories: CategoryBreakdown;
  };
}

/**
 * Optimized monthly breakdown endpoint
 * Returns monthly trends and category breakdowns
 */
async function getFinancialMonthlyHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Require authentication and finance module access
    await requireModuleAccess('finance');

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const paymentMethod = searchParams.get('payment_method');

    const databases = getServerDatabases();
    const collectionId = appwriteConfig.collections.financeRecords;
    const databaseId = appwriteConfig.databaseId;

    // Build optimized queries - only fetch necessary fields
    const queries: string[] = [
      Query.select(['amount', 'record_type', 'transaction_date', 'category']), // Only needed fields
      Query.limit(10000), // Higher limit for accurate trends
    ];

    if (from) {
      queries.push(Query.greaterThanEqual('transaction_date', from));
    }
    if (to) {
      queries.push(Query.lessThanEqual('transaction_date', to));
    }
    if (paymentMethod) {
      queries.push(Query.equal('payment_method', paymentMethod));
    }

    // Fetch documents with optimized query
    const response = await databases.listDocuments(databaseId, collectionId, queries);

    const documents = response.documents as unknown as FinanceRecord[];

    // Aggregate monthly trends
    const monthlyStats: Record<string, { income: number; expense: number }> = {};

    // Aggregate categories
    const categoryStats: CategoryBreakdown = {
      income: {},
      expense: {},
    };

    documents.forEach((doc) => {
      const amount = doc.amount || 0;
      const type = doc.record_type;
      const dateStr = doc.transaction_date;
      if (!dateStr) return;

      const date = new Date(dateStr);
      // Format YYYY-MM
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = doc.category || 'Diğer';

      // Monthly trends
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { income: 0, expense: 0 };
      }

      if (type === 'income') {
        monthlyStats[monthKey].income += amount;
        // Category breakdown for income
        if (!categoryStats.income[category]) {
          categoryStats.income[category] = 0;
        }
        categoryStats.income[category] += amount;
      } else if (type === 'expense') {
        monthlyStats[monthKey].expense += amount;
        // Category breakdown for expense
        if (!categoryStats.expense[category]) {
          categoryStats.expense[category] = 0;
        }
        categoryStats.expense[category] += amount;
      }
    });

    // Format trends for response (sorted by date)
    const trends: MonthlyTrend[] = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        income: stats.income,
        expense: stats.expense,
      }));

    const monthlyData: MonthlyResponse = {
      success: true,
      data: {
        trends,
        categories: categoryStats,
      },
    };

    // Return cached response (5 minutes cache for monthly data)
    return createCachedResponse(monthlyData, {
      ...CACHE_CONFIGS.PUBLIC_STANDARD,
      maxAge: 5 * 60 * 1000, // 5 minutes
    }) as NextResponse<MonthlyResponse>;
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to fetch financial monthly data', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Aylık finansal veriler alınamadı.',
        data: { trends: [], categories: { income: {}, expense: {} } },
      },
      { status: 500 }
    ) as NextResponse<MonthlyResponse>;
  }
}

export const GET = readOnlyRateLimit(getFinancialMonthlyHandler);
