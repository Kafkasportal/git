import { NextRequest, NextResponse } from 'next/server';
import { appwriteAidApplications } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { extractParams } from '@/lib/api/route-helpers';

function validateApplicationUpdate(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (
    data.stage &&
    !['draft', 'under_review', 'approved', 'ongoing', 'completed'].includes(data.stage as string)
  ) {
    errors.push('Geçersiz aşama');
  }
  if (data.status && !['open', 'closed'].includes(data.status as string)) {
    errors.push('Geçersiz durum');
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * GET /api/aid-applications/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);
  try {
    const application = await appwriteAidApplications.get(id);

    if (!application) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (_error) {
    logger.error('Get aid application error', _error, {
      endpoint: '/api/aid-applications/[id]',
      method: 'GET',
      applicationId: id,
    });
    return NextResponse.json({ success: false, _error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * PATCH /api/aid-applications/[id]
 */
async function _updateApplicationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const validation = validateApplicationUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const applicationData = {
      stage: body.stage as
        | 'draft'
        | 'under_review'
        | 'approved'
        | 'ongoing'
        | 'completed'
        | undefined,
      status: body.status as 'open' | 'closed' | undefined,
      priority: body.priority as 'low' | 'normal' | 'high' | 'urgent' | undefined,
      one_time_aid: body.one_time_aid as number | undefined,
      regular_financial_aid: body.regular_financial_aid as number | undefined,
      regular_food_aid: body.regular_food_aid as number | undefined,
      in_kind_aid: body.in_kind_aid as number | undefined,
      service_referral: body.service_referral as number | undefined,
      description: body.description as string | undefined,
      notes: body.notes as string | undefined,
      processed_by: body.processed_by as string | undefined,
      processed_at: body.processed_at as string | undefined,
      approved_by: body.approved_by as string | undefined,
      approved_at: body.approved_at as string | undefined,
      completed_at: body.completed_at as string | undefined,
    };

    const updated = await appwriteAidApplications.update(
      id,
      applicationData
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Başvuru başarıyla güncellendi',
    });
  } catch (_error) {
    logger.error('Update aid application error', _error, {
      endpoint: '/api/aid-applications/[id]',
      method: 'PATCH',
      applicationId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/aid-applications/[id]
 */
async function _deleteApplicationHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await appwriteAidApplications.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Başvuru başarıyla silindi',
    });
  } catch (_error) {
    logger.error('Delete aid application error', _error, {
      endpoint: '/api/aid-applications/[id]',
      method: 'DELETE',
      applicationId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

export const PATCH = _updateApplicationHandler;
export const DELETE = _deleteApplicationHandler;
