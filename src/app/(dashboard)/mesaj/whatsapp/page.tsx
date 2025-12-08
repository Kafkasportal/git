'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Users,
  Send,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { WhatsAppConnectionManager } from '@/components/whatsapp/WhatsAppConnectionManager';
import { WhatsAppMessageComposer } from '@/components/whatsapp/WhatsAppMessageComposer';
import type { WhatsAppState, MessageTemplate, TemplateCategory } from '@/lib/whatsapp';

type ActiveTab = 'connection' | 'single' | 'bulk';

interface BulkRecipient {
  id: string;
  name: string;
  phoneNumber: string;
  selected: boolean;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  yardim: 'Yardim',
  burs: 'Burs',
  bagis: 'Bagis',
  toplanti: 'Toplanti',
  genel: 'Genel',
};

// Mock recipients - replace with actual API call
const MOCK_RECIPIENTS: BulkRecipient[] = [
  { id: '1', name: 'Ahmet Yilmaz', phoneNumber: '5551234567', selected: false },
  { id: '2', name: 'Mehmet Demir', phoneNumber: '5559876543', selected: false },
  { id: '3', name: 'Ayse Kaya', phoneNumber: '5554567890', selected: false },
  { id: '4', name: 'Fatma Celik', phoneNumber: '5551112233', selected: false },
  { id: '5', name: 'Ali Ozturk', phoneNumber: '5552223344', selected: false },
];

export default function WhatsAppMessagingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('connection');
  const [recipients, setRecipients] = useState<BulkRecipient[]>(MOCK_RECIPIENTS);
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [sendingResults, setSendingResults] = useState<
    Array<{ phoneNumber: string; success: boolean; error?: string }>
  >([]);

  // Check WhatsApp status
  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/status');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as WhatsAppState;
    },
    refetchInterval: 5000,
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['whatsapp-templates', selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory === 'all'
          ? '/api/whatsapp/templates'
          : `/api/whatsapp/templates?category=${selectedCategory}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as MessageTemplate[];
    },
  });

  // Send bulk messages mutation
  const sendBulkMutation = useMutation({
    mutationFn: async (data: { recipients: Array<{ phoneNumber: string; message: string }> }) => {
      const response = await fetch('/api/whatsapp/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(
        `${result.data.success} mesaj gonderildi, ${result.data.failed} basarisiz`
      );
      setSendingResults(result.data.results);
    },
    onError: (error: Error) => {
      toast.error(`Toplu mesaj gonderilemedi: ${error.message}`);
    },
  });

  const isReady = statusData?.status === 'ready';
  const selectedRecipients = recipients.filter((r) => r.selected);

  const handleSelectAll = () => {
    const allSelected = recipients.every((r) => r.selected);
    setRecipients(recipients.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleRecipientToggle = (id: string) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templatesData?.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      const vars: Record<string, string> = {};
      template.variables.forEach((v) => {
        vars[v] = '';
      });
      setTemplateVariables(vars);
      setBulkMessage(template.content);
    }
  };

  const handleSendBulk = () => {
    if (selectedRecipients.length === 0) {
      toast.error('En az bir alici secmelisiniz');
      return;
    }
    if (!bulkMessage.trim()) {
      toast.error('Mesaj icerigi zorunludur');
      return;
    }

    // Fill template variables if template is selected
    let finalMessage = bulkMessage;
    if (selectedTemplate) {
      for (const variable of selectedTemplate.variables) {
        const value = templateVariables[variable] || `{{${variable}}}`;
        finalMessage = finalMessage.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }
    }

    const recipientsData = selectedRecipients.map((r) => ({
      phoneNumber: r.phoneNumber,
      message: finalMessage.replace('{{isim}}', r.name),
    }));

    sendBulkMutation.mutate({ recipients: recipientsData });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Mesajlari</h2>
          <p className="text-gray-600 mt-2">
            WhatsApp uzerinden tekli ve toplu mesaj gonderin
          </p>
        </div>
        <Badge
          className={
            isReady
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }
        >
          {isReady ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Bagli: +{statusData?.phoneNumber}
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 mr-1" />
              Bagli Degil
            </>
          )}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baglanti Durumu</CardTitle>
            <div
              className={`p-2 rounded-lg ${isReady ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <MessageSquare
                className={`h-4 w-4 ${isReady ? 'text-green-600' : 'text-gray-600'}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isReady ? 'Aktif' : 'Pasif'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secili Alicilar</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedRecipients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesaj Sablonlari</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templatesData?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Baglanti</TabsTrigger>
          <TabsTrigger value="single">Tekli Mesaj</TabsTrigger>
          <TabsTrigger value="bulk">Toplu Mesaj</TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="mt-6">
          <WhatsAppConnectionManager />
        </TabsContent>

        {/* Single Message Tab */}
        <TabsContent value="single" className="mt-6">
          <WhatsAppMessageComposer />
        </TabsContent>

        {/* Bulk Message Tab */}
        <TabsContent value="bulk" className="mt-6 space-y-6">
          {/* Connection Warning */}
          {!isReady && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                WhatsApp bagli degil. Toplu mesaj gondermek icin once &quot;Baglanti&quot;
                sekmesinden baglanin.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recipients Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alicilar</CardTitle>
                    <CardDescription>
                      Mesaj gonderilecek kisileri secin
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {recipients.every((r) => r.selected)
                      ? 'Hepsini Kaldir'
                      : 'Hepsini Sec'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        recipient.selected
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleRecipientToggle(recipient.id)}
                    >
                      <Checkbox
                        checked={recipient.selected}
                        onCheckedChange={() => handleRecipientToggle(recipient.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-gray-500">{recipient.phoneNumber}</p>
                      </div>
                      {sendingResults.find(
                        (r) => r.phoneNumber === recipient.phoneNumber
                      ) && (
                        <Badge
                          className={
                            sendingResults.find(
                              (r) => r.phoneNumber === recipient.phoneNumber
                            )?.success
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {sendingResults.find(
                            (r) => r.phoneNumber === recipient.phoneNumber
                          )?.success ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  {selectedRecipients.length} / {recipients.length} kisi secildi
                </p>
              </CardContent>
            </Card>

            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Mesaj Icerigi</CardTitle>
                <CardDescription>
                  Toplu gonderilecek mesaji yazin veya sablon secin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <Label className="font-medium">Sablon Sec</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Kategori</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={(value) => {
                          setSelectedCategory(value as TemplateCategory | 'all');
                          setSelectedTemplate(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tumu</SelectItem>
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">Sablon</Label>
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
                    <div className="space-y-2 pt-3 border-t">
                      <Label className="text-xs font-medium">Degiskenler</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTemplate.variables
                          .filter((v) => v !== 'isim')
                          .map((variable) => (
                            <div key={variable}>
                              <Label className="text-xs text-gray-500 capitalize">
                                {variable.replace(/_/g, ' ')}
                              </Label>
                              <Input
                                value={templateVariables[variable] || ''}
                                onChange={(e) =>
                                  setTemplateVariables((prev) => ({
                                    ...prev,
                                    [variable]: e.target.value,
                                  }))
                                }
                                placeholder={`{{${variable}}}`}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Not: {`{{isim}}`} otomatik olarak alici ismiyle doldurulur
                      </p>
                    </div>
                  )}
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <Label>Mesaj</Label>
                  <Textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Toplu mesaj icerigini yazin..."
                    rows={8}
                  />
                  <p className="text-xs text-gray-500">{bulkMessage.length} karakter</p>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendBulk}
                  disabled={
                    !isReady ||
                    sendBulkMutation.isPending ||
                    selectedRecipients.length === 0 ||
                    !bulkMessage
                  }
                  className="w-full"
                >
                  {sendBulkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gonderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {selectedRecipients.length} Kisiye Gonder
                    </>
                  )}
                </Button>

                {/* Results Summary */}
                {sendingResults.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Gonderim Sonucu</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm text-green-600">
                        Basarili: {sendingResults.filter((r) => r.success).length}
                      </span>
                      <span className="text-sm text-red-600">
                        Basarisiz: {sendingResults.filter((r) => !r.success).length}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
