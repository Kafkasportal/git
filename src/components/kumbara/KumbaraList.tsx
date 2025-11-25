'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Trash2, FileText, Loader2, MapPin, Route, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { KumbaraForm } from './KumbaraForm';
import { KumbaraPrintQR } from './KumbaraPrintQR';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';
import { appwriteConfig } from '@/lib/appwrite/config';

interface KumbaraDonation {
  _id: string;
  donor_name: string;
  donor_phone: string;
  amount: number;
  currency: string;
  kumbara_location: string;
  kumbara_institution: string;
  collection_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  receipt_number: string;
  receipt_file_id?: string;
  location_coordinates?: { lat: number; lng: number } | null;
  location_address?: string;
  route_points?: Array<{ lat: number; lng: number; address?: string }>;
  route_distance?: number | null;
  route_duration?: number | null;
}

interface KumbaraListProps {
  onCreate?: () => void;
}

export function KumbaraList({ onCreate }: KumbaraListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  // Real-time subscription for donations
  const { isConnected: _isConnected } = useAppwriteRealtime(
    appwriteConfig.collections.donations,
    {
      notifyOnChange: true,
      changeMessage: 'Yeni kumbara bağışı eklendi',
      skipInitial: true,
      onChange: (event) => {
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['kumbara-donations'] });
        queryClient.invalidateQueries({ queryKey: ['kumbara-stats'] });
        
        // Show specific messages
        if (event === 'create') {
          toast.success('Yeni kumbara bağışı eklendi!');
        } else if (event === 'update') {
          toast.info('Kumbara bağışı güncellendi');
        } else if (event === 'delete') {
          toast.warning('Kumbara bağışı silindi');
        }
      },
    }
  );

  const { data, isLoading, error } = useQuery<{
    donations: KumbaraDonation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ['kumbara-donations', search, statusFilter, locationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (locationFilter !== 'all') params.append('location', locationFilter);

      const response = await fetch(`/api/kumbara?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Kumbara listesi yüklenemedi');
      }
      return response.json();
    },
  });

  const { mutate: deleteKumbara } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/kumbara/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Kumbara silinemedi');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumbara-donations'] });
      queryClient.invalidateQueries({ queryKey: ['kumbara-stats'] });
      toast.success('Kumbara bağışı başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Beklemede', className: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Tamamlandı', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'İptal', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={cn('font-normal', config.className)}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleCreateSuccess = () => {
    setIsFormOpen(false);
    onCreate?.();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">Kumbara listesi yüklenirken hata oluştu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Kumbara Listesi</CardTitle>
          <CardDescription>Tüm kumbara bağışlarını görüntüleyin ve yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Bağışçı adı veya lokasyon ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Lokasyon seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Lokasyonlar</SelectItem>
                {/* Bu liste API'den gelecek, şimdilik statik */}
                <SelectItem value="ofis">Ofis Giriş</SelectItem>
                <SelectItem value="market">Market Girişi</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Kumbara
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden p-3">
                <DialogHeader className="sr-only pb-0">
                  <DialogTitle>Yeni Kumbara Bağışı</DialogTitle>
                  <DialogDescription>
                    Kumbara bağışını kaydetmek için formu doldurunuz.
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-50px)] pr-0.5 -mr-0.5">
                  <KumbaraForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsFormOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tablo */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bağışçı</TableHead>
                  <TableHead>Lokasyon</TableHead>
                  <TableHead>Koordinat/Rota</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Belgeler</TableHead>
                  <TableHead>Toplama Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Kumbara bağışı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.donations.map((donation) => (
                    <TableRow key={donation._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{donation.donor_name}</p>
                          <p className="text-sm text-muted-foreground">{donation.donor_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{donation.kumbara_location}</p>
                          {donation.location_address && (
                            <p className="text-xs text-muted-foreground">
                              {donation.location_address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {donation.location_coordinates ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {donation.location_coordinates.lat.toFixed(4)},{' '}
                                {donation.location_coordinates.lng.toFixed(4)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Konum yok</span>
                          )}
                          {donation.route_points && donation.route_points.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Route className="h-3 w-3" />
                              <span>
                                {donation.route_points.length} nokta
                                {donation.route_distance &&
                                  ` (${donation.route_distance.toFixed(1)} km)`}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(donation.amount, donation.currency)}</TableCell>
                      <TableCell>
                        {donation.receipt_file_id ? (
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-4 w-4 text-blue-600" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                // Open file in new tab
                                window.open(
                                  `/api/storage/files/${donation.receipt_file_id}?download=true`,
                                  '_blank'
                                );
                              }}
                            >
                              <span className="text-xs">Belge var</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(donation.collection_date), 'dd MMMM yyyy', {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(donation.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <KumbaraPrintQR
                            kumbara={{
                              id: donation._id,
                              donor_name: donation.donor_name,
                              kumbara_location: donation.kumbara_location,
                              kumbara_institution: donation.kumbara_institution,
                              collection_date: donation.collection_date,
                              amount: donation.amount,
                              currency: donation.currency,
                              receipt_number: donation.receipt_number,
                            }}
                          />
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Kumbara bağışını silmek istediğinizden emin misiniz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu işlem geri alınamaz. Kumbara bağışı kalıcı olarak silinecektir.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteKumbara(donation._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Sayfalama */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={data.pagination.page === 1}>
                Önceki
              </Button>
              <span className="text-sm text-muted-foreground">
                Sayfa {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.pagination.page === data.pagination.totalPages}
              >
                Sonraki
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
