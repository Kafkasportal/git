/**
 * POST /api/whatsapp/send-bulk
 * Send bulk WhatsApp messages to multiple recipients
 * Requires authentication and messages module access
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendBulkWhatsAppMessages } from '@/lib/services/whatsapp';
import { requireModuleAccess, verifyCsrfToken, buildErrorResponse } from '@/lib/api/auth-utils';
import { dataModificationRateLimit } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const bulkMessageSchema = z.object({
  recipients: z
    .array(z.string().min(10, 'Telefon numarası en az 10 karakter olmalı'))
    .min(1, 'En az bir alıcı belirtmelisiniz')
    .max(1000, 'Maksimum 1000 alıcıya aynı anda mesaj gönderebilirsiniz'),
  message: z.string().min(1, 'Mesaj boş olamaz').max(4096, 'Mesaj çok uzun (max 4096 karakter)'),
});

async function sendBulkWhatsAppHandler(request: NextRequest) {
  try {
    // Require authentication with messages module access
    const { user } = await requireModuleAccess('messages');

    // CSRF protection
    await verifyCsrfToken(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz istek',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { recipients, message } = validation.data;

    logger.info('Starting bulk WhatsApp messaging', {
      service: 'whatsapp',
      userId: user.id,
      recipientCount: recipients.length,
      messageLength: message.length,
    });

    // Send bulk messages with progress tracking
    const result = await sendBulkWhatsAppMessages(recipients, message);

    logger.info('Bulk WhatsApp messaging completed', {
      service: 'whatsapp',
      userId: user.id,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });

    return NextResponse.json({
      success: true,
      message: `${result.successful} mesaj başarıyla gönderildi, ${result.failed} mesaj başarısız`,
      data: result,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to send bulk WhatsApp messages', error, {
      service: 'whatsapp',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Toplu WhatsApp mesajı gönderilemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = dataModificationRateLimit(sendBulkWhatsAppHandler);
