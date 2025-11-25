import { NextRequest, NextResponse } from 'next/server';
import { appwriteUsers } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/users/batch
 * Get multiple users by IDs (for n8n workflows and batch operations)
 * Requires authentication - prevents unauthorized user data access
 * Body: { user_ids: string[] }
 *
 * SECURITY CRITICAL: Batch user data retrieval without auth = mass PII data leak
 */
async function batchGetUsersHandler(request: NextRequest) {
  try {
    // Require authentication - prevent unauthorized batch user data access
    const { user } = await requireAuthenticatedUser();

    // Only users with users:manage permission can batch fetch user data
    if (!user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'user_ids array is required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (user_ids.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 users can be fetched at once' },
        { status: 400 }
      );
    }

    // Fetch users in parallel
    const userPromises = user_ids.map((id: string) =>
      appwriteUsers.get(id).catch(() => null)
    );

    const users = await Promise.all(userPromises);
    const validUsers = users.filter((user) => user !== null);

    return NextResponse.json({
      success: true,
      data: validUsers,
      total: validUsers.length,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Batch get users error', error, {
      endpoint: '/api/users/batch',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export handler with rate limiting (use readOnly since this is a data retrieval operation)
export const POST = readOnlyRateLimit(batchGetUsersHandler);
