'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Save, RefreshCw } from 'lucide-react';

export interface PasswordFormData {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
  preventReuse: number;
  lockoutAttempts: number;
  lockoutDuration: number;
}

interface PasswordPolicyFormProps {
  form: PasswordFormData;
  onChange: (form: PasswordFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function PasswordPolicyForm({ form, onChange, onSubmit, isPending }: PasswordPolicyFormProps) {
  const updateField = <K extends keyof PasswordFormData>(key: K, value: PasswordFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit}>
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
                value={form.minLength}
                onChange={(e) => updateField('minLength', parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-upper">Büyük Harf Zorunlu</Label>
              <Switch
                id="require-upper"
                checked={form.requireUppercase}
                onCheckedChange={(checked) => updateField('requireUppercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-lower">Küçük Harf Zorunlu</Label>
              <Switch
                id="require-lower"
                checked={form.requireLowercase}
                onCheckedChange={(checked) => updateField('requireLowercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-numbers">Rakam Zorunlu</Label>
              <Switch
                id="require-numbers"
                checked={form.requireNumbers}
                onCheckedChange={(checked) => updateField('requireNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-special">Özel Karakter Zorunlu (!@#$%)</Label>
              <Switch
                id="require-special"
                checked={form.requireSpecialChars}
                onCheckedChange={(checked) => updateField('requireSpecialChars', checked)}
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
                value={form.maxAge}
                onChange={(e) => updateField('maxAge', parseInt(e.target.value))}
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
                value={form.preventReuse}
                onChange={(e) => updateField('preventReuse', parseInt(e.target.value))}
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
                value={form.lockoutAttempts}
                onChange={(e) => updateField('lockoutAttempts', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Kilitleme Süresi (dakika)</Label>
              <Input
                id="lockout-duration"
                type="number"
                min={5}
                max={1440}
                value={form.lockoutDuration}
                onChange={(e) => updateField('lockoutDuration', parseInt(e.target.value))}
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
