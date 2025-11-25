'use client';

/**
 * Theme Settings Page
 * Allows admins to customize application theme, colors, and appearance
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettings, useTheme } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';
import { Palette, Sun, Moon, Monitor, Check, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

export default function ThemeSettingsPage() {
  const queryClient = useQueryClient();
  const { isLoading } = useSettings();
  const { currentTheme, themePresets, setTheme, themeMode, setThemeMode, resolvedThemeMode } =
    useTheme();

  const [selectedPreset, setSelectedPreset] = useState<string>(currentTheme?.name || '');
  const [customThemeName, setCustomThemeName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [customColors, setCustomColors] = useState({
    primary: currentTheme?.colors?.primary || '#3b82f6',
    secondary: currentTheme?.colors?.secondary || '#6b7280',
    accent: currentTheme?.colors?.accent || '#8b5cf6',
    success: currentTheme?.colors?.success || '#10b981',
    warning: currentTheme?.colors?.warning || '#f59e0b',
    error: currentTheme?.colors?.error || '#ef4444',
  });

  const handleThemeModeChange = async (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    toast.success(
      `Tema modu ${mode === 'light' ? 'Açık' : mode === 'dark' ? 'Koyu' : 'Otomatik'} olarak ayarlandı`
    );
  };

  const handlePresetChange = async (presetName: string) => {
    setSelectedPreset(presetName);
    await setTheme(presetName);
    toast.success(`${presetName} teması uygulandı`);
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setCustomColors((prev) => ({ ...prev, [colorKey]: value }));
  };

  const applyCustomColors = async () => {
    // Validate theme name
    if (!customThemeName.trim()) {
      toast.error('Lütfen bir tema adı girin');
      return;
    }

    setIsSaving(true);

    try {
      // Create theme preset object
      const themeData = {
        name: customThemeName.trim(),
        description: 'Kullanıcı tarafından oluşturulan özel tema',
        colors: customColors,
        isCustom: true,
        isDefault: false,
      };

      // Make POST request to create theme preset (fetchWithCsrf handles CSRF token)
      const response = await fetchWithCsrf('/api/settings/theme-presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Tema kaydedilemedi');
      }

      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['theme-presets'] });

      // Apply the new theme
      await setTheme(customThemeName.trim());

      toast.success('Özel tema başarıyla kaydedildi ve uygulandı');
      
      // Reset form
      setCustomThemeName('');
    } catch (error) {
      logger.error('Failed to save custom theme', error);
      toast.error(error instanceof Error ? error.message : 'Tema kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomTheme = async (presetId: string, presetName: string) => {
    try {
      // Make DELETE request (fetchWithCsrf handles CSRF token)
      const response = await fetchWithCsrf(`/api/settings/theme-presets?id=${presetId}`, {
        method: 'DELETE',
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Tema silinemedi');
      }

      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['theme-presets'] });

      toast.success(`${presetName} teması başarıyla silindi`);
    } catch (error) {
      logger.error('Failed to delete custom theme', error);
      toast.error(error instanceof Error ? error.message : 'Tema silinemedi');
    }
  };

  const resetToDefault = async () => {
    const defaultTheme = themePresets.find((t) => t.isDefault);
    if (defaultTheme) {
      setSelectedPreset(defaultTheme.name);
      await setTheme(defaultTheme.name);
      toast.success('Varsayılan tema geri yüklendi');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Tema ayarları yükleniyor...</span>
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
            <Palette className="w-8 h-8" />
            Tema Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            Uygulamanın görünümünü ve renklerini özelleştirin
          </p>
        </div>
        <Button onClick={resetToDefault} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Varsayılana Dön
        </Button>
      </div>

      <Tabs defaultValue="mode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mode">Tema Modu</TabsTrigger>
          <TabsTrigger value="presets">Hazır Temalar</TabsTrigger>
          <TabsTrigger value="custom">Özel Renkler</TabsTrigger>
        </TabsList>

        {/* Theme Mode Tab */}
        <TabsContent value="mode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema Modu Seçimi</CardTitle>
              <CardDescription>
                Açık, koyu veya sistem tercihine göre otomatik tema seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Mode */}
                <button
                  onClick={() => handleThemeModeChange('light')}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    themeMode === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Sun className="w-12 h-12" />
                    <h3 className="font-semibold">Açık Tema</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Parlak ve net görünüm
                    </p>
                    {themeMode === 'light' && (
                      <Badge className="absolute top-2 right-2">
                        <Check className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Dark Mode */}
                <button
                  onClick={() => handleThemeModeChange('dark')}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    themeMode === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Moon className="w-12 h-12" />
                    <h3 className="font-semibold">Koyu Tema</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Göz dostu karanlık mod
                    </p>
                    {themeMode === 'dark' && (
                      <Badge className="absolute top-2 right-2">
                        <Check className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Auto Mode */}
                <button
                  onClick={() => handleThemeModeChange('auto')}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    themeMode === 'auto'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Monitor className="w-12 h-12" />
                    <h3 className="font-semibold">Otomatik</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Sistem tercihine göre
                    </p>
                    {themeMode === 'auto' && (
                      <Badge className="absolute top-2 right-2">
                        <Check className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    )}
                  </div>
                </button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Şu Anki Mod:</span>
                  <Badge variant="outline">
                    {resolvedThemeMode === 'light' ? 'Açık' : 'Koyu'} (
                    {themeMode === 'auto' ? 'Sistem' : themeMode === 'light' ? 'Açık' : 'Koyu'})
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Presets Tab */}
        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hazır Tema Paketleri</CardTitle>
              <CardDescription>Önceden tasarlanmış renk paletlerinden birini seçin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themePresets.map((preset) => (
                  <button
                    key={preset._id || preset.name}
                    onClick={() => handlePresetChange(preset.name)}
                    className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPreset === preset.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{preset.name}</h3>
                        <div className="flex items-center gap-2">
                          {preset.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Varsayılan
                            </Badge>
                          )}
                          {preset.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              Özel
                            </Badge>
                          )}
                          {selectedPreset === preset.name && (
                            <Badge className="text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Aktif
                            </Badge>
                          )}
                          {preset.isCustom && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Temayı Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    &quot;{preset.name}&quot; temasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomTheme(preset._id || '', preset.name);
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      {preset.description && (
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      )}

                      {/* Color Preview */}
                      <div className="flex gap-1">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: preset.colors.primary }}
                          title="Primary"
                        />
                        {preset.colors.secondary && (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: preset.colors.secondary }}
                            title="Secondary"
                          />
                        )}
                        {preset.colors.accent && (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: preset.colors.accent }}
                            title="Accent"
                          />
                        )}
                        {preset.colors.success && (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: preset.colors.success }}
                            title="Success"
                          />
                        )}
                        {preset.colors.warning && (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: preset.colors.warning }}
                            title="Warning"
                          />
                        )}
                        {preset.colors.error && (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: preset.colors.error }}
                            title="Error"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Colors Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Özel Renk Paleti
              </CardTitle>
              <CardDescription>Kendi renk paletinizi oluşturun ve kaydedin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Name Input */}
              <div className="space-y-2">
                <Label htmlFor="theme-name">Tema Adı</Label>
                <Input
                  id="theme-name"
                  type="text"
                  value={customThemeName}
                  onChange={(e) => setCustomThemeName(e.target.value)}
                  placeholder="Özel temam için bir isim girin"
                  className="max-w-md"
                />
                <p className="text-sm text-muted-foreground">
                  Bu tema kaydedilecek ve hazır temalar listesinde görünecektir
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primary">Ana Renk (Primary)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label htmlFor="secondary">İkincil Renk (Secondary)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={customColors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customColors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="flex-1"
                      placeholder="#6b7280"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label htmlFor="accent">Vurgu Rengi (Accent)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent"
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="flex-1"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>

                {/* Success Color */}
                <div className="space-y-2">
                  <Label htmlFor="success">Başarı Rengi (Success)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="success"
                      type="color"
                      value={customColors.success}
                      onChange={(e) => handleColorChange('success', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customColors.success}
                      onChange={(e) => handleColorChange('success', e.target.value)}
                      className="flex-1"
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                {/* Warning Color */}
                <div className="space-y-2">
                  <Label htmlFor="warning">Uyarı Rengi (Warning)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="warning"
                      type="color"
                      value={customColors.warning}
                      onChange={(e) => handleColorChange('warning', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customColors.warning}
                      onChange={(e) => handleColorChange('warning', e.target.value)}
                      className="flex-1"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                {/* Error Color */}
                <div className="space-y-2">
                  <Label htmlFor="error">Hata Rengi (Error)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="error"
                      type="color"
                      value={customColors.error}
                      onChange={(e) => handleColorChange('error', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customColors.error}
                      onChange={(e) => handleColorChange('error', e.target.value)}
                      className="flex-1"
                      placeholder="#ef4444"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="pt-6 border-t space-y-4">
                <h4 className="font-medium">Renk Önizleme</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(customColors).map(([key, color]) => (
                    <div key={key} className="space-y-2">
                      <div
                        className="w-full h-20 rounded-lg border-2"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-xs text-center font-medium capitalize">{key}</p>
                      <p className="text-xs text-center text-muted-foreground">{color}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={applyCustomColors} className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Renkleri Kaydet
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCustomColors({
                      primary: currentTheme?.colors?.primary || '#3b82f6',
                      secondary: currentTheme?.colors?.secondary || '#6b7280',
                      accent: currentTheme?.colors?.accent || '#8b5cf6',
                      success: currentTheme?.colors?.success || '#10b981',
                      warning: currentTheme?.colors?.warning || '#f59e0b',
                      error: currentTheme?.colors?.error || '#ef4444',
                    });
                    toast.info('Renkler sıfırlandı');
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sıfırla
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Theme Info */}
      <Card>
        <CardHeader>
          <CardTitle>Aktif Tema Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Tema Adı</Label>
              <p className="font-medium">{currentTheme?.name || 'Yükleniyor...'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tema Modu</Label>
              <p className="font-medium capitalize">
                {themeMode} {themeMode === 'auto' && `(${resolvedThemeMode})`}
              </p>
            </div>
            {currentTheme?.description && (
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Açıklama</Label>
                <p className="font-medium">{currentTheme.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
