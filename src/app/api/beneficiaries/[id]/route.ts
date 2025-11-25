import { NextRequest, NextResponse } from 'next/server';
import { appwriteBeneficiaries } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { BeneficiaryFormData } from '@/types/beneficiary';
import { extractParams } from '@/lib/api/route-helpers';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

/**
 * Validate beneficiary data for updates
 */
function validateBeneficiaryUpdate(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const beneficiaryData = data as Record<string, unknown>;

  // Optional fields validation (only if provided)
  if (
    beneficiaryData.name &&
    typeof beneficiaryData.name === 'string' &&
    beneficiaryData.name.trim().length < 2
  ) {
    errors.push('Ad Soyad en az 2 karakter olmalıdır');
  }

  if (
    beneficiaryData.tc_no &&
    typeof beneficiaryData.tc_no === 'string' &&
    !/^\d{11}$/.test(beneficiaryData.tc_no)
  ) {
    errors.push('TC Kimlik No 11 haneli olmalıdır');
  }

  if (
    beneficiaryData.phone &&
    typeof beneficiaryData.phone === 'string' &&
    !/^[0-9\s\-\+\(\)]{10,15}$/.test(beneficiaryData.phone)
  ) {
    errors.push('Geçerli bir telefon numarası giriniz');
  }

  if (
    beneficiaryData.address &&
    typeof beneficiaryData.address === 'string' &&
    beneficiaryData.address.trim().length < 10
  ) {
    errors.push('Adres en az 10 karakter olmalıdır');
  }

  if (
    beneficiaryData.email &&
    typeof beneficiaryData.email === 'string' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(beneficiaryData.email)
  ) {
    errors.push('Geçerli bir email adresi giriniz');
  }

  if (
    beneficiaryData.status &&
    typeof beneficiaryData.status === 'string' &&
    !['TASLAK', 'AKTIF', 'PASIF', 'SILINDI'].includes(beneficiaryData.status)
  ) {
    errors.push('Geçersiz durum değeri');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * GET /api/beneficiaries/[id]
 * Get beneficiary by ID
 */
async function getBeneficiaryHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);

  try {
    await requireModuleAccess('beneficiaries');

    const beneficiary = await appwriteBeneficiaries.get(id);

    if (!beneficiary) {
      return NextResponse.json(
        { success: false, error: 'İhtiyaç sahibi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: beneficiary,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Get beneficiary error', _error, {
      endpoint: '/api/beneficiaries/[id]',
      method: request.method,
      beneficiaryId: id,
    });

    return NextResponse.json({ success: false, error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * PUT /api/beneficiaries/[id]
 * Update beneficiary
 */
async function updateBeneficiaryHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);

  try {
    await verifyCsrfToken(request);
    const { user } = await requireModuleAccess('beneficiaries');

    const body = (await request.json()) as Partial<BeneficiaryFormData>;

    const validation = validateBeneficiaryUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const updated = await appwriteBeneficiaries.update(id, body, {
      auth: { userId: user.id, role: user.role ?? 'Personel' },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'İhtiyaç sahibi başarıyla güncellendi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Update beneficiary error', _error, {
      endpoint: '/api/beneficiaries/[id]',
      method: request.method,
      beneficiaryId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'İhtiyaç sahibi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/beneficiaries/[id]
 * Delete beneficiary
 */
async function deleteBeneficiaryHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);

  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('beneficiaries');

    await appwriteBeneficiaries.remove(id);

    return NextResponse.json({
      success: true,
      message: 'İhtiyaç sahibi başarıyla silindi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Delete beneficiary error', _error, {
      endpoint: '/api/beneficiaries/[id]',
      method: request.method,
      beneficiaryId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'İhtiyaç sahibi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

// Export handlers with CSRF protection for state-changing operations
export const GET = getBeneficiaryHandler;
export const PUT = updateBeneficiaryHandler;
export const DELETE = deleteBeneficiaryHandler;
