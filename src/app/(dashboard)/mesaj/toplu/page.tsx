'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DemoBanner } from '@/components/ui/demo-banner';
import { BulkMessagingHeader } from './_components/BulkMessagingHeader';
import { BulkMessagingStats } from './_components/BulkMessagingStats';
import { BulkMessagingWizard, type WizardStep } from './_components/BulkMessagingWizard';
import { ComposeStep } from './_components/ComposeStep';
import { RecipientsStep } from './_components/RecipientsStep';
import { PreviewStep } from './_components/PreviewStep';
import { SendingStep } from './_components/SendingStep';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MessageStatistics, SendingResult } from '@/lib/messages/calculations';
import type { MessageType } from '@/lib/messages/calculations';

export default function BulkMessagingPage() {
  const queryClient = useQueryClient();

  // Filter & Wizard State
  const [wizardStep, setWizardStep] = useState<WizardStep>('compose');
  const [messageType, _setMessageType] = useState<MessageType>('sms');
  const [messageData, setMessageData] = useState<{ subject?: string; content: string }>({
    content: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sendingResults, setSendingResults] = useState<SendingResult | undefined>();

  // Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Mock stats (replace with API call)
  const stats: MessageStatistics = {
    totalSms: 1250,
    totalEmails: 840,
    failedMessages: 12,
    thisMonth: 2092,
  };

  // Mutations
  const sendBulkMessageMutation = useMutation({
    mutationFn: async (data: {
      messageType: MessageType;
      messageData: { subject?: string; content: string };
      recipients: string[];
    }) => {
      // Simulate sending process
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;
        setSendingProgress(Math.floor(progress));
      }, 500);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));
      clearInterval(interval);

      return {
        data: {
          success: data.recipients.length - 2,
          failed: 2,
          errors: [
            { recipient: '+90 555 123 4567', error: 'Geçersiz numara formatı' },
            { recipient: 'invalid@email', error: 'Geçersiz e-posta adresi' },
          ],
        },
      };
    },
    onSuccess: (response) => {
      setSendingProgress(100);
      setSendingResults(response.data as SendingResult);
      toast.success('Mesajlar başarıyla gönderildi!');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      toast.error(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      setSendingResults({
        success: 0,
        failed: selectedRecipients.length,
        errors: [{ recipient: 'Tümü', error: 'Gönderme başarısız oldu' }],
      });
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  // Event Handlers
  const handleNextStep = () => {
    if (wizardStep === 'compose') {
      if (!messageData.content.trim()) {
        toast.error('Mesaj içeriği zorunludur');
        return;
      }
      setWizardStep('recipients');
    } else if (wizardStep === 'recipients') {
      if (selectedRecipients.length === 0) {
        toast.error('En az bir alıcı seçmelisiniz');
        return;
      }
      setWizardStep('preview');
    } else if (wizardStep === 'preview') {
      if (!confirmed) {
        toast.error('Lütfen gönderimi onaylayın');
        return;
      }
      handleSend();
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendingProgress(0);
    setWizardStep('sending');

    await sendBulkMessageMutation.mutateAsync({
      messageType,
      messageData,
      recipients: selectedRecipients,
    });
  };

  const handleStepChange = (step: WizardStep) => {
    setWizardStep(step);
  };

  // Start over functionality can be added if needed
  // Currently users can refresh the page to reset the wizard
  // const handleStartOver = () => {
  //   setWizardStep('compose');
  //   setMessageType('sms');
  //   setMessageData({ content: '' });
  //   setSelectedRecipients([]);
  //   setConfirmed(false);
  //   setSendingProgress(0);
  //   setSendingResults(undefined);
  // };

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <BulkMessagingHeader onShowHistory={() => setShowHistoryModal(true)} />

      {/* Statistics */}
      <BulkMessagingStats stats={stats} />

      {/* Wizard */}
      <BulkMessagingWizard
        currentStep={wizardStep}
        messageType={messageType}
        recipientCount={selectedRecipients.length}
        isSending={isSending}
        sendingProgress={sendingProgress}
        confirmed={confirmed}
        onStepChange={handleStepChange}
        onSend={handleNextStep}
      >
        {wizardStep === 'compose' && (
          <ComposeStep
            messageType={messageType}
            messageData={messageData}
            onMessageChange={setMessageData}
          />
        )}

        {wizardStep === 'recipients' && (
          <RecipientsStep
            messageType={messageType}
            selectedRecipients={selectedRecipients}
            onRecipientsChange={setSelectedRecipients}
          />
        )}

        {wizardStep === 'preview' && (
          <PreviewStep
            messageType={messageType}
            messageData={messageData}
            recipientCount={selectedRecipients.length}
            confirmed={confirmed}
            onConfirmedChange={setConfirmed}
          />
        )}

        {wizardStep === 'sending' && (
          <SendingStep
            progress={sendingProgress}
            result={sendingResults}
            isCompleted={sendingProgress === 100}
            isFailed={sendingResults && sendingResults.failed > 0}
          />
        )}
      </BulkMessagingWizard>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Toplu Mesaj Geçmişi</DialogTitle>
            <DialogDescription>Gönderilen toplu mesajların geçmişi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center py-8">
              Geçmiş veriler yakında eklenecektir
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
