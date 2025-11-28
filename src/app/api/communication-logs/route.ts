import { NextRequest, NextResponse } from 'next/server';
import { appwriteCommunicationLogs, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireModuleAccess, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/communication-logs
 * Retrieve communication logs (email and SMS)
 * Requires authentication and messages module access
 *
 * SECURITY CRITICAL: Communication logs contain sensitive PII data (emails, phone numbers)
 * GDPR/KVKK Compliance: Must be protected with authentication
 */
async function getCommunicationLogsHandler(request: NextRequest) {
  try {
    // Require authentication with messages module access
    // Communication logs contain sensitive personal data (emails, phone numbers, message content)
    await requireModuleAccess('messages');

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'email' | 'sms' | 'whatsapp' | null;
    const status = searchParams.get('status') as 'sent' | 'failed' | 'pending' | null;
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get communication logs using Appwrite
    const params = normalizeQueryParams(searchParams);
    const filters: Record<string, unknown> = {};
    
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (limit) params.limit = limit;

    const response = await appwriteCommunicationLogs.list({
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

    logger.error('Communication logs fetch error', error, {
      endpoint: '/api/communication-logs',
      method: 'GET',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'İletişim kayıtları alınamadı',
      },
      { status: 500 }
    );
  }
}

// Export handler with rate limiting
export const GET = readOnlyRateLimit(getCommunicationLogsHandler);
