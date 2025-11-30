'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parametersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Check, X } from 'lucide-react';
import type { ParameterCategory } from '@/types/database';

const CATEGORY_LABELS: Record<ParameterCategory, string> = {
  gender: 'Cinsiyet',
  religion: 'İnanç',
  marital_status: 'Medeni Durum',
  employment_status: 'Çalışma Durumu',
  living_status: 'Yaşam Durumu',
  housing_type: 'Konut Türü',
  income_level: 'Gelir Düzeyi',
  guardian_relation: 'Vasi Yakınlık Derecesi',
  education_status: 'Eğitim Durumu',
  education_level: 'Eğitim Düzeyi',
  education_success: 'Eğitim Başarısı',
  death_reason: 'Vefat Nedeni',
  health_problem: 'Sağlık Sorunu',
  illness: 'Hastalık',
  treatment: 'Tedavi',
  special_condition: 'Özel Durum',
  occupation: 'Meslek',
  cancellation_reason: 'İptal Nedeni',
  document_type: 'Belge Türü',
  refund_reason: 'İade Nedeni',
  sponsorship_end_reason: 'Sponsorluk Bitirme Nedeni',
  sponsorship_continue: 'Sponsorluk Devam',
  school_type: 'Okul Türü',
  school_institution_type: 'Okul Kurum Türü',
  orphan_assignment_correction: 'Yetim Atama Düzeltmeleri',
  orphan_detail: 'Yetim Detay',
};

export default function ParametersPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['parameters', search, categoryFilter, statusFilter],
    queryFn: async () => {
      const result = await parametersApi.getAllParameters();
      if (!result.success) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Parametreler alınamadı'
        );
      }
      return result;
    },
    retry: 1,
  });

  const parameters = (data?.data || []) as unknown as Array<{
    _id: string;
    category: string;
    name_tr: string;
    value: string;
    order: number;
    is_active: boolean;
  }>;
  const total = data?.total || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: ({ category, key, value }: { category: string; key: string; value: unknown }) =>
      parametersApi.updateParameter(undefined, { category, key, value }),
    onSuccess: () => {
      toast.success('Parametre durumu güncellendi');
      void queryClient.invalidateQueries({ queryKey: ['parameters'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Güncelleme hatası: ${message}`);
    },
  });

  const deleteParameterMutation = useMutation({
    mutationFn: ({ category, key }: { category: string; key: string }) =>
      parametersApi.deleteParameter({ category, key, updatedBy: '' }),
    onSuccess: () => {
      toast.success('Parametre silindi');
      void queryClient.invalidateQueries({ queryKey: ['parameters'] });
    },
    onError: (error: Error) => {
      toast.error(`Silme hatası: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parametre Yönetimi</h1>
          <p className="text-gray-600 mt-2">
            Sistem parametrelerini yönetin - Portal Plus tarzı dinamik parametre sistemi
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Parametre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Parametre Ekle</DialogTitle>
            </DialogHeader>
            <ParameterForm
              onSuccess={() => {
                setShowCreateDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreleme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Kategoriler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arama</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Parametre adı..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters List */}
      <Card>
        <CardHeader>
          <CardTitle>Parametreler</CardTitle>
          <CardDescription>Toplam {total} parametre</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 py-12">
              <p className="text-lg font-medium mb-2">Parametreler yüklenirken hata oluştu</p>
              <p className="text-sm text-gray-600 mb-4">
                {error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['parameters'] });
                }}
              >
                Tekrar Dene
              </Button>
            </div>
          ) : parameters.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg font-medium">Parametre bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-md font-medium text-sm">
                <div className="col-span-3">Kategori</div>
                <div className="col-span-3">İsim</div>
                <div className="col-span-2">Değer</div>
                <div className="col-span-1">Sıra</div>
                <div className="col-span-1">Durum</div>
                <div className="col-span-2">İşlemler</div>
              </div>

              {parameters.map((param) => (
                <div
                  key={param._id}
                  className="grid grid-cols-12 gap-4 p-3 border rounded-md hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-3">
                    <Badge variant="outline">
                      {CATEGORY_LABELS[param.category as ParameterCategory] || param.category}
                    </Badge>
                  </div>
                  <div className="col-span-3 font-medium">{param.name_tr}</div>
                  <div className="col-span-2 text-sm text-gray-600">{param.value}</div>
                  <div className="col-span-1 text-sm">{param.order}</div>
                  <div className="col-span-1">
                    {param.is_active ? (
                      <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Pasif</Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          category: param.category,
                          key: param._id,
                          value: !param.is_active,
                        })
                      }
                    >
                      {param.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Bu parametreyi silmek istediğinizden emin misiniz?')) {
                          deleteParameterMutation.mutate({
                            category: param.category,
                            key: param._id,
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParameterForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    category: '' as ParameterCategory | '',
    name_tr: '',
    name_en: '',
    value: '',
    order: 1,
    is_active: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      parametersApi.createParameter(
        data as Omit<typeof formData, 'category'> & { category: ParameterCategory }
      ),
    onSuccess: () => {
      toast.success('Parametre eklendi');
      queryClient.invalidateQueries({ queryKey: ['parameters'] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Hata: ${message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.name_tr || !formData.value) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Kategori *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => {
            setFormData({ ...formData, category: value as ParameterCategory });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>İsim (Türkçe) *</Label>
        <Input
          value={formData.name_tr}
          onChange={(e) => {
            setFormData({ ...formData, name_tr: e.target.value });
          }}
          placeholder="Örn: Erkek"
        />
      </div>

      <div className="space-y-2">
        <Label>İsim (İngilizce)</Label>
        <Input
          value={formData.name_en}
          onChange={(e) => {
            setFormData({ ...formData, name_en: e.target.value });
          }}
          placeholder="Örn: Male"
        />
      </div>

      <div className="space-y-2">
        <Label>Değer *</Label>
        <Input
          value={formData.value}
          onChange={(e) => {
            setFormData({ ...formData, value: e.target.value });
          }}
          placeholder="Örn: male"
        />
      </div>

      <div className="space-y-2">
        <Label>Sıra *</Label>
        <Input
          type="number"
          min={1}
          value={formData.order}
          onChange={(e) => {
            setFormData({ ...formData, order: parseInt(e.target.value) });
          }}
        />
      </div>

      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Ekleniyor...' : 'Parametre Ekle'}
      </Button>
    </form>
  );
}
