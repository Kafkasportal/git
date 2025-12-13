'use client';

/**
 * Security Settings Page
 * Manage password policies, sessions, 2FA, and general security configurations
 * SUPER ADMIN ONLY
 * 
 * Refactored: Form components extracted to _components/ folder
 * Original: 815 lines, CC: 50 → Refactored: ~260 lines, CC: ~10
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Shield,
  Lock,
  Clock,
  AlertTriangle,
  RefreshCw,
  Fingerprint,
  Activity,
} from 'lucide-react';

import {
  PasswordPolicyForm,
  SessionManagementForm,
  TwoFactorAuthForm,
  GeneralSecurityForm,
  type PasswordFormData,
  type SessionFormData,
  type TfaFormData,
  type GeneralSecurityFormData,
} from './_components';

// Default form values
const DEFAULT_PASSWORD_FORM: PasswordFormData = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90,
  preventReuse: 5,
  lockoutAttempts: 5,
  lockoutDuration: 30,
};

const DEFAULT_SESSION_FORM: SessionFormData = {
  sessionTimeout: 120,
  maxConcurrentSessions: 3,
  requireReauthForSensitive: true,
  rememberMeDuration: 30,
  enableSessionMonitoring: true,
};

const DEFAULT_TFA_FORM: TfaFormData = {
  enabled: false,
  required: false,
  gracePeriod: 7,
};

const DEFAULT_GENERAL_FORM: GeneralSecurityFormData = {
  enableAuditLog: true,
  enableIpWhitelist: false,
  enableRateLimiting: true,
  enableBruteForceProtection: true,
  enableCsrfProtection: true,
  securityEmailAlerts: true,
  suspiciousActivityThreshold: 10,
};

// Helper to sync settings with form - creates a new object with settings values merged over defaults
function syncFormWithSettings<T>(
  settings: Record<string, unknown>,
  defaults: T
): T {
  const result = { ...defaults } as T;
  const defaultKeys = Object.keys(defaults as object);
  
  for (const key of defaultKeys) {
    if (key in settings && settings[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = settings[key];
    }
  }
  return result;
}

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

  // Form states
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>(DEFAULT_PASSWORD_FORM);
  const [sessionForm, setSessionForm] = useState<SessionFormData>(DEFAULT_SESSION_FORM);
  const [tfaForm, setTfaForm] = useState<TfaFormData>(DEFAULT_TFA_FORM);
  const [generalForm, setGeneralForm] = useState<GeneralSecurityFormData>(DEFAULT_GENERAL_FORM);

  // Sync forms with loaded settings
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setPasswordForm(syncFormWithSettings(settings, DEFAULT_PASSWORD_FORM));
      setSessionForm(syncFormWithSettings(settings, DEFAULT_SESSION_FORM));
      setTfaForm(syncFormWithSettings(settings, DEFAULT_TFA_FORM));
      setGeneralForm(syncFormWithSettings(settings, DEFAULT_GENERAL_FORM));
    }
  }, [settings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: 'password' | 'session' | '2fa' | 'general';
      data: PasswordFormData | SessionFormData | TfaFormData | GeneralSecurityFormData;
    }) => {
      const response = await fetch(`/api/security?type=${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type.toUpperCase()} güvenlik ayarları kaydedildi`);
      void queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
    onError: (err: Error) => {
      toast.error(`Güvenlik ayarları kaydedilemedi: ${err.message}`);
    },
  });

  // Submit handlers
  const handlePasswordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'password', data: passwordForm });
  }, [passwordForm, updateMutation]);

  const handleSessionSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'session', data: sessionForm });
  }, [sessionForm, updateMutation]);

  const handleTfaSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: '2fa', data: tfaForm });
  }, [tfaForm, updateMutation]);

  const handleGeneralSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ type: 'general', data: generalForm });
  }, [generalForm, updateMutation]);

  // Loading state
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

  // Error state
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

        <TabsContent value="password" className="space-y-6">
          <PasswordPolicyForm
            form={passwordForm}
            onChange={setPasswordForm}
            onSubmit={handlePasswordSubmit}
            isPending={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="session" className="space-y-6">
          <SessionManagementForm
            form={sessionForm}
            onChange={setSessionForm}
            onSubmit={handleSessionSubmit}
            isPending={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6">
          <TwoFactorAuthForm
            form={tfaForm}
            onChange={setTfaForm}
            onSubmit={handleTfaSubmit}
            isPending={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <GeneralSecurityForm
            form={generalForm}
            onChange={setGeneralForm}
            onSubmit={handleGeneralSubmit}
            isPending={updateMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
