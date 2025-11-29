import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { requireAuthenticatedUser, verifyCsrfToken } from '@/lib/api/auth-utils';
import { sendEmail } from '@/lib/services/email';
import { sendSMS } from '@/lib/services/sms';
import logger from '@/lib/logger';
import { z } from 'zod';

/**
 * Test message schema
 */
const testMessageSchema = z.object({
  type: z.enum(['email', 'sms']),
  recipient: z.string().min(1, 'Alıcı bilgisi gerekli'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Mesaj gerekli'),
  template: z.string().optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/messages/test
 * Development-only endpoint for testing email/SMS sending
 */
export const POST = buildApiRoute({
  requireModule: 'messages',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 10, windowMs: 60000 },
})(async (request: NextRequest) => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('Bu endpoint sadece development ortamında kullanılabilir', 403);
  }

  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { data: body, error: parseError } = await parseBody(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  const validation = testMessageSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse('Geçersiz istek', 400, validation.error.issues.map((i) => i.message));
  }

  const { type, recipient, subject, message, template, templateData } = validation.data;

  logger.info('Test message sending', {
    service: 'messages',
    type,
    recipient,
    template,
  });

  try {
    let success = false;

    if (type === 'email') {
      if (!subject) {
        return errorResponse('Email göndermek için konu başlığı gereklidir', 400);
      }

      success = await sendEmail({
        to: recipient,
        subject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        template,
        templateData,
      });
    } else if (type === 'sms') {
      success = await sendSMS({
        to: recipient,
        message,
      });
    }

    if (success) {
      return successResponse(
        {
          type,
          recipient,
          sent: true,
        },
        `${type === 'email' ? 'Email' : 'SMS'} başarıyla gönderildi`
      );
    } else {
      return errorResponse(`${type === 'email' ? 'Email' : 'SMS'} gönderilemedi`, 500);
    }
  } catch (error) {
    logger.error('Test message sending failed', { error, type, recipient });
    return errorResponse(
      `Test mesajı gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      500
    );
  }
});

