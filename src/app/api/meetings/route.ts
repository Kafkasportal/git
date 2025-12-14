import { NextRequest } from 'next/server';
import { appwriteMeetings, normalizeQueryParams } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import {
  meetingApiCreateSchema,
  validateWithSchema,
} from '@/lib/validations/api-schemas';

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

  // Validate using centralized schema
  const validation = validateWithSchema(meetingApiCreateSchema, body);
  if (!validation.isValid || !validation.data) {
    return errorResponse('Doğrulama hatası', 400, validation.errors);
  }

  const validatedData = validation.data;

  const meetingData = {
    title: validatedData.title,
    description: validatedData.description,
    meeting_date: validatedData.meeting_date,
    location: validatedData.location,
    organizer: validatedData.organizer || '',
    participants: validatedData.participants,
    status: validatedData.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
    meeting_type: validatedData.meeting_type as 'general' | 'committee' | 'board' | 'other',
    agenda: validatedData.agenda,
    notes: validatedData.notes,
  };

  const response = await appwriteMeetings.create(meetingData);

  return successResponse(response, 'Toplantı başarıyla oluşturuldu', 201);
});
