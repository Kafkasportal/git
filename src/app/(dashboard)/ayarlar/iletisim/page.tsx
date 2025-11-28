'use client';

/**
 * Communication Settings Page
 * Manage Email/SMTP, SMS/Twilio, and WhatsApp configurations
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Mail,
  MessageSquare,
  Phone,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Send,
  Shield,
  Server,
  Key,
} from 'lucide-react';

export default function CommunicationSettingsPage() {
  const queryClient = useQueryClient();

  // Fetch all communication settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['communication-settings'],
    queryFn: async () => {
      const response = await fetch('/api/communication');
      if (!response.ok) throw new Error('Failed to fetch communication settings');
      return response.json();
    },
  });

  // Email form state
  const [emailForm, setEmailForm] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    enabled: false,
  });

  // SMS form state
  const [smsForm, setSmsForm] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    twilioMessagingServiceSid: '',
    enabled: false,
    testMode: true,
  });

  // WhatsApp form state
  const [whatsappForm, setWhatsappForm] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    webhookVerifyToken: '',
    enabled: false,
    testMode: true,
  });

  // Track previous data key to prevent re-initialization
  const previousDataKeyRef = useRef<string>('');

  // Update forms when settings data loads (only when data actually changes)
  useEffect(() => {
    // Skip if no data
    if (!settingsData?.data) {
      return;
    }

    // Create a stable key from the data
    const dataKey = JSON.stringify(settingsData.data);

    // Skip if data hasn't changed
    if (previousDataKeyRef.current === dataKey) {
      return;
    }

    previousDataKeyRef.current = dataKey;
    const settings = settingsData.data;

    // Update email form only if email settings exist
    if (settings.email && Object.keys(settings.email).length > 0) {
      setEmailForm({
        smtpHost: settings.email.smtpHost || '',
        smtpPort: settings.email.smtpPort || 587,
        smtpUser: settings.email.smtpUser || '',
        smtpPassword: settings.email.smtpPassword || '',
        smtpSecure: settings.email.smtpSecure ?? true,
        fromEmail: settings.email.fromEmail || '',
        fromName: settings.email.fromName || '',
        replyToEmail: settings.email.replyToEmail || '',
        enabled: settings.email.enabled ?? false,
      });
    }

    // Update SMS form only if SMS settings exist
    if (settings.sms && Object.keys(settings.sms).length > 0) {
      setSmsForm({
        twilioAccountSid: settings.sms.twilioAccountSid || '',
        twilioAuthToken: settings.sms.twilioAuthToken || '',
        twilioPhoneNumber: settings.sms.twilioPhoneNumber || '',
        twilioMessagingServiceSid: settings.sms.twilioMessagingServiceSid || '',
        enabled: settings.sms.enabled ?? false,
        testMode: settings.sms.testMode ?? true,
      });
    }

    // Update WhatsApp form only if WhatsApp settings exist
    if (settings.whatsapp && Object.keys(settings.whatsapp).length > 0) {
      setWhatsappForm({
        phoneNumberId: settings.whatsapp.phoneNumberId || '',
        accessToken: settings.whatsapp.accessToken || '',
        businessAccountId: settings.whatsapp.businessAccountId || '',
        webhookVerifyToken: settings.whatsapp.webhookVerifyToken || '',
        enabled: settings.whatsapp.enabled ?? false,
        testMode: settings.whatsapp.testMode ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData?.data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: 'email' | 'sms' | 'whatsapp';
      data: Record<string, any>;
    }) => {
      const response = await fetch(`/api/communication?type=${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type.toUpperCase()} ayarları başarıyla kaydedildi`);
      void queryClient.invalidateQueries({ queryKey: ['communication-settings'] });
    },
    onError: (error: Error, variables) => {
      toast.error(`${variables.type.toUpperCase()} ayarları kaydedilemedi: ${error.message}`);
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'email', data: emailForm });
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'sms', data: smsForm });
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'whatsapp', data: whatsappForm });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>İletişim ayarları yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            İletişim Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            E-posta, SMS ve WhatsApp iletişim kanallarını yapılandırın
          </p>
        </div>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-posta (SMTP)
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            SMS (Twilio)
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* Email/SMTP Tab */}
        <TabsContent value="email" className="space-y-6">
          <form onSubmit={handleEmailSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      E-posta / SMTP Ayarları
                    </CardTitle>
                    <CardDescription>
                      SMTP sunucu bilgileri ve e-posta gönderim yapılandırması
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email-enabled">Aktif</Label>
                    <Switch
                      id="email-enabled"
                      checked={emailForm.enabled}
                      onCheckedChange={(checked) =>
                        setEmailForm({ ...emailForm, enabled: checked })
                      }
                    />
                    {emailForm.enabled ? (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <XCircle className="w-3 h-3 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SMTP Server Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    SMTP Sunucu Bilgileri
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host *</Label>
                      <Input
                        id="smtp-host"
                        value={emailForm.smtpHost}
                        onChange={(e) => setEmailForm({ ...emailForm, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port *</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={emailForm.smtpPort}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, smtpPort: parseInt(e.target.value) })
                        }
                        placeholder="587"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">SMTP Kullanıcı Adı *</Label>
                    <Input
                      id="smtp-user"
                      value={emailForm.smtpUser}
                      onChange={(e) => setEmailForm({ ...emailForm, smtpUser: e.target.value })}
                      placeholder="kullanici@domain.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-password" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      SMTP Şifre *
                    </Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={emailForm.smtpPassword}
                      onChange={(e) => setEmailForm({ ...emailForm, smtpPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtp-secure"
                      checked={emailForm.smtpSecure}
                      onCheckedChange={(checked) =>
                        setEmailForm({ ...emailForm, smtpSecure: checked })
                      }
                    />
                    <Label htmlFor="smtp-secure">
                      TLS/SSL Güvenli Bağlantı (Port 587 için önerilir)
                    </Label>
                  </div>
                </div>

                {/* Email Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta Ayarları
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-email">Gönderen E-posta *</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={emailForm.fromEmail}
                        onChange={(e) => setEmailForm({ ...emailForm, fromEmail: e.target.value })}
                        placeholder="noreply@kafkasder.org"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from-name">Gönderen Adı *</Label>
                      <Input
                        id="from-name"
                        value={emailForm.fromName}
                        onChange={(e) => setEmailForm({ ...emailForm, fromName: e.target.value })}
                        placeholder="Kafkasder"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reply-to">Cevap E-postası</Label>
                    <Input
                      id="reply-to"
                      type="email"
                      value={emailForm.replyToEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, replyToEmail: e.target.value })}
                      placeholder="info@kafkasder.org"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                    {updateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.info('Test e-posta özelliği yakında gelecek')}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Test E-posta Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* SMS/Twilio Tab */}
        <TabsContent value="sms" className="space-y-6">
          <form onSubmit={handleSmsSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      SMS / Twilio Ayarları
                    </CardTitle>
                    <CardDescription>Twilio SMS API yapılandırması</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sms-enabled">Aktif</Label>
                    <Switch
                      id="sms-enabled"
                      checked={smsForm.enabled}
                      onCheckedChange={(checked) => setSmsForm({ ...smsForm, enabled: checked })}
                    />
                    {smsForm.enabled ? (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <XCircle className="w-3 h-3 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilio-sid" className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Twilio Account SID *
                    </Label>
                    <Input
                      id="twilio-sid"
                      value={smsForm.twilioAccountSid}
                      onChange={(e) => setSmsForm({ ...smsForm, twilioAccountSid: e.target.value })}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilio-token" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Twilio Auth Token *
                    </Label>
                    <Input
                      id="twilio-token"
                      type="password"
                      value={smsForm.twilioAuthToken}
                      onChange={(e) => setSmsForm({ ...smsForm, twilioAuthToken: e.target.value })}
                      placeholder="••••••••••••••••••••••••••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilio-phone">Twilio Telefon Numarası *</Label>
                    <Input
                      id="twilio-phone"
                      value={smsForm.twilioPhoneNumber}
                      onChange={(e) =>
                        setSmsForm({ ...smsForm, twilioPhoneNumber: e.target.value })
                      }
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilio-service">Messaging Service SID (Opsiyonel)</Label>
                    <Input
                      id="twilio-service"
                      value={smsForm.twilioMessagingServiceSid}
                      onChange={(e) =>
                        setSmsForm({ ...smsForm, twilioMessagingServiceSid: e.target.value })
                      }
                      placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sms-test-mode"
                      checked={smsForm.testMode}
                      onCheckedChange={(checked) => setSmsForm({ ...smsForm, testMode: checked })}
                    />
                    <Label htmlFor="sms-test-mode">
                      Test Modu (SMS gönderilmez, sadece log kaydı tutulur)
                    </Label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                    {updateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.info('Test SMS özelliği yakında gelecek')}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Test SMS Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <form onSubmit={handleWhatsAppSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      WhatsApp Business API Ayarları
                    </CardTitle>
                    <CardDescription>Meta WhatsApp Business API yapılandırması</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="whatsapp-enabled">Aktif</Label>
                    <Switch
                      id="whatsapp-enabled"
                      checked={whatsappForm.enabled}
                      onCheckedChange={(checked) =>
                        setWhatsappForm({ ...whatsappForm, enabled: checked })
                      }
                    />
                    {whatsappForm.enabled ? (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <XCircle className="w-3 h-3 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone-id">Phone Number ID *</Label>
                    <Input
                      id="wa-phone-id"
                      value={whatsappForm.phoneNumberId}
                      onChange={(e) =>
                        setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })
                      }
                      placeholder="123456789012345"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-token" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Access Token *
                    </Label>
                    <Input
                      id="wa-token"
                      type="password"
                      value={whatsappForm.accessToken}
                      onChange={(e) =>
                        setWhatsappForm({ ...whatsappForm, accessToken: e.target.value })
                      }
                      placeholder="••••••••••••••••••••••••••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-business-id">Business Account ID *</Label>
                    <Input
                      id="wa-business-id"
                      value={whatsappForm.businessAccountId}
                      onChange={(e) =>
                        setWhatsappForm({ ...whatsappForm, businessAccountId: e.target.value })
                      }
                      placeholder="123456789012345"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-webhook" className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Webhook Verify Token *
                    </Label>
                    <Input
                      id="wa-webhook"
                      type="password"
                      value={whatsappForm.webhookVerifyToken}
                      onChange={(e) =>
                        setWhatsappForm({ ...whatsappForm, webhookVerifyToken: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wa-test-mode"
                      checked={whatsappForm.testMode}
                      onCheckedChange={(checked) =>
                        setWhatsappForm({ ...whatsappForm, testMode: checked })
                      }
                    />
                    <Label htmlFor="wa-test-mode">
                      Test Modu (Mesaj gönderilmez, sadece log kaydı tutulur)
                    </Label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                    {updateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.info('Test WhatsApp özelliği yakında gelecek')}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Test Mesaj Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
