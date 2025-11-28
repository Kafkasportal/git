'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, Send } from 'lucide-react';
import { STEP_TITLES, STEP_DESCRIPTIONS, WIZARD_STEPS } from '@/lib/messages/constants';
import type { MessageType } from '@/lib/messages/calculations';

export type WizardStep = 'compose' | 'recipients' | 'preview' | 'sending';

interface BulkMessagingWizardProps {
  currentStep: WizardStep;
  messageType: MessageType;
  recipientCount: number;
  isSending: boolean;
  sendingProgress: number;
  confirmed: boolean;
  onStepChange: (step: WizardStep) => void;
  onSend: () => void;
  children: React.ReactNode;
}

export function BulkMessagingWizard({
  currentStep,
  messageType,
  recipientCount,
  isSending,
  sendingProgress,
  confirmed,
  onStepChange,
  onSend,
  children,
}: BulkMessagingWizardProps) {
  const canGoNext =
    (currentStep === WIZARD_STEPS.COMPOSE && messageType) ||
    (currentStep === WIZARD_STEPS.RECIPIENTS && recipientCount > 0) ||
    (currentStep === WIZARD_STEPS.PREVIEW && confirmed);

  const canGoBack = currentStep !== WIZARD_STEPS.COMPOSE && !isSending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">{STEP_TITLES[currentStep]}</span>
        </CardTitle>
        <CardDescription>{STEP_DESCRIPTIONS[currentStep]}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wizard Progress Indicator */}
        <WizardProgressIndicator currentStep={currentStep} isSending={isSending} />

        {/* Step Content */}
        <div className="min-h-[300px]">{children}</div>

        {/* Progress Bar for Sending */}
        {isSending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gönderiliyor...</span>
              <span className="text-sm text-muted-foreground">{sendingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${sendingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => onStepChange(getPreviousStep(currentStep))}
            disabled={!canGoBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>

          {currentStep !== WIZARD_STEPS.SENDING ? (
            <Button
              onClick={
                currentStep === WIZARD_STEPS.PREVIEW
                  ? onSend
                  : () => onStepChange(getNextStep(currentStep))
              }
              disabled={!canGoNext || isSending}
              className="gap-2"
            >
              {currentStep === WIZARD_STEPS.PREVIEW ? (
                <>
                  <Send className="h-4 w-4" />
                  Gönder
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  İleri
                </>
              )}
            </Button>
          ) : (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tamamlandı
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface WizardProgressIndicatorProps {
  currentStep: WizardStep;
  isSending: boolean;
}

function WizardProgressIndicator({
  currentStep,
  isSending: _isSending,
}: WizardProgressIndicatorProps) {
  const steps: WizardStep[] = [
    WIZARD_STEPS.COMPOSE,
    WIZARD_STEPS.RECIPIENTS,
    WIZARD_STEPS.PREVIEW,
    WIZARD_STEPS.SENDING,
  ];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          {/* Step Circle */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-colors ${
              index < currentIndex
                ? 'bg-green-600 text-white'
                : index === currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {index < currentIndex ? <CheckCircle className="h-5 w-5" /> : index + 1}
          </div>

          {/* Step Label */}
          <div className="ml-2 text-sm font-medium hidden sm:inline">{STEP_TITLES[step]}</div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                index < currentIndex ? 'bg-green-600' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function getPreviousStep(step: WizardStep): WizardStep {
  const steps: WizardStep[] = [
    WIZARD_STEPS.COMPOSE,
    WIZARD_STEPS.RECIPIENTS,
    WIZARD_STEPS.PREVIEW,
    WIZARD_STEPS.SENDING,
  ];
  const index = steps.indexOf(step);
  return index > 0 ? steps[index - 1] : step;
}

function getNextStep(step: WizardStep): WizardStep {
  const steps: WizardStep[] = [
    WIZARD_STEPS.COMPOSE,
    WIZARD_STEPS.RECIPIENTS,
    WIZARD_STEPS.PREVIEW,
    WIZARD_STEPS.SENDING,
  ];
  const index = steps.indexOf(step);
  return index < steps.length - 1 ? steps[index + 1] : step;
}
