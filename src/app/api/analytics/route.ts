import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';

/**
 * Analytics Event Tracking Endpoint
 *
 * POST /api/analytics - Track an event (requires auth to prevent abuse)
 * GET /api/analytics - Get analytics stats (requires auth and admin permission)
 */

/**
 * POST /api/analytics
 * Track analytics event
 * Requires authentication - prevents spam and abuse
 *
 * SECURITY: Without auth, anyone could flood analytics with fake events
 */
async function postAnalyticsHandler(request: NextRequest) {
  try {
    // Require authentication to prevent analytics spam/abuse
    await requireAuthenticatedUser();

    const body = await request.json();
    const { event, properties, userId, sessionId } = body;

    // Validation
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Log analytics event
    logger.info('Analytics event tracked', {
      service: 'analytics',
      event,
      properties: properties || {},
      userId: userId || 'anonymous',
      sessionId: sessionId || null,
      userAgent: request.headers.get('user-agent') || undefined,
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to:
    // 1. Store in Appwrite database
    // 2. Send to Google Analytics 4
    // 3. Send to Mixpanel/Amplitude
    // 4. Send to custom analytics service

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Analytics tracking failed', error, {
      service: 'analytics',
    });

    return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 });
  }
}

/**
 * GET /api/analytics
 * Get analytics statistics
 * Requires authentication and admin permissions
 *
 * SECURITY CRITICAL: Analytics data should only be accessible to admins
 */
async function getAnalyticsHandler(request: NextRequest) {
  try {
    // Require authentication - analytics data is sensitive
    const { user } = await requireAuthenticatedUser();

    // Only admins can view analytics data
    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Analitik verilerini görüntülemek için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // For now, return a placeholder response
    // In production, query from database
    return NextResponse.json({
      success: true,
      event: event || 'all',
      startDate,
      endDate,
      count: 0,
      uniqueUsers: 0,
      message: 'Analytics data retrieval - implement database query',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Analytics fetch failed', error, {
      service: 'analytics',
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
// POST uses aggressive rate limiting to prevent analytics spam
export const POST = dataModificationRateLimit(postAnalyticsHandler);
export const GET = readOnlyRateLimit(getAnalyticsHandler);
