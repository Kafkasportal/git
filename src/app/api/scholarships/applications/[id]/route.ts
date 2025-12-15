/**
 * Scholarship Application API Routes
 * GET /api/scholarships/applications/[id] - Get single scholarship application
 * PUT /api/scholarships/applications/[id] - Update scholarship application
 * DELETE /api/scholarships/applications/[id] - Delete scholarship application
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteScholarshipApplications } from '@/lib/appwrite/api';
import { createLogger } from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse, verifyCsrfToken } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';

const logger = createLogger('api:scholarships:applications:id');

// Next.js 16 route context type
type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

/**
 * GET /api/scholarships/applications/[id]
 * Get single scholarship application
 */
async function getApplicationHandler(
  _request: NextRequest,
  context?: RouteContext
): Promise<NextResponse> {
  try {
    await requireAuthenticatedUser();

    const params = await context?.params;
    const id = params?.id as string;
    const data = await appwriteScholarshipApplications.get(id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to get scholarship application', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scholarship application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scholarships/applications/[id]
 * Update scholarship application
 */
async function updateApplicationHandler(
  request: NextRequest,
  context?: RouteContext
): Promise<NextResponse> {
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();

    const params = await context?.params;
    const id = params?.id as string;
    const body = await request.json();

    const result = await appwriteScholarshipApplications.update(id, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Scholarship application updated successfully',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to update scholarship application', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update scholarship application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scholarships/applications/[id]
 * Delete scholarship application
 */
async function deleteApplicationHandler(
  request: NextRequest,
  context?: RouteContext
): Promise<NextResponse> {
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();

    const params = await context?.params;
    const id = params?.id as string;
    await appwriteScholarshipApplications.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Scholarship application deleted successfully',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to delete scholarship application', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete scholarship application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getApplicationHandler);
export const PUT = dataModificationRateLimit(updateApplicationHandler);
export const DELETE = dataModificationRateLimit(deleteApplicationHandler);
