import { NextRequest } from 'next/server';
import { appwriteMeetings, normalizeQueryParams } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';

function validateMeeting(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
  normalizedData?: Record<string, unknown>;
} {
  const errors: string[] = [];
  if (!data.title || (typeof data.title === 'string' && data.title.trim().length < 3)) {
    errors.push('Toplantı başlığı en az 3 karakter olmalıdır');
  }
  if (!data.meeting_date) {
    errors.push('Toplantı tarihi zorunludur');
  }
  if (
    data.status &&
    !['scheduled', 'ongoing', 'completed', 'cancelled'].includes(data.status as string)
  ) {
    errors.push('Geçersiz durum');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const normalizedData = {
    ...data,
    status: (data.status as string) || 'scheduled',
  };

  return { isValid: true, errors: [], normalizedData };
}

/**
 * GET /api/meetings
 */
export const GET = buildApiRoute({
  requireModule: 'workflow',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);

  const response = await appwriteMeetings.list({
    ...params,
    organizer: searchParams.get('organizer') || undefined,
  });

  return successResponse(response.documents || []);
});

/**
 * POST /api/meetings
 */
export const POST = buildApiRoute({
  requireModule: 'workflow',
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

  const validation = validateMeeting(body);
  if (!validation.isValid || !validation.normalizedData) {
    return errorResponse('Doğrulama hatası', 400, validation.errors);
  }

  const meetingData = {
    title: validation.normalizedData.title as string,
    description: validation.normalizedData.description as string | undefined,
    meeting_date: validation.normalizedData.meeting_date as string,
    location: validation.normalizedData.location as string | undefined,
    organizer: validation.normalizedData.organizer as string,
    participants: (validation.normalizedData.participants as string[]) || [],
    status: (validation.normalizedData.status || 'scheduled') as
      | 'scheduled'
      | 'ongoing'
      | 'completed'
      | 'cancelled',
    meeting_type: (validation.normalizedData.meeting_type || 'general') as
      | 'general'
      | 'committee'
      | 'board'
      | 'other',
    agenda: validation.normalizedData.agenda as string | undefined,
    notes: validation.normalizedData.notes as string | undefined,
  };

  const response = await appwriteMeetings.create(meetingData);

  return successResponse(response, 'Toplantı başarıyla oluşturuldu', 201);
});
