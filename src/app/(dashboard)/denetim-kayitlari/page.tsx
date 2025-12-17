'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLayout } from '@/components/layouts/PageLayout';
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

type ActionFilter = 'all' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';

interface AuditLog {
  _id: string;
  _creationTime: number;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  resource: string;
  resourceId: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, resourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '100');

      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      if (resourceFilter !== 'all') {
        params.append('resource', resourceFilter);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      return (data.data || []) as AuditLog[];
    },
  });

  // Calculate statistics
  const stats = {
    total: logs?.length || 0,
    creates: logs?.filter((l) => l.action === 'CREATE').length || 0,
    updates: logs?.filter((l) => l.action === 'UPDATE').length || 0,
    deletes: logs?.filter((l) => l.action === 'DELETE').length || 0,
    views: logs?.filter((l) => l.action === 'VIEW').length || 0,
  };

  // Get unique resources for filter
  const resources = ['all', ...new Set(logs?.map((l) => l.resource) || [])];

  // Filter logs by search term
  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.userName.toLowerCase().includes(search) ||
      log.resource.toLowerCase().includes(search) ||
      log.resourceId.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <Badge className="bg-success text-success-foreground">
            <Plus className="h-3 w-3 mr-1" />
            Oluşturma
          </Badge>
        );
      case 'UPDATE':
        return (
          <Badge className="bg-info text-info-foreground">
            <Edit className="h-3 w-3 mr-1" />
            Güncelleme
          </Badge>
        );
      case 'DELETE':
        return (
          <Badge variant="destructive">
            <Trash2 className="h-3 w-3 mr-1" />
            Silme
          </Badge>
        );
      case 'VIEW':
        return (
          <Badge variant="secondary">
            <Eye className="h-3 w-3 mr-1" />
            Görüntüleme
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getResourceLabel = (resource: string) => {
    const labels: Record<string, string> = {
      beneficiary: 'İhtiyaç Sahibi',
      user: 'Kullanıcı',
      donation: 'Bağış',
      scholarship: 'Burs',
      task: 'Görev',
      meeting: 'Toplantı',
      message: 'Mesaj',
      aid_application: 'Yardım Başvurusu',
      partner: 'Ortak Kuruluş',
    };
    return labels[resource] || resource;
  };

  const exportToCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;

    const headers = ['Tarih', 'Kullanıcı', 'İşlem', 'Kaynak', 'Kaynak ID', 'IP Adresi'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: tr }),
      log.userName,
      log.action,
      getResourceLabel(log.resource),
      log.resourceId,
      log.ipAddress || '-',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `denetim-kayitlari-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <PageLayout
      title="Denetim Kayıtları"
      description="KVKK/GDPR uyumluluğu için tüm sistem işlemlerini görüntüleyin"
      badge={{ text: `${stats.total} Kayıt`, variant: 'default' }}
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm kayıtlı işlemler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oluşturma</CardTitle>
            <Plus className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.creates}</div>
            <p className="text-xs text-muted-foreground mt-1">Yeni kayıt işlemleri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Güncelleme</CardTitle>
            <Edit className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.updates}</div>
            <p className="text-xs text-muted-foreground mt-1">Değişiklik işlemleri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Silme</CardTitle>
            <Trash2 className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{stats.deletes}</div>
            <p className="text-xs text-muted-foreground mt-1">Silme işlemleri</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
          <CardDescription>Denetim kayıtlarını filtreleyin ve arayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı, kaynak veya ID ara..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="İşlem türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="CREATE">Oluşturma</SelectItem>
                <SelectItem value="UPDATE">Güncelleme</SelectItem>
                <SelectItem value="DELETE">Silme</SelectItem>
                <SelectItem value="VIEW">Görüntüleme</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kaynak seçin" />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource === 'all' ? 'Tüm Kaynaklar' : getResourceLabel(resource)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV İndir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Denetim Kayıtları</CardTitle>
          <CardDescription>{filteredLogs?.length || 0} kayıt gösteriliyor</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Kaynak ID</TableHead>
                    <TableHead>IP Adresi</TableHead>
                    <TableHead className="text-right">Detay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getResourceLabel(log.resource)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.resourceId.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Denetim Kaydı Detayı</DialogTitle>
                              <DialogDescription>Denetim kaydının detaylı bilgileri</DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Kullanıcı
                                    </label>
                                    <p className="mt-1 font-medium">{selectedLog.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {selectedLog.userId}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      İşlem
                                    </label>
                                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Kaynak
                                    </label>
                                    <p className="mt-1">{getResourceLabel(selectedLog.resource)}</p>
                                    <p className="text-xs font-mono text-muted-foreground break-all">
                                      {selectedLog.resourceId}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      <Calendar className="inline h-3 w-3 mr-1" />
                                      Tarih
                                    </label>
                                    <p className="mt-1">
                                      {format(
                                        new Date(selectedLog.timestamp),
                                        'dd MMMM yyyy, HH:mm:ss',
                                        {
                                          locale: tr,
                                        }
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {selectedLog.ipAddress && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      IP Adresi
                                    </label>
                                    <p className="mt-1 font-mono text-sm">
                                      {selectedLog.ipAddress}
                                    </p>
                                  </div>
                                )}

                                {selectedLog.userAgent && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Tarayıcı
                                    </label>
                                    <p className="mt-1 text-sm text-foreground">
                                      {selectedLog.userAgent}
                                    </p>
                                  </div>
                                )}

                                {selectedLog.changes && (
                                  <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Değişiklikler
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                      {selectedLog.changes.before && (
                                        <div>
                                          <p className="text-xs font-semibold text-error mb-2">
                                            Önce:
                                          </p>
                                          <pre className="p-3 bg-error/10 rounded text-xs overflow-auto max-h-64">
                                            {JSON.stringify(selectedLog.changes.before, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                      {selectedLog.changes.after && (
                                        <div>
                                          <p className="text-xs font-semibold text-success mb-2">
                                            Sonra:
                                          </p>
                                          <pre className="p-3 bg-success/10 rounded text-xs overflow-auto max-h-64">
                                            {JSON.stringify(selectedLog.changes.after, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {selectedLog.metadata &&
                                  Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Ek Bilgiler
                                      </label>
                                      <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto max-h-32">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Kayıt bulunamadı</h3>
              <p className="text-muted-foreground">
                {searchTerm || actionFilter !== 'all' || resourceFilter !== 'all'
                  ? 'Filtrelere uygun kayıt bulunamadı. Filtreleri değiştirmeyi deneyin.'
                  : 'Henüz hiç denetim kaydı oluşturulmamış.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KVKK Compliance Info */}
      <Card className="mt-6 border-info/20 bg-info/10">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KVKK/GDPR Uyumluluk Bilgisi
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Tüm kritik işlemler otomatik olarak kaydedilir ve 7 yıl boyunca saklanır.</p>
          <p>
            • Denetim kayıtları, veri sorumlusunun hesap verebilirlik yükümlülüğü kapsamında
            tutulmaktadır.
          </p>
          <p>• TC Kimlik No erişimleri özel olarak loglanır ve düzenli olarak denetlenir.</p>
          <p>• Kayıtlar değiştirilemez ve silinenemez (immutable).</p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
