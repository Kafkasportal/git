/**
 * POST /api/whatsapp/send
 * Send WhatsApp message to single or multiple recipients
 * Requires authentication and messages module access
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/services/whatsapp';
import { requireModuleAccess, verifyCsrfToken, buildErrorResponse } from '@/lib/api/auth-utils';
import { dataModificationRateLimit } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const sendMessageSchema = z.object({
  to: z.union([
    z.string().min(10, 'Telefon numarası en az 10 karakter olmalı'),
    z.array(z.string().min(10)).min(1, 'En az bir alıcı belirtmelisiniz'),
  ]),
  message: z.string().min(1, 'Mesaj boş olamaz').max(4096, 'Mesaj çok uzun (max 4096 karakter)'),
});

async function sendWhatsAppHandler(request: NextRequest) {
  try {
    // Require authentication with messages module access
    const { user } = await requireModuleAccess('messages');

    // CSRF protection
    await verifyCsrfToken(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

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

    const { to, message } = validation.data;

    // Send WhatsApp message
    const success = await sendWhatsAppMessage({
      to,
      message,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp mesajı gönderilemedi',
        },
        { status: 500 }
      );
    }

    logger.info('WhatsApp message sent via API', {
      service: 'whatsapp',
      userId: user.id,
      recipientCount: Array.isArray(to) ? to.length : 1,
      messageLength: message.length,
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp mesajı başarıyla gönderildi',
      recipientCount: Array.isArray(to) ? to.length : 1,
    });
  } catch (error) {
    const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error('Failed to send WhatsApp message', error, {
      service: 'whatsapp',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'WhatsApp mesajı gönderilemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = dataModificationRateLimit(sendWhatsAppHandler);
