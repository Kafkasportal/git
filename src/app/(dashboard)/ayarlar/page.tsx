'use client';

/**
 * Settings Dashboard Page
 * Overview and quick access to all system settings
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Palette,
  Building2,
  MessageSquare,
  Shield,
  List,
  ChevronRight,
  Zap,
  Lock,
  Eye,
  Wifi,
} from 'lucide-react';

interface SettingCategory {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  features: string[];
}

const settingCategories: SettingCategory[] = [
  {
    title: 'Tema Ayarları',
    description: 'Uygulamanın görünümünü ve renklerini özelleştirin',
    icon: Palette,
    href: '/ayarlar/tema',
    badge: 'Yeni',
    badgeVariant: 'default',
    features: [
      'Light/Dark/Auto mod seçimi',
      '5 hazır tema paketi',
      'Özel renk paleti oluşturma',
      'Gerçek zamanlı önizleme',
    ],
  },
  {
    title: 'Marka ve Organizasyon',
    description: 'Logolar ve kurumsal kimlik yönetimi',
    icon: Building2,
    href: '/ayarlar/marka',
    badge: 'Yeni',
    badgeVariant: 'default',
    features: [
      '4 farklı logo türü (Ana, Koyu, Favicon, Email)',
      'Organizasyon bilgileri',
      'İletişim detayları',
      'Canlı önizleme',
    ],
  },
  {
    title: 'İletişim Ayarları',
    description: 'Email, SMS ve WhatsApp kanallarını yapılandırın',
    icon: MessageSquare,
    href: '/ayarlar/iletisim',
    badge: 'Yeni',
    badgeVariant: 'default',
    features: [
      'SMTP Email yapılandırması',
      'Twilio SMS entegrasyonu',
      'WhatsApp Business API',
      'Test gönderim araçları',
    ],
  },
  {
    title: 'Güvenlik Ayarları',
    description: 'Şifre politikaları, oturum yönetimi ve 2FA',
    icon: Shield,
    href: '/ayarlar/guvenlik',
    badge: 'Super Admin',
    badgeVariant: 'destructive',
    features: [
      'Şifre politikası ayarları',
      'Oturum ve zaman aşımı yönetimi',
      '2FA (İki faktörlü kimlik doğrulama)',
      'Audit log ve güvenlik özellikleri',
    ],
  },
  {
    title: 'Parametreler',
    description: 'Sistem parametrelerini ve değerlerini yönetin',
    icon: List,
    href: '/ayarlar/parametreler',
    features: [
      'Cinsiyet, medeni durum vb. parametreler',
      'Kategori bazlı yönetim',
      'Aktif/Pasif durum kontrolü',
      'Sıralama ve filtreleme',
    ],
  },
  {
    title: 'Offline ve PWA',
    description: 'Çevrimdışı senkronizasyon ve uygulama ayarları',
    icon: Wifi,
    href: '/ayarlar/offline',
    badge: 'Beta',
    badgeVariant: 'secondary',
    features: [
      'Offline mutation queue',
      'Background sync',
      'PWA installation',
      'Cache management',
    ],
  },
];

export default function SettingsPage() {
  const [offlineStats, setOfflineStats] = useState<{
    pendingCount: number;
    failedCount: number;
  }>({ pendingCount: 0, failedCount: 0 });

  useEffect(() => {
    // Load offline stats
    const loadStats = async () => {
      try {
        const { getOfflineStats } = await import('@/lib/offline-sync');
        const stats = await getOfflineStats();
        setOfflineStats({
          pendingCount: stats.pendingCount,
          failedCount: stats.failedCount,
        });
      } catch (_error) {
        // Ignore errors if offline sync is not available
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Sistem Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            Uygulama ayarlarını ve konfigürasyonları yönetin
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Palette className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Hazır Tema</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">İletişim Kanalı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Güvenlik Modülü</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground">Ayar Alanı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {offlineStats.pendingCount > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Wifi className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{offlineStats.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Bekleyen Offline İşlem</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {category.title}
                        {category.badge && (
                          <Badge variant={category.badgeVariant || 'secondary'} className="text-xs">
                            {category.badge}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{category.description}</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Eye className="w-5 h-5" />
              Gerçek Zamanlı Değişiklikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tema ve ayar değişiklikleriniz Appwrite real-time sync ile anında tüm cihazlarda
              güncellenir. LocalStorage ile tercihleriniz saklanır ve bir sonraki oturumda
              hatırlanır.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Lock className="w-5 h-5" />
              Güvenli ve Şifreli
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hassas bilgiler (şifreler, API key&apos;ler, token&apos;lar) şifreli olarak saklanır.
              Admin ve Super Admin rolleri ile erişim kontrolü sağlanır. Tüm değişiklikler audit
              log&apos;da izlenir.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Yardım ve Dokümantasyon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Tema Ayarları</h4>
              <p className="text-muted-foreground">
                5 hazır tema arasından seçim yapın veya kendi renk paletinizi oluşturun. Tüm
                değişiklikler anında uygulanır.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">İletişim Kanalları</h4>
              <p className="text-muted-foreground">
                Email, SMS ve WhatsApp kanallarını yapılandırın. Test modları ile güvenli test
                yapabilirsiniz.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Güvenlik Önlemleri</h4>
              <p className="text-muted-foreground">
                Şifre politikaları, oturum yönetimi ve 2FA ile sistemin güvenliğini maksimize edin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
