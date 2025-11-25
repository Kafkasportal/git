import { z } from 'zod';
import { MessageDocument } from '@/types/database';
import { phoneSchema, requiredEmailSchema } from './shared-validators';

// Helper for email validation (use required version from shared-validators)
export const emailSchema = requiredEmailSchema;

// Helper for recipient validation based on message type
export const recipientSchema = z
  .string()
  .min(1, 'Alıcı boş olamaz')
  .max(100, 'Alıcı en fazla 100 karakter olmalıdır');

// Message type enum
export const messageTypeEnum = z.enum(['sms', 'email', 'internal', 'whatsapp'], {
  message: 'Mesaj türü seçiniz',
});

// Status enum
export const statusEnum = z.enum(['draft', 'sent', 'failed'], {
  message: 'Durum seçiniz',
});

// Main message schema
export const messageSchema = z
  .object({
    message_type: messageTypeEnum,
    sender: z.string().min(1, "Gönderen kullanıcı ID'si zorunludur"),
    recipients: z
      .array(recipientSchema)
      .min(1, 'En az bir alıcı seçmelisiniz')
      .max(100, 'En fazla 100 alıcı seçebilirsiniz'),
    subject: z.string().max(200, 'Konu en fazla 200 karakter olmalıdır').optional(),
    content: z
      .string()
      .min(1, 'Mesaj içeriği zorunludur')
      .max(5000, 'Mesaj içeriği en fazla 5000 karakter olmalıdır'),
    status: statusEnum.default('draft'),
    is_bulk: z.boolean().default(false),
    template_id: z.string().optional(),
    sent_at: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // SMS specific validations
    if (data.message_type === 'sms') {
      // Content must be max 160 chars for SMS
      if (data.content.length > 160) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SMS mesajı en fazla 160 karakter olmalıdır',
          path: ['content'],
        });
      }

      // Recipients must be valid phone numbers for SMS
      data.recipients.forEach((recipient, index) => {
        if (!phoneSchema.safeParse(recipient).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'SMS için geçerli telefon numarası girin (5XXXXXXXXX)',
            path: ['recipients', index],
          });
        }
      });
    }

    // Email specific validations
    if (data.message_type === 'email') {
      // Subject is required for email
      if (!data.subject || data.subject.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'E-posta için konu zorunludur',
          path: ['subject'],
        });
      }

      // Recipients must be valid email addresses for email
      data.recipients.forEach((recipient, index) => {
        if (!z.string().email().safeParse(recipient).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'E-posta için geçerli e-posta adresi girin',
            path: ['recipients', index],
          });
        }
      });
    }

    // Internal message specific validations
    if (data.message_type === 'internal') {
      // Subject is required for internal messages
      if (!data.subject || data.subject.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Kurum içi mesaj için konu zorunludur',
          path: ['subject'],
        });
      }

      // Recipients must be valid user IDs for internal messages
      data.recipients.forEach((recipient, index) => {
        if (!recipient || recipient.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Kurum içi mesaj için geçerli kullanıcı ID'si girin",
            path: ['recipients', index],
          });
        }
      });
    }

    // Auto-set is_bulk if recipients > 1
    if (data.recipients.length > 1 && !data.is_bulk) {
      data.is_bulk = true;
    }

    // Auto-set sent_at if status is 'sent'
    if (data.status === 'sent' && !data.sent_at) {
      data.sent_at = new Date().toISOString();
    }
  });

// Template schema for reusable message templates
export const messageTemplateSchema = z.object({
  name: z
    .string()
    .min(3, 'Şablon adı en az 3 karakter olmalıdır')
    .max(100, 'Şablon adı en fazla 100 karakter olmalıdır'),
  message_type: messageTypeEnum,
  subject: z.string().max(200, 'Konu en fazla 200 karakter olmalıdır').optional(),
  content: z
    .string()
    .min(1, 'Şablon içeriği zorunludur')
    .max(5000, 'Şablon içeriği en fazla 5000 karakter olmalıdır'),
  variables: z.array(z.string()).max(20, 'En fazla 20 değişken tanımlayabilirsiniz').optional(),
});

// Export types
export type MessageFormData = z.infer<typeof messageSchema>;
export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>;

// Utility functions for UI
export const getMessageTypeLabel = (type: MessageDocument['message_type']) => {
  switch (type) {
    case 'sms':
      return 'SMS';
    case 'email':
      return 'E-posta';
    case 'internal':
      return 'Kurum İçi';
    case 'whatsapp':
      return 'WhatsApp';
    default:
      return 'Bilinmiyor';
  }
};

export const getStatusLabel = (status: MessageDocument['status']) => {
  switch (status) {
    case 'draft':
      return 'Taslak';
    case 'sent':
      return 'Gönderildi';
    case 'failed':
      return 'Başarısız';
    default:
      return 'Bilinmiyor';
  }
};

export const getStatusColor = (status: MessageDocument['status']) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'sent':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const validateRecipients = (
  recipients: string[],
  messageType: MessageDocument['message_type']
) => {
  const errors: string[] = [];

  recipients.forEach((recipient, index) => {
    if (messageType === 'sms') {
      if (!phoneSchema.safeParse(recipient).success) {
        errors.push(`Alıcı ${index + 1}: Geçerli telefon numarası girin (5XXXXXXXXX)`);
      }
    } else if (messageType === 'email') {
      if (!z.string().email().safeParse(recipient).success) {
        errors.push(`Alıcı ${index + 1}: Geçerli e-posta adresi girin`);
      }
    } else if (messageType === 'internal') {
      if (!recipient || recipient.trim() === '') {
        errors.push(`Alıcı ${index + 1}: Geçerli kullanıcı ID'si girin`);
      }
    }
  });

  return errors;
};

// Helper function to check if SMS content will be split
export const getSmsMessageCount = (content: string) => {
  if (content.length <= 160) return 1;
  if (content.length <= 320) return 2;
  if (content.length <= 480) return 3;
  return Math.ceil(content.length / 160);
};

// Helper function to estimate SMS cost (in Turkish Lira)
export const estimateSmsCost = (recipientCount: number, content: string) => {
  const messageCount = getSmsMessageCount(content);
  const costPerMessage = 0.15; // 15 kuruş per SMS
  return recipientCount * messageCount * costPerMessage;
};

// Helper function to format phone number for display
export const formatPhoneNumber = (phone: string) => {
  if (phone.length === 10 && phone.startsWith('5')) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8)}`;
  }
  return phone;
};

// Helper function to extract variables from template content
export const extractTemplateVariables = (content: string) => {
  const variableRegex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};

// Helper function to replace variables in content
export const replaceTemplateVariables = (content: string, variables: Record<string, string>) => {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    // Escape special regex characters in the key to prevent regex injection
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const placeholder = `{${escapedKey}}`;

    // Use simple string replacement with escaped placeholder
    while (result.includes(placeholder)) {
      result = result.replace(placeholder, value);
    }
  });

  return result;
};
