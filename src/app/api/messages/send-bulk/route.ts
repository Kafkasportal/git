/**
 * POST /api/messages/send-bulk
 * Toplu email gönderimi
 * Kimlik doğrulama ve messages modülü erişimi gerektirir
 *
 * REQUEST BODY:
 * {
 *   recipients: string[], // Email adresleri
 *   message: string,
 *   subject: string,
 *   template?: string, // Opsiyonel şablon ID
 * }
 *
 * RESPONSE:
 * {
 *   success: boolean,
 *   total: number,
 *   successful: number,
 *   failed: number,
 *   failedRecipients: Array<{recipient: string, error: string}>,
 * }
 */

import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { requireAuthenticatedUser, verifyCsrfToken } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';
import { z } from 'zod';
import { sendEmail } from '@/lib/services/email';

/**
 * Common result type for bulk message operations
 */
interface BulkMessageResult {
  total: number;
  successful: number;
  failed: number;
  failedRecipients: Array<{ recipient: string; error: string }>;
}

// Validation schema
const bulkMessageSchema = z.object({
  recipients: z
    .array(z.string().email('Geçerli bir email adresi girin'))
    .min(1, 'En az bir alıcı belirtmelisiniz')
    .max(1000, 'Maksimum 1000 alıcıya aynı anda mesaj gönderebilirsiniz'),
  message: z.string().min(1, 'Mesaj boş olamaz'),
  subject: z.string().min(1, 'Konu başlığı gereklidir'),
  template: z.string().optional(),
});

/**
 * Send bulk Email messages with rate limiting and error tracking
 */
async function sendBulkEmailMessages(
  recipients: string[],
  message: string,
  subject?: string
): Promise<BulkMessageResult> {
  const result: BulkMessageResult = {
    total: recipients.length,
    successful: 0,
    failed: 0,
    failedRecipients: [],
  };

  const emailSubject = subject || 'Kafkasder - Bilgilendirme';

  for (const email of recipients) {
    try {
      const success = await sendEmail({
        to: email,
        subject: emailSubject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      });

      if (success) {
        result.successful++;
      } else {
        result.failed++;
        result.failedRecipients.push({
          recipient: email,
          error: 'Email gönderilemedi',
        });
      }

      // Rate limiting - 500ms between emails
      if (recipients.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      result.failed++;
      result.failedRecipients.push({
        recipient: email,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    }
  }

  return result;
}

export const POST = buildApiRoute({
  requireModule: 'messages',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 20, windowMs: 60000 },
  supportOfflineSync: false,
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  const { user } = await requireAuthenticatedUser();

  const { data: body, error: parseError } = await parseBody(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  const validation = bulkMessageSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse('Geçersiz istek', 400, validation.error.issues.map((i) => i.message));
  }

  const { recipients, message, subject } = validation.data;

  logger.info('Starting bulk email sending', {
    service: 'messages',
    userId: user.id,
    recipientCount: recipients.length,
    messageLength: message.length,
  });

  const result = await sendBulkEmailMessages(recipients, message, subject);

  logger.info('Bulk email sending completed', {
    service: 'messages',
    userId: user.id,
    total: result.total,
    successful: result.successful,
    failed: result.failed,
  });

  // Save to communication_logs using Appwrite
  try {
    const { appwriteCommunicationLogs } = await import('@/lib/appwrite/api');
    
    const logData = {
      type: 'email' as const,
      recipient_count: recipients.length,
      message,
      successful: result.successful,
      failed: result.failed,
      sent_at: new Date().toISOString(),
      user_id: user.id,
      status: result.failed === 0 ? 'sent' : result.successful === 0 ? 'failed' : 'partial',
      metadata: {
        subject,
        failedRecipients: result.failedRecipients,
      },
    };

    const logResponse = await appwriteCommunicationLogs.create(logData);
    const typedLogResponse = logResponse as { $id?: string; id?: string };
    const logId = typedLogResponse.$id || typedLogResponse.id || '';

    logger.info('Bulk operation logged successfully', {
      service: 'messages',
      logId,
    });
  } catch (logError) {
    // Log error but don't fail the request
    logger.error('Failed to save communication log', logError, {
      service: 'messages',
    });
  }

  return successResponse(
    result,
    `${result.successful} mesaj başarıyla gönderildi${result.failed > 0 ? `, ${result.failed} mesaj başarısız` : ''}`
  );
});
