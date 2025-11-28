'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { Loader2, FileText, DollarSign, Package, Utensils, Stethoscope } from 'lucide-react';

// Validation schema
const aidApplicationSchema = z.object({
  applicant_type: z.enum(['person', 'organization', 'partner']),
  applicant_name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  beneficiary_id: z.string().optional(),

  // Yardım türleri
  one_time_aid: z.number().min(0).optional(),
  regular_financial_aid: z.number().min(0).optional(),
  regular_food_aid: z.number().min(0).optional(),
  in_kind_aid: z.number().min(0).optional(),
  service_referral: z.number().min(0).optional(),

  description: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

type AidApplicationFormData = z.infer<typeof aidApplicationSchema>;

interface AidApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AidApplicationForm({ onSuccess, onCancel }: AidApplicationFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Beneficiaries listesini çek (dropdown için)
  const { data: beneficiariesData } = useQuery({
    queryKey: ['beneficiaries', 1, ''],
    queryFn: () => api.beneficiaries.getBeneficiaries({ page: 1, limit: 100 }),
  });

  const beneficiaries = beneficiariesData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AidApplicationFormData>({
    resolver: zodResolver(aidApplicationSchema),
    defaultValues: {
      applicant_type: 'person',
      priority: 'normal',
      one_time_aid: 0,
      regular_financial_aid: 0,
      regular_food_aid: 0,
      in_kind_aid: 0,
      service_referral: 0,
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data: AidApplicationFormData) =>
      api.aidApplications.createAidApplication({
        ...data,
        application_date: new Date().toISOString(),
        stage: 'draft',
        status: 'open',
      }),
    onSuccess: () => {
      toast.success('Başvuru başarıyla oluşturuldu');
      void queryClient.invalidateQueries({ queryKey: ['aid-applications'] });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(`Başvuru oluşturulurken hata oluştu: ${error.message}`);
    },
  });

  const onSubmit = async (data: AidApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await createApplicationMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni Yardım Başvurusu</CardTitle>
        <CardDescription>
          Portal Plus tarzı yardım başvuru formu - Yardım türlerini belirleyerek başvuru oluşturun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Başvuru Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Başvuru Bilgileri
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant_type">Başvuran Türü *</Label>
                <Select
                  value={watch('applicant_type')}
                  onValueChange={(value) =>
                    setValue('applicant_type', value as 'person' | 'organization' | 'partner')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Kişi</SelectItem>
                    <SelectItem value="organization">Kurum</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
                {errors.applicant_type && (
                  <p className="text-sm text-red-600">{errors.applicant_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicant_name">Başvuran Adı *</Label>
                <Input
                  id="applicant_name"
                  {...register('applicant_name')}
                  placeholder="Ahmet Yılmaz / Kurum Adı"
                />
                {errors.applicant_name && (
                  <p className="text-sm text-red-600">{errors.applicant_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary_id">İhtiyaç Sahibi (Opsiyonel)</Label>
                <Select
                  value={watch('beneficiary_id')}
                  onValueChange={(value) => setValue('beneficiary_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="İhtiyaç sahibi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçiniz</SelectItem>
                    {beneficiaries.map((ben) => (
                      <SelectItem key={ben._id || ben.$id || ''} value={ben._id || ben.$id || ''}>
                        {ben.name} - {ben.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) =>
                    setValue('priority', value as 'low' | 'normal' | 'high' | 'urgent' | undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Yardım Türleri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Yardım Türleri</h3>
            <Separator />
            <p className="text-sm text-gray-600">
              Portal Plus tarzı yardım türleri - İlgili yardım türlerine değer girin
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="one_time_aid" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Tek Seferlik Nakdi Yardım (₺)
                </Label>
                <Input
                  id="one_time_aid"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('one_time_aid', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regular_financial_aid" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Düzenli Nakdi Yardım (₺/Ay)
                </Label>
                <Input
                  id="regular_financial_aid"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('regular_financial_aid', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regular_food_aid" className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-orange-600" />
                  Düzenli Gıda Yardımı (Paket)
                </Label>
                <Input
                  id="regular_food_aid"
                  type="number"
                  min={0}
                  {...register('regular_food_aid', { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Aylık gıda paketi sayısı</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="in_kind_aid" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  Ayni Yardım (Adet)
                </Label>
                <Input
                  id="in_kind_aid"
                  type="number"
                  min={0}
                  {...register('in_kind_aid', { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Eşya, kıyafet vb. adet</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_referral" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-red-600" />
                  Hizmet Sevk (Adet)
                </Label>
                <Input
                  id="service_referral"
                  type="number"
                  min={0}
                  {...register('service_referral', { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Sağlık, eğitim sevk sayısı</p>
              </div>
            </div>
          </div>

          {/* Açıklama ve Notlar */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detaylar</h3>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Başvuru detayları, talep edilen yardım hakkında açıklama..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Ek notlar, özel durumlar..."
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <Separator />
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none" size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Başvuru Oluştur'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                İptal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
