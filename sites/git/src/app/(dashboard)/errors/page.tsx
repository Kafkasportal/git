'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logger from '@/lib/logger';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';

interface ErrorStats {
  total: number;
  activeErrors: number;
  criticalErrors: number;
  totalOccurrences: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}

interface ErrorItem {
  _id: string;
  error_code: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  component?: string;
}

export default function ErrorsPage() {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/errors/stats');
      const { data } = await response.json();
      setStats(data);
    } catch (error) {
      logger.error('Failed to fetch error stats', { error });
    }
  };

  const fetchErrors = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterSeverity) params.append('severity', filterSeverity);
      params.append('limit', '20');

      const response = await fetch(`/api/errors?${params.toString()}`);
      const { data } = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      logger.error('Failed to fetch error list', { error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
    void fetchErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSeverity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-500';
      case 'reopened':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <PageLayout title="Hata Takip Sistemi" description="Uygulama hatalarını izleyin ve yönetin">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Hata</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalOccurrences || 0} toplam oluşum
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Hatalar</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeErrors || 0}</div>
              <p className="text-xs text-muted-foreground">Açık veya devam eden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kritik Hatalar</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.criticalErrors || 0}</div>
              <p className="text-xs text-muted-foreground">Acil müdahale gerekli</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Çözülen</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.byStatus?.resolved || 0}
              </div>
              <p className="text-xs text-muted-foreground">Başarıyla çözüldü</p>
            </CardContent>
          </Card>
        </div>

        {/* Severity Distribution */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Önem Derecesine Göre Dağılım</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {stats.bySeverity?.critical || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Kritik</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.bySeverity?.high || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Yüksek</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats.bySeverity?.medium || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Orta</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.bySeverity?.low || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Düşük</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hata Listesi</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchStats();
                    fetchErrors();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Durum:</span>
                <Button
                  variant={filterStatus === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('')}
                >
                  Tümü
                </Button>
                <Button
                  variant={filterStatus === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('new')}
                >
                  Yeni
                </Button>
                <Button
                  variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('in_progress')}
                >
                  Devam Ediyor
                </Button>
                <Button
                  variant={filterStatus === 'resolved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('resolved')}
                >
                  Çözüldü
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Önem:</span>
                <Button
                  variant={filterSeverity === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterSeverity('');
                  }}
                >
                  Tümü
                </Button>
                <Button
                  variant={filterSeverity === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterSeverity('critical');
                  }}
                >
                  Kritik
                </Button>
                <Button
                  variant={filterSeverity === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterSeverity('high');
                  }}
                >
                  Yüksek
                </Button>
                <Button
                  variant={filterSeverity === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterSeverity('medium');
                  }}
                >
                  Orta
                </Button>
              </div>
            </div>

            {/* Error List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
                </div>
              ) : errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-2" />
                  <p>Hata bulunamadı</p>
                </div>
              ) : (
                errors.map((error) => (
                  <Card key={error._id} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity === 'critical' && 'Kritik'}
                              {error.severity === 'high' && 'Yüksek'}
                              {error.severity === 'medium' && 'Orta'}
                              {error.severity === 'low' && 'Düşük'}
                            </Badge>
                            <Badge className={getStatusColor(error.status)}>
                              {error.status === 'new' && 'Yeni'}
                              {error.status === 'assigned' && 'Atandı'}
                              {error.status === 'in_progress' && 'Devam Ediyor'}
                              {error.status === 'resolved' && 'Çözüldü'}
                              {error.status === 'closed' && 'Kapalı'}
                              {error.status === 'reopened' && 'Yeniden Açıldı'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {error.error_code}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{error.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {error.component && (
                              <span className="flex items-center gap-1">📦 {error.component}</span>
                            )}
                            <span className="flex items-center gap-1">
                              🔄 {error.occurrence_count} oluşum
                            </span>
                            <span className="flex items-center gap-1">
                              ⏰ {formatDate(error.last_seen)}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Detaylar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
