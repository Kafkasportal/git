/**
 * WhatsApp Service
 * Handles WhatsApp messaging via whatsapp-web.js
 *
 * FEATURES:
 * - QR Code authentication
 * - Session persistence (no need to scan QR repeatedly)
 * - Single and bulk messaging
 * - Connection status monitoring
 * - Turkish phone number support
 *
 * USAGE:
 * 1. Initialize: await initializeWhatsApp()
 * 2. Get QR: getQRCode() - scan with your phone
 * 3. Send message: await sendWhatsAppMessage({to: '+905551234567', message: 'Hello'})
 */

import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import logger from '@/lib/logger';
import path from 'path';

interface WhatsAppMessageOptions {
  to: string | string[];
  message: string;
  priority?: 'normal' | 'high';
}

interface WhatsAppStatus {
  isReady: boolean;
  isAuthenticated: boolean;
  phoneNumber?: string;
  lastError?: string;
}

// WhatsApp client singleton
let whatsappClient: Client | null = null;
let qrCodeData: string | null = null;
let clientStatus: WhatsAppStatus = {
  isReady: false,
  isAuthenticated: false,
};

/**
 * Validate and format Turkish phone number for WhatsApp
 * Accepts: +905551234567, 905551234567, 05551234567, 5551234567
 * Returns: 905551234567@c.us (WhatsApp format)
 */
function formatWhatsAppNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading + if exists
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Add 90 country code if not present
  if (!cleaned.startsWith('90')) {
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = `90${cleaned}`;
  }

  // Validate Turkish mobile number (90 5XX XXXXXXX = 12 digits total)
  if (!cleaned.match(/^905\d{9}$/)) {
    throw new Error(`Invalid Turkish phone number: ${phone}. Expected format: +90 5XX XXX XX XX`);
  }

  // Return WhatsApp format
  return `${cleaned}@c.us`;
}

/**
 * Initialize WhatsApp client with QR code authentication
 */
export async function initializeWhatsApp(): Promise<void> {
  if (whatsappClient) {
    logger.info('WhatsApp client already initialized', { service: 'whatsapp' });
    return;
  }

  try {
    logger.info('Initializing WhatsApp client...', { service: 'whatsapp' });

    // Create client with session persistence
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(process.cwd(), '.whatsapp-session'),
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      },
    });

    // QR Code event - user needs to scan this
    whatsappClient.on('qr', (qr: string) => {
      qrCodeData = qr;
      clientStatus.isAuthenticated = false;
      logger.info('WhatsApp QR Code generated - scan with your phone', {
        service: 'whatsapp',
      });
    });

    // Authenticated event
    whatsappClient.on('authenticated', () => {
      qrCodeData = null;
      clientStatus.isAuthenticated = true;
      logger.info('WhatsApp authenticated successfully', {
        service: 'whatsapp',
      });
    });

    // Ready event - client is ready to send messages
    whatsappClient.on('ready', () => {
      clientStatus.isReady = true;
      clientStatus.isAuthenticated = true;
      clientStatus.lastError = undefined;

      // Get phone number
      if (whatsappClient?.info) {
        clientStatus.phoneNumber = whatsappClient.info.wid?.user;
        logger.info('WhatsApp client ready', {
          service: 'whatsapp',
          phoneNumber: clientStatus.phoneNumber,
        });
      }
    });

    // Disconnected event
    whatsappClient.on('disconnected', (reason: string) => {
      clientStatus.isReady = false;
      clientStatus.isAuthenticated = false;
      clientStatus.lastError = `Disconnected: ${reason}`;
      logger.warn('WhatsApp client disconnected', {
        service: 'whatsapp',
        reason,
      });
    });

    // Auth failure event
    whatsappClient.on('auth_failure', (message: string) => {
      clientStatus.isAuthenticated = false;
      clientStatus.lastError = `Auth failure: ${message}`;
      logger.error('WhatsApp authentication failed', {
        service: 'whatsapp',
        error: message,
      });
    });

    // Initialize the client
    await whatsappClient.initialize();

    logger.info('WhatsApp client initialization started', {
      service: 'whatsapp',
    });
  } catch (error) {
    clientStatus.lastError = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to initialize WhatsApp client', error, {
      service: 'whatsapp',
    });
    throw error;
  }
}

/**
 * Get current QR code (if authentication is pending)
 * Returns null if already authenticated or if QR not yet generated
 */
export function getQRCode(): string | null {
  return qrCodeData;
}

/**
 * Get current WhatsApp connection status
 */
export function getWhatsAppStatus(): WhatsAppStatus {
  return { ...clientStatus };
}

/**
 * Destroy WhatsApp client and logout
 */
export async function destroyWhatsApp(): Promise<void> {
  if (!whatsappClient) {
    return;
  }

  try {
    await whatsappClient.destroy();
    whatsappClient = null;
    qrCodeData = null;
    clientStatus = {
      isReady: false,
      isAuthenticated: false,
    };
    logger.info('WhatsApp client destroyed', { service: 'whatsapp' });
  } catch (error) {
    logger.error('Failed to destroy WhatsApp client', error, {
      service: 'whatsapp',
    });
    throw error;
  }
}

/**
 * Send WhatsApp message to one or multiple recipients
 *
 * @param options - Message options
 * @returns Promise<boolean> - true if all messages sent successfully
 *
 * @example
 * await sendWhatsAppMessage({
 *   to: '+905551234567',
 *   message: 'Merhaba, yarın saat 14:00\'da yardım dağıtımı olacaktır.'
 * });
 *
 * @example
 * await sendWhatsAppMessage({
 *   to: ['+905551234567', '+905559876543'],
 *   message: 'Toplu mesaj örneği'
 * });
 */
export async function sendWhatsAppMessage(options: WhatsAppMessageOptions): Promise<boolean> {
  if (!whatsappClient) {
    logger.error('WhatsApp client not initialized', { service: 'whatsapp' });
    throw new Error('WhatsApp client not initialized. Call initializeWhatsApp() first.');
  }

  if (!clientStatus.isReady) {
    logger.error('WhatsApp client not ready', {
      service: 'whatsapp',
      status: clientStatus,
    });
    throw new Error('WhatsApp client not ready. Please scan QR code or check connection.');
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const results: boolean[] = [];

    for (const recipient of recipients) {
      try {
        // Format phone number to WhatsApp format
        const whatsappNumber = formatWhatsAppNumber(recipient);

        // Send message
        const message: Message = await whatsappClient.sendMessage(whatsappNumber, options.message);

        logger.info('WhatsApp message sent successfully', {
          service: 'whatsapp',
          to: recipient,
          messageLength: options.message.length,
          messageId: message.id.id,
          timestamp: message.timestamp,
        });

        results.push(true);

        // Rate limiting - wait 1 second between messages to avoid spam detection
        if (recipients.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error('Failed to send WhatsApp message to recipient', error, {
          service: 'whatsapp',
          to: recipient,
          message: options.message,
        });
        results.push(false);
      }
    }

    // Return true only if ALL messages were sent successfully
    const allSuccess = results.every((r) => r === true);

    if (!allSuccess) {
      logger.warn('Some WhatsApp messages failed to send', {
        service: 'whatsapp',
        total: recipients.length,
        successful: results.filter((r) => r).length,
        failed: results.filter((r) => !r).length,
      });
    }

    return allSuccess;
  } catch (error) {
    logger.error('WhatsApp message sending failed', error, {
      service: 'whatsapp',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    });
    return false;
  }
}

/**
 * Send bulk WhatsApp messages with detailed progress tracking
 *
 * @param recipients - Array of phone numbers
 * @param message - Message to send
 * @param onProgress - Optional callback for progress updates
 * @returns Object with success/failure counts and failed recipients
 */
export async function sendBulkWhatsAppMessages(
  recipients: string[],
  message: string,
  onProgress?: (current: number, total: number, phone: string) => void
): Promise<{
  total: number;
  successful: number;
  failed: number;
  failedRecipients: string[];
}> {
  const result = {
    total: recipients.length,
    successful: 0,
    failed: 0,
    failedRecipients: [] as string[],
  };

  if (!whatsappClient || !clientStatus.isReady) {
    logger.error('WhatsApp client not ready for bulk messaging', {
      service: 'whatsapp',
    });
    throw new Error('WhatsApp client not ready');
  }

  for (let i = 0; i < recipients.length; i++) {
    const phone = recipients[i];

    try {
      // Progress callback
      if (onProgress) {
        onProgress(i + 1, recipients.length, phone);
      }

      // Send message
      const success = await sendWhatsAppMessage({ to: phone, message });

      if (success) {
        result.successful++;
      } else {
        result.failed++;
        result.failedRecipients.push(phone);
      }

      // Rate limiting - 1 second between messages
      if (i < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      result.failed++;
      result.failedRecipients.push(phone);
      logger.error('Bulk WhatsApp message failed for recipient', error, {
        service: 'whatsapp',
        phone,
        index: i + 1,
        total: recipients.length,
      });
    }
  }

  logger.info('Bulk WhatsApp messaging completed', {
    service: 'whatsapp',
    total: result.total,
    successful: result.successful,
    failed: result.failed,
  });

  return result;
}

/**
 * Check if a number is registered on WhatsApp
 * Useful for validation before sending messages
 */
export async function isRegisteredOnWhatsApp(phone: string): Promise<boolean> {
  if (!whatsappClient || !clientStatus.isReady) {
    throw new Error('WhatsApp client not ready');
  }

  try {
    const whatsappNumber = formatWhatsAppNumber(phone);
    const isRegistered = await whatsappClient.isRegisteredUser(whatsappNumber);
    return isRegistered;
  } catch (error) {
    logger.error('Failed to check WhatsApp registration', error, {
      service: 'whatsapp',
      phone,
    });
    return false;
  }
}

// Auto-initialize on module load (in server environments only)
if (typeof window === 'undefined') {
  // Only initialize if explicitly enabled via env var
  // This prevents auto-initialization during builds
  if (process.env.WHATSAPP_AUTO_INIT === 'true') {
    initializeWhatsApp().catch((error) => {
      logger.error('Auto-initialization of WhatsApp failed', error, {
        service: 'whatsapp',
      });
    });
  }
}
