/**
 * Webhook: Hata Oluştuğunda n8n'e Bildirim Gönder
 */

import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

const N8N_WEBHOOK_URL =
  process.env.N8N_ERROR_WEBHOOK_URL || 'https://vmi2876541.contaboserver.net/webhook/error-logged';
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'your-secret-key';

/**
 * n8n'e hata bildirimi gönder
 * Sadece critical ve high severity hataları gönder
 */
interface ErrorData {
  error_code: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  [key: string]: unknown;
}

async function notifyN8N(errorData: ErrorData) {
  // Sadece kritik hataları gönder
  if (!['critical', 'high'].includes(errorData.severity)) {
    logger.debug('Skipping n8n notification for non-critical error', {
      severity: errorData.severity,
    });
    return false;
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        ...errorData,
        triggered_at: new Date().toISOString(),
        source: 'kafkasder-panel',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('n8n webhook failed', new Error(errorText));
      return false;
    }

    logger.info('n8n error webhook sent successfully');
    return true;
  } catch (error) {
    logger.error('Error sending error webhook to n8n', error);
    return false;
  }
}

/**
 * POST /api/webhooks/error-logged
 */
export async function POST(request: Request) {
  try {
    const error = await request.json();

    // Zorunlu alanları kontrol et
    if (!error.error_code || !error.title || !error.severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // n8n'e webhook gönder (async, hata olsa bile devam et)
    notifyN8N(error).catch((err) => {
      logger.error('Error webhook notification failed (non-blocking)', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Error webhook notification sent',
    });
  } catch (error) {
    logger.error('Error in error webhook', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
