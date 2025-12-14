import { NextRequest } from 'next/server';
import { appwriteDonations, normalizeQueryParams } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';
import type { PaymentMethod } from '@/lib/api/types';
import {
  donationApiCreateSchema,
  validateWithSchema,
} from '@/lib/validations/api-schemas';

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

  // Validate using centralized schema
  const validation = validateWithSchema(donationApiCreateSchema, body);
  if (!validation.isValid || !validation.data) {
    return errorResponse('Doğrulama hatası', 400, validation.errors);
  }

  const validatedData = validation.data;

  // Validate required fields before sending to Appwrite
  const missingFields: string[] = [];
  if (!validatedData.donation_type?.trim()) {
    missingFields.push('Bağış türü');
  }
  if (!validatedData.donation_purpose?.trim()) {
    missingFields.push('Bağış amacı');
  }
  if (!validatedData.receipt_number?.trim()) {
    missingFields.push('Makbuz numarası');
  }
  
  if (missingFields.length > 0) {
    return errorResponse('Zorunlu alanlar eksik', 400, missingFields);
  }

  const donationData = {
    donor_name: validatedData.donor_name,
    donor_phone: validatedData.donor_phone || '',
    donor_email: validatedData.donor_email || undefined,
    amount: validatedData.amount,
    currency: validatedData.currency as 'TRY' | 'USD' | 'EUR',
    donation_type: validatedData.donation_type || '',
    payment_method: (validatedData.payment_method || 'cash') as PaymentMethod,
    donation_purpose: validatedData.donation_purpose || '',
    notes: validatedData.notes,
    receipt_number: validatedData.receipt_number || '',
    receipt_file_id: validatedData.receipt_file_id,
    status: validatedData.status as 'pending' | 'completed' | 'cancelled',
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
