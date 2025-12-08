export {
  getWhatsAppService,
  WhatsAppService,
  type WhatsAppStatus,
  type WhatsAppState,
  type SendMessageResult,
} from './whatsapp-service';

export {
  MESSAGE_TEMPLATES,
  type MessageTemplate,
  type TemplateCategory,
  getTemplatesByCategory,
  getTemplateById,
  fillTemplate,
} from './templates';
