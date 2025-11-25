'use client';

/**
 * WhatsApp QR Code & Connection Management Page
 * Allows admins to:
 * - Initialize WhatsApp Web client
 * - Scan QR code with phone
 * - Monitor connection status
 * - Disconnect/logout
 */

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
  Smartphone,
  LogOut,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';
import logger from '@/lib/logger';

interface WhatsAppStatus {
  isReady: boolean;
  isAuthenticated: boolean;
  phoneNumber?: string;
  lastError?: string;
}

export default function WhatsAppConnectionPage() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    isAuthenticated: false,
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch status periodically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Render QR code when available
  useEffect(() => {
    if (qrCode && canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).catch((error) => {
        logger.error('QR code rendering failed', error as Error);
      });
    }
  }, [qrCode]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If 403, user doesn't have permission - don't show error
        if (response.status === 403) {
          setIsLoading(false);
          return;
        }
        throw new Error('Status fetch failed');
      }

      const data = await response.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }

      // If not ready and not authenticated, try to get QR code
      if (!data.status.isReady && !data.status.isAuthenticated) {
        fetchQRCode();
      } else {
        setQrCode(null);
      }
    } catch (error) {
      logger.error('Failed to fetch WhatsApp status', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await fetch('/api/whatsapp/qr', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error) {
      logger.error('Failed to fetch QR code', error as Error);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/whatsapp/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Initialization failed');
      }

      toast.success(data.message || 'WhatsApp başlatılıyor...');

      // Start polling for QR code
      setTimeout(fetchQRCode, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'WhatsApp başlatılamadı');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDestroy = async () => {
    if (
      !confirm(
        'WhatsApp bağlantısını kesmek istediğinizden emin misiniz? Tekrar bağlanmak için QR kod okutmanız gerekecek.'
      )
    ) {
      return;
    }

    setIsDestroying(true);
    try {
      const response = await fetch('/api/whatsapp/destroy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Destroy failed');
      }

      toast.success('WhatsApp bağlantısı kesildi');
      setStatus({ isReady: false, isAuthenticated: false });
      setQrCode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bağlantı kesilemedi');
    } finally {
      setIsDestroying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Bağlantısı</h2>
          <p className="text-gray-600 mt-2">WhatsApp Web bağlantınızı yönetin</p>
        </div>
        <Card className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp Bağlantısı</h2>
        <p className="text-gray-600 mt-2">WhatsApp Web bağlantınızı yönetin</p>
      </div>

      {/* Connection Status Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bağlantı Durumu</h3>
            <p className="text-sm text-gray-600">WhatsApp Web ile bağlantı durumunuz</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>

        {/* Status Display */}
        <div className="space-y-4">
          {/* Ready Status */}
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            {status.isReady ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">{status.isReady ? 'Bağlı ve Hazır' : 'Bağlı Değil'}</p>
              <p className="text-sm text-gray-600">
                {status.isReady ? 'Mesaj göndermeye hazır' : 'WhatsApp Web bağlantısı yok'}
              </p>
            </div>
          </div>

          {/* Authenticated Status */}
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            {status.isAuthenticated ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">
                {status.isAuthenticated ? 'Kimlik Doğrulandı' : 'Kimlik Doğrulanmadı'}
              </p>
              <p className="text-sm text-gray-600">
                {status.phoneNumber
                  ? `Telefon: +${status.phoneNumber}`
                  : 'QR kod okutmanız gerekiyor'}
              </p>
            </div>
          </div>

          {/* Error Status */}
          {status.lastError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.lastError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {!status.isReady && !status.isAuthenticated && (
            <Button onClick={handleInitialize} disabled={isInitializing} className="gap-2">
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Başlatılıyor...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  WhatsApp Başlat
                </>
              )}
            </Button>
          )}

          {(status.isReady || status.isAuthenticated) && (
            <Button
              onClick={handleDestroy}
              disabled={isDestroying}
              variant="destructive"
              className="gap-2"
            >
              {isDestroying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kesiliyor...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Bağlantıyı Kes
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* QR Code Card */}
      {qrCode && !status.isReady && (
        <Card className="p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Smartphone className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">QR Kodu Telefonunuzla Okutun</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              WhatsApp uygulamasını açın, Ayarlar {'->'} Bağlı Cihazlar {'->'}
              Cihaz Bağla menüsüne gidip bu QR kodu okutun
            </p>

            {/* QR Code Canvas */}
            <div className="flex justify-center mb-6">
              <canvas ref={canvasRef} className="border-4 border-green-500 rounded-lg shadow-lg" />
            </div>

            {/* Instructions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                QR kod 30 saniyede bir yenilenir. Okutamazsan new code için sayfayı yenileyin.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {status.isReady && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ WhatsApp başarıyla bağlandı! Artık toplu mesaj gönderebilirsiniz. Toplu mesaj
            göndermek için{' '}
            <a href="/mesaj/toplu" className="underline font-medium">
              Toplu Mesaj
            </a>{' '}
            sayfasına gidin.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-900">ℹ️ Önemli Bilgiler</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Telefonunuzun internete bağlı olması gerekir (WhatsApp Web kullanılıyor)</li>
          <li>
            • Bir kez QR kodu okuttuktan sonra oturum kaydedilir, tekrar QR okutmaya gerek yoktur
          </li>
          <li>• Toplu mesaj gönderirken mesajlar arasında 1 saniye beklenir (spam önleme)</li>
          <li>• Sadece admin kullanıcılar WhatsApp bağlantısı yapabilir</li>
          <li>• Bağlantıyı kestikten sonra tekrar bağlanmak için QR kod okutmanız gerekir</li>
        </ul>
      </Card>
    </div>
  );
}
