/**
 * Webhook: Telegram Bildirimi Gönderme
 *
 * Telegram üzerinden bildirim göndermek için kullanın
 */

import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

const N8N_TELEGRAM_WEBHOOK_URL =
  process.env.N8N_TELEGRAM_WEBHOOK_URL ||
  'https://vmi2876541.contaboserver.net/webhook/telegram-notify';
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'your-secret-key';

/**
 * Telegram bildirim tipleri
 */
type NotificationType =
  | 'donation' // Bağış bildirimi
  | 'meeting' // Toplantı bildirimi
  | 'error' // Hata bildirimi
  | 'task' // Görev bildirimi
  | 'beneficiary' // İhtiyaç sahibi bildirimi
  | 'scholarship' // Burs bildirimi
  | 'general'; // Genel bildirim

interface TelegramNotification {
  type: NotificationType;
  title: string;
  description?: string;
  details?: Record<string, any>;
  url?: string;
  recipient_type: 'group' | 'personal';
  recipient_id?: string; // Chat ID (personal için)
  has_attachment?: boolean;
  attachment?: {
    data: string; // Base64
    filename: string;
    caption?: string;
  };
}

/**
 * n8n'e Telegram bildirimi gönder
 */
async function sendTelegramNotification(notification: TelegramNotification) {
  try {
    const response = await fetch(N8N_TELEGRAM_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        ...notification,
        triggered_at: new Date().toISOString(),
        source: 'kafkasder-panel',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Telegram webhook failed', new Error(errorText));
      return false;
    }

    logger.info('Telegram notification sent successfully');
    return true;
  } catch (error) {
    logger.error('Error sending Telegram notification', error);
    return false;
  }
}

/**
 * POST /api/webhooks/telegram-notify
 */
export async function POST(request: Request) {
  try {
    const notification = (await request.json()) as TelegramNotification;

    // Zorunlu alanları kontrol et
    if (!notification.type || !notification.title || !notification.recipient_type) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, recipient_type' },
        { status: 400 }
      );
    }

    // Telegram bildirimi gönder (async, hata olsa bile devam et)
    sendTelegramNotification(notification).catch((err) => {
      logger.error('Telegram notification failed (non-blocking)', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Telegram notification sent',
    });
  } catch (error) {
    logger.error('Error in Telegram webhook', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
