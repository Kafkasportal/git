import { NextRequest, NextResponse } from 'next/server';
import { appwriteMessages, normalizeQueryParams } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import { buildErrorResponse, verifyCsrfToken, requireModuleAccess } from '@/lib/api/auth-utils';

function validateMessage(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
  normalizedData?: Record<string, unknown>;
} {
  const errors: string[] = [];
  if (!data.message_type || !['sms', 'email', 'internal'].includes(data.message_type as string)) {
    errors.push('Geçersiz mesaj türü');
  }
  if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
    errors.push('En az bir alıcı seçilmelidir');
  }
  if (!data.content || (typeof data.content === 'string' && data.content.trim().length < 3)) {
    errors.push('İçerik en az 3 karakter olmalıdır');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const normalizedData = {
    ...data,
    status: (data.status as string) || 'draft',
  };

  return { isValid: true, errors: [], normalizedData };
}

/**
 * GET /api/messages
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);
  let currentUserId: string | undefined;
  try {
    const { user } = await requireModuleAccess('messages');

    currentUserId = user.id;
    const authenticatedUserId = user.id;
    const tab = searchParams.get('tab');
    const canViewAllMessages = user.permissions.includes('users:manage');

    const parseUserIdParam = (value: string | null): string | undefined =>
      value && value.length > 0 ? value : undefined;

    const requestedSender = parseUserIdParam(searchParams.get('sender'));
    const requestedRecipient = parseUserIdParam(searchParams.get('recipient'));

    if (
      !canViewAllMessages &&
      ((requestedSender && requestedSender !== authenticatedUserId) ||
        (requestedRecipient && requestedRecipient !== authenticatedUserId))
    ) {
      return NextResponse.json(
        { success: false, error: 'Bu kayıtlara erişim yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    let response;

    if (tab === 'inbox') {
      // Inbox: messages where current user is recipient
      response = await appwriteMessages.list({
        ...params,
        recipient: authenticatedUserId,
        message_type: 'internal',
      });
    } else if (tab === 'sent') {
      // Sent: messages where current user is sender
      response = await appwriteMessages.list({
        ...params,
        sender: authenticatedUserId,
        message_type: 'internal',
      });
    } else if (tab === 'drafts') {
      // Drafts: draft messages where current user is sender
      response = await appwriteMessages.list({
        ...params,
        sender: authenticatedUserId,
        status: 'draft',
        message_type: 'internal',
      });
    } else {
      // Default: use provided filters
      const senderFilter = canViewAllMessages ? requestedSender : authenticatedUserId;
      const recipientFilter = canViewAllMessages ? requestedRecipient : undefined;

      response = await appwriteMessages.list({
        ...params,
        sender: senderFilter,
        recipient: recipientFilter,
        message_type: searchParams.get('message_type') as 'sms' | 'email' | 'internal' | undefined,
      });
    }

    return NextResponse.json({
      success: true,
      data: response.documents || [],
      total: response.total || 0,
    });
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('List messages error', _error, {
      endpoint: '/api/messages',
      method: 'GET',
      params,
      userId: currentUserId,
      tab: searchParams.get('tab'),
    });
    return NextResponse.json({ success: false, error: 'Veri alınamadı' }, { status: 500 });
  }
}

/**
 * POST /api/messages
 */
async function createMessageHandler(request: NextRequest) {
  let body: unknown = null;
  let currentUserId: string | undefined;
  try {
    await verifyCsrfToken(request);
    const { user } = await requireModuleAccess('messages');
    currentUserId = user.id;

    body = await request.json();
    const validation = validateMessage(body as Record<string, unknown>);
    if (!validation.isValid || !validation.normalizedData) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama hatası', details: validation.errors },
        { status: 400 }
      );
    }

    const messageData = {
      message_type: validation.normalizedData.message_type as 'sms' | 'email' | 'internal',
      sender: user.id,
      recipients: validation.normalizedData.recipients as string[],
      subject: validation.normalizedData.subject as string | undefined,
      content: validation.normalizedData.content as string,
      status: (validation.normalizedData.status || 'draft') as 'draft' | 'sent' | 'failed',
      is_bulk: (validation.normalizedData.is_bulk as boolean) || false,
      template_id: validation.normalizedData.template_id as string | undefined,
    };

    if (messageData.is_bulk && !user.permissions.includes('users:manage')) {
      return NextResponse.json(
        { success: false, error: 'Toplu mesaj göndermek için yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    const response = await appwriteMessages.create(messageData as any);

    return NextResponse.json(
      { success: true, data: response, message: 'Mesaj taslağı oluşturuldu' },
      { status: 201 }
    );
  } catch (_error: unknown) {
    const authError = buildErrorResponse(_error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Create message error', _error, {
      endpoint: '/api/messages',
      method: 'POST',
      messageType: (body as Record<string, unknown>)?.message_type,
      userId: currentUserId,
      recipientCount: Array.isArray((body as Record<string, unknown>)?.recipients)
        ? ((body as Record<string, unknown>)?.recipients as unknown[]).length
        : 0,
    });
    return NextResponse.json(
      { success: false, error: 'Oluşturma işlemi başarısız' },
      { status: 500 }
    );
  }
}

export const POST = createMessageHandler;
