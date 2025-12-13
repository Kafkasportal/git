'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Save, RefreshCw } from 'lucide-react';

export interface SessionFormData {
  sessionTimeout: number;
  maxConcurrentSessions: number;
  requireReauthForSensitive: boolean;
  rememberMeDuration: number;
  enableSessionMonitoring: boolean;
}

interface SessionManagementFormProps {
  form: SessionFormData;
  onChange: (form: SessionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function SessionManagementForm({ form, onChange, onSubmit, isPending }: SessionManagementFormProps) {
  const updateField = <K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit}>
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
                value={form.sessionTimeout}
                onChange={(e) => updateField('sessionTimeout', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-sessions">Maksimum Eş Zamanlı Oturum</Label>
              <Input
                id="max-sessions"
                type="number"
                min={1}
                max={10}
                value={form.maxConcurrentSessions}
                onChange={(e) => updateField('maxConcurrentSessions', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remember-me">Beni Hatırla Süresi (gün)</Label>
              <Input
                id="remember-me"
                type="number"
                min={1}
                max={90}
                value={form.rememberMeDuration}
                onChange={(e) => updateField('rememberMeDuration', parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Label htmlFor="reauth-sensitive">
                Hassas İşlemler İçin Yeniden Kimlik Doğrulama
              </Label>
              <Switch
                id="reauth-sensitive"
                checked={form.requireReauthForSensitive}
                onCheckedChange={(checked) => updateField('requireReauthForSensitive', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="session-monitoring">Oturum İzleme Aktif</Label>
              <Switch
                id="session-monitoring"
                checked={form.enableSessionMonitoring}
                onCheckedChange={(checked) => updateField('enableSessionMonitoring', checked)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
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
  );
}
