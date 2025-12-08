import { Client, LocalAuth } from 'whatsapp-web.js';
import { EventEmitter } from 'events';

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready' | 'error';

export interface WhatsAppState {
  status: WhatsAppStatus;
  qrCode: string | null;
  error: string | null;
  phoneNumber: string | null;
  lastActivity: Date | null;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private state: WhatsAppState = {
    status: 'disconnected',
    qrCode: null,
    error: null,
    phoneNumber: null,
    lastActivity: null,
  };

  constructor() {
    super();
  }

  getState(): WhatsAppState {
    return { ...this.state };
  }

  private updateState(updates: Partial<WhatsAppState>) {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  async initialize(): Promise<void> {
    if (this.client) {
      // Client already exists, no action needed
      return;
    }

    try {
      this.updateState({ status: 'connecting', error: null });

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './.wwebjs_auth',
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

      this.setupEventListeners();
      await this.client.initialize();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.updateState({ status: 'error', error: errorMessage });
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      this.updateState({ status: 'qr_ready', qrCode: qr });
      this.emit('qr', qr);
    });

    this.client.on('authenticated', () => {
      this.updateState({ status: 'authenticated', qrCode: null });
      this.emit('authenticated');
    });

    this.client.on('ready', () => {
      const info = this.client?.info;
      this.updateState({
        status: 'ready',
        phoneNumber: info?.wid?.user || null,
        lastActivity: new Date(),
      });
      this.emit('ready');
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('WhatsApp auth failure:', msg);
      this.updateState({ status: 'error', error: `Kimlik dogrulama hatasi: ${msg}` });
      this.emit('auth_failure', msg);
    });

    this.client.on('disconnected', (reason: string) => {
      console.warn('WhatsApp disconnected:', reason);
      this.updateState({
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        error: reason,
      });
      this.client = null;
      this.emit('disconnected', reason);
    });

    this.client.on('message', (msg) => {
      this.updateState({ lastActivity: new Date() });
      this.emit('message', msg);
    });
  }

  async sendMessage(phoneNumber: string, message: string): Promise<SendMessageResult> {
    if (!this.client || this.state.status !== 'ready') {
      return {
        success: false,
        error: 'WhatsApp baglantisi hazir degil',
      };
    }

    try {
      // Format phone number (remove spaces, dashes, etc.)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const chatId = `${formattedNumber}@c.us`;

      // Check if number is registered on WhatsApp
      const isRegistered = await this.client.isRegisteredUser(chatId);
      if (!isRegistered) {
        return {
          success: false,
          error: 'Bu numara WhatsApp\'ta kayitli degil',
        };
      }

      const result = await this.client.sendMessage(chatId, message);
      this.updateState({ lastActivity: new Date() });

      return {
        success: true,
        messageId: result.id._serialized,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mesaj gonderilemedi';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendBulkMessages(
    recipients: Array<{ phoneNumber: string; message: string }>,
    delayMs: number = 2000
  ): Promise<Array<{ phoneNumber: string; result: SendMessageResult }>> {
    const results: Array<{ phoneNumber: string; result: SendMessageResult }> = [];

    for (const recipient of recipients) {
      const result = await this.sendMessage(recipient.phoneNumber, recipient.message);
      results.push({ phoneNumber: recipient.phoneNumber, result });

      // Delay between messages to avoid rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Turkish numbers
    if (cleaned.startsWith('0')) {
      cleaned = '90' + cleaned.substring(1);
    } else if (!cleaned.startsWith('90') && cleaned.length === 10) {
      cleaned = '90' + cleaned;
    }

    return cleaned;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.logout();
      } catch (error) {
        console.error('Error during logout:', error);
      }
      await this.client.destroy();
      this.client = null;
      this.updateState({
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        lastActivity: null,
      });
    }
  }

  async restart(): Promise<void> {
    await this.disconnect();
    await this.initialize();
  }

  isReady(): boolean {
    return this.state.status === 'ready';
  }
}

// Singleton instance
let whatsappService: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappService) {
    whatsappService = new WhatsAppService();
  }
  return whatsappService;
}

export { WhatsAppService };
