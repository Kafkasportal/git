import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { checkDuplicates, checkTcNoDuplicate } from '@/lib/beneficiary/duplicate-detection';
import { z } from 'zod';

// Validation schemas
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

type DuplicateCheckData = z.infer<typeof duplicateCheckSchema>;

// Helper functions to reduce cyclomatic complexity
function hasRequiredFields(data: DuplicateCheckData): boolean {
  const { tc_no, firstName, lastName, phone, address } = data;
  return Boolean(tc_no || firstName || lastName || phone || address);
}

async function handleTcOnlyCheck(data: unknown) {
  const validation = tcCheckSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const result = await checkTcNoDuplicate(
    validation.data.tc_no,
    validation.data.excludeId
  );

  return { result };
}

async function handleFullDuplicateCheck(data: unknown) {
  const validation = duplicateCheckSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  if (!hasRequiredFields(validation.data)) {
    return { error: 'En az bir kontrol alanı gereklidir' };
  }

  const result = await checkDuplicates(validation.data);
  const message = result.hasDuplicates
    ? 'Olası mükerrer kayıt bulundu'
    : 'Mükerrer kayıt bulunamadı';

  return { result, message };
}

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

  const url = new URL(request.url);
  const checkType = url.searchParams.get('type') || 'full';

  try {
    if (checkType === 'tc_only') {
      const response = await handleTcOnlyCheck(data);
      if (response.error) {
        return errorResponse(response.error, 400);
      }
      return successResponse(response.result);
    }

    const response = await handleFullDuplicateCheck(data);
    if (response.error) {
      return errorResponse(response.error, 400);
    }
    return successResponse(response.result, response.message);
  } catch (_err) {
    return errorResponse('Mükerrer kontrol sırasında bir hata oluştu', 500);
  }
});
