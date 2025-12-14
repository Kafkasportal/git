/**
 * Scholarship Applications API Routes
 * GET /api/scholarships/applications - List scholarship applications
 * POST /api/scholarships/applications - Create new scholarship application
 */

import { NextRequest, NextResponse } from 'next/server';
import { appwriteScholarshipApplications } from '@/lib/appwrite/api';
import { createLogger } from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse, verifyCsrfToken } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';

const logger = createLogger('api:scholarships:applications');

/**
 * GET /api/scholarships/applications
 * List scholarship applications with filters
 */
async function getApplicationsHandler(request: NextRequest) {
  try {
    await requireAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');
    const scholarship_id = searchParams.get('scholarship_id');
    const status = searchParams.get('status');
    const tc_no = searchParams.get('tc_no');

    const params: {
      limit?: number;
      skip?: number;
      scholarship_id?: string;
      status?: string;
      tc_no?: string;
    } = {};

    if (limit) params.limit = parseInt(limit, 10);
    if (skip) params.skip = parseInt(skip, 10);
    if (scholarship_id) params.scholarship_id = scholarship_id;
    if (status) params.status = status;
    if (tc_no) params.tc_no = tc_no;

    const response = await appwriteScholarshipApplications.list(params);

    return NextResponse.json({
      success: true,
      data: response.documents,
      total: response.total,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to list scholarship applications', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list scholarship applications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scholarships/applications
 * Create a new scholarship application
 */
async function createApplicationHandler(request: NextRequest) {
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();

    const body = await request.json();

    const result = await appwriteScholarshipApplications.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Scholarship application created successfully',
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to create scholarship application', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create scholarship application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getApplicationsHandler);
export const POST = dataModificationRateLimit(createApplicationHandler);
