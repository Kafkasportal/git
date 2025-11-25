'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const RecipientSelector = dynamic(
  () =>
    import('@/components/messages/RecipientSelector').then((mod) => ({
      default: mod.RecipientSelector,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
    ssr: false,
  }
);

interface RecipientsStepProps {
  messageType: 'sms' | 'email' | 'internal' | 'whatsapp';
  selectedRecipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
}

export function RecipientsStep({
  messageType,
  selectedRecipients,
  onRecipientsChange,
}: RecipientsStepProps) {
  return (
    <div className="space-y-6">
      {/* Selected Count Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seçili Alıcılar
          </CardTitle>
          <CardDescription>Toplam {selectedRecipients.length} alıcı seçili</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{selectedRecipients.length}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedRecipients.length === 0
              ? 'Alıcı seçmek için aşağıdan başlayın'
              : `Mesaj ${selectedRecipients.length} kişiye gönderilecek`}
          </p>
        </CardContent>
      </Card>

      {/* Recipient Selector */}
      <RecipientSelector
        messageType={messageType}
        selectedRecipients={selectedRecipients}
        onRecipientsChange={onRecipientsChange}
      />
    </div>
  );
}
