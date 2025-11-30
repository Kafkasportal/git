'use client';

/**
 * Branding & Organization Settings Page
 * Manage logos, organization info, and brand identity
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  X,
  Save,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';

// Logo upload component
function LogoUploader({
  logoType,
  currentLogoUrl,
  label,
  description,
}: {
  logoType: 'main_logo' | 'logo_dark' | 'favicon' | 'email_logo';
  currentLogoUrl?: string;
  label: string;
  description: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Sync preview with current logo URL from server
    if (currentLogoUrl !== preview) {
      setPreview(currentLogoUrl || null);
    }
  }, [currentLogoUrl, preview]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('logoType', logoType);

      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`${label} başarıyla yüklendi`);
      setPreview(data.data.url);
      void queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: (error: Error) => {
      toast.error(`Yükleme hatası: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/branding/logo?logoType=${logoType}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`${label} silindi`);
      setPreview(null);
      void queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: (error: Error) => {
      toast.error(`Silme hatası: ${error.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece PNG, JPG, WEBP ve SVG formatları destekleniyor');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu maksimum 5MB olabilir');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
          {preview ? (
            <img src={preview} alt={label} className="max-w-full max-h-full object-contain p-2" />
          ) : (
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {preview ? 'Değiştir' : 'Yükle'}
              </>
            )}
          </Button>

          {preview && (
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Sil
            </Button>
          )}

          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG • Maks. 5MB</p>
        </div>
      </div>
    </div>
  );
}

export default function BrandingSettingsPage() {
  const queryClient = useQueryClient();

  // Fetch branding settings
  const { data: brandingData, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const response = await fetch('/api/branding/organization');
      if (!response.ok) throw new Error('Failed to fetch branding');
      return response.json();
    },
  });

  const branding = brandingData?.data || {};

  // Form state
  const [formData, setFormData] = useState({
    organizationName: '',
    slogan: '',
    footerText: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
  });

  // Initialize form data from branding once it loads
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (branding && !isInitialized) {
      // Defer state update to avoid cascading renders
      Promise.resolve().then(() => {
        setFormData({
          organizationName: branding.organizationName || '',
          slogan: branding.slogan || '',
          footerText: branding.footerText || '',
          contactEmail: branding.contactEmail || '',
          contactPhone: branding.contactPhone || '',
          address: branding.address || '',
          website: branding.website || '',
        });
        setIsInitialized(true);
      });
    }
  }, [branding, isInitialized]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/branding/organization', {
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
    onSuccess: () => {
      toast.success('Organizasyon bilgileri güncellendi');
      void queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: (error: Error) => {
      toast.error(`Güncelleme hatası: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      organizationName: branding.organizationName || '',
      slogan: branding.slogan || '',
      footerText: branding.footerText || '',
      contactEmail: branding.contactEmail || '',
      contactPhone: branding.contactPhone || '',
      address: branding.address || '',
      website: branding.website || '',
    });
    toast.info('Değişiklikler geri alındı');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Marka ayarları yükleniyor...</span>
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
            <Building2 className="w-8 h-8" />
            Marka ve Organizasyon Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            Logolar, organizasyon bilgileri ve kurumsal kimlik yönetimi
          </p>
        </div>
      </div>

      <Tabs defaultValue="logos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logos">Logolar</TabsTrigger>
          <TabsTrigger value="organization">Organizasyon Bilgileri</TabsTrigger>
        </TabsList>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Ana Logo</CardTitle>
                <CardDescription>Açık tema için kullanılacak ana logo</CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploader
                  logoType="main_logo"
                  currentLogoUrl={branding.main_logo?.url}
                  label="Ana Logo"
                  description="Açık temada gösterilecek logo (önerilen: PNG, şeffaf arka plan)"
                />
              </CardContent>
            </Card>

            {/* Dark Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Koyu Tema Logosu</CardTitle>
                <CardDescription>Koyu tema için kullanılacak logo</CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploader
                  logoType="logo_dark"
                  currentLogoUrl={branding.logo_dark?.url}
                  label="Koyu Logo"
                  description="Koyu temada gösterilecek logo (önerilen: açık renkli, PNG)"
                />
              </CardContent>
            </Card>

            {/* Favicon */}
            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>Tarayıcı sekmesinde görünecek ikon</CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploader
                  logoType="favicon"
                  currentLogoUrl={branding.favicon?.url}
                  label="Favicon"
                  description="Tarayıcı ikon (önerilen: 32x32 veya 64x64, PNG/ICO)"
                />
              </CardContent>
            </Card>

            {/* Email Logo */}
            <Card>
              <CardHeader>
                <CardTitle>E-posta Logosu</CardTitle>
                <CardDescription>E-posta şablonlarında kullanılacak logo</CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploader
                  logoType="email_logo"
                  currentLogoUrl={branding.email_logo?.url}
                  label="E-posta Logo"
                  description="E-posta başlığında gösterilecek logo (önerilen: 200px genişlik)"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Info Tab */}
        <TabsContent value="organization" className="space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Organizasyon Bilgileri</CardTitle>
                <CardDescription>
                  Derneğinizin genel bilgileri ve iletişim detayları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization Name */}
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organizasyon Adı *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="Kafkasder"
                    required
                  />
                </div>

                {/* Slogan */}
                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan</Label>
                  <Input
                    id="slogan"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    placeholder="Yardımlaşma ve Dayanışma Derneği"
                  />
                </div>

                {/* Footer Text */}
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Metni</Label>
                  <Textarea
                    id="footerText"
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    placeholder="© 2024 Kafkasder. Tüm hakları saklıdır."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Email */}
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      İletişim E-postası
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="info@kafkasder.org"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      İletişim Telefonu
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+90 XXX XXX XX XX"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Adres
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="İstanbul, Türkiye"
                    rows={3}
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://kafkasder.org"
                  />
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
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </Button>

                  <Button type="button" variant="outline" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sıfırla
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Önizleme
              </CardTitle>
              <CardDescription>
                Girdiğiniz bilgilerin nasıl görüneceğini buradan kontrol edebilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border rounded-lg bg-muted/20">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">
                    {formData.organizationName || 'Organizasyon Adı'}
                  </h3>
                  <p className="text-muted-foreground italic">{formData.slogan || 'Slogan'}</p>
                  <div className="pt-3 space-y-1 text-sm border-t">
                    {formData.contactEmail && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {formData.contactEmail}
                      </p>
                    )}
                    {formData.contactPhone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {formData.contactPhone}
                      </p>
                    )}
                    {formData.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {formData.address}
                      </p>
                    )}
                    {formData.website && (
                      <p className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <a
                          href={formData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.website}
                        </a>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pt-3 border-t">
                    {formData.footerText || 'Footer metni'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
