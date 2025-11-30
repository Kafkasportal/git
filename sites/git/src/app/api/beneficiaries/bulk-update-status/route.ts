import { NextRequest } from 'next/server';
import { appwriteBeneficiaries } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';
import { z } from 'zod';

/**
 * Request body schema for bulk status update
 */
const bulkStatusUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'En az bir ID gerekli'),
  status: z.enum(['TASLAK', 'AKTIF', 'PASIF', 'SILINDI']),
});

/**
 * POST /api/beneficiaries/bulk-update-status
 * Update status of multiple beneficiaries in bulk
 */
export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 20, windowMs: 60000 },
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { data: body, error: parseError } = await parseBody<unknown>(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  // Validate request body
  const validationResult = bulkStatusUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse('Geçersiz istek verisi', 400, validationResult.error.issues.map((e) => e.message));
  }

  const { ids, status } = validationResult.data;

  logger.info('Bulk update beneficiary status', { count: ids.length, status, ids: ids.slice(0, 5) }); // Log first 5 IDs

  // Update all beneficiaries in parallel
  const updateResults = await Promise.allSettled(
    ids.map(id => appwriteBeneficiaries.update(id, { status }))
  );

  // Track successful and failed updates
  const updated: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  updateResults.forEach((result, index) => {
    const id = ids[index];
    if (result.status === 'fulfilled') {
      updated.push(id);
    } else {
      const errorMessage = result.reason instanceof Error ? result.reason.message : 'Bilinmeyen hata';
      failed.push({ id, error: errorMessage });
      logger.error('Failed to update beneficiary status', { beneficiaryId: id, status, error: result.reason });
    }
  });

  // Log results
  logger.info('Bulk status update completed', {
    total: ids.length,
    updated: updated.length,
    failed: failed.length,
    status,
  });

  // If all updates failed, return error
  if (updated.length === 0) {
    return errorResponse(
      'Hiçbir ihtiyaç sahibi durumu güncellenemedi',
      500,
      failed.map(f => `${f.id}: ${f.error}`)
    );
  }

  // Return partial success response
  const statusLabel = status === 'AKTIF' ? 'Aktif' : status === 'PASIF' ? 'Pasif' : status === 'TASLAK' ? 'Taslak' : 'Silindi';
  return successResponse({
    success: true,
    updated: updated.length,
    failed: failed.length,
  }, `${updated.length} ihtiyaç sahibi ${statusLabel} olarak güncellendi${failed.length > 0 ? `, ${failed.length} ihtiyaç sahibi güncellenemedi` : ''}`);
});
