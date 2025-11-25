'use client';

import dynamic from 'next/dynamic';
import type { MessageType } from '@/lib/messages/calculations';

const MessageForm = dynamic(
  () => import('@/components/forms/MessageForm').then((mod) => ({ default: mod.MessageForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
    ssr: false,
  }
);

const MessageTemplateSelector = dynamic(
  () =>
    import('@/components/messages/MessageTemplateSelector').then((mod) => ({
      default: mod.MessageTemplateSelector,
    })),
  {
    loading: () => <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>,
    ssr: false,
  }
);

interface ComposeStepProps {
  messageType: MessageType;
  messageData: { subject?: string; content: string };
  onMessageChange: (data: { subject?: string; content: string }) => void;
}

export function ComposeStep({ messageType, messageData, onMessageChange }: ComposeStepProps) {
  return (
    <div className="space-y-6">
      {/* Message Template Selector */}
      <MessageTemplateSelector
        messageType={messageType}
        onSelect={(template) =>
          onMessageChange({ subject: template.subject, content: template.content })
        }
      />

      {/* Message Form */}
      <MessageForm
        defaultMessageType={messageType}
        initialData={messageData}
        onSuccess={() => {
          // Form submitted successfully
          // The form handles its own submission
        }}
      />
    </div>
  );
}
