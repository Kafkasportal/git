'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Utensils,
  Package,
  Stethoscope,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AidApplicationDocument } from '@/types/database';
import { validateAidApplicationDocument } from '@/lib/validations/aid-application';
import logger from '@/lib/logger';

const STAGE_LABELS = {
  draft: { label: 'Taslak', icon: Clock, color: 'bg-muted text-muted-foreground' },
  under_review: {
    label: 'İnceleme',
    icon: Clock,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  approved: {
    label: 'Onaylandı',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  ongoing: {
    label: 'Devam Ediyor',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  completed: {
    label: 'Tamamlandı',
    icon: CheckCircle,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  },
};

export default function AidApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['aid-application', id],
    queryFn: async () => {
      const result = await api.aidApplications.getAidApplication(id);
      return result;
    },
  });

  const { data, isLoading, error } = queryResult;

  const updateStageMutation = useMutation({
    mutationFn: ({ stage }: { stage: AidApplicationDocument['stage'] }) =>
      api.aidApplications.updateStage(id, stage),
    onSuccess: () => {
      toast.success('Aşama güncellendi');
      queryClient.invalidateQueries({ queryKey: ['aid-application', id] });
      queryClient.invalidateQueries({ queryKey: ['aid-applications'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Hata: ${message}`);
    },
  });

  // Runtime validation of API response
  const application = data?.data ? validateAidApplicationDocument(data.data) : null;

  // Log validation failures for debugging
  if (data?.data && !application) {
    logger.error('Invalid aid application data received from API', {
      applicationId: id,
      data: data.data,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive py-8">Başvuru bulunamadı</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StageIcon = STAGE_LABELS[application.stage as keyof typeof STAGE_LABELS].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()} size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{application.applicant_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-muted-foreground">
                {new Date(application.application_date).toLocaleDateString('tr-TR')}
              </p>
              <Badge className={STAGE_LABELS[application.stage as keyof typeof STAGE_LABELS].color}>
                <StageIcon className="h-3 w-3 mr-1" />
                {STAGE_LABELS[application.stage as keyof typeof STAGE_LABELS].label}
              </Badge>
              <Badge variant={application.status === 'open' ? 'default' : 'secondary'}>
                {application.status === 'open' ? 'Açık' : 'Kapalı'}
              </Badge>
            </div>
          </div>
        </div>

        <Button className="gap-2">
          <Edit className="h-4 w-4" />
          Düzenle
        </Button>
      </div>

      {/* Aşama Yönetimi */}
      <Card>
        <CardHeader>
          <CardTitle>Aşama Yönetimi</CardTitle>
          <CardDescription>Başvuru aşamasını değiştirin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mevcut Aşama</Label>
                <div
                  className={`p-3 rounded-md ${STAGE_LABELS[application.stage as keyof typeof STAGE_LABELS].color} font-medium flex items-center gap-2`}
                >
                  <StageIcon className="h-4 w-4" />
                  {STAGE_LABELS[application.stage as keyof typeof STAGE_LABELS].label}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aşama Değiştir</Label>
                <Select
                  value={application.stage}
                  onValueChange={(value) =>
                    updateStageMutation.mutate({
                      stage: value as
                        | 'draft'
                        | 'under_review'
                        | 'approved'
                        | 'ongoing'
                        | 'completed',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="under_review">İnceleme</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yardım Türleri */}
      <Card>
        <CardHeader>
          <CardTitle>Talep Edilen Yardımlar</CardTitle>
          <CardDescription>Portal Plus tarzı yardım türleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {application.one_time_aid && application.one_time_aid > 0 && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">Tek Seferlik</h4>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {application.one_time_aid.toLocaleString('tr-TR')} ₺
                </p>
              </div>
            )}

            {application.regular_financial_aid && application.regular_financial_aid > 0 && (
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-green-900 dark:text-green-300">Düzenli Nakdi</h4>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {application.regular_financial_aid.toLocaleString('tr-TR')} ₺/Ay
                </p>
              </div>
            )}

            {application.regular_food_aid && application.regular_food_aid > 0 && (
              <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-medium text-orange-900 dark:text-orange-300">Düzenli Gıda</h4>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {application.regular_food_aid} Paket
                </p>
              </div>
            )}

            {application.in_kind_aid && application.in_kind_aid > 0 && (
              <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-300">Ayni Yardım</h4>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {application.in_kind_aid} Adet
                </p>
              </div>
            )}

            {application.service_referral && application.service_referral > 0 && (
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h4 className="font-medium text-red-900 dark:text-red-300">Hizmet Sevk</h4>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {application.service_referral} Sevk
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detaylar */}
      <Card>
        <CardHeader>
          <CardTitle>Başvuru Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {application.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                <p className="text-base mt-1 whitespace-pre-wrap">{application.description}</p>
              </div>
            )}

            {application.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notlar</p>
                  <p className="text-base mt-1 whitespace-pre-wrap">{application.notes}</p>
                </div>
              </>
            )}

            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kayıt Tarihi</p>
                <p className="text-base">
                  {application._creationTime 
                    ? new Date(application._creationTime).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Son Güncelleme</p>
                <p className="text-base">
                  {application._updatedAt 
                    ? new Date(application._updatedAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </p>
              </div>

              {application.approved_by && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Onaylayan</p>
                  <p className="text-base">{application.approved_by}</p>
                </div>
              )}

              {application.approved_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Onay Tarihi</p>
                  <p className="text-base">
                    {new Date(application.approved_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
