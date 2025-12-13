import { NextRequest } from 'next/server';
import { appwriteDonations, normalizeQueryParams } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { sanitizePhone } from '@/lib/sanitization';
import { phoneSchema } from '@/lib/validations/shared-validators';
import logger from '@/lib/logger';
import type { DonationDocument, Document } from '@/types/database';
import type { PaymentMethod } from '@/lib/api/types';

/**
 * Validate donation payload
 */
function validateDonation(data: Partial<DonationDocument>): {
  isValid: boolean;
  errors: string[];
  normalizedData?: Omit<DonationDocument, keyof Document>;
} {
  const errors: string[] = [];

  if (!data.donor_name || data.donor_name.trim().length < 2) {
    errors.push('Bağışçı adı en az 2 karakter olmalıdır');
  }
  if (data.amount === undefined || data.amount === null || Number(data.amount) <= 0) {
    errors.push('Bağış tutarı pozitif olmalıdır');
  }
  if (!data.currency || !['TRY', 'USD', 'EUR'].includes(data.currency)) {
    errors.push('Geçersiz para birimi');
  }
  if (data.donor_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.donor_email)) {
    errors.push('Geçersiz e-posta');
  }
  if (Boolean(data.donor_phone)) {
    const sanitized = sanitizePhone(data.donor_phone);
    if (!sanitized || !phoneSchema.safeParse(sanitized).success) {
      errors.push('Geçersiz telefon numarası (5XXXXXXXXX formatında olmalıdır)');
    } else {
      data.donor_phone = sanitized; // Normalize edilmiş değeri kullan
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Normalize data with defaults
  const normalizedData = {
    ...data,
    status: (data.status as 'pending' | 'completed' | 'cancelled') || 'pending',
  } as Omit<DonationDocument, keyof Document>;

  return { isValid: true, errors: [], normalizedData };
}

/**
 * GET /api/donations
 * List donations
 */
export const GET = buildApiRoute({
  requireModule: 'donations',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);

  const response = await appwriteDonations.list({
    ...params,
    donor_email: searchParams.get('donor_email') || undefined,
  });

  return successResponse(response.documents || []);
});

/**
 * POST /api/donations
 * Create donation
 */
export const POST = buildApiRoute({
  requireModule: 'donations',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 50, windowMs: 60000 },
  supportOfflineSync: true,
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { data: body, error: parseError } = await parseBody<Record<string, unknown>>(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  const validation = validateDonation(body as Partial<DonationDocument>);
  if (!validation.isValid || !validation.normalizedData) {
    return errorResponse('Doğrulama hatası', 400, validation.errors);
  }

  // Validate required fields before sending to Appwrite
  const missingFields: string[] = [];
  if (!validation.normalizedData.donation_type?.trim()) {
    missingFields.push('Bağış türü');
  }
  if (!validation.normalizedData.donation_purpose?.trim()) {
    missingFields.push('Bağış amacı');
  }
  if (!validation.normalizedData.receipt_number?.trim()) {
    missingFields.push('Makbuz numarası');
  }
  
  if (missingFields.length > 0) {
    return errorResponse('Zorunlu alanlar eksik', 400, missingFields);
  }

  const donationData = {
    donor_name: validation.normalizedData.donor_name || '',
    donor_phone: validation.normalizedData.donor_phone || '',
    donor_email: validation.normalizedData.donor_email,
    amount: validation.normalizedData.amount || 0,
    currency: (validation.normalizedData.currency || 'TRY') as 'TRY' | 'USD' | 'EUR',
    donation_type: validation.normalizedData.donation_type || '',
    payment_method: (validation.normalizedData.payment_method || 'cash') as PaymentMethod,
    donation_purpose: validation.normalizedData.donation_purpose || '',
    notes: validation.normalizedData.notes,
    receipt_number: validation.normalizedData.receipt_number || '',
    receipt_file_id: validation.normalizedData.receipt_file_id,
    status: (validation.normalizedData.status || 'pending') as
      | 'pending'
      | 'completed'
      | 'cancelled',
  };

  try {
    const response = await appwriteDonations.create(donationData);
    return successResponse(response, 'Bağış başarıyla oluşturuldu', 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    // Log the detailed error for debugging
    logger.error('Donation create error', { error, donationData: { ...donationData, donor_phone: '***' } });
    
    // Return user-friendly error
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return errorResponse('Bu makbuz numarası zaten kullanılmış', 409);
    }
    return errorResponse(`Bağış kaydedilemedi: ${errorMessage}`, 500);
  }
});
