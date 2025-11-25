import { NextRequest, NextResponse } from 'next/server';
import { appwriteWorkflowNotifications } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

type NotificationStatus = 'beklemede' | 'gonderildi' | 'okundu';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess('workflow');

    const { id } = await params;
    const notification = await appwriteWorkflowNotifications.get(id as string);
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Bildirim bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Get workflow notification error', _error, {
      endpoint: '/api/workflow-notifications/[id]',
      method: 'GET',
      id,
    });

    return NextResponse.json({ success: false, error: 'Bildirim getirilemedi' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: Record<string, unknown> | null = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    body = (await request.json()) as Record<string, unknown>;
    const { id } = await params;

    const status = body.status as NotificationStatus | undefined;

    if (!status || !['gonderildi', 'okundu'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz bildirim durumu' },
        { status: 400 }
      );
    }

    let response;

    if (status === 'gonderildi') {
      response = await appwriteWorkflowNotifications.markAsSent(
        id as string,
        (body.sent_at as string | undefined) ?? undefined
      );
    } else if (status === 'okundu') {
      response = await appwriteWorkflowNotifications.markAsRead(
        id as string,
        (body.read_at as string | undefined) ?? undefined
      );
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Bildirim güncellendi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Update workflow notification error', _error, {
      endpoint: '/api/workflow-notifications/[id]',
      method: 'PATCH',
      id,
      payload: body,
    });

    return NextResponse.json({ success: false, error: 'Bildirim güncellenemedi' }, { status: 500 });
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
    await appwriteWorkflowNotifications.remove(id as string);

    return NextResponse.json({
      success: true,
      message: 'Bildirim silindi',
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    const { id } = await params;
    logger.error('Delete workflow notification error', _error, {
      endpoint: '/api/workflow-notifications/[id]',
      method: 'DELETE',
      id,
    });

    return NextResponse.json({ success: false, error: 'Bildirim silinemedi' }, { status: 500 });
  }
}
