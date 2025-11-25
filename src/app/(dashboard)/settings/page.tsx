'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  settingsApi,
  type OrganizationSettings,
  type EmailSettings,
  type NotificationSettings,
  type SystemSettings,
  type SecuritySettings,
} from '@/lib/api/settings';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const organizationSchema = z.object({
  name: z.string().min(1, 'Organizasyon adı gerekli'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli bir e-posta adresi girin').optional().or(z.literal('')),
});

const emailSchema = z.object({
  enabled: z.boolean(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().email('Geçerli bir e-posta adresi girin').optional().or(z.literal('')),
});

const systemSchema = z.object({
  sessionTimeout: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(3).max(10),
  maintenanceMode: z.boolean(),
});

const securitySchema = z.object({
  requireTwoFactor: z.boolean(),
  passwordMinLength: z.number().min(6).max(20),
  sessionTimeout: z.number().min(5).max(1440),
});

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('organization');
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings
  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await settingsApi.getSettings();
      if (!response.success || !response.data) {
        return {};
      }
      return response.data as {
        organization?: OrganizationSettings;
        email?: EmailSettings;
        notifications?: NotificationSettings;
        system?: SystemSettings;
        security?: SecuritySettings;
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize form state with defaults
  const [settings, setSettings] = useState({
    organization: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
    email: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false,
    },
    system: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      maintenanceMode: false,
    },
    security: {
      requireTwoFactor: false,
      passwordMinLength: 8,
      sessionTimeout: 30,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (allSettings) {
      setSettings((prev) => ({
        organization: {
          name: allSettings.organization?.name || prev.organization.name,
          address: allSettings.organization?.address || prev.organization.address,
          phone: allSettings.organization?.phone || prev.organization.phone,
          email: allSettings.organization?.email || prev.organization.email,
        },
        email: {
          enabled: allSettings.email?.enabled ?? prev.email.enabled,
          smtpHost: allSettings.email?.smtpHost || prev.email.smtpHost,
          smtpPort: allSettings.email?.smtpPort ?? prev.email.smtpPort,
          smtpUser: allSettings.email?.smtpUser || prev.email.smtpUser,
          smtpPassword: allSettings.email?.smtpPassword || prev.email.smtpPassword,
          fromEmail: allSettings.email?.fromEmail || prev.email.fromEmail,
        },
        notifications: {
          emailNotifications:
            allSettings.notifications?.emailNotifications ?? prev.notifications.emailNotifications,
          pushNotifications:
            allSettings.notifications?.pushNotifications ?? prev.notifications.pushNotifications,
          smsNotifications:
            allSettings.notifications?.smsNotifications ?? prev.notifications.smsNotifications,
        },
        system: {
          sessionTimeout: allSettings.system?.sessionTimeout ?? prev.system.sessionTimeout,
          maxLoginAttempts: allSettings.system?.maxLoginAttempts ?? prev.system.maxLoginAttempts,
          maintenanceMode: allSettings.system?.maintenanceMode ?? prev.system.maintenanceMode,
        },
        security: {
          requireTwoFactor:
            allSettings.security?.requireTwoFactor ?? prev.security.requireTwoFactor,
          passwordMinLength:
            allSettings.security?.passwordMinLength ?? prev.security.passwordMinLength,
          sessionTimeout: allSettings.security?.sessionTimeout ?? prev.security.sessionTimeout,
        },
      }));
      setHasChanges(false);
    }
  }, [allSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (category: string, categorySettings: unknown) => {
      const response = await settingsApi.updateCategorySettings(
        category as 'organization' | 'email' | 'notifications' | 'system',
        categorySettings as Record<string, unknown>
      );
      if (!response.success) {
        throw new Error(response.error || 'Ayarlar kaydedilemedi');
      }
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Ayarlar başarıyla kaydedildi');
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ayarlar kaydedilirken hata oluştu');
    },
  });

  const handleSave = async () => {
    try {
      // Validate based on active tab
      let categorySettings: Record<string, unknown>;
      let category: string;

      switch (activeTab) {
        case 'organization':
          category = 'organization';
          categorySettings = organizationSchema.parse(settings.organization);
          break;
        case 'email':
          category = 'email';
          categorySettings = emailSchema.parse(settings.email);
          break;
        case 'system':
          category = 'system';
          categorySettings = systemSchema.parse(settings.system);
          break;
        case 'security':
          category = 'security';
          categorySettings = securitySchema.parse(settings.security);
          break;
        case 'notifications':
          category = 'notifications';
          categorySettings = settings.notifications;
          break;
        default:
          return;
      }

      await saveMutation.mutateAsync(category, categorySettings);
    } catch (error: unknown) {
      const errorObj = error as { errors?: Array<{ message?: string }> };
      if (errorObj?.errors && Array.isArray(errorObj.errors)) {
        const firstError = errorObj.errors[0];
        toast.error(firstError?.message || 'Form validasyon hatası');
      }
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        'Bu kategori ayarlarını varsayılan değerlere sıfırlamak istediğinizden emin misiniz?'
      )
    ) {
      return;
    }

    try {
      const response = await settingsApi.resetSettings(
        activeTab as 'organization' | 'email' | 'notifications' | 'system'
      );
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['system-settings'] });
        toast.success('Ayarlar varsayılan değerlere sıfırlandı');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ayarlar sıfırlanırken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Ayarlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  const hasOrganizationName = settings.organization.name.trim() !== '';

  return (
    <div data-testid="settings-page" className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ayarlarını yapılandırın</p>
      </div>

      {!hasOrganizationName ? (
        <Card>
          <CardHeader>
            <CardTitle>Ayarları Başlat</CardTitle>
            <CardDescription>
              İlk kez ayarları yapılandırıyorsunuz. Organizasyon bilgilerini girin ve başlayın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name-init">Organizasyon Adı *</Label>
                <Input
                  id="org-name-init"
                  data-testid="settings-org-name"
                  value={settings.organization.name}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      organization: { ...prev.organization, name: e.target.value },
                    }));
                    setHasChanges(true);
                  }}
                />
              </div>
              <Button
                data-testid="settings-initialize-button"
                onClick={() => {
                  if (settings.organization.name.trim()) {
                    void handleSave();
                  } else {
                    toast.error('Organizasyon adı gerekli');
                  }
                }}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Ayarları Oluştur'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="settings-tabs-list" className="grid w-full grid-cols-5">
            <TabsTrigger data-testid="settings-tab-organization" value="organization">
              Organizasyon
            </TabsTrigger>
            <TabsTrigger data-testid="settings-tab-email" value="email">
              E-posta
            </TabsTrigger>
            <TabsTrigger data-testid="settings-tab-notifications" value="notifications">
              Bildirimler
            </TabsTrigger>
            <TabsTrigger data-testid="settings-tab-system" value="system">
              Sistem
            </TabsTrigger>
            <TabsTrigger data-testid="settings-tab-security" value="security">
              Güvenlik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organizasyon Bilgileri</CardTitle>
                <CardDescription>Dernek organizasyon bilgilerini güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organizasyon Adı *</Label>
                  <Input
                    id="org-name"
                    data-testid="settings-org-name"
                    value={settings.organization.name}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        organization: { ...prev.organization, name: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="org-address">Adres</Label>
                  <Input
                    id="org-address"
                    data-testid="settings-org-address"
                    value={settings.organization.address}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        organization: { ...prev.organization, address: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="org-phone">Telefon</Label>
                  <Input
                    id="org-phone"
                    data-testid="settings-org-phone"
                    value={settings.organization.phone}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        organization: { ...prev.organization, phone: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="org-email">E-posta</Label>
                  <Input
                    id="org-email"
                    data-testid="settings-org-email"
                    type="email"
                    value={settings.organization.email}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        organization: { ...prev.organization, email: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>E-posta Ayarları</CardTitle>
                <CardDescription>SMTP sunucu ayarlarını yapılandırın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="settings-smtp-enabled"
                    checked={settings.email.enabled}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, enabled: checked },
                      }));
                      setHasChanges(true);
                    }}
                  />
                  <Label htmlFor="smtp-enabled">SMTP Etkin</Label>
                </div>

                {settings.email.enabled && (
                  <>
                    <div>
                      <Label htmlFor="smtp-host">SMTP Sunucu *</Label>
                      <Input
                        id="smtp-host"
                        data-testid="settings-smtp-host"
                        value={settings.email.smtpHost}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            email: { ...prev.email, smtpHost: e.target.value },
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        data-testid="settings-smtp-port"
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            email: { ...prev.email, smtpPort: parseInt(e.target.value) || 587 },
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-user">SMTP Kullanıcı</Label>
                      <Input
                        id="smtp-user"
                        data-testid="settings-smtp-user"
                        value={settings.email.smtpUser}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            email: { ...prev.email, smtpUser: e.target.value },
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-password">SMTP Şifre</Label>
                      <Input
                        id="smtp-password"
                        data-testid="settings-smtp-password"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            email: { ...prev.email, smtpPassword: e.target.value },
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="from-email">Gönderen E-posta</Label>
                      <Input
                        id="from-email"
                        data-testid="settings-from-email"
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            email: { ...prev.email, fromEmail: e.target.value },
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>Bildirim tercihlerini yapılandırın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="settings-email-notifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailNotifications: checked },
                      }));
                      setHasChanges(true);
                    }}
                  />
                  <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="settings-push-notifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, pushNotifications: checked },
                      }));
                      setHasChanges(true);
                    }}
                  />
                  <Label htmlFor="push-notifications">Push Bildirimleri</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="settings-sms-notifications"
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, smsNotifications: checked },
                      }));
                      setHasChanges(true);
                    }}
                  />
                  <Label htmlFor="sms-notifications">SMS Bildirimleri</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Ayarları</CardTitle>
                <CardDescription>Sistem genel ayarlarını yapılandırın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="session-timeout">Oturum Zaman Aşımı (dakika)</Label>
                  <Input
                    id="session-timeout"
                    data-testid="settings-session-timeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.system.sessionTimeout}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        system: { ...prev.system, sessionTimeout: parseInt(e.target.value) || 30 },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max-login-attempts">Maksimum Giriş Denemesi</Label>
                  <Input
                    id="max-login-attempts"
                    data-testid="settings-max-login-attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.system.maxLoginAttempts}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        system: { ...prev.system, maxLoginAttempts: parseInt(e.target.value) || 5 },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="settings-maintenance-mode"
                    checked={settings.system.maintenanceMode}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({
                        ...prev,
                        system: { ...prev.system, maintenanceMode: checked },
                      }));
                      setHasChanges(true);
                    }}
                  />
                  <Label htmlFor="maintenance-mode">Bakım Modu</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
                <CardDescription>
                  Güvenlik ve kimlik doğrulama ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="settings-require-two-factor"
                    checked={settings.security.requireTwoFactor}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({
                        ...prev,
                        security: { ...prev.security, requireTwoFactor: checked },
                      }));
                      setHasChanges(true);
                    }}
                  />
                  <Label htmlFor="require-two-factor">İki Faktörlü Kimlik Doğrulama</Label>
                </div>
                <div>
                  <Label htmlFor="password-min-length">Minimum Şifre Uzunluğu</Label>
                  <Input
                    id="password-min-length"
                    data-testid="settings-password-min-length"
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          passwordMinLength: parseInt(e.target.value) || 8,
                        },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="security-session-timeout">
                    Güvenlik Oturum Zaman Aşımı (dakika)
                  </Label>
                  <Input
                    id="security-session-timeout"
                    data-testid="settings-security-session-timeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          sessionTimeout: parseInt(e.target.value) || 30,
                        },
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Kategoriyi Sıfırla
            </Button>
            <Button
              data-testid="settings-save-button"
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </Tabs>
      )}
    </div>
  );
}
