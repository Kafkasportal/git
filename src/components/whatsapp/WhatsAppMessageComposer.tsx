'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  MessageSquare,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { MessageTemplate, TemplateCategory } from '@/lib/whatsapp';
import type { WhatsAppState } from '@/lib/whatsapp';

interface WhatsAppMessageComposerProps {
  defaultPhoneNumber?: string;
  defaultMessage?: string;
  onSuccess?: () => void;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  yardim: 'Yardim',
  burs: 'Burs',
  bagis: 'Bagis',
  toplanti: 'Toplanti',
  genel: 'Genel',
};

export function WhatsAppMessageComposer({
  defaultPhoneNumber = '',
  defaultMessage = '',
  onSuccess,
}: WhatsAppMessageComposerProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber);
  const [message, setMessage] = useState(defaultMessage);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  // Check WhatsApp status
  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/status');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as WhatsAppState;
    },
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['whatsapp-templates', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all'
        ? '/api/whatsapp/templates'
        : `/api/whatsapp/templates?category=${selectedCategory}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as MessageTemplate[];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success('Mesaj gonderildi!');
      setPhoneNumber('');
      setMessage('');
      setSelectedTemplate(null);
      setTemplateVariables({});
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Mesaj gonderilemedi: ${error.message}`);
    },
  });

  // Helper function to fill template with variables
  const getFilledTemplateContent = (template: MessageTemplate, vars: Record<string, string>) => {
    let content = template.content;
    for (const variable of template.variables) {
      const value = vars[variable] || `{{${variable}}}`;
      content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    }
    return content;
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templatesData?.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      // Reset variables
      const vars: Record<string, string> = {};
      template.variables.forEach((v) => {
        vars[v] = '';
      });
      setTemplateVariables(vars);
      // Set message immediately
      setMessage(template.content);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    const newVars = { ...templateVariables, [variable]: value };
    setTemplateVariables(newVars);
    // Update message with new variable value
    if (selectedTemplate) {
      setMessage(getFilledTemplateContent(selectedTemplate, newVars));
    }
  };

  const handleSend = () => {
    if (!phoneNumber.trim()) {
      toast.error('Telefon numarasi zorunludur');
      return;
    }
    if (!message.trim()) {
      toast.error('Mesaj icerigi zorunludur');
      return;
    }
    sendMessageMutation.mutate({ phoneNumber: phoneNumber.trim(), message: message.trim() });
  };

  const isReady = statusData?.status === 'ready';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <CardTitle>WhatsApp Mesaj Gonder</CardTitle>
            <CardDescription>Tek kisiyle hizli mesajlasma</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Warning */}
        {!isReady && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              WhatsApp bagli degil. Mesaj gondermek icin once baglanin.
            </p>
          </div>
        )}

        {/* Template Selection */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            <Label className="font-medium">Sablon Sec (Opsiyonel)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Kategori</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value as TemplateCategory | 'all');
                  setSelectedTemplate(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori secin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tum Kategoriler</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Sablon</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sablon secin" />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">Sablon Degiskenleri</Label>
              <div className="grid grid-cols-2 gap-3">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable}>
                    <Label className="text-xs text-gray-500 capitalize">
                      {variable.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      value={templateVariables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`{{${variable}}}`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Telefon Numarasi</Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="5XX XXX XX XX"
          />
          <p className="text-xs text-gray-500">
            Ornek: 5551234567 veya +905551234567
          </p>
        </div>

        {/* Message Content */}
        <div className="space-y-2">
          <Label htmlFor="message">Mesaj</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesajinizi yazin..."
            rows={6}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{message.length} karakter</span>
            {selectedTemplate && (
              <Badge variant="outline" className="text-xs">
                Sablon: {selectedTemplate.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!isReady || sendMessageMutation.isPending || !phoneNumber || !message}
          className="w-full"
        >
          {sendMessageMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gonderiliyor...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Mesaj Gonder
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
