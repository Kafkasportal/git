import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { checkDuplicates, checkTcNoDuplicate } from '@/lib/beneficiary/duplicate-detection';
import { z } from 'zod';

// Validation schema
const duplicateCheckSchema = z.object({
  tc_no: z.string().length(11).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  excludeId: z.string().optional(),
});

const tcCheckSchema = z.object({
  tc_no: z.string().length(11, 'TC Kimlik No 11 haneli olmalıdır'),
  excludeId: z.string().optional(),
});

/**
 * POST /api/beneficiaries/check-duplicate
 * Mükerrer kayıt kontrolü yapar
 */
export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 50, windowMs: 60000 },
})(async (request: NextRequest) => {
  await requireAuthenticatedUser();

  const { data, error } = await parseBody(request);

  if (error) {
    return errorResponse(error, 400);
  }

  // Hangi tip kontrol yapılacağını belirle
  const url = new URL(request.url);
  const checkType = url.searchParams.get('type') || 'full';

  try {
    if (checkType === 'tc_only') {
      // Sadece TC Kimlik kontrolü
      const validation = tcCheckSchema.safeParse(data);
      if (!validation.success) {
        return errorResponse(validation.error.issues[0].message, 400);
      }

      const result = await checkTcNoDuplicate(
        validation.data.tc_no,
        validation.data.excludeId
      );

      return successResponse(result);
    }

    // Tam mükerrer kontrolü
    const validation = duplicateCheckSchema.safeParse(data);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    // En az bir alan gerekli
    const { tc_no, firstName, lastName, phone, address } = validation.data;
    if (!tc_no && !firstName && !lastName && !phone && !address) {
      return errorResponse('En az bir kontrol alanı gereklidir', 400);
    }

    const result = await checkDuplicates(validation.data);

    return successResponse(result, result.hasDuplicates ? 'Olası mükerrer kayıt bulundu' : 'Mükerrer kayıt bulunamadı');
  } catch (_err) {
    return errorResponse('Mükerrer kontrol sırasında bir hata oluştu', 500);
  }
});
