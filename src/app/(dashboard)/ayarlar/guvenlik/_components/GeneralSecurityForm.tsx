'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Activity, Save, RefreshCw } from 'lucide-react';

export interface GeneralSecurityFormData {
  enableAuditLog: boolean;
  enableIpWhitelist: boolean;
  enableRateLimiting: boolean;
  enableBruteForceProtection: boolean;
  enableCsrfProtection: boolean;
  securityEmailAlerts: boolean;
  suspiciousActivityThreshold: number;
}

interface GeneralSecurityFormProps {
  form: GeneralSecurityFormData;
  onChange: (form: GeneralSecurityFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function GeneralSecurityForm({ form, onChange, onSubmit, isPending }: GeneralSecurityFormProps) {
  const updateField = <K extends keyof GeneralSecurityFormData>(key: K, value: GeneralSecurityFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Genel Güvenlik Ayarları
          </CardTitle>
          <CardDescription>
            Sistem genelinde güvenlik özelliklerini yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audit-log">Denetim Günlüğü</Label>
                <p className="text-xs text-muted-foreground">
                  Tüm kullanıcı işlemlerini kaydet
                </p>
              </div>
              <Switch
                id="audit-log"
                checked={form.enableAuditLog}
                onCheckedChange={function(checked) { return updateField('enableAuditLog', checked) }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                <p className="text-xs text-muted-foreground">
                  Sadece izin verilen IP adreslerinden erişim
                </p>
              </div>
              <Switch
                id="ip-whitelist"
                checked={form.enableIpWhitelist}
                onCheckedChange={(checked) => updateField('enableIpWhitelist', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rate-limiting">Rate Limiting</Label>
                <p className="text-xs text-muted-foreground">
                  API isteklerini sınırla
                </p>
              </div>
              <Switch
                id="rate-limiting"
                checked={form.enableRateLimiting}
                onCheckedChange={(checked) => updateField('enableRateLimiting', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="brute-force">Brute Force Koruması</Label>
                <p className="text-xs text-muted-foreground">
                  Tekrarlanan başarısız girişleri engelle
                </p>
              </div>
              <Switch
                id="brute-force"
                checked={form.enableBruteForceProtection}
                onCheckedChange={(checked) => updateField('enableBruteForceProtection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="csrf">CSRF Koruması</Label>
                <p className="text-xs text-muted-foreground">
                  Cross-Site Request Forgery koruması
                </p>
              </div>
              <Switch
                id="csrf"
                checked={form.enableCsrfProtection}
                onCheckedChange={(checked) => updateField('enableCsrfProtection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-alerts">E-posta Uyarıları</Label>
                <p className="text-xs text-muted-foreground">
                  Güvenlik olaylarında bildirim gönder
                </p>
              </div>
              <Switch
                id="email-alerts"
                checked={form.securityEmailAlerts}
                onCheckedChange={(checked) => updateField('securityEmailAlerts', checked)}
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="suspicious-threshold">Şüpheli Aktivite Eşiği</Label>
              <Input
                id="suspicious-threshold"
                type="number"
                min={1}
                max={100}
                value={form.suspiciousActivityThreshold}
                onChange={(e) => updateField('suspiciousActivityThreshold', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Bu sayıdan fazla şüpheli aktivite tespit edilirse uyarı ver
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
