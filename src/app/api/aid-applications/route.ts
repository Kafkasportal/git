import { NextRequest, NextResponse } from 'next/server';
import { appwriteAidApplications, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { requireModuleAccess, verifyCsrfToken, buildErrorResponse } from '@/lib/api/auth-utils';
import { readOnlyRateLimit, dataModificationRateLimit } from '@/lib/rate-limit';

function validateApplication(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (
    !data.applicant_name ||
    (typeof data.applicant_name === 'string' && data.applicant_name.trim().length < 2)
  ) {
    errors.push('Başvuru sahibi adı zorunludur');
  }
  if (!data.application_date) {
    errors.push('Başvuru tarihi zorunludur');
  }
  if (
    !data.stage ||
    !['draft', 'under_review', 'approved', 'ongoing', 'completed'].includes(data.stage as string)
  ) {
    errors.push('Geçersiz aşama');
  }
  if (!data.status || !['open', 'closed'].includes(data.status as string)) {
    errors.push('Geçersiz durum');
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * GET /api/aid-applications
 * List aid applications
 * Requires authentication and beneficiaries module access
 *
 * SECURITY CRITICAL: Aid applications contain sensitive beneficiary data
 */
async function getAidApplicationsHandler(request: NextRequest) {
  try {
    // Require authentication with beneficiaries module access
    // Aid applications contain sensitive personal and financial data
    await requireModuleAccess('beneficiaries');

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const response = await appwriteAidApplications.list({
      ...params,
      stage: searchParams.get('stage') || undefined,
      beneficiary_id: searchParams.get('beneficiary_id') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: response.documents || [],
      total: response.total || 0,
    });
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List aid applications error', error, {
      endpoint: '/api/aid-applications',
      method: 'GET',
    });
    return NextResponse.json({ success: false, error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * POST /api/aid-applications
 * Create new aid application
 * Requires authentication, CSRF token, and beneficiaries module access
 *
 * SECURITY CRITICAL: Creating aid applications affects financial aid distribution
 */
async function createApplicationHandler(request: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    // Verify CSRF token
    await verifyCsrfToken(request);

    // Require authentication with beneficiaries module access
    await requireModuleAccess('beneficiaries');

    body = (await request.json()) as Record<string, unknown>;
    if (!body) {
      return NextResponse.json({ success: false, error: 'Geçersiz istek verisi' }, { status: 400 });
    }
    const validation = validateApplication(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const applicationData = {
      application_date: (body.application_date as string) || new Date().toISOString(),
      applicant_type: (body.applicant_type as 'person' | 'organization' | 'partner') || 'person',
      applicant_name: body.applicant_name as string,
      beneficiary_id: body.beneficiary_id as string | undefined,
      one_time_aid: body.one_time_aid as number | undefined,
      regular_financial_aid: body.regular_financial_aid as number | undefined,
      regular_food_aid: body.regular_food_aid as number | undefined,
      in_kind_aid: body.in_kind_aid as number | undefined,
      service_referral: body.service_referral as number | undefined,
      stage:
        (body.stage as 'draft' | 'under_review' | 'approved' | 'ongoing' | 'completed') || 'draft',
      status: (body.status as 'open' | 'closed') || 'open',
      description: body.description as string | undefined,
      notes: body.notes as string | undefined,
      priority: body.priority as 'low' | 'normal' | 'high' | 'urgent' | undefined,
    };

    const response = await appwriteAidApplications.create(applicationData);

    return NextResponse.json(
      { success: true, data: response, message: 'Başvuru oluşturuldu' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Create aid application error', error, {
      endpoint: '/api/aid-applications',
      method: 'POST',
      applicantName: body?.applicant_name,
      stage: body?.stage,
    });
    return NextResponse.json(
      { success: false, error: 'Oluşturma işlemi başarısız' },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const GET = readOnlyRateLimit(getAidApplicationsHandler);
export const POST = dataModificationRateLimit(createApplicationHandler);
