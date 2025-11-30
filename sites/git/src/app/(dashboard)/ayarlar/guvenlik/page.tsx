'use client';

/**
 * Security Settings Page
 * Manage password policies, sessions, 2FA, and general security configurations
 * SUPER ADMIN ONLY
 */

import { useState, useEffect, useMemo } from 'react';
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
  Shield,
  Lock,
  Key,
  Clock,
  AlertTriangle,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Activity,
} from 'lucide-react';

export default function SecuritySettingsPage() {
  const queryClient = useQueryClient();

  // Fetch security settings
  const {
    data: settingsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const response = await fetch('/api/security');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch security settings');
      }
      return response.json();
    },
    retry: 1,
  });

  // Memoize settings to prevent unnecessary re-renders
  const settings = useMemo(() => settingsData?.data || {}, [settingsData?.data]);

  // Password Policy form
  const [passwordForm, setPasswordForm] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90,
    preventReuse: 5,
    lockoutAttempts: 5,
    lockoutDuration: 30,
  });

  // Session form
  const [sessionForm, setSessionForm] = useState({
    sessionTimeout: 120,
    maxConcurrentSessions: 3,
    requireReauthForSensitive: true,
    rememberMeDuration: 30,
    enableSessionMonitoring: true,
  });

  // 2FA form
  const [tfaForm, setTfaForm] = useState({
    enabled: false,
    required: false,
    gracePeriod: 7,
  });

  // General Security form
  const [generalForm, setGeneralForm] = useState({
    enableAuditLog: true,
    enableIpWhitelist: false,
    enableRateLimiting: true,
    enableBruteForceProtection: true,
    enableCsrfProtection: true,
    securityEmailAlerts: true,
    suspiciousActivityThreshold: 10,
  });

  // Update forms when data loads
  // This effect synchronizes external API data (settings) with form state
  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- External data sync is the intended use case
      setPasswordForm({
        minLength: settings.minLength ?? 8,
        requireUppercase: settings.requireUppercase ?? true,
        requireLowercase: settings.requireLowercase ?? true,
        requireNumbers: settings.requireNumbers ?? true,
        requireSpecialChars: settings.requireSpecialChars ?? true,
        maxAge: settings.maxAge ?? 90,
        preventReuse: settings.preventReuse ?? 5,
        lockoutAttempts: settings.lockoutAttempts ?? 5,
        lockoutDuration: settings.lockoutDuration ?? 30,
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect -- External data sync is the intended use case
      setSessionForm({
        sessionTimeout: settings.sessionTimeout ?? 120,
        maxConcurrentSessions: settings.maxConcurrentSessions ?? 3,
        requireReauthForSensitive: settings.requireReauthForSensitive ?? true,
        rememberMeDuration: settings.rememberMeDuration ?? 30,
        enableSessionMonitoring: settings.enableSessionMonitoring ?? true,
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect -- External data sync is the intended use case
      setTfaForm({
        enabled: settings.enabled ?? false,
        required: settings.required ?? false,
        gracePeriod: settings.gracePeriod ?? 7,
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect -- External data sync is the intended use case
      setGeneralForm({
        enableAuditLog: settings.enableAuditLog ?? true,
        enableIpWhitelist: settings.enableIpWhitelist ?? false,
        enableRateLimiting: settings.enableRateLimiting ?? true,
        enableBruteForceProtection: settings.enableBruteForceProtection ?? true,
        enableCsrfProtection: settings.enableCsrfProtection ?? true,
        securityEmailAlerts: settings.securityEmailAlerts ?? true,
        suspiciousActivityThreshold: settings.suspiciousActivityThreshold ?? 10,
      });
    }
  }, [settings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: 'password' | 'session' | '2fa' | 'general';
      data: Record<string, any>;
    }) => {
      const response = await fetch(`/api/security?type=${type}`, {
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
      toast.success(`${variables.type.toUpperCase()} güvenlik ayarları kaydedildi`);
      void queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
    onError: (error: Error) => {
      toast.error(`Güvenlik ayarları kaydedilemedi: ${error.message}`);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'password', data: passwordForm });
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'session', data: sessionForm });
  };

  const handleTfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: '2fa', data: tfaForm });
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'general', data: generalForm });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Güvenlik ayarları yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Hata Oluştu
            </CardTitle>
            <CardDescription>Güvenlik ayarları yüklenirken bir hata oluştu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}
            </p>
            <Button
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ['security-settings'] });
              }}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Güvenlik Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            Şifre politikaları, oturum yönetimi, 2FA ve genel güvenlik yapılandırması
          </p>
          <Badge variant="destructive" className="mt-2">
            <AlertTriangle className="w-3 h-3 mr-1" />
            SUPER ADMIN ONLY
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="password" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Şifre Politikası
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Oturum Yönetimi
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4" />
            2FA Ayarları
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Genel Güvenlik
          </TabsTrigger>
        </TabsList>

        {/* Password Policy Tab */}
        <TabsContent value="password" className="space-y-6">
          <form onSubmit={handlePasswordSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Şifre Politika Ayarları
                </CardTitle>
                <CardDescription>
                  Kullanıcı şifrelerinin güvenlik gereksinimlerini belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Requirements */}
                <div className="space-y-4">
                  <h4 className="font-medium">Şifre Gereksinimleri</h4>

                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Şifre Uzunluğu</Label>
                    <Input
                      id="min-length"
                      type="number"
                      min={4}
                      max={32}
                      value={passwordForm.minLength}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, minLength: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-upper">Büyük Harf Zorunlu</Label>
                    <Switch
                      id="require-upper"
                      checked={passwordForm.requireUppercase}
                      onCheckedChange={(checked) =>
                        setPasswordForm({ ...passwordForm, requireUppercase: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-lower">Küçük Harf Zorunlu</Label>
                    <Switch
                      id="require-lower"
                      checked={passwordForm.requireLowercase}
                      onCheckedChange={(checked) =>
                        setPasswordForm({ ...passwordForm, requireLowercase: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-numbers">Rakam Zorunlu</Label>
                    <Switch
                      id="require-numbers"
                      checked={passwordForm.requireNumbers}
                      onCheckedChange={(checked) =>
                        setPasswordForm({ ...passwordForm, requireNumbers: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-special">Özel Karakter Zorunlu (!@#$%)</Label>
                    <Switch
                      id="require-special"
                      checked={passwordForm.requireSpecialChars}
                      onCheckedChange={(checked) =>
                        setPasswordForm({ ...passwordForm, requireSpecialChars: checked })
                      }
                    />
                  </div>
                </div>

                {/* Password Policies */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Şifre Politikaları</h4>

                  <div className="space-y-2">
                    <Label htmlFor="max-age">Şifre Geçerlilik Süresi (gün)</Label>
                    <Input
                      id="max-age"
                      type="number"
                      min={0}
                      max={365}
                      value={passwordForm.maxAge}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, maxAge: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = sınırsız (şifrenin süresi dolmaz)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prevent-reuse">Geçmiş Şifre Kontrolü (son N şifre)</Label>
                    <Input
                      id="prevent-reuse"
                      type="number"
                      min={0}
                      max={10}
                      value={passwordForm.preventReuse}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, preventReuse: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Kullanıcı son N şifresini tekrar kullanamaz
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockout-attempts">Hesap Kilitleme (başarısız giriş)</Label>
                    <Input
                      id="lockout-attempts"
                      type="number"
                      min={3}
                      max={20}
                      value={passwordForm.lockoutAttempts}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          lockoutAttempts: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockout-duration">Kilitleme Süresi (dakika)</Label>
                    <Input
                      id="lockout-duration"
                      type="number"
                      min={5}
                      max={1440}
                      value={passwordForm.lockoutDuration}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          lockoutDuration: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Save Button */}
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
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Session Management Tab */}
        <TabsContent value="session" className="space-y-6">
          <form onSubmit={handleSessionSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Oturum Yönetimi Ayarları
                </CardTitle>
                <CardDescription>Kullanıcı oturumlarını ve güvenliği yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Oturum Zaman Aşımı (dakika)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min={5}
                      max={1440}
                      value={sessionForm.sessionTimeout}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          sessionTimeout: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-sessions">Maksimum Eş Zamanlı Oturum</Label>
                    <Input
                      id="max-sessions"
                      type="number"
                      min={1}
                      max={10}
                      value={sessionForm.maxConcurrentSessions}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          maxConcurrentSessions: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remember-me">Beni Hatırla Süresi (gün)</Label>
                    <Input
                      id="remember-me"
                      type="number"
                      min={1}
                      max={90}
                      value={sessionForm.rememberMeDuration}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          rememberMeDuration: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Label htmlFor="reauth-sensitive">
                      Hassas İşlemler İçin Yeniden Kimlik Doğrulama
                    </Label>
                    <Switch
                      id="reauth-sensitive"
                      checked={sessionForm.requireReauthForSensitive}
                      onCheckedChange={(checked) =>
                        setSessionForm({ ...sessionForm, requireReauthForSensitive: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="session-monitoring">Oturum İzleme Aktif</Label>
                    <Switch
                      id="session-monitoring"
                      checked={sessionForm.enableSessionMonitoring}
                      onCheckedChange={(checked) =>
                        setSessionForm({ ...sessionForm, enableSessionMonitoring: checked })
                      }
                    />
                  </div>
                </div>

                {/* Save Button */}
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
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* 2FA Tab */}
        <TabsContent value="2fa" className="space-y-6">
          <form onSubmit={handleTfaSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5" />
                      İki Faktörlü Kimlik Doğrulama (2FA)
                    </CardTitle>
                    <CardDescription>
                      Ekstra güvenlik katmanı ile hesap güvenliğini artırın
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="2fa-enabled">Aktif</Label>
                    <Switch
                      id="2fa-enabled"
                      checked={tfaForm.enabled}
                      onCheckedChange={(checked) => setTfaForm({ ...tfaForm, enabled: checked })}
                    />
                    {tfaForm.enabled ? (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="2fa-required">Tüm Kullanıcılar İçin Zorunlu</Label>
                    <Switch
                      id="2fa-required"
                      checked={tfaForm.required}
                      onCheckedChange={(checked) => setTfaForm({ ...tfaForm, required: checked })}
                      disabled={!tfaForm.enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grace-period">Zorunlu Hale Gelme Süresi (gün)</Label>
                    <Input
                      id="grace-period"
                      type="number"
                      min={0}
                      max={90}
                      value={tfaForm.gracePeriod}
                      onChange={(e) =>
                        setTfaForm({ ...tfaForm, gracePeriod: parseInt(e.target.value) })
                      }
                      disabled={!tfaForm.required}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kullanıcılara 2FA kurulumu için verilen süre
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Desteklenen 2FA Yöntemleri
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>TOTP (Google Authenticator, Authy)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>SMS (Twilio entegrasyonu gerekli)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>E-posta (SMTP yapılandırması gerekli)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
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
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* General Security Tab */}
        <TabsContent value="general" className="space-y-6">
          <form onSubmit={handleGeneralSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Genel Güvenlik Ayarları
                </CardTitle>
                <CardDescription>
                  Sistem genelinde güvenlik özelliklerini yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="audit-log">Audit Log (Denetim Kaydı)</Label>
                      <p className="text-xs text-muted-foreground">Tüm önemli işlemleri kaydet</p>
                    </div>
                    <Switch
                      id="audit-log"
                      checked={generalForm.enableAuditLog}
                      onCheckedChange={(checked) =>
                        setGeneralForm({ ...generalForm, enableAuditLog: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ip-whitelist">IP Beyaz Listesi</Label>
                      <p className="text-xs text-muted-foreground">
                        Sadece belirli IP&apos;lerden erişim
                      </p>
                    </div>
                    <Switch
                      id="ip-whitelist"
                      checked={generalForm.enableIpWhitelist}
                      onCheckedChange={(checked) =>
                        setGeneralForm({ ...generalForm, enableIpWhitelist: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="rate-limiting">Rate Limiting (Hız Sınırlama)</Label>
                      <p className="text-xs text-muted-foreground">API istek limitleri</p>
                    </div>
                    <Switch
                      id="rate-limiting"
                      checked={generalForm.enableRateLimiting}
                      onCheckedChange={(checked) =>
                        setGeneralForm({ ...generalForm, enableRateLimiting: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="brute-force">Brute Force Koruması</Label>
                      <p className="text-xs text-muted-foreground">Otomatik saldırı tespiti</p>
                    </div>
                    <Switch
                      id="brute-force"
                      checked={generalForm.enableBruteForceProtection}
                      onCheckedChange={(checked) =>
                        setGeneralForm({ ...generalForm, enableBruteForceProtection: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="csrf">CSRF Koruması</Label>
                      <p className="text-xs text-muted-foreground">
                        Cross-Site Request Forgery koruması
                      </p>
                    </div>
                    <Switch
                      id="csrf"
                      checked={generalForm.enableCsrfProtection}
                      onCheckedChange={(checked) =>
                        setGeneralForm({ ...generalForm, enableCsrfProtection: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-alerts">Güvenlik E-posta Bildirimleri</Label>
                      <p className="text-xs text-muted-foreground">
                        Şüpheli aktivitelerde admin&apos;lere e-posta
                      </p>
                    </div>
                    <Switch
                      id="email-alerts"
                      checked={generalForm.securityEmailAlerts}
                      onCheckedChange={(checked) =>
                        setGeneralForm({ ...generalForm, securityEmailAlerts: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="suspicious-threshold">Şüpheli Aktivite Eşiği</Label>
                    <Input
                      id="suspicious-threshold"
                      type="number"
                      min={5}
                      max={50}
                      value={generalForm.suspiciousActivityThreshold}
                      onChange={(e) =>
                        setGeneralForm({
                          ...generalForm,
                          suspiciousActivityThreshold: parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Dakika başına maksimum başarısız deneme sayısı
                    </p>
                  </div>
                </div>

                {/* Save Button */}
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
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
