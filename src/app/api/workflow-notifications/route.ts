import { NextRequest, NextResponse } from 'next/server';
import { appwriteWorkflowNotifications, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { verifyCsrfToken, buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';

type NotificationStatus = 'beklemede' | 'gonderildi' | 'okundu';
type NotificationCategory = 'meeting' | 'gorev' | 'rapor' | 'hatirlatma';

function validateNotification(data: Record<string, unknown>) {
  const errors: string[] = [];

  if (!data.recipient) {
    errors.push('Alıcı zorunludur');
  }

  if (!data.title || (typeof data.title === 'string' && data.title.trim().length < 3)) {
    errors.push('Bildirim başlığı en az 3 karakter olmalıdır');
  }

  if (
    data.category &&
    !['meeting', 'gorev', 'rapor', 'hatirlatma'].includes(data.category as string)
  ) {
    errors.push('Geçersiz bildirim kategorisi');
  }

  if (data.status && !['beklemede', 'gonderildi', 'okundu'].includes(data.status as string)) {
    errors.push('Geçersiz bildirim durumu');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess('workflow');

    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);

    const recipient = searchParams.get('recipient') || undefined;
    const status = searchParams.get('status') as NotificationStatus | undefined;
    const category = searchParams.get('category') as NotificationCategory | undefined;

    const response = await appwriteWorkflowNotifications.list({
      ...(params as Record<string, unknown>),
      recipient,
      status,
      category,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List workflow notifications error', _error, {
      endpoint: '/api/workflow-notifications',
      method: 'GET',
    });

    return NextResponse.json({ success: false, error: 'Bildirimler alınamadı' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    await verifyCsrfToken(request);
    await requireModuleAccess('workflow');

    body = (await request.json()) as Record<string, unknown>;

    const validation = validateNotification(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doğrulama hatası',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const response = await appwriteWorkflowNotifications.create({
      recipient: body.recipient as string,
      triggered_by: body.triggered_by as string | undefined,
      category: (body.category as NotificationCategory) ?? 'meeting',
      title: body.title as string,
      body: body.body as string | undefined,
      status: (body.status as NotificationStatus) ?? 'beklemede',
      reference: body.reference as
        | { type: 'meeting_action_item' | 'meeting' | 'meeting_decision'; id: string }
        | undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
      created_at: body.created_at as string | undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Bildirim oluşturuldu',
      },
      { status: 201 }
    );
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Create workflow notification error', _error, {
      endpoint: '/api/workflow-notifications',
      method: 'POST',
      payload: body,
    });

    return NextResponse.json({ success: false, error: 'Bildirim oluşturulamadı' }, { status: 500 });
  }
}
