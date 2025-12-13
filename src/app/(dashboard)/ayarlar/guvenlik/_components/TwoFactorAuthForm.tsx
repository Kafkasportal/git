'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Save, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export interface TfaFormData {
  enabled: boolean;
  required: boolean;
  gracePeriod: number;
}

interface TwoFactorAuthFormProps {
  form: TfaFormData;
  onChange: (form: TfaFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function TwoFactorAuthForm({ form, onChange, onSubmit, isPending }: TwoFactorAuthFormProps) {
  const updateField = <K extends keyof TfaFormData>(key: K, value: TfaFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit}>
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
                checked={form.enabled}
                onCheckedChange={(checked) => updateField('enabled', checked)}
              />
              {form.enabled ? (
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
                checked={form.required}
                onCheckedChange={(checked) => updateField('required', checked)}
                disabled={!form.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace-period">Geçiş Süresi (gün)</Label>
              <Input
                id="grace-period"
                type="number"
                min={1}
                max={30}
                value={form.gracePeriod}
                onChange={(e) => updateField('gracePeriod', parseInt(e.target.value))}
                disabled={!form.enabled || !form.required}
              />
              <p className="text-xs text-muted-foreground">
                Kullanıcıların 2FA kurulumu için verilen süre
              </p>
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
