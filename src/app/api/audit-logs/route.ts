import { NextRequest, NextResponse } from 'next/server';
import { appwriteAuditLogs, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireAuthenticatedUser, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/audit-logs
 * Retrieve audit logs for compliance
 * Requires authentication and admin permissions (CRITICAL - compliance data)
 */
async function getAuditLogsHandler(request: NextRequest) {
  try {
    // Require authentication - audit logs are CRITICAL compliance data
    const { user } = await requireAuthenticatedUser();

    // Only admins and users with audit:view permission can access audit logs
    const isAdmin =
      user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
    const hasAuditPermission = user.permissions.includes('audit:view');

    if (!isAdmin && !hasAuditPermission) {
      return NextResponse.json(
        { success: false, error: 'Denetim kayıtlarını görüntülemek için yetkiniz yok' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get audit logs using Appwrite
    const params = normalizeQueryParams(searchParams);
    const filters: Record<string, unknown> = {};
    
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (limit) params.limit = limit;

    const response = await appwriteAuditLogs.list({
      ...params,
      filters,
    });

    const logs = response.documents || [];

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Audit logs fetch error', error, {
      endpoint: '/api/audit-logs',
      method: 'GET',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Denetim kayıtları alınamadı',
      },
      { status: 500 }
    );
  }
}

// Export handler with rate limiting
export const GET = readOnlyRateLimit(getAuditLogsHandler);
