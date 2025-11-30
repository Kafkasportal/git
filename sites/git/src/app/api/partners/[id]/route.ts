import { NextRequest, NextResponse } from 'next/server';
import { appwritePartners } from '@/lib/appwrite/api';
import logger from '@/lib/logger';

interface PartnerData {
  name?: string;
  type?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  partnership_type?: string;
  collaboration_start_date?: string;
  collaboration_end_date?: string;
  notes?: string;
  status?: string;
  total_contribution?: number;
  contribution_count?: number;
  logo_url?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate partner data
 */
function validatePartnerData(data: PartnerData): ValidationResult {
  const errors: string[] = [];

  // Required fields (for updates, all are optional except those that are provided)
  if (data.name && data.name.trim().length < 2) {
    errors.push('Partner adı en az 2 karakter olmalıdır');
  }

  if (data.type && !['organization', 'individual', 'sponsor'].includes(data.type)) {
    errors.push('Geçersiz partner türü');
  }

  if (
    data.partnership_type &&
    !['donor', 'supplier', 'volunteer', 'sponsor', 'service_provider'].includes(
      data.partnership_type
    )
  ) {
    errors.push('Geçersiz işbirliği türü');
  }

  // Email validation (optional but if provided must be valid)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Geçerli bir email adresi giriniz');
  }

  // Phone validation (optional but if provided must be valid)
  if (data.phone && !/^[0-9\s\-\+\(\)]{10,15}$/.test(data.phone)) {
    errors.push('Geçerli bir telefon numarası giriniz');
  }

  // Status validation
  if (data.status && !['active', 'inactive', 'pending'].includes(data.status)) {
    errors.push('Geçersiz durum değeri');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * GET /api/partners/[id]
 * Get single partner by ID
 */
async function getPartnerHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = await appwritePartners.get(id);

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Partner bulundu',
    });
  } catch (_error: unknown) {
    logger.error('Get partner error', _error, {
      endpoint: `/api/partners/${(await params).id}`,
      method: 'GET',
    });

    return NextResponse.json(
      { success: false, error: 'Partner getirme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/partners/[id]
 * Update partner by ID
 */
async function updatePartnerHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: PartnerData | null = null;
  try {
    body = (await request.json()) as PartnerData;

    // Validate input
    if (!body) {
      return NextResponse.json({ success: false, error: 'Veri bulunamadı' }, { status: 400 });
    }

    // Validate partner data
    const validation = validatePartnerData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined)
      updateData.type = body.type as 'organization' | 'individual' | 'sponsor';
    if (body.contact_person !== undefined) updateData.contact_person = body.contact_person;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.tax_number !== undefined) updateData.tax_number = body.tax_number;
    if (body.partnership_type !== undefined)
      updateData.partnership_type = body.partnership_type as
        | 'donor'
        | 'supplier'
        | 'volunteer'
        | 'sponsor'
        | 'service_provider';
    if (body.collaboration_start_date !== undefined)
      updateData.collaboration_start_date = body.collaboration_start_date;
    if (body.collaboration_end_date !== undefined)
      updateData.collaboration_end_date = body.collaboration_end_date;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined)
      updateData.status = body.status as 'active' | 'inactive' | 'pending';
    if (body.total_contribution !== undefined)
      updateData.total_contribution = body.total_contribution;
    if (body.contribution_count !== undefined)
      updateData.contribution_count = body.contribution_count;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;

    const response = await appwritePartners.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Partner başarıyla güncellendi',
    });
  } catch (_error: unknown) {
    logger.error('Update partner error', _error, {
      endpoint: `/api/partners/${(await params).id}`,
      method: 'PUT',
      partnerName: body?.name,
    });

    return NextResponse.json(
      { success: false, error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partners/[id]
 * Delete partner by ID
 */
async function deletePartnerHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if partner exists
    const partner = await appwritePartners.get(id);
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner bulunamadı' }, { status: 404 });
    }

    await appwritePartners.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Partner başarıyla silindi',
    });
  } catch (_error: unknown) {
    logger.error('Delete partner error', _error, {
      endpoint: `/api/partners/${(await params).id}`,
      method: 'DELETE',
    });

    return NextResponse.json({ success: false, error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

// Export handlers
export const GET = getPartnerHandler;
export const PUT = updatePartnerHandler;
export const DELETE = deletePartnerHandler;
