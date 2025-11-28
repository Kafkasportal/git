'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DemoBanner } from '@/components/ui/demo-banner';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  FileDown,
  Filter,
} from 'lucide-react';
import { generateFinancialReportPDF } from '@/lib/utils/pdf-export';

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    count: number;
    type: 'income' | 'expense';
  }[];
  monthlyData: { month: string; income: number; expense: number; net: number }[];
  paymentMethodData: { method: string; amount: number; count: number }[];
  statusData: { status: string; amount: number; count: number }[];
}

// Currency labels defined but not used in current implementation

export default function FundReportsPage() {
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Mock data for demonstration
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['financial-reports', dateRange, customStartDate, customEndDate, reportType],
    queryFn: () => {
      const mockReportData: ReportData = {
        totalIncome: 62000,
        totalExpense: 28000,
        netIncome: 34000,
        categoryBreakdown: [
          { category: 'Bağış Gelirleri', amount: 50000, count: 12, type: 'income' },
          { category: 'Kurs Gelirleri', amount: 12000, count: 8, type: 'income' },
          { category: 'Burs Ödemeleri', amount: 25000, count: 15, type: 'expense' },
          { category: 'Ofis Giderleri', amount: 3000, count: 3, type: 'expense' },
        ],
        monthlyData: [
          { month: '2024-07', income: 8000, expense: 2000, net: 6000 },
          { month: '2024-08', income: 12000, expense: 3000, net: 9000 },
          { month: '2024-09', income: 15000, expense: 4000, net: 11000 },
          { month: '2024-10', income: 18000, expense: 5000, net: 13000 },
          { month: '2024-11', income: 20000, expense: 6000, net: 14000 },
          { month: '2024-12', income: 22000, expense: 8000, net: 14000 },
        ],
        paymentMethodData: [
          { method: 'Banka Transferi', amount: 35000, count: 20 },
          { method: 'Nakit', amount: 15000, count: 12 },
          { method: 'Kredi Kartı', amount: 12000, count: 8 },
        ],
        statusData: [
          { status: 'Onaylandı', amount: 58000, count: 25 },
          { status: 'Beklemede', amount: 4000, count: 3 },
        ],
      };

      return Promise.resolve(mockReportData);
    },
  });

  // Transform data based on reportType
  const displayedData = useMemo(() => {
    if (!reportsData) return null;

    if (reportType === 'summary') {
      // Summary mode: Show aggregated/reduced data
      return {
        ...reportsData,
        // Show only last 3 months for summary
        monthlyData: reportsData.monthlyData.slice(-3),
        // Aggregate categories by type (combine income and expense separately)
        categoryBreakdown: [
          {
            category: 'Toplam Gelirler',
            amount: reportsData.categoryBreakdown
              .filter((c) => c.type === 'income')
              .reduce((sum, c) => sum + c.amount, 0),
            count: reportsData.categoryBreakdown
              .filter((c) => c.type === 'income')
              .reduce((sum, c) => sum + c.count, 0),
            type: 'income' as const,
          },
          {
            category: 'Toplam Giderler',
            amount: reportsData.categoryBreakdown
              .filter((c) => c.type === 'expense')
              .reduce((sum, c) => sum + c.amount, 0),
            count: reportsData.categoryBreakdown
              .filter((c) => c.type === 'expense')
              .reduce((sum, c) => sum + c.count, 0),
            type: 'expense' as const,
          },
        ],
        // Show only top 2 payment methods
        paymentMethodData: reportsData.paymentMethodData
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 2),
        // Aggregate status data (combine all into one summary)
        statusData: [
          {
            status: 'Toplam',
            amount: reportsData.statusData.reduce((sum, s) => sum + s.amount, 0),
            count: reportsData.statusData.reduce((sum, s) => sum + s.count, 0),
          },
        ],
      };
    } else {
      // Detailed mode: Show all data
      return reportsData;
    }
  }, [reportsData, reportType]);

  const reportData = displayedData;

  const handleExportExcel = () => {
    if (!reportData) return;

    const csvContent = [
      ['Rapor Türü', 'Finans Raporu'],
      ['Rapor Formatı', reportType === 'summary' ? 'Özet' : 'Detaylı'],
      ['Tarih', new Date().toLocaleDateString('tr-TR')],
      [
        'Tarih Aralığı',
        dateRange === 'custom' ? `${customStartDate} - ${customEndDate}` : 'Tüm Zamanlar',
      ],
      [''],
      ['ÖZET'],
      ['Toplam Gelir', `${reportData.totalIncome.toLocaleString('tr-TR')} ₺`],
      ['Toplam Gider', `${reportData.totalExpense.toLocaleString('tr-TR')} ₺`],
      ['Net Gelir', `${reportData.netIncome.toLocaleString('tr-TR')} ₺`],
      [''],
      ['KATEGORİ DAĞILIMI'],
      ['Kategori', 'Tip', 'Tutar', 'Adet'],
      ...reportData.categoryBreakdown.map((item) => [
        item.category,
        item.type === 'income' ? 'Gelir' : 'Gider',
        `${item.amount.toLocaleString('tr-TR')} ₺`,
        item.count.toString(),
      ]),
      [''],
      ['AYLIK TREND'],
      ['Ay', 'Gelir', 'Gider', 'Net'],
      ...reportData.monthlyData.map((item) => [
        new Date(`${item.month}-01`).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'short',
        }),
        `${item.income.toLocaleString('tr-TR')} ₺`,
        `${item.expense.toLocaleString('tr-TR')} ₺`,
        `${item.net.toLocaleString('tr-TR')} ₺`,
      ]),
    ];

    const csv = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finans-raporu-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Finans raporu Excel formatında indirildi');
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    try {
      generateFinancialReportPDF(reportData);
      toast.success('Finans raporu PDF formatında indirildi');
    } catch (error) {
      logger.error('Fund report PDF export failed', { error });
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finans Raporları</h1>
          <p className="text-muted-foreground mt-2">Mali raporları görüntüleyin ve analiz edin</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finans Raporları</h1>
          <p className="text-muted-foreground mt-2">Mali raporları görüntüleyin ve analiz edin</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Veri bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-2">
              Rapor oluşturmak için finans verisi bulunmuyor
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finans Raporları</h1>
          <p className="text-muted-foreground mt-2">Mali raporları görüntüleyin ve analiz edin</p>
        </div>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Raporu İndir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raporu Dışa Aktar</DialogTitle>
              <DialogDescription>Finans raporunu istediğiniz formatta indirin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={handleExportExcel}
                className="w-full justify-start"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel (CSV) Olarak İndir
              </Button>
              <Button onClick={handleExportPDF} className="w-full justify-start" variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                PDF Olarak İndir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Rapor Filtreleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-range">Tarih Aralığı</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Zamanlar</SelectItem>
                  <SelectItem value="last7days">Son 7 Gün</SelectItem>
                  <SelectItem value="last30days">Son 30 Gün</SelectItem>
                  <SelectItem value="thisYear">Bu Yıl</SelectItem>
                  <SelectItem value="custom">Özel Tarih</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <Label htmlFor="start-date">Başlangıç</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Bitiş</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="report-type">Rapor Türü</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Özet</SelectItem>
                  <SelectItem value="detailed">Detaylı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.totalIncome.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.categoryBreakdown
                .filter((c) => c.type === 'income')
                .reduce((sum, c) => sum + c.count, 0)}{' '}
              kayıt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reportData.totalExpense.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.categoryBreakdown
                .filter((c) => c.type === 'expense')
                .reduce((sum, c) => sum + c.count, 0)}{' '}
              kayıt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Gelir</CardTitle>
            <DollarSign
              className={`h-4 w-4 ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {reportData.netIncome.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.totalIncome && reportData.totalIncome !== 0
                ? (() => {
                    const percentage = (reportData.netIncome / reportData.totalIncome) * 100;
                    return Number.isFinite(percentage) ? `${percentage.toFixed(1)}%` : '0.0%';
                  })()
                : '-'}{' '}
              marj
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Aylık Trendi
            </CardTitle>
            <CardDescription>
              {reportType === 'summary'
                ? 'Son 3 ayın finansal durumu'
                : 'Son 6 ayın finansal durumu'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthlyData.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">
                      {new Date(`${item.month}-01`).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span
                      className={`font-bold ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {item.net.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${Math.max((item.income / (item.income + item.expense)) * 100, 0)}%`,
                        }}
                      />
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${Math.max((item.expense / (item.income + item.expense)) * 100, 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span> Gelir: {item.income.toLocaleString('tr-TR')} ₺</span>
                    <span> Gider: {item.expense.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Kategori Dağılımı
            </CardTitle>
            <CardDescription>Gelir ve gider kategorileri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.categoryBreakdown.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${item.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{
                        width: `${(item.amount / (item.type === 'income' ? reportData.totalIncome : reportData.totalExpense)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.count} kayıt • {item.type === 'income' ? 'Gelir' : 'Gider'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Yöntemleri</CardTitle>
          <CardDescription>Ödeme yöntemi bazında analiz</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ödeme Yöntemi</TableHead>
                <TableHead className="text-right">Toplam Tutar</TableHead>
                <TableHead className="text-right">İşlem Sayısı</TableHead>
                <TableHead className="text-right">Ortalama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.paymentMethodData.map((method) => (
                <TableRow key={method.method}>
                  <TableCell className="font-medium">{method.method}</TableCell>
                  <TableCell className="text-right">
                    {method.amount.toLocaleString('tr-TR')} ₺
                  </TableCell>
                  <TableCell className="text-right">{method.count}</TableCell>
                  <TableCell className="text-right">
                    {(method.amount / method.count).toLocaleString('tr-TR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    ₺
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Durum Özeti</CardTitle>
          <CardDescription>İşlem durumlarına göre dağılım</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {reportData.statusData.map((status) => (
              <div key={status.status} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{status.status}</h3>
                  <Badge variant="secondary">{status.count}</Badge>
                </div>
                <div className="text-2xl font-bold">{status.amount.toLocaleString('tr-TR')} ₺</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {(
                    (status.amount / (reportData.totalIncome + reportData.totalExpense)) *
                    100
                  ).toFixed(1)}
                  % toplam
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
