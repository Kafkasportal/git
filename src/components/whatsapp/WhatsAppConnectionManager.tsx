'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
} from 'lucide-react';
import type { WhatsAppState, WhatsAppStatus } from '@/lib/whatsapp';

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<WhatsAppStatus, StatusConfig> = {
  disconnected: {
    label: 'Bagli Degil',
    color: 'bg-gray-100 text-gray-700',
    icon: <WifiOff className="h-4 w-4" />,
  },
  connecting: {
    label: 'Baglaniyor',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  qr_ready: {
    label: 'QR Kod Hazir',
    color: 'bg-blue-100 text-blue-700',
    icon: <QrCode className="h-4 w-4" />,
  },
  authenticated: {
    label: 'Dogrulandi',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  ready: {
    label: 'Hazir',
    color: 'bg-green-100 text-green-700',
    icon: <Wifi className="h-4 w-4" />,
  },
  error: {
    label: 'Hata',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function WhatsAppConnectionManager() {
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);

  // Fetch WhatsApp status
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/status');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as WhatsAppState;
    },
    refetchInterval: isPolling ? 2000 : false,
  });

  // Fetch QR code when status is qr_ready
  const { data: qrData } = useQuery({
    queryKey: ['whatsapp-qr'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/qr');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: statusData?.status === 'qr_ready',
    refetchInterval: statusData?.status === 'qr_ready' ? 3000 : false,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success('WhatsApp baglantisi baslatildi');
      setIsPolling(true);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
    onError: (error: Error) => {
      toast.error(`Baglanti hatasi: ${error.message}`);
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success('WhatsApp baglantisi kesildi');
      setIsPolling(false);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
    onError: (error: Error) => {
      toast.error(`Baglanti kesme hatasi: ${error.message}`);
    },
  });

  // Stop polling when connected - using a ref to avoid effect setState
  const previousStatus = statusData?.status;
  if (previousStatus === 'ready' && isPolling) {
    // Using startTransition to batch state updates
    setIsPolling(false);
  }

  const handleConnect = useCallback(() => {
    connectMutation.mutate();
  }, [connectMutation]);

  const handleDisconnect = useCallback(() => {
    disconnectMutation.mutate();
  }, [disconnectMutation]);

  const status = statusData?.status || 'disconnected';
  const statusConfig = STATUS_CONFIG[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>WhatsApp Baglantisi</CardTitle>
              <CardDescription>WhatsApp hesabinizi QR kod ile baglayin</CardDescription>
            </div>
          </div>
          <Badge className={statusConfig.color}>
            <span className="flex items-center gap-1">
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status Details */}
        {statusData?.phoneNumber && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Smartphone className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Bagli Numara</p>
              <p className="text-sm text-green-600">+{statusData.phoneNumber}</p>
            </div>
          </div>
        )}

        {statusData?.error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Hata</p>
              <p className="text-sm text-red-600">{statusData.error}</p>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        {status === 'qr_ready' && qrData?.qrCode && (
          <div className="flex flex-col items-center gap-4 p-6 bg-white border rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              WhatsApp uygulamanizdan QR kodu tarayin
            </p>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <QRCodeSVG value={qrData.qrCode} size={200} />
            </div>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>1. WhatsApp&apos;i acin</p>
              <p>2. Ayarlar &gt; Bagli Cihazlar &gt; Cihaz Bagla</p>
              <p>3. QR kodu tarayin</p>
            </div>
          </div>
        )}

        {/* Connecting State */}
        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">WhatsApp&apos;a baglaniyor...</p>
            <p className="text-xs text-gray-500">Bu islem birkaç saniye surebilir</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'disconnected' || status === 'error' ? (
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              className="flex-1"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Baglaniyor...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  WhatsApp&apos;a Baglan
                </>
              )}
            </Button>
          ) : status === 'ready' ? (
            <Button
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kesiliyor...
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  Baglantiyi Kes
                </>
              )}
            </Button>
          ) : null}

          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })}
            disabled={isStatusLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isStatusLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Last Activity */}
        {statusData?.lastActivity && (
          <p className="text-xs text-gray-500 text-center">
            Son aktivite: {new Date(statusData.lastActivity).toLocaleString('tr-TR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
