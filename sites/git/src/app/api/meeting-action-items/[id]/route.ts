import { NextRequest, NextResponse } from 'next/server';
import { appwriteMeetingActionItems } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

type ActionStatus = 'beklemede' | 'devam' | 'hazir' | 'iptal';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess('workflow');

    const { id } = await params;
    const actionItem = await appwriteMeetingActionItems.get(id as string);
    if (!actionItem) {
      return NextResponse.json(
        { success: false, error: 'Toplantı görevi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: actionItem });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Get meeting action item error', _error, {
      endpoint: '/api/meeting-action-items/[id]',
      method: 'GET',
      id,
    });

    return NextResponse.json(
      { success: false, error: 'Toplantı görevi getirilemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: Record<string, unknown> | null = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    body = (await request.json()) as Record<string, unknown>;
    const { id } = await params;

    const response = await appwriteMeetingActionItems.update(id as string, body);

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Toplantı görevi güncellendi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Update meeting action item error', _error, {
      endpoint: '/api/meeting-action-items/[id]',
      method: 'PUT',
      id,
      payload: body,
    });

    return NextResponse.json(
      { success: false, error: 'Toplantı görevi güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: Record<string, unknown> | null = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    body = (await request.json()) as Record<string, unknown>;
    const { id } = await params;

    const status = body?.status as ActionStatus | undefined;
    const changed_by = body?.changed_by as string | undefined;

    if (!status || !['beklemede', 'devam', 'hazir', 'iptal'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Geçersiz durum' }, { status: 400 });
    }

    if (!changed_by) {
      return NextResponse.json(
        { success: false, error: 'Durum güncellemesi yapan kullanıcı belirtilmelidir' },
        { status: 400 }
      );
    }

    const response = await appwriteMeetingActionItems.updateStatus(id as string, {
      status,
      changed_by,
      note: body?.note as string | undefined,
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Görev durumu güncellendi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Update meeting action item status error', _error, {
      endpoint: '/api/meeting-action-items/[id]',
      method: 'PATCH',
      id,
      payload: body,
    });

    return NextResponse.json(
      { success: false, error: 'Görev durumu güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    const { id } = await params;
    await appwriteMeetingActionItems.remove(id as string);

    return NextResponse.json({
      success: true,
      message: 'Toplantı görevi silindi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Delete meeting action item error', _error, {
      endpoint: '/api/meeting-action-items/[id]',
      method: 'DELETE',
      id,
    });

    return NextResponse.json(
      { success: false, error: 'Toplantı görevi silinemedi' },
      { status: 500 }
    );
  }
}
