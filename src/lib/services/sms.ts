/**
 * SMS Service
 * Handles SMS sending via Twilio
 */

import twilio from 'twilio';
import { getServerEnv, hasSmsConfig } from '@/lib/env-validation';
import logger from '@/lib/logger';

interface SmsOptions {
  to: string | string[];
  message: string;
  from?: string;
  priority?: 'normal' | 'high';
}

// Twilio client singleton
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const env = getServerEnv();

  if (!hasSmsConfig(env)) {
    logger.warn('Twilio configuration missing');
    return null;
  }

  twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  return twilioClient;
}

/**
 * Validate Turkish phone number format
 */
function validateTurkishPhone(phone: string): boolean {
  // Turkish mobile: +90 5XX XXX XX XX or variants
  const cleaned = phone.replace(/\s/g, '');
  return cleaned.startsWith('+90') && cleaned.length === 13;
}

/**
 * Send SMS via Twilio
 * Returns true if SMS was sent successfully, false otherwise
 */
export async function sendSMS(options: SmsOptions): Promise<boolean> {
  const env = getServerEnv();

  if (!hasSmsConfig(env)) {
    logger.warn('SMS not configured - SMS will not be sent', {
      service: 'sms',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    });
    return false;
  }

  try {
    const client = getTwilioClient();
    if (!client) {
      throw new Error('Failed to create Twilio client');
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const fromNumber = options.from || env.TWILIO_PHONE_NUMBER || '';

    // Validate all phone numbers
    for (const recipient of recipients) {
      if (!validateTurkishPhone(recipient)) {
        logger.error('Invalid Turkish phone number', {
          service: 'sms',
          phone: recipient,
        });
        throw new Error(`Invalid Turkish phone number: ${recipient}`);
      }
    }

    // Send SMS to each recipient
    for (const recipient of recipients) {
      const cleanPhone = recipient.replace(/\s/g, '');

      const result = await client.messages.create({
        body: options.message,
        from: fromNumber,
        to: cleanPhone,
      });

      logger.info('SMS sent successfully', {
        service: 'sms',
        to: cleanPhone,
        messageLength: options.message.length,
        sid: result.sid,
        status: result.status,
      });
    }

    return true;
  } catch (error) {
    logger.error('SMS sending failed', error, {
      service: 'sms',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    });
    return false;
  }
}

/**
 * Send bulk SMS with rate limiting
 * Adds delay between messages to avoid rate limits
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string
): Promise<{
  success: number;
  failed: number;
  results: Array<{ phone: string; success: boolean; error?: string }>;
}> {
  let success = 0;
  let failed = 0;
  const results: Array<{ phone: string; success: boolean; error?: string }> = [];

  for (const recipient of recipients) {
    try {
      const result = await sendSMS({
        to: recipient,
        message,
      });

      if (result) {
        success++;
        results.push({ phone: recipient, success: true });
      } else {
        failed++;
        results.push({ phone: recipient, success: false, error: 'Send failed' });
      }

      // Rate limiting: wait 1 second between messages
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      failed++;
      results.push({
        phone: recipient,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk SMS completed', {
    service: 'sms',
    total: recipients.length,
    success,
    failed,
  });

  return { success, failed, results };
}

/**
 * Send verification code SMS
 */
export async function sendVerificationSMS(phone: string, code: string): Promise<boolean> {
  const message = `Dernek Yönetim Sistemi doğrulama kodunuz: ${code}\n\nBu kodu kimseyle paylaşmayın.`;
  return await sendSMS({ to: phone, message });
}

/**
 * Send notification SMS
 */
export async function sendNotificationSMS(
  phone: string,
  title: string,
  content: string
): Promise<boolean> {
  const message = `${title}\n\n${content}\n\nDernek Yönetim Sistemi`;
  return await sendSMS({ to: phone, message });
}

/**
 * Send aid approval notification SMS
 */
export async function sendAidApprovedSMS(
  phone: string,
  beneficiaryName: string,
  aidType: string
): Promise<boolean> {
  const message = `Merhaba ${beneficiaryName},\n\n${aidType} yardım başvurunuz onaylanmıştır.\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\nDernek Yönetim Sistemi`;
  return await sendSMS({ to: phone, message });
}

/**
 * Send scholarship approval notification SMS
 */
export async function sendScholarshipApprovedSMS(
  phone: string,
  studentName: string,
  amount: number
): Promise<boolean> {
  const message = `Tebrikler ${studentName}!\n\nBurs başvurunuz onaylanmıştır.\nAylık tutar: ${amount} TL\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\nDernek Yönetim Sistemi`;
  return await sendSMS({ to: phone, message });
}

/**
 * Send meeting reminder SMS
 */
export async function sendMeetingReminderSMS(
  phone: string,
  meetingTitle: string,
  meetingDate: string,
  location: string
): Promise<boolean> {
  const message = `Toplantı Hatırlatması\n\n${meetingTitle}\nTarih: ${meetingDate}\nYer: ${location}\n\nDernek Yönetim Sistemi`;
  return await sendSMS({ to: phone, message });
}
