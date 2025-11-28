export const MESSAGE_TYPES = {
  SMS: 'sms',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
} as const;

export const WIZARD_STEPS = {
  COMPOSE: 'compose',
  RECIPIENTS: 'recipients',
  PREVIEW: 'preview',
  SENDING: 'sending',
} as const;

export const STEP_TITLES = {
  compose: 'Mesaj Oluştur',
  recipients: 'Alıcı Seçimi',
  preview: 'Önizleme ve Onay',
  sending: 'Gönderiliyor',
} as const;

export const STEP_DESCRIPTIONS = {
  compose: 'Mesajınızı yazın ve şablon seçin',
  recipients: 'Mesajı göndereceğiniz alıcıları seçin',
  preview: 'Mesajı kontrol edin ve gönderimi onaylayın',
  sending: 'Mesajlar gönderiliyor...',
} as const;

export const MESSAGE_TYPE_LABELS = {
  sms: 'SMS',
  email: 'E-Posta',
  whatsapp: 'WhatsApp',
} as const;
