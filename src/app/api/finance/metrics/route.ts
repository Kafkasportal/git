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
  [key: string]: unknown;
}

interface MetricsResponse {
  success: boolean;
  data: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    recordCount: number;
  };
}

/**
 * Optimized metrics endpoint - Returns only aggregated totals
 * Uses efficient querying with minimal data transfer
 */
async function getFinancialMetricsHandler(request: NextRequest): Promise<NextResponse> {
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
      Query.select(['amount', 'record_type']), // Only fetch fields we need
      Query.limit(10000), // Higher limit for accurate totals, but still bounded
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

    // Aggregate totals efficiently
    let totalIncome = 0;
    let totalExpenses = 0;

    documents.forEach((doc) => {
      const amount = doc.amount || 0;
      const type = doc.record_type;

      if (type === 'income') {
        totalIncome += amount;
      } else if (type === 'expense') {
        totalExpenses += amount;
      }
    });

    const netIncome = totalIncome - totalExpenses;
    const recordCount = documents.length;

    const metricsData: MetricsResponse = {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netIncome,
        recordCount,
      },
    };

    // Return cached response (5 minutes cache for metrics)
    return createCachedResponse(metricsData, {
      ...CACHE_CONFIGS.PUBLIC_STANDARD,
      maxAge: 5 * 60 * 1000, // 5 minutes
    }) as NextResponse<MetricsResponse>;
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to fetch financial metrics', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Finansal metrikler alınamadı.',
        data: { totalIncome: 0, totalExpenses: 0, netIncome: 0, recordCount: 0 },
      },
      { status: 500 }
    ) as NextResponse<MetricsResponse>;
  }
}

export const GET = readOnlyRateLimit(getFinancialMetricsHandler);
