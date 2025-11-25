import { NextRequest, NextResponse } from 'next/server';
import { appwriteMeetings } from '@/lib/appwrite/api';
import { extractParams } from '@/lib/api/route-helpers';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

function validateMeetingUpdate(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (data.title && typeof data.title === 'string' && data.title.trim().length < 3) {
    errors.push('Toplantı başlığı en az 3 karakter olmalıdır');
  }
  if (
    data.status &&
    !['scheduled', 'ongoing', 'completed', 'cancelled'].includes(data.status as string)
  ) {
    errors.push('Geçersiz durum');
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * GET /api/meetings/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await extractParams(params);
  try {
    await requireModuleAccess('workflow');

    const meeting = await appwriteMeetings.get(id);

    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Toplantı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: meeting,
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Get meeting error', _error, {
      endpoint: '/api/meetings/[id]',
      method: 'GET',
      meetingId: id,
    });
    return NextResponse.json({ success: false, _error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * PUT /api/meetings/[id]
 */
async function updateMeetingHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    const body = (await request.json()) as Record<string, unknown>;

    const validation = validateMeetingUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const meetingData: Parameters<typeof appwriteMeetings.update>[1] = {
      title: body.title as string | undefined,
      description: body.description as string | undefined,
      meeting_date: body.meeting_date as string | undefined,
      location: body.location as string | undefined,
      participants: body.participants as string[] | undefined,
      status: body.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | undefined,
      agenda: body.agenda as string | undefined,
      notes: body.notes as string | undefined,
    };

    const updated = await appwriteMeetings.update(id, meetingData);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Toplantı başarıyla güncellendi',
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Update meeting error', _error, {
      endpoint: '/api/meetings/[id]',
      method: request.method,
      meetingId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ success: false, _error: 'Toplantı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, _error: 'Güncelleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/[id]
 */
async function deleteMeetingHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await extractParams(params);
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    await appwriteMeetings.remove(id);

    return NextResponse.json({
      success: true,
      message: 'Toplantı başarıyla silindi',
    });
  } catch (_error) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Delete meeting error', _error, {
      endpoint: '/api/meetings/[id]',
      method: request.method,
      meetingId: id,
    });

    const errorMessage = _error instanceof Error ? _error.message : '';
    if (errorMessage?.includes('not found')) {
      return NextResponse.json({ success: false, _error: 'Toplantı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: false, _error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}

export const PUT = updateMeetingHandler;
export const DELETE = deleteMeetingHandler;
