import { NextRequest, NextResponse } from 'next/server';

// Only import rate-limit-monitor at runtime to avoid build-time jsdom issues
// This prevents Next.js from trying to bundle jsdom during build
import type { RateLimitViolation } from '@/lib/rate-limit-monitor';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';

let RateLimitMonitor: typeof import('@/lib/rate-limit-monitor').RateLimitMonitor;

async function loadRateLimitMonitor() {
  if (!RateLimitMonitor) {
    const rateLimitModule = await import('@/lib/rate-limit-monitor');
    RateLimitMonitor = rateLimitModule.RateLimitMonitor;
  }
  return { RateLimitMonitor };
}

/**
 * GET /api/monitoring/rate-limit
 * Rate limit monitoring endpoint
 * Requires authentication and admin permissions
 *
 * Query Parameters:
 * - action: stats|violations|ip-stats|export|reset
 * - timeRange: 1h|24h|7d|30d (for stats and ip-stats)
 * - ip: IP address (for ip-stats)
 * - limit: number (for violations, default: 50)
 *
 * SECURITY CRITICAL: Rate limit monitoring data reveals system security patterns
 */
async function getMonitoringHandler(request: NextRequest) {
  try {
    // Require authentication - monitoring data is sensitive system information
    const { user } = await requireAuthenticatedUser();

    // Only admins can view rate limit monitoring data
    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit izleme verilerini görüntülemek için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const { RateLimitMonitor: Monitor } = await loadRateLimitMonitor();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeRange = (searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d') || '24h';
    const ip = searchParams.get('ip');
    switch (action) {
      case 'stats':
        const stats = Monitor.getStats(timeRange);
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });

      case 'violations':
        const limit = parseInt(searchParams.get('limit') || '50');
        const violations = Monitor.getRecentViolations(limit);
        return NextResponse.json({
          success: true,
          data: violations,
          count: violations.length,
          timestamp: new Date().toISOString(),
        });

      case 'ip-stats':
        if (!ip) {
          return NextResponse.json(
            {
              success: false,
              error: 'IP address required for ip-stats action',
              example: '/api/monitoring/rate-limit?action=ip-stats&ip=192.168.1.1',
            },
            { status: 400 }
          );
        }
        // IP stats için sadece 1h, 24h, 7d destekleniyor
        const ipTimeRange = ['1h', '24h', '7d'].includes(timeRange)
          ? (timeRange as '1h' | '24h' | '7d')
          : '24h';
        const ipStats = Monitor.getIPStats(ip, ipTimeRange);
        return NextResponse.json({
          success: true,
          data: {
            ip,
            stats: ipStats,
            timeRange: ipTimeRange,
          },
          timestamp: new Date().toISOString(),
        });

      case 'export':
        const exportData = Monitor.exportData();
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="rate-limit-export-${new Date().toISOString().split('T')[0]}.json"`,
          },
        });

      case 'reset':
        // Admin check already done at the beginning of the function
        Monitor.reset();
        return NextResponse.json({
          success: true,
          message: 'Rate limit monitoring data reset successfully',
          timestamp: new Date().toISOString(),
        });

      default:
        // Default action - return overview
        const overview = {
          stats: Monitor.getStats('24h'),
          recentViolations: Monitor.getRecentViolations(10),
          availableActions: [
            'stats - Get overall statistics',
            'violations - Get recent violations',
            'ip-stats - Get IP-specific statistics',
            'export - Export all monitoring data',
            'reset - Reset monitoring data (admin only)',
          ],
          example: '/api/monitoring/rate-limit?action=stats&timeRange=24h',
        };

        return NextResponse.json({
          success: true,
          data: overview,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process monitoring request',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/rate-limit
 * Additional monitoring actions
 * Requires authentication and admin permissions
 *
 * SECURITY CRITICAL: Recording violations and exporting data requires admin access
 */
async function postMonitoringHandler(request: NextRequest) {
  try {
    // Require authentication - prevent unauthorized monitoring actions
    const { user } = await requireAuthenticatedUser();

    // Only admins can perform monitoring actions
    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit izleme işlemleri için admin yetkisi gerekli',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record-violation':
        // Manuel violation kaydetme (test amaçlı)
        const { RateLimitMonitor: MonitorRecord } = await loadRateLimitMonitor();
        const violationData = data as Omit<RateLimitViolation, 'id' | 'timestamp'>;
        MonitorRecord.recordViolation(violationData);

        return NextResponse.json({
          success: true,
          message: 'Violation recorded successfully',
        });

      case 'bulk-export':
        // Toplu export
        const { RateLimitMonitor: MonitorExport } = await loadRateLimitMonitor();
        const exportData = MonitorExport.exportData();
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="bulk-rate-limit-data-${new Date().toISOString()}.json"`,
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid POST action',
            availableActions: ['record-violation', 'bulk-export'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process POST request',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getMonitoringHandler);
export const POST = dataModificationRateLimit(postMonitoringHandler);
