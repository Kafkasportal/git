'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye } from 'lucide-react';
import { calculateEstimatedSendTime, getMessageTypeIcon } from '@/lib/messages/calculations';
import { getSmsMessageCount } from '@/lib/validations/message';

type MessageType = 'sms' | 'email' | 'whatsapp';

interface PreviewStepProps {
  messageType: MessageType;
  messageData: { subject?: string; content: string };
  recipientCount: number;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}

export function PreviewStep({
  messageType,
  messageData,
  recipientCount,
  confirmed,
  onConfirmedChange,
}: PreviewStepProps) {
  const estimatedTime = calculateEstimatedSendTime(recipientCount);
  const smsCount = messageType === 'sms' ? getSmsMessageCount(messageData.content) : 1;

  return (
    <div className="space-y-6">
      {/* Message Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Mesaj Önizlemesi
          </CardTitle>
          <CardDescription>Göndermeden önce mesajı kontrol edin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mesaj Türü:</span>
            <Badge variant="secondary" className="gap-1">
              {getMessageTypeIcon(messageType)} {getMessageTypeLabel(messageType)}
            </Badge>
          </div>

          {/* Subject (Email Only) */}
          {messageType === 'email' && messageData.subject && (
            <div>
              <span className="text-sm font-medium">Konu:</span>
              <p className="text-sm text-muted-foreground mt-1">{messageData.subject}</p>
            </div>
          )}

          {/* Content */}
          <div>
            <span className="text-sm font-medium">İçerik:</span>
            <div className="mt-2 p-4 bg-muted rounded-lg border">
              <p className="text-sm whitespace-pre-wrap wrap-break-word">{messageData.content}</p>
            </div>
          </div>

          {/* SMS Info */}
          {messageType === 'sms' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                📱 Bu mesaj <strong>{smsCount}</strong> SMS olarak gönderilecektir (160
                karakter/SMS)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gönderme Detayları</CardTitle>
          <CardDescription>Gönderme işlemi hakkında bilgiler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Alıcı Sayısı:</span>
              <p className="text-2xl font-bold">{recipientCount}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tahmini Süre:</span>
              <p className="text-lg font-semibold">{estimatedTime}</p>
            </div>
          </div>

          {recipientCount > 100 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-700 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-900">
                Çok sayıda alıcıya mesaj gönderme işlemi biraz zaman alabilir
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Checkbox */}
      <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
        <Checkbox
          id="confirm-send"
          checked={confirmed}
          onCheckedChange={(checked) => onConfirmedChange(checked === true)}
        />
        <Label htmlFor="confirm-send" className="text-sm cursor-pointer">
          Mesaj bilgilerini kontrol ettim ve gönderilmesini onaylıyorum
        </Label>
      </div>
    </div>
  );
}

function getMessageTypeLabel(type: MessageType): string {
  const labels: Record<MessageType, string> = {
    sms: 'SMS',
    email: 'E-Posta',
    whatsapp: 'WhatsApp',
  };
  return labels[type] || type;
}
