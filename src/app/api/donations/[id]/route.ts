import { NextRequest, NextResponse } from 'next/server';
import { appwriteDonations } from '@/lib/appwrite/api';
import { extractParams } from '@/lib/api/route-helpers';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';
import {
  donationApiUpdateSchema,
  validateWithSchema,
} from '@/lib/validations/api-schemas';

/**
 * GET /api/donations/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);

  // Handle special "stats" route - redirect to stats endpoint if it exists
  if (id === 'stats') {
    return NextResponse.json(
      { success: false, error: 'Stats endpoint için /api/donations/stats kullanın' },
      { status: 404 }
    );
  }

  try {
    await requireModuleAccess('donations');

    const donation = await appwriteDonations.get(id);

    if (!donation) {
      return NextResponse.json({ success: false, error: 'Bağış bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: donation,
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Get donation error', _error, {
      endpoint: '/api/donations/[id]',
      method: 'GET',
      donationId: id,
    });
    return NextResponse.json({ success: false, _error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * PUT /api/donations/[id]
 */
async function updateDonationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('donations');

    const body = (await request.json()) as Record<string, unknown>;

    // Validate using centralized schema
    const validation = validateWithSchema(donationApiUpdateSchema, body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const donationData: Parameters<typeof appwriteDonations.update>[1] = {
      status: body.status as 'pending' | 'completed' | 'cancelled' | undefined,
      amount: body.amount as number | undefined,
      notes: body.notes as string | undefined,
    };

    const updated = await appwriteDonations.update(id, donationData);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bağış başarıyla güncellendi',
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Update donation error', _error, {
      endpoint: '/api/donations/[id]',
      method: 'PUT',
      donationId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ success: false, _error: 'Bağış bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, _error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/donations/[id]
 */
async function deleteDonationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('donations');

    await appwriteDonations.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Bağış başarıyla silindi',
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Delete donation error', _error, {
      endpoint: '/api/donations/[id]',
      method: 'DELETE',
      donationId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json({ success: false, _error: 'Bağış bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, _error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

export const PUT = updateDonationHandler;
export const DELETE = deleteDonationHandler;
