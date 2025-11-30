import { NextRequest } from 'next/server';
import { appwriteBeneficiaries } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';
import { z } from 'zod';

/**
 * Request body schema for bulk delete
 */
const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'En az bir ID gerekli'),
});

/**
 * POST /api/beneficiaries/bulk-delete
 * Delete multiple beneficiaries in bulk
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
  const validationResult = bulkDeleteSchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse('Geçersiz istek verisi', 400, validationResult.error.issues.map((e) => e.message));
  }

  const { ids } = validationResult.data;

  logger.info('Bulk delete beneficiaries', { count: ids.length, ids: ids.slice(0, 5) }); // Log first 5 IDs for debugging

  // Delete all beneficiaries in parallel
  const deleteResults = await Promise.allSettled(
    ids.map(id => appwriteBeneficiaries.remove(id))
  );

  // Track successful and failed deletions
  const deleted: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  deleteResults.forEach((result, index) => {
    const id = ids[index];
    if (result.status === 'fulfilled') {
      deleted.push(id);
    } else {
      const errorMessage = result.reason instanceof Error ? result.reason.message : 'Bilinmeyen hata';
      failed.push({ id, error: errorMessage });
      logger.error('Failed to delete beneficiary', { beneficiaryId: id, error: result.reason });
    }
  });

  // Log results
  logger.info('Bulk delete completed', {
    total: ids.length,
    deleted: deleted.length,
    failed: failed.length,
  });

  // If all deletions failed, return error
  if (deleted.length === 0) {
    return errorResponse(
      'Hiçbir ihtiyaç sahibi silinemedi',
      500,
      failed.map(f => `${f.id}: ${f.error}`)
    );
  }

  // Return partial success response
  return successResponse({
    success: true,
    deleted: deleted.length,
    failed: failed.length,
    errors: failed.length > 0 ? failed.map(f => `${f.id}: ${f.error}`) : undefined,
  }, `${deleted.length} ihtiyaç sahibi başarıyla silindi${failed.length > 0 ? `, ${failed.length} ihtiyaç sahibi silinemedi` : ''}`);
});
