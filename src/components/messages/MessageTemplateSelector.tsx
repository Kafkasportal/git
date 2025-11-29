'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FileText, Plus, Star, StarOff, MessageSquare, Mail, Users, Phone } from 'lucide-react';
import {
  getMessageTypeLabel,
  extractTemplateVariables,
  type MessageTemplateFormData,
} from '@/lib/validations/message';

interface MessageTemplate {
  id: string;
  name: string;
  message_type: 'sms' | 'email' | 'internal';
  subject?: string;
  content: string;
  variables?: string[];
  is_favorite?: boolean;
  last_used?: string;
  created_at: string;
}

interface MessageTemplateSelectorProps {
  messageType: 'sms' | 'email' | 'internal';
  onSelect: (template: MessageTemplate) => void;
  onSaveAsTemplate?: (data: MessageTemplateFormData) => void;
}

// Pre-defined templates
const predefinedTemplates: MessageTemplate[] = [
  // SMS Templates
  {
    id: 'sms-thanks',
    name: 'Bağış Teşekkürü',
    message_type: 'sms',
    content:
      'Merhaba {name}, {amount} TL bağışınız için teşekkür ederiz. Hayırseverliğiniz için minnettarız.',
    variables: ['name', 'amount'],
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sms-aid-approval',
    name: 'Yardım Onayı',
    message_type: 'sms',
    content:
      'Merhaba {name}, yardım talebiniz onaylanmıştır. Detaylar için lütfen bizimle iletişime geçin.',
    variables: ['name'],
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sms-meeting-reminder',
    name: 'Toplantı Hatırlatması',
    message_type: 'sms',
    content:
      "Merhaba {name}, {date} tarihinde saat {time}'da toplantımız var. Katılımınızı bekliyoruz.",
    variables: ['name', 'date', 'time'],
    is_favorite: false,
    created_at: new Date().toISOString(),
  },

  // Email Templates
  {
    id: 'email-receipt',
    name: 'Bağış Makbuzu',
    message_type: 'email',
    subject: 'Bağış Makbuzunuz - {organization_name}',
    content: `Merhaba {name},

{amount} TL tutarındaki bağışınız için teşekkür ederiz.

Bağış Detayları:
- Tutar: {amount} TL
- Tarih: {date}
- Bağış No: {donation_id}

Bu makbuz vergi indirimi için kullanılabilir.

Saygılarımızla,
{organization_name} Ekibi`,
    variables: ['name', 'amount', 'date', 'donation_id', 'organization_name'],
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'email-annual-report',
    name: 'Yıllık Rapor',
    message_type: 'email',
    subject: '{year} Yıllık Faaliyet Raporumuz',
    content: `Merhaba {name},

{year} yılı faaliyet raporumuzu sizinle paylaşmak istiyoruz.

Rapor Özeti:
- Toplam Bağış: {total_donations} TL
- Yardım Edilen Kişi: {beneficiaries_count}
- Proje Sayısı: {project_count}

Detaylı raporu ekte bulabilirsiniz.

Saygılarımızla,
{organization_name} Ekibi`,
    variables: [
      'name',
      'year',
      'total_donations',
      'beneficiaries_count',
      'project_count',
      'organization_name',
    ],
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'email-event-invitation',
    name: 'Etkinlik Daveti',
    message_type: 'email',
    subject: '{event_name} Etkinliğine Davetlisiniz',
    content: `Merhaba {name},

{event_name} etkinliğimize davetlisiniz.

Etkinlik Detayları:
- Tarih: {event_date}
- Saat: {event_time}
- Yer: {event_location}
- Açıklama: {event_description}

Katılımınızı bekliyoruz.

Saygılarımızla,
{organization_name} Ekibi`,
    variables: [
      'name',
      'event_name',
      'event_date',
      'event_time',
      'event_location',
      'event_description',
      'organization_name',
    ],
    is_favorite: false,
    created_at: new Date().toISOString(),
  },

  // Internal Templates
  {
    id: 'internal-task-assignment',
    name: 'Görev Atama',
    message_type: 'internal',
    subject: 'Yeni Görev Ataması: {task_title}',
    content: `Merhaba {name},

Size yeni bir görev atanmıştır.

Görev Detayları:
- Başlık: {task_title}
- Açıklama: {task_description}
- Öncelik: {task_priority}
- Son Tarih: {task_due_date}

Görevle ilgili sorularınız için lütfen bizimle iletişime geçin.

Saygılarımızla,
{assigner_name}`,
    variables: [
      'name',
      'task_title',
      'task_description',
      'task_priority',
      'task_due_date',
      'assigner_name',
    ],
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'internal-approval-request',
    name: 'Onay Talebi',
    message_type: 'internal',
    subject: 'Onay Talebi: {request_title}',
    content: `Merhaba {name},

{request_title} konusunda onayınıza ihtiyacımız var.

Talep Detayları:
- Konu: {request_title}
- Açıklama: {request_description}
- Talep Eden: {requester_name}
- Tarih: {request_date}

Lütfen en kısa sürede değerlendiriniz.

Saygılarımızla,
{requester_name}`,
    variables: ['name', 'request_title', 'request_description', 'requester_name', 'request_date'],
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'internal-notification',
    name: 'Bilgilendirme',
    message_type: 'internal',
    subject: 'Bilgilendirme: {notification_title}',
    content: `Merhaba {name},

{notification_title} konusunda bilgilendirmek istiyoruz.

Bilgi Detayları:
- Konu: {notification_title}
- Açıklama: {notification_description}
- Tarih: {notification_date}

Bu bilgiyi dikkate almanızı rica ederiz.

Saygılarımızla,
{organization_name} Ekibi`,
    variables: [
      'name',
      'notification_title',
      'notification_description',
      'notification_date',
      'organization_name',
    ],
    is_favorite: false,
    created_at: new Date().toISOString(),
  },
];

export function MessageTemplateSelector({
  messageType,
  onSelect,
  onSaveAsTemplate,
}: MessageTemplateSelectorProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Filter templates by message type
  const filteredTemplates = predefinedTemplates.filter((template) => {
    const typeMatch = template.message_type === messageType;
    const favoriteMatch = !showFavoritesOnly || template.is_favorite;
    return typeMatch && favoriteMatch;
  });

  const handleSelectTemplate = (template: MessageTemplate) => {
    onSelect(template);
    setSelectedTemplate(template);
  };

  const handleSaveTemplate = (data: MessageTemplateFormData) => {
    // In a real implementation, this would save to a MESSAGE_TEMPLATES collection
    // For now, we'll just show a success message
    toast.success('Şablon başarıyla kaydedildi.');
    setShowSaveDialog(false);
    onSaveAsTemplate?.(data);
  };

  const getMessageTypeIcon = (type: 'sms' | 'email' | 'internal') => {
    switch (type) {
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'internal':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getMessageTypeIcon(messageType)}
          <h3 className="text-lg font-semibold">{getMessageTypeLabel(messageType)} Şablonları</h3>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="favorites-only"
            checked={showFavoritesOnly}
            onCheckedChange={(checked) => setShowFavoritesOnly(checked === true)}
          />
          <Label htmlFor="favorites-only" className="text-sm">
            Sadece Favoriler
          </Label>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid gap-3">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Bu tür için şablon bulunmuyor</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.is_favorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-300" />
                      )}
                      {template.name}
                    </CardTitle>
                    {template.subject && (
                      <CardDescription className="mt-1">
                        <strong>Konu:</strong> {template.subject}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {getMessageTypeLabel(template.message_type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>İçerik:</strong>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm line-clamp-3">
                    {template.content}
                  </div>

                  {template.variables && template.variables.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        <strong>Değişkenler:</strong>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {`{${variable}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şablon Oluştur
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Şablon Oluştur</DialogTitle>
          </DialogHeader>
          <SaveTemplateForm
            messageType={messageType}
            onSave={handleSaveTemplate}
            onCancel={() => setShowSaveDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Save Template Form Component
function SaveTemplateForm({
  messageType,
  onSave,
  onCancel,
}: {
  messageType: 'sms' | 'email' | 'internal';
  onSave: (data: MessageTemplateFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<MessageTemplateFormData>({
    name: '',
    message_type: messageType,
    subject: '',
    content: '',
    variables: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Şablon adı zorunludur.');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Şablon içeriği zorunludur.');
      return;
    }

    // Extract variables from content
    const variables = extractTemplateVariables(formData.content);
    const finalData = { ...formData, variables };

    onSave(finalData);
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
      variables: extractTemplateVariables(content),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Şablon Adı *</Label>
        <Input
          id="template-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Şablon adını girin"
          className="h-9"
        />
      </div>

      {messageType !== 'sms' && (
        <div className="space-y-2">
          <Label htmlFor="template-subject">Konu</Label>
          <Input
            id="template-subject"
            value={formData.subject}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Şablon konusu"
            className="h-9"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="template-content">İçerik *</Label>
        <Textarea
          id="template-content"
          value={formData.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Şablon içeriğini girin. Değişkenler için {değişken_adı} formatını kullanın."
          rows={6}
        />
      </div>

      {formData.variables && formData.variables.length > 0 && (
        <div className="space-y-2">
          <Label>Bulunan Değişkenler</Label>
          <div className="flex flex-wrap gap-2">
            {formData.variables.map((variable, index) => (
              <Badge key={index} variant="secondary">
                {`{${variable}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Kaydet
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          İptal
        </Button>
      </div>
    </form>
  );
}
