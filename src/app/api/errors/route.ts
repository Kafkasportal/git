/**
 * Error Tracking API Routes
 * POST /api/errors - Create or update error record (rate-limited, no auth required for client-side error tracking)
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
  description: z.string().default(''),
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
  user_id: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  device_info: z.any().optional(),
  url: z.string().optional(),
  component: z.string().optional(),
  function_name: z.string().optional(),
  reporter_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.any().optional(),
  fingerprint: z.string().optional(),
});

/**
 * POST /api/errors
 * Create a new error record
 * Authentication is optional - rate limiting prevents spam/abuse
 *
 * SECURITY: Rate limiting prevents flooding, no auth required for client-side error reporting
 */
async function postErrorHandler(request: NextRequest) {
  try {
    // Authentication is optional for error reporting
    // Client-side error tracking doesn't have auth tokens
    // Rate limiting (applied at export) prevents spam

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('Failed to parse error request body', { error: parseError });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validationResult = createErrorSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Error validation failed', {
        issues: validationResult.error.issues,
        receivedData: {
          error_code: body.error_code,
          title: body.title,
          description: body.description?.substring(0, 100),
          category: body.category,
          severity: body.severity,
        },
      });
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

    // Ensure message field is always present (required by Appwrite errors collection)
    // Use title first, then description, then fallback - ensure it's never empty
    const errorMessage = (data.title?.trim() || data.description?.trim() || 'Unknown error').substring(0, 500);
    if (!errorMessage || errorMessage.trim() === '') {
      logger.warn('Error message is empty, using fallback', { error_code: data.error_code });
    }
    
    const now = new Date().toISOString();
    
    // Prepare data for Appwrite - only include fields that exist in the collection schema
    // Required fields: message, title, status, severity, first_occurred, last_occurred, occurrence_count
    // Status must be one of: open, investigating, resolved, ignored
    // Note: Appwrite errors collection has a strict schema - only send recognized fields
    const appwriteData: Record<string, unknown> = {
      // Required fields (based on Appwrite schema)
      message: errorMessage || 'Unknown error',
      title: data.title,
      status: 'open', // Valid values: open, investigating, resolved, ignored
      severity: data.severity,
      first_occurred: now,
      last_occurred: now,
      occurrence_count: 1,
    };
    
    // Only add optional fields if they exist in the schema
    // Based on PATCH endpoint, these fields might be accepted: category, description, tags, user_id, etc.
    // But we'll be conservative and only add them if they don't cause errors
    
    let errorId: string;
    try {
      // Create error using Appwrite
      const result = await appwriteErrors.create(appwriteData);
      const typedResult = result as { $id?: string; id?: string };
      errorId = typedResult.$id || typedResult.id || '';
    } catch (appwriteError) {
      // If Appwrite is not configured, log the error but don't fail the request
      // This allows error tracking to work even when Appwrite is not set up
      const errorMsg = appwriteError instanceof Error ? appwriteError.message : 'Unknown error';
      if (errorMsg.includes('not initialized') || errorMsg.includes('not configured')) {
        logger.warn('Appwrite not configured - error logged to console only', {
          error_code: data.error_code,
          title: data.title,
          severity: data.severity,
        });
        // Return success with a mock ID to prevent client-side error loops
        errorId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      } else {
        // Re-throw other errors
        throw appwriteError;
      }
    }

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
    // Support both legacy UI statuses (new/assigned) and backend statuses (open/investigating/resolved/ignored)
    const validStatuses = [
      'new',
      'assigned',
      'open',
      'investigating',
      'resolved',
      'ignored',
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

    let result: unknown[] = [];
    try {
      const response = await appwriteErrors.list({ filters: params });
      result = response.documents || [];
    } catch (appwriteError) {
      const errorMsg = appwriteError instanceof Error ? appwriteError.message : 'Unknown error';
      if (errorMsg.includes('not initialized') || errorMsg.includes('not configured')) {
        logger.warn('Appwrite not configured - cannot list errors');
        return NextResponse.json(
          {
            success: false,
            error: 'Appwrite yapılandırması eksik. Lütfen yönetici ile iletişime geçin.',
            code: 'CONFIG_ERROR',
          },
          { status: 503 }
        );
      }
      throw appwriteError;
    }

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
// POST uses aggressive rate limiting to prevent error log spam (no auth required for client-side error tracking)
// GET requires authentication and admin permissions to view error logs
export const POST = dataModificationRateLimit(postErrorHandler);
export const GET = readOnlyRateLimit(getErrorsHandler);
