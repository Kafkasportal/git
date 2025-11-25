/**
 * Error Tracking API Routes
 * POST /api/errors - Create or update error record (requires auth to prevent spam)
 * GET /api/errors - List errors with filters (requires auth and admin permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteErrors } from '@/lib/appwrite/api';
import { createLogger } from '@/lib/logger';
import { createErrorNotification } from '@/lib/error-notifications';
import { z } from 'zod';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';

const logger = createLogger('api:errors');

// Validation schema for creating errors
const createErrorSchema = z.object({
  error_code: z.string(),
  title: z.string().min(1).max(500),
  description: z.string(),
  category: z.enum([
    'runtime',
    'ui_ux',
    'design_bug',
    'system',
    'data',
    'security',
    'performance',
    'integration',
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  stack_trace: z.string().optional(),
  error_context: z.any().optional(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  device_info: z.any().optional(),
  url: z.string().optional(),
  component: z.string().optional(),
  function_name: z.string().optional(),
  reporter_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.any().optional(),
  fingerprint: z.string().optional(),
  sentry_event_id: z.string().optional(),
});

/**
 * POST /api/errors
 * Create a new error record
 * Requires authentication - prevents error tracking spam/abuse
 *
 * SECURITY: Without auth, anyone could flood error logs with fake errors
 */
async function postErrorHandler(request: NextRequest) {
  try {
    // Require authentication to prevent error log spam
    await requireAuthenticatedUser();

    const body = await request.json();

    // Validate request body
    const validationResult = createErrorSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    logger.info('Creating error record', {
      error_code: data.error_code,
      category: data.category,
      severity: data.severity,
    });

    // Create error using unified backend
    // Create error using Appwrite
    const result = await appwriteErrors.create({
      ...data,
      user_id: data.user_id || undefined,
      reporter_id: data.reporter_id || undefined,
      occurrence_count: 1,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
    const typedResult = result as { $id?: string; id?: string };
    const errorId = typedResult.$id || typedResult.id || '';

    // Send notification for critical/high severity errors
    if (data.severity === 'critical' || data.severity === 'high') {
      logger.warn('High severity error detected', {
        errorId,
        severity: data.severity,
        title: data.title,
      });

      // Create notification
      await createErrorNotification({
        errorId: errorId as string,
        errorCode: data.error_code,
        title: data.title,
        severity: data.severity,
        category: data.category,
        component: data.component,
        url: data.url,
      }).catch((err) => {
        logger.error('Failed to create error notification', err);
      });
    }

    logger.info('Error record created successfully', { errorId });

    return NextResponse.json({
      success: true,
      data: { errorId },
      message: 'Error recorded successfully',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to create error record', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create error record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/errors
 * List errors with filters
 * Requires authentication and admin permissions
 *
 * SECURITY CRITICAL: Error logs contain sensitive system information
 */
async function getErrorsHandler(request: NextRequest) {
  try {
    // Require authentication - error logs are sensitive
    const { user } = await requireAuthenticatedUser();

    // Only admins/developers can view error logs
    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Hata kayıtlarını görüntülemek için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters with type validation
    const statusParam = searchParams.get('status');
    const severityParam = searchParams.get('severity');
    const categoryParam = searchParams.get('category');
    const assigned_to = searchParams.get('assigned_to');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');

    // Validate and type-cast status
    const validStatuses = [
      'new',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'reopened',
    ] as const;
    type ValidStatus = (typeof validStatuses)[number];
    const status =
      statusParam && validStatuses.includes(statusParam as ValidStatus)
        ? (statusParam as ValidStatus)
        : undefined;

    // Validate and type-cast severity
    const validSeverities = ['critical', 'high', 'medium', 'low'] as const;
    type ValidSeverity = (typeof validSeverities)[number];
    const severity =
      severityParam && validSeverities.includes(severityParam as ValidSeverity)
        ? (severityParam as ValidSeverity)
        : undefined;

    // Validate and type-cast category
    const validCategories = [
      'runtime',
      'ui_ux',
      'design_bug',
      'system',
      'data',
      'security',
      'performance',
      'integration',
    ] as const;
    type ValidCategory = (typeof validCategories)[number];
    const category =
      categoryParam && validCategories.includes(categoryParam as ValidCategory)
        ? (categoryParam as ValidCategory)
        : undefined;

    logger.info('Listing errors', {
      status,
      severity,
      category,
      limit,
    });

    // Fetch errors using unified backend
    // Fetch errors using Appwrite
    const params: Record<string, unknown> = {};
    if (status) params.status = status;
    if (severity) params.severity = severity;
    if (category) params.category = category;
    if (assigned_to) params.assigned_to = assigned_to;
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;
    if (limit) params.limit = parseInt(limit, 10);
    if (skip) params.skip = parseInt(skip, 10);

    const response = await appwriteErrors.list({ filters: params });
    const result = response.documents || [];

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to list errors', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list errors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
// POST uses aggressive rate limiting to prevent error log spam
export const POST = dataModificationRateLimit(postErrorHandler);
export const GET = readOnlyRateLimit(getErrorsHandler);
