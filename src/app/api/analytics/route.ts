import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';
import { serverDatabases } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { ID, Query } from 'node-appwrite';

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
 */
async function postAnalyticsHandler(request: NextRequest) {
  try {
    // Require authentication to prevent analytics spam/abuse
    const { user } = await requireAuthenticatedUser();

    const body = await request.json();
    const { event, properties, userId, sessionId } = body;

    // Validation
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Log to console
    logger.info('Analytics event tracked', {
      service: 'analytics',
      event,
      userId: userId || user.id, // Changed from $id to id based on assumption, will verify
    });

    // Store in Appwrite
    if (serverDatabases) {
      await serverDatabases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.analyticsEvents,
        ID.unique(),
        {
          event,
          properties: JSON.stringify(properties || {}),
          user_id: userId || user.id, // Changed from $id to id
          session_id: sessionId || 'unknown',
          url: properties?.url || '',
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString(),
        }
      );
    }

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

    if (!serverDatabases) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Fetch recent events for aggregation
    const events = await serverDatabases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.analyticsEvents,
      [Query.limit(limit), Query.orderDesc('$createdAt')]
    );

    // Simple in-memory aggregation
    const totalEvents = events.total;
    const uniqueUsers = new Set(events.documents.map((doc) => doc.user_id)).size;

    // Group by event type
    const eventCounts: Record<string, number> = {};
    events.documents.forEach((doc) => {
      eventCounts[doc.event] = (eventCounts[doc.event] || 0) + 1;
    });

    // Group by page (from properties or url)
    const pageViews: Record<string, number> = {};
    events.documents.forEach((doc) => {
      if (doc.event === 'page_view') {
        const url = doc.url || 'unknown';
        pageViews[url] = (pageViews[url] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      totalEvents,
      uniqueUsers,
      eventCounts,
      pageViews,
      recentEvents: events.documents.slice(0, 50), // Return last 50 for table
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
