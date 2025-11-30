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
  Mail,
  Phone,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type CommunicationType = 'email' | 'sms' | 'all';
type StatusFilter = 'all' | 'sent' | 'failed' | 'pending';

interface CommunicationLog {
  _id: string;
  _creationTime: number;
  type: 'email' | 'sms';
  to: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  error?: string;
  sentAt: string;
  userId?: string;
  metadata?: {
    userName?: string;
    recipientCount?: number;
    [key: string]: unknown;
  };
}

export default function CommunicationHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<CommunicationType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);

  // Fetch communication logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['communication-logs', typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '100');

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/communication-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communication logs');
      }
      const data = await response.json();
      return (data.data || []) as CommunicationLog[];
    },
  });

  // Calculate statistics
  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter((l) => l.status === 'sent').length || 0,
    failed: logs?.filter((l) => l.status === 'failed').length || 0,
    pending: logs?.filter((l) => l.status === 'pending').length || 0,
    emails: logs?.filter((l) => l.type === 'email').length || 0,
    sms: logs?.filter((l) => l.type === 'sms').length || 0,
  };

  // Filter logs by search term
  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.to.toLowerCase().includes(search) ||
      log.message.toLowerCase().includes(search) ||
      log.subject?.toLowerCase().includes(search) ||
      log.metadata?.userName?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gönderildi
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Başarısız
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Bekliyor
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'email' ? (
      <Mail className="h-4 w-4 text-blue-600" />
    ) : (
      <Phone className="h-4 w-4 text-green-600" />
    );
  };

  const exportToCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;

    const headers = ['Tarih', 'Tür', 'Alıcı', 'Konu', 'Durum', 'Hata'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.sentAt), 'dd/MM/yyyy HH:mm', { locale: tr }),
      log.type === 'email' ? 'E-posta' : 'SMS',
      log.to,
      log.subject || '-',
      log.status === 'sent' ? 'Gönderildi' : log.status === 'failed' ? 'Başarısız' : 'Bekliyor',
      log.error || '-',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `iletisim-gecmisi-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <PageLayout
      title="İletişim Geçmişi"
      description="E-posta ve SMS gönderim kayıtlarını görüntüleyin"
      badge={{ text: `${stats.total} Kayıt`, variant: 'default' }}
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gönderim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.emails} e-posta, {stats.sms} SMS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarılı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0}% başarı oranı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.failed > 0 && 'Hata detaylarını görüntüleyin'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pending > 0 ? 'Gönderilmeyi bekliyor' : 'Bekleyen yok'}
            </p>
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
          <CardDescription>Kayıtları filtreleyin ve arayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Alıcı, konu veya gönderen ara..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CommunicationType)}>
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="email">E-posta</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="sent">Gönderildi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="pending">Bekliyor</SelectItem>
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
          <CardTitle>İletişim Kayıtları</CardTitle>
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
                    <TableHead>Tür</TableHead>
                    <TableHead>Alıcı</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Gönderen</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.sentAt), 'dd/MM/yyyy HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log.type)}
                          <span className="text-sm capitalize">
                            {log.type === 'email' ? 'E-posta' : 'SMS'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.to}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.subject || `${log.message.substring(0, 50)}...`}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {log.metadata?.userName || 'Sistem'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>İletişim Detayı</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Tür</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getTypeIcon(selectedLog.type)}
                                      <span>
                                        {selectedLog.type === 'email' ? 'E-posta' : 'SMS'}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Durum
                                    </label>
                                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Alıcı
                                    </label>
                                    <p className="mt-1 font-medium">{selectedLog.to}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Tarih
                                    </label>
                                    <p className="mt-1">
                                      {format(new Date(selectedLog.sentAt), 'dd MMMM yyyy, HH:mm', {
                                        locale: tr,
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {selectedLog.subject && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Konu
                                    </label>
                                    <p className="mt-1 font-medium">{selectedLog.subject}</p>
                                  </div>
                                )}

                                <div>
                                  <label className="text-sm font-medium text-gray-600">Mesaj</label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                                    {selectedLog.message}
                                  </div>
                                </div>

                                {selectedLog.error && (
                                  <div>
                                    <label className="text-sm font-medium text-red-600">Hata</label>
                                    <p className="mt-1 text-red-600 text-sm">{selectedLog.error}</p>
                                  </div>
                                )}

                                {selectedLog.messageId && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Mesaj ID
                                    </label>
                                    <p className="mt-1 font-mono text-xs text-gray-500">
                                      {selectedLog.messageId}
                                    </p>
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
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kayıt bulunamadı</h3>
              <p className="text-gray-600">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Filtrelere uygun kayıt bulunamadı. Filtreleri değiştirmeyi deneyin.'
                  : 'Henüz hiç e-posta veya SMS gönderilmemiş.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
