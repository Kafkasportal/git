export type MessageType = 'sms' | 'email' | 'whatsapp';

export interface SendingResult {
  success: number;
  failed: number;
  errors: Array<{ recipient: string; error: string }>;
}

export interface MessageStatistics {
  totalSms: number;
  totalEmails: number;
  failedMessages: number;
  thisMonth?: number;
}

/**
 * Validate message content based on type
 */
export function validateMessageContent(
  content: string,
  type: MessageType,
  subject?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content.trim()) {
    errors.push('Mesaj içeriği boş olamaz');
  }

  if (type === 'email') {
    if (!subject?.trim()) {
      errors.push('E-posta konusu boş olamaz');
    }
    if (subject && subject.length > 200) {
      errors.push('E-posta konusu 200 karakterden uzun olamaz');
    }
  }

  if (content.length > 5000) {
    errors.push('Mesaj içeriği 5000 karakterden uzun olamaz');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate recipients list
 */
export function validateRecipients(recipients: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!recipients || recipients.length === 0) {
    errors.push('En az bir alıcı seçmelisiniz');
  }

  if (recipients.length > 1000) {
    errors.push('Maksimum 1000 alıcıya mesaj gönderilebilir');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get message type label
 */
export function getMessageTypeLabel(type: MessageType): string {
  const labels: Record<MessageType, string> = {
    sms: 'SMS',
    email: 'E-Posta',
    whatsapp: 'WhatsApp',
  };

  return labels[type] || type;
}

/**
 * Get icon for message type
 */
export function getMessageTypeIcon(type: MessageType): string {
  const icons: Record<MessageType, string> = {
    sms: '📱',
    email: '✉️',
    whatsapp: '💬',
  };

  return icons[type] || '📨';
}

/**
 * Calculate estimated send time
 */
export function calculateEstimatedSendTime(
  recipientCount: number,
  delayPerMessage: number = 100
): string {
  const totalMs = recipientCount * delayPerMessage;
  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor(totalMs / (1000 * 60 * 60));

  if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  }

  if (minutes > 0) {
    return `${minutes} dakika ${seconds} saniye`;
  }

  return `${seconds} saniye`;
}

/**
 * Generate message preview (truncated)
 */
export function generateMessagePreview(content: string, maxLength: number = 100): string {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
}
