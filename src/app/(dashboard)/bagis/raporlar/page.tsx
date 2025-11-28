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
import { toast } from 'sonner';
import logger from '@/lib/logger';
import {
  FileText,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Filter,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { generateDonationPDF } from '@/lib/utils/pdf-export';
import { apiClient as api } from '@/lib/api/api-client';

interface DonationReport {
  _id: string;
  donor_name: string;
  donor_email?: string;
  amount: number;
  currency: string;
  donation_type: string;
  payment_method: string;
  status: string;
  _creationTime: string;
}

interface ReportData {
  totalAmount: number;
  totalDonations: number;
  averageDonation: number;
  completedDonations: number;
  pendingDonations: number;
  monthlyData: { month: string; amount: number; count: number }[];
  typeData: { type: string; amount: number; count: number }[];
  paymentMethodData: { method: string; amount: number; count: number }[];
  topDonors: { donor: string; amount: number; count: number }[];
}

export default function DonationReportsPage() {
  const [dateRange, setDateRange] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Fetch all donations for reporting
  const { data: donationsData, isLoading } = useQuery({
    queryKey: ['donations-report'],
    queryFn: () => api.donations.getDonations({ limit: 1000 }),
  });

  const donations: DonationReport[] = useMemo(() => {
    const data = (donationsData?.data || []) as unknown as Array<Record<string, unknown>>;
    return data.map((d) => {
      const doc = d as { _creationTime?: number; $createdAt?: string; createdAt?: string; [key: string]: unknown };
      return {
        ...doc,
        _creationTime: doc._creationTime 
          ? new Date(doc._creationTime).toISOString() 
          : (doc.$createdAt || doc.createdAt || new Date().toISOString()),
      };
    }) as DonationReport[];
  }, [donationsData]);

  // Process data based on filters
  const reportData: ReportData | null = useMemo(() => {
    if (!donations.length) return null;

    // Apply date filter
    let filteredDonations = donations;
    const now = new Date();

    if (dateRange === 'last7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredDonations = donations.filter((d) => new Date(d._creationTime) >= sevenDaysAgo);
    } else if (dateRange === 'last30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredDonations = donations.filter((d) => new Date(d._creationTime) >= thirtyDaysAgo);
    } else if (dateRange === 'thisYear') {
      const thisYear = now.getFullYear();
      filteredDonations = donations.filter(
        (d) => new Date(d._creationTime).getFullYear() === thisYear
      );
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      filteredDonations = donations.filter((d) => {
        const donationDate = new Date(d._creationTime);
        return donationDate >= start && donationDate <= end;
      });
    }

    // Calculate totals
    const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonations = filteredDonations.length;
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;
    const completedDonations = filteredDonations.filter((d) => d.status === 'completed').length;
    const pendingDonations = filteredDonations.filter((d) => d.status === 'pending').length;

    // Monthly data
    const monthlyMap = new Map<string, { amount: number; count: number }>();
    filteredDonations.forEach((d) => {
      const date = new Date(d._creationTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { amount: 0, count: 0 });
      }
      const data = monthlyMap.get(monthKey)!;
      data.amount += d.amount;
      data.count += 1;
    });

    const monthlyData = Array.from(monthlyMap.entries())
      .map(([key, data]) => ({
        month: key,
        amount: data.amount,
        count: data.count,
      }))
      .sort()
      .slice(-12); // Last 12 months

    // Type data
    const typeMap = new Map<string, { amount: number; count: number }>();
    filteredDonations.forEach((d) => {
      const type = d.donation_type;
      if (!typeMap.has(type)) {
        typeMap.set(type, { amount: 0, count: 0 });
      }
      const data = typeMap.get(type)!;
      data.amount += d.amount;
      data.count += 1;
    });

    const typeData = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      amount: data.amount,
      count: data.count,
    }));

    // Payment method data
    const paymentMap = new Map<string, { amount: number; count: number }>();
    filteredDonations.forEach((d) => {
      const method = d.payment_method;
      if (!paymentMap.has(method)) {
        paymentMap.set(method, { amount: 0, count: 0 });
      }
      const data = paymentMap.get(method)!;
      data.amount += d.amount;
      data.count += 1;
    });

    const paymentMethodData = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
    }));

    // Top donors
    const donorMap = new Map<string, { amount: number; count: number }>();
    filteredDonations.forEach((d) => {
      const donor = d.donor_name;
      if (!donorMap.has(donor)) {
        donorMap.set(donor, { amount: 0, count: 0 });
      }
      const data = donorMap.get(donor)!;
      data.amount += d.amount;
      data.count += 1;
    });

    const topDonors = Array.from(donorMap.entries())
      .map(([donor, data]) => ({ donor, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalAmount,
      totalDonations,
      averageDonation,
      completedDonations,
      pendingDonations,
      monthlyData,
      typeData,
      paymentMethodData,
      topDonors,
    };
  }, [donations, dateRange, customStartDate, customEndDate]);

  const handleExportExcel = () => {
    if (!reportData) return;

    const csvContent = [
      // Header
      ['Rapor Türü', 'Bağış Raporları'],
      ['Tarih', new Date().toLocaleDateString('tr-TR')],
      [''],
      // Summary
      ['ÖZET'],
      ['Toplam Bağış Adedi', reportData.totalDonations],
      ['Toplam Tutar', `${reportData.totalAmount.toLocaleString('tr-TR')} ₺`],
      ['Ortalama Bağış', `${reportData.averageDonation.toLocaleString('tr-TR')} ₺`],
      ['Tamamlanan', reportData.completedDonations],
      ['Bekleyen', reportData.pendingDonations],
      [''],
      // Top donors
      ['EN ÇOK BAĞIŞ YAPANLAR'],
      ['Bağışçı', 'Toplam Tutar', 'Bağış Sayısı'],
      ...reportData.topDonors.map((d) => [
        d.donor,
        `${d.amount.toLocaleString('tr-TR')} ₺`,
        d.count,
      ]),
      [''],
      // Type breakdown
      ['BAĞIŞ TÜRLERİ'],
      ['Tür', 'Tutar', 'Adet'],
      ...reportData.typeData.map((t) => [t.type, `${t.amount.toLocaleString('tr-TR')} ₺`, t.count]),
    ];

    const csv = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bagis-raporu-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Rapor Excel formatında indirildi');
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    try {
      generateDonationPDF(reportData);
      toast.success('Rapor PDF formatında indirildi');
    } catch (error) {
      logger.error('Donation report PDF export failed', { error });
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bağış Raporları</h1>
          <p className="text-muted-foreground mt-2">
            Bağış verilerini analiz edin ve raporlar oluşturun
          </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Bağış Raporları</h1>
          <p className="text-muted-foreground mt-2">
            Bağış verilerini analiz edin ve raporlar oluşturun
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Veri bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-2">
              Rapor oluşturmak için bağış verisi bulunmuyor
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bağış Raporları</h1>
          <p className="text-muted-foreground mt-2">
            Bağış verilerini analiz edin ve raporlar oluşturun
          </p>
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
              <DialogDescription>Raporu istediğiniz formatta indirin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={handleExportExcel}
                className="w-full justify-start"
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.totalAmount.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">{reportData.totalDonations} bağış</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Bağış</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.averageDonation.toLocaleString('tr-TR', {
                maximumFractionDigits: 0,
              })}{' '}
              ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bağış başına</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.completedDonations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((reportData.completedDonations / reportData.totalDonations) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.pendingDonations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((reportData.pendingDonations / reportData.totalDonations) * 100).toFixed(1)}%
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
            <CardDescription>Son 12 ayın bağış durumu</CardDescription>
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
                    <span className="text-muted-foreground">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(item.amount / reportData.totalAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{item.count} bağış</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Donation Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Bağış Türleri
            </CardTitle>
            <CardDescription>Tür bazında dağılım</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.typeData.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-muted-foreground">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(item.amount / reportData.totalAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{item.count} bağış</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Donors */}
      <Card>
        <CardHeader>
          <CardTitle>En Çok Bağış Yapanlar</CardTitle>
          <CardDescription>Top 10 bağışçı listesi</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sıra</TableHead>
                <TableHead>Bağışçı</TableHead>
                <TableHead className="text-right">Toplam Tutar</TableHead>
                <TableHead className="text-right">Bağış Sayısı</TableHead>
                <TableHead className="text-right">Ort. Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.topDonors.map((donor, index) => (
                <TableRow key={donor.donor}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{donor.donor}</TableCell>
                  <TableCell className="text-right font-medium">
                    {donor.amount.toLocaleString('tr-TR')} ₺
                  </TableCell>
                  <TableCell className="text-right">{donor.count}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(donor.amount / donor.count).toLocaleString('tr-TR', {
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

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Yöntemleri</CardTitle>
          <CardDescription>Ödeme yöntemi bazında analiz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {reportData.paymentMethodData.map((method) => (
              <div key={method.method} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{method.method}</h3>
                  <Badge variant="secondary">{method.count}</Badge>
                </div>
                <div className="text-2xl font-bold">{method.amount.toLocaleString('tr-TR')} ₺</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {((method.amount / reportData.totalAmount) * 100).toFixed(1)}% toplam
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
