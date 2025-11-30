/**
 * Offline Sync Panel Component
 * Manual sync UI for monitoring and controlling offline sync
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useOfflineSync,
  getPendingMutations,
  getFailedMutations,
  retryMutation,
  clearAllMutations,
} from '@/lib/offline-sync';
import type { OfflineMutation } from '@/lib/offline-sync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function OfflineSyncPanel() {
  const { sync, getStats, isSupported } = useOfflineSync();
  const { isOnline } = useOnlineStatus();
  const [stats, setStats] = useState<{
    pendingCount: number;
    failedCount: number;
    oldestMutation?: Date;
    totalSize: number;
  }>({
    pendingCount: 0,
    failedCount: 0,
    totalSize: 0,
  });
  const [pendingMutations, setPendingMutations] = useState<OfflineMutation[]>([]);
  const [failedMutations, setFailedMutations] = useState<OfflineMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const loadStats = async () => {
    const statsData = await getStats();
    setStats(statsData);

    const pending = await getPendingMutations();
    setPendingMutations(pending.filter((m) => m.retryCount < 3));

    const failed = await getFailedMutations();
    setFailedMutations(failed);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('İnternet bağlantısı yok');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await sync();
      toast.success(`${result.success} işlem senkronize edildi`, {
        description:
          result.failed > 0 ? `${result.failed} işlem başarısız oldu` : 'Tüm işlemler tamamlandı',
      });
      await loadStats();
    } catch (error) {
      toast.error('Senkronizasyon başarısız', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    if (!isOnline) {
      toast.error('İnternet bağlantısı yok');
      return;
    }

    setIsSyncing(true);
    try {
      for (const mutation of failedMutations) {
        await retryMutation(mutation.id);
      }
      toast.success('Başarısız işlemler yeniden deneme için hazırlandı');
      await loadStats();
      await handleSync();
    } catch (error) {
      toast.error('Yeniden deneme başarısız', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMutations();
      toast.success('Tüm offline işlemler temizlendi');
      setShowClearDialog(false);
      await loadStats();
    } catch (error) {
      toast.error('Temizleme başarısız', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offline Senkronizasyon</CardTitle>
          <CardDescription>Tarayıcınız offline modu desteklemiyor</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-sm text-muted-foreground">Bekleyen İşlem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failedCount}</p>
                <p className="text-sm text-muted-foreground">Başarısız İşlem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.oldestMutation
                    ? formatDistanceToNow(stats.oldestMutation, {
                        addSuffix: true,
                        locale: tr,
                      })
                    : '-'}
                </p>
                <p className="text-sm text-muted-foreground">En Eski İşlem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Senkronizasyon İşlemleri</CardTitle>
          <CardDescription>
            Offline kuyruğundaki işlemleri manuel olarak senkronize edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSync} disabled={!isOnline || isSyncing} className="gap-2">
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Şimdi Senkronize Et
            </Button>

            {failedMutations.length > 0 && (
              <Button
                onClick={handleRetryFailed}
                disabled={!isOnline || isSyncing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Başarısızları Yeniden Dene ({failedMutations.length})
              </Button>
            )}

            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Tümünü Temizle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tüm offline işlemleri temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Bekleyen tüm offline işlemler kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
                    Temizle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>İnternet bağlantısı olmadığı için senkronizasyon yapılamıyor</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Mutations List */}
      {pendingMutations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bekleyen İşlemler</CardTitle>
            <CardDescription>Offline kuyruğundaki işlemlerin listesi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingMutations.slice(0, 10).map((mutation) => (
                <div
                  key={mutation.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{mutation.type}</Badge>
                      <span className="text-sm font-medium">{mutation.collection}</span>
                      {mutation.retryCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mutation.retryCount} deneme
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(mutation.timestamp), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {pendingMutations.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{pendingMutations.length - 10} daha fazla işlem
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Mutations List */}
      {failedMutations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Başarısız İşlemler</CardTitle>
            <CardDescription>
              Maksimum deneme sayısına ulaşan işlemler (manuel müdahale gerekli)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedMutations.map((mutation) => (
                <div
                  key={mutation.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{mutation.type}</Badge>
                      <span className="text-sm font-medium">{mutation.collection}</span>
                      <Badge variant="destructive" className="text-xs">
                        {mutation.retryCount} deneme
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(mutation.timestamp), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingMutations.length === 0 && failedMutations.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>Bekleyen offline işlem yok</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

