/**
 * Offline and PWA Settings Page
 * Centralized offline management interface
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, Cloud, Smartphone, Settings } from 'lucide-react';
import { OfflineSyncPanel } from '@/components/pwa/OfflineSyncPanel';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineSettingsPage() {
  const { isOnline: _isOnline } = useOnlineStatus();
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [backgroundSyncSupported, setBackgroundSyncSupported] = useState(false);

  useEffect(() => {
    // Check if app is installed
    if (typeof window !== 'undefined') {
      // Check if running as standalone (installed PWA)
      const checkInstallation = () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsInstalled(isStandalone || (window.navigator as any).standalone === true);
      };

      // Check service worker registration
      const checkServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          setSwRegistered(!!reg);
        }
      };

      // Check background sync support
      const checkBackgroundSync = () => {
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          setBackgroundSyncSupported(true);
        }
      };

      checkInstallation();
      checkServiceWorker();
      checkBackgroundSync();
    }
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wifi className="w-8 h-8" />
            Offline ve PWA Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            Çevrimdışı senkronizasyon ve Progressive Web App özelliklerini yönetin
          </p>
        </div>
      </div>

      {/* Offline Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Offline Senkronizasyon Durumu
          </CardTitle>
          <CardDescription>
            Offline kuyruğundaki işlemleri görüntüleyin ve manuel olarak senkronize edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OfflineSyncPanel />
        </CardContent>
      </Card>

      {/* PWA Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            PWA Kurulum Durumu
          </CardTitle>
          <CardDescription>
            Uygulamanın kurulu olup olmadığını kontrol edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Kurulum Durumu</p>
              <p className="text-sm text-muted-foreground">
                {isInstalled
                  ? 'Uygulama cihazınıza kurulu'
                  : 'Uygulama henüz kurulmamış'}
              </p>
            </div>
            <Badge variant={isInstalled ? 'default' : 'secondary'}>
              {isInstalled ? 'Kurulu' : 'Kurulmamış'}
            </Badge>
          </div>
          {!isInstalled && (
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Uygulamayı ana ekranınıza eklemek için tarayıcı menüsünden &quot;Ana ekrana ekle&quot;
                seçeneğini kullanın.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Service Worker Durumu
          </CardTitle>
          <CardDescription>
            Service Worker kayıt durumu ve özellikler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Kayıt Durumu</p>
              <p className="text-sm text-muted-foreground">
                {swRegistered ? 'Service Worker aktif' : 'Service Worker kayıtlı değil'}
              </p>
            </div>
            <Badge variant={swRegistered ? 'default' : 'secondary'}>
              {swRegistered ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Background Sync</p>
              <p className="text-sm text-muted-foreground">
                Arka plan senkronizasyonu desteği
              </p>
            </div>
            <Badge variant={backgroundSyncSupported ? 'default' : 'secondary'}>
              {backgroundSyncSupported ? 'Destekleniyor' : 'Desteklenmiyor'}
            </Badge>
          </div>

          {!swRegistered && (
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Service Worker kayıtlı değil. Sayfayı yenileyerek tekrar deneyin.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Özellikler Hakkında</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Offline Mutation Queue</p>
            <p>
              İnternet bağlantısı olmadığında yapılan değişiklikler otomatik olarak kuyruğa eklenir.
              Bağlantı kurulduğunda bu işlemler otomatik olarak senkronize edilir.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Background Sync</p>
            <p>
              Tarayıcınız destekliyorsa, işlemler arka planda otomatik olarak senkronize edilir.
              Bu sayede sayfayı kapatmanıza gerek kalmaz.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">PWA Installation</p>
            <p>
              Uygulamayı cihazınıza kurarak daha hızlı erişim sağlayabilir ve offline özelliklerden
              tam olarak yararlanabilirsiniz.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Cache Management</p>
            <p>
              Service Worker, uygulama dosyalarını önbelleğe alarak daha hızlı yükleme sağlar ve
              offline erişime olanak tanır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

