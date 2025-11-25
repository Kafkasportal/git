/**
 * Error Statistics and Trends API
 * GET /api/errors/stats - Get error statistics (requires auth and admin permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteErrors } from '@/lib/appwrite/api';
import { createLogger } from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';
import { ErrorSeverity } from '@/lib/errors/AppError';

const logger = createLogger('api:errors:stats');

/**
 * GET /api/errors/stats
 * Get error statistics
 * Requires authentication and admin permissions
 *
 * SECURITY CRITICAL: Error statistics contain sensitive system information
 */
async function getErrorStatsHandler(request: NextRequest) {
  try {
    // Require authentication - error stats are sensitive system data
    const { user } = await requireAuthenticatedUser();

    // Only admins can view error statistics
    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hata istatistiklerini görüntülemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    logger.info('Fetching error statistics', { start_date, end_date });

    // Calculate stats from errors collection using Appwrite
    const allErrors = await appwriteErrors.list({
      filters: {
        ...(start_date ? { first_seen: { gte: start_date } } : {}),
        ...(end_date ? { last_seen: { lte: end_date } } : {}),
      },
    });

    // Type guard for error objects
    interface ErrorRecord {
      severity?: string;
      category?: string;
      status?: string;
      occurrence_count?: number;
    }

    const errors = (allErrors.documents || []) as ErrorRecord[];

    // Calculate statistics
    const stats = {
      total: errors.length,
      by_severity: {
        critical: errors.filter((e) => e.severity === ErrorSeverity.CRITICAL).length,
        high: errors.filter((e) => e.severity === ErrorSeverity.HIGH).length,
        medium: errors.filter((e) => e.severity === ErrorSeverity.MEDIUM).length,
        low: errors.filter((e) => e.severity === ErrorSeverity.LOW).length,
      },
      by_category: errors.reduce((acc: Record<string, number>, e) => {
        const category = e.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      by_status: errors.reduce((acc: Record<string, number>, e) => {
        const status = e.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      total_occurrences: errors.reduce((sum: number, e) => sum + (e.occurrence_count || 1), 0),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to fetch error statistics', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch error statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export handler with rate limiting
export const GET = readOnlyRateLimit(getErrorStatsHandler);
