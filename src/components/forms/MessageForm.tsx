'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { useAuthStore } from '@/stores/authStore';
import {
  Loader2,
  X,
  MessageSquare,
  Mail,
  Users,
  Send,
  Save,
  Phone,
  AtSign,
  MessageCircle,
} from 'lucide-react';
import {
  messageSchema,
  type MessageFormData,
  getMessageTypeLabel,
  getStatusLabel,
  getStatusColor,
  validateRecipients,
  getSmsMessageCount,
  estimateSmsCost,
  formatPhoneNumber,
} from '@/lib/validations/message';
import { useFormMutation } from '@/hooks/useFormMutation';
import { toast } from 'sonner';
import type { UserDocument, MessageDocument } from '@/types/database';

interface MessageFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<MessageFormData>;
  messageId?: string; // For edit mode
  defaultMessageType?: 'sms' | 'email' | 'internal' | 'whatsapp';
}

export function MessageForm({
  onSuccess,
  onCancel,
  initialData,
  messageId,
  defaultMessageType,
}: MessageFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditMode = !!messageId;

  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    initialData?.recipients || []
  );
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    initialData?.template_id || null
  );
  const [showPreview, setShowPreview] = useState(false);
  const previousMessageTypeRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message_type: initialData?.message_type || defaultMessageType || 'sms',
      sender: user?.id || '',
      recipients: initialData?.recipients || [],
      subject: initialData?.subject || '',
      content: initialData?.content || '',
      status: (initialData?.status || 'draft') as 'draft' | 'sent' | 'failed',
      is_bulk: initialData?.is_bulk || false,
      template_id: initialData?.template_id || undefined,
      sent_at: initialData?.sent_at || undefined,
    },
  });

  const messageType = watch('message_type');
  const content = watch('content');
  const subject = watch('subject');

  useEffect(() => {
    if (previousMessageTypeRef.current === null) {
      previousMessageTypeRef.current = messageType;
      return;
    }

    if (previousMessageTypeRef.current === messageType) {
      return;
    }

    setSelectedRecipients([]);
    setRecipientInput('');
    setValue('recipients', []);
    previousMessageTypeRef.current = messageType;
  }, [messageType, setValue]);

  // Fetch users for recipient selection (used for internal messaging)
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getUsers({ limit: 200 }),
  });
  const users: UserDocument[] = usersResponse?.data || [];

  useEffect(() => {
    if (initialData) {
      setSelectedRecipients(initialData.recipients || []);
      setSelectedTemplate(initialData.template_id || null);
      // Update form values when initialData changes
      if (initialData.subject) setValue('subject', initialData.subject);
      if (initialData.content) setValue('content', initialData.content);
      if (initialData.message_type) setValue('message_type', initialData.message_type);
      if (initialData.message_type) {
        previousMessageTypeRef.current = initialData.message_type;
      }
    }
  }, [initialData, setValue]);

  const createMessageMutation = useFormMutation<MessageDocument, MessageFormData>({
    queryKey: ['messages'],
    successMessage: 'Mesaj başarıyla oluşturuldu.',
    errorMessage: 'Mesaj oluşturulurken hata oluştu',
    mutationFn: async (data: MessageFormData) => {
      const response = await api.messages.createMessage(data);
      if (response.error) {
        throw new Error(response.error);
      }
      if (!response.data) {
        throw new Error('Mesaj oluşturulamadı');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onSuccess?.();
    },
  });

  const updateMessageMutation = useFormMutation<unknown, { id: string; data: MessageFormData }>({
    queryKey: ['messages'],
    successMessage: 'Mesaj başarıyla güncellendi.',
    errorMessage: 'Mesaj güncellenirken hata oluştu',
    mutationFn: (data: { id: string; data: MessageFormData }) =>
      api.messages.updateMessage(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onSuccess?.();
    },
  });

  const sendMessageMutation = useFormMutation<unknown, string>({
    queryKey: ['messages'],
    successMessage: 'Mesaj başarıyla gönderildi.',
    errorMessage: 'Mesaj gönderilirken hata oluştu',
    mutationFn: (id: string) => api.messages.sendMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onSuccess?.();
    },
  });

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    const rawInput = recipientInput.trim();
    if (!rawInput) {
      return;
    }

    e.preventDefault();

    let recipientValue = rawInput;

    if (messageType === 'internal') {
      if (isLoadingUsers) {
        toast.info('Kullanıcı listesi yükleniyor, lütfen bekleyin.');
        return;
      }

      const matchedUser = users.find((u) => {
        const email = u.email?.toLowerCase();
        const name = u.name?.toLowerCase();
        const normalized = rawInput.toLowerCase();
        return email === normalized || name === normalized;
      });

      if (!matchedUser) {
        toast.error('Kullanıcı bulunamadı. Lütfen kullanıcı adı veya e-postasını doğru girin.');
        return;
      }

      recipientValue = matchedUser._id || matchedUser.$id || '';
    }

    const validationErrors = validateRecipients([recipientValue], messageType);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    if (selectedRecipients.includes(recipientValue)) {
      toast.warning('Bu alıcı zaten eklenmiş.');
      return;
    }

    if (selectedRecipients.length >= 100) {
      toast.warning('En fazla 100 alıcı ekleyebilirsiniz.');
      return;
    }

    const updatedRecipients = [...selectedRecipients, recipientValue];
    setSelectedRecipients(updatedRecipients);
    setValue('recipients', updatedRecipients);
    setRecipientInput('');
  };

  const handleRemoveRecipient = (recipientToRemove: string) => {
    const updatedRecipients = selectedRecipients.filter(
      (recipient) => recipient !== recipientToRemove
    );
    setSelectedRecipients(updatedRecipients);
    setValue('recipients', updatedRecipients);
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!user?.id) {
      toast.error('Gönderen kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    const submissionData = {
      ...data,
      sender: user.id,
      recipients: selectedRecipients,
      is_bulk: selectedRecipients.length > 1,
      template_id: selectedTemplate || undefined,
    };

    if (isEditMode && messageId) {
      await updateMessageMutation.mutateAsync({ id: messageId, data: submissionData });
    } else {
      await createMessageMutation.mutateAsync(submissionData);
    }
  };

  const handleSend = async (data: MessageFormData) => {
    if (!user?.id) {
      toast.error('Gönderen kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error('En az bir alıcı seçmelisiniz.');
      return;
    }

    // Show confirmation for bulk messages
    if (selectedRecipients.length > 1) {
      const confirmed = window.confirm(
        `${selectedRecipients.length} alıcıya mesaj gönderilecek. Emin misiniz?`
      );
      if (!confirmed) return;
    }

    const submissionData = {
      ...data,
      sender: user.id,
      recipients: selectedRecipients,
      is_bulk: selectedRecipients.length > 1,
      template_id: selectedTemplate || undefined,
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
    };

    if (isEditMode && messageId) {
      await updateMessageMutation.mutateAsync({ id: messageId, data: submissionData });
      await sendMessageMutation.mutateAsync(messageId);
    } else {
      const result = await createMessageMutation.mutateAsync(submissionData);
      if (result && typeof result === 'object' && 'data' in result && result.data) {
        await sendMessageMutation.mutateAsync((result.data as { _id: string })._id);
      }
    }
  };

  const getRecipientPlaceholder = () => {
    switch (messageType) {
      case 'sms':
        return 'Telefon numarası girin (5XXXXXXXXX)';
      case 'email':
        return 'E-posta adresi girin';
      case 'internal':
        return 'Kullanıcı e-posta adresi veya adını girin';
      default:
        return 'Alıcı girin';
    }
  };

  const getRecipientIcon = () => {
    switch (messageType) {
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <AtSign className="h-4 w-4" />;
      case 'internal':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRecipientLabel = (recipient: string) => {
    if (messageType === 'internal') {
      const matchedUser = users.find((u) => u._id === recipient);
      if (matchedUser) {
        if (matchedUser.name && matchedUser.email) {
          return `${matchedUser.name} (${matchedUser.email})`;
        }
        return matchedUser.name || matchedUser.email || matchedUser._id;
      }
      return recipient;
    }

    if (messageType === 'sms') {
      return formatPhoneNumber(recipient);
    }

    return recipient;
  };

  const getContentPlaceholder = () => {
    switch (messageType) {
      case 'sms':
        return 'SMS mesajınızı yazın (max 160 karakter)';
      case 'email':
        return 'E-posta içeriğinizi yazın';
      case 'internal':
        return 'Kurum içi mesajınızı yazın';
      default:
        return 'Mesaj içeriğinizi yazın';
    }
  };

  const getContentRows = () => {
    switch (messageType) {
      case 'sms':
        return 4;
      case 'email':
        return 8;
      case 'internal':
        return 6;
      default:
        return 6;
    }
  };

  const getContentMaxLength = () => {
    switch (messageType) {
      case 'sms':
        return 160;
      case 'email':
        return 5000;
      case 'internal':
        return 5000;
      default:
        return 5000;
    }
  };

  const smsMessageCount = messageType === 'sms' ? getSmsMessageCount(content) : 1;
  const estimatedCost =
    messageType === 'sms' ? estimateSmsCost(selectedRecipients.length, content) : 0;

  return (
    <Card className="w-full mx-auto shadow-none border-none">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Mesajı Düzenle' : 'Yeni Mesaj Oluştur'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Message Type */}
          <div className="space-y-2">
            <Label htmlFor="message_type">Mesaj Türü *</Label>
            <Select
              value={messageType}
              onValueChange={(value) =>
                setValue('message_type', value as MessageFormData['message_type'])
              }
              disabled={isEditMode}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Mesaj türü seçin" />
              </SelectTrigger>
              <SelectContent>
                {['sms', 'email', 'internal', 'whatsapp'].map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {type === 'sms' && <Phone className="h-4 w-4" />}
                      {type === 'email' && <Mail className="h-4 w-4" />}
                      {type === 'internal' && <Users className="h-4 w-4" />}
                      {type === 'whatsapp' && <MessageCircle className="h-4 w-4" />}
                      {getMessageTypeLabel(type as MessageFormData['message_type'])}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.message_type && (
              <p className="text-sm text-red-600">{errors.message_type.message}</p>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="recipients">Alıcılar ({selectedRecipients.length}/100) *</Label>
            <div className="relative">
              {getRecipientIcon()}
              <Input
                id="recipients"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleAddRecipient}
                placeholder={getRecipientPlaceholder()}
                className="h-9 pl-10"
                disabled={messageType === 'internal' && isLoadingUsers}
              />
            </div>
            {errors.recipients && (
              <p className="text-sm text-red-600">{errors.recipients.message}</p>
            )}
            {messageType === 'internal' &&
              selectedRecipients.length === 0 &&
              !isLoadingUsers &&
              users.length === 0 && (
                <p className="text-sm text-gray-500">
                  Kayıtlı kullanıcı bulunamadı. Kurum içi mesaj göndermek için önce kullanıcı
                  ekleyin.
                </p>
              )}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRecipients.map((recipient, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {getRecipientLabel(recipient)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveRecipient(recipient)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Subject (conditional) */}
          {messageType !== 'sms' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Konu *</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="Mesaj konusu"
                className="h-9"
              />
              {errors.subject && <p className="text-sm text-red-600">{errors.subject.message}</p>}
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">İçerik *</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder={getContentPlaceholder()}
              rows={getContentRows()}
              maxLength={getContentMaxLength()}
            />
            {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}

            {/* Character count and warnings */}
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {content.length}/{getContentMaxLength()} karakter
              </span>
              {messageType === 'sms' && (
                <div className="flex items-center gap-2">
                  {smsMessageCount > 1 && (
                    <span className="text-orange-600">
                      {smsMessageCount} SMS olarak gönderilecek
                    </span>
                  )}
                  {estimatedCost > 0 && (
                    <span className="text-blue-600">
                      Tahmini maliyet: {estimatedCost.toFixed(2)} ₺
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Display (edit mode only) */}
          {isEditMode && (
            <div className="space-y-2">
              <Label>Durum</Label>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(watch('status') || 'draft')}>
                  {getStatusLabel(watch('status') || 'draft')}
                </Badge>
                {watch('sent_at') && (
                  <span className="text-sm text-gray-500">
                    Gönderim: {new Date(watch('sent_at')!).toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPreview(!showPreview);
              }}
              className="w-full"
            >
              {showPreview ? 'Önizlemeyi Gizle' : 'Önizleme'}
            </Button>

            {showPreview && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Tür:</strong> {getMessageTypeLabel(messageType)}
                    </div>
                    {subject && (
                      <div className="text-sm text-gray-600">
                        <strong>Konu:</strong> {subject}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <strong>Alıcılar:</strong> {selectedRecipients.length} kişi
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>İçerik:</strong>
                    </div>
                    <div className="bg-card p-3 rounded border border-border text-sm">
                      {content || 'İçerik yok'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : isEditMode ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Güncelle
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Taslak Olarak Kaydet
                </>
              )}
            </Button>

            {!isEditMode && (
              <Button
                type="button"
                onClick={() => {
                  const data = watch() as MessageFormData;
                  handleSend(data);
                }}
                disabled={isSubmitting || selectedRecipients.length === 0}
                className="flex-1 sm:flex-none"
              >
                <Send className="mr-2 h-4 w-4" />
                Gönder
              </Button>
            )}

            {isEditMode && watch('status') === 'draft' && (
              <Button
                type="button"
                onClick={handleSubmit(handleSend)}
                disabled={isSubmitting || selectedRecipients.length === 0}
                className="flex-1 sm:flex-none"
              >
                <Send className="mr-2 h-4 w-4" />
                Gönder
              </Button>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                İptal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
