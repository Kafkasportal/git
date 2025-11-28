/**
 * Health Information Step for BeneficiaryFormWizard
 * Sağlık Durumu Adımı
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { ParameterSelect } from '../ParameterSelect';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

export function HealthInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BeneficiaryFormData>();

  const hasChronicIllness = watch('hasChronicIllness');
  const hasDisability = watch('hasDisability');
  const has_health_insurance = watch('has_health_insurance');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Sağlık Durumu
        </CardTitle>
        <CardDescription>İhtiyaç sahibinin sağlık bilgileri ve özel durumlar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Health Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bloodType">Kan Grubu</Label>
            <ParameterSelect
              parameter="KAN_GRUBU"
              value={watch('bloodType')}
              onValueChange={(value) => setValue('bloodType', value as any)}
              placeholder="Kan grubu seçin"
              className={errors.bloodType ? 'border-red-500' : ''}
            />
            {errors.bloodType && <p className="text-sm text-red-500">{errors.bloodType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="smokingStatus">Sigara Kullanımı</Label>
            <ParameterSelect
              parameter="SIGARA_KULLANIMI"
              value={watch('smokingStatus')}
              onValueChange={(value) => setValue('smokingStatus', value as any)}
              placeholder="Durum seçin"
              className={errors.smokingStatus ? 'border-red-500' : ''}
            />
            {errors.smokingStatus && (
              <p className="text-sm text-red-500">{errors.smokingStatus.message}</p>
            )}
          </div>
        </div>

        {/* Chronic Illness */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hasChronicIllness"
              checked={hasChronicIllness}
              onCheckedChange={(checked) => setValue('hasChronicIllness', checked as boolean)}
            />
            <Label
              htmlFor="hasChronicIllness"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Kronik hastalığı var
            </Label>
          </div>

          {hasChronicIllness && (
            <div className="ml-7 space-y-2">
              <Label htmlFor="chronicIllnessDetail">Hastalık Detayı</Label>
              <Textarea
                id="chronicIllnessDetail"
                {...register('chronicIllnessDetail')}
                placeholder="Kronik hastalık hakkında detaylı bilgi giriniz..."
                rows={3}
                className={errors.chronicIllnessDetail ? 'border-red-500' : ''}
              />
              {errors.chronicIllnessDetail && (
                <p className="text-sm text-red-500">{errors.chronicIllnessDetail.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Disability */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hasDisability"
              checked={hasDisability}
              onCheckedChange={(checked) => setValue('hasDisability', checked as boolean)}
            />
            <Label
              htmlFor="hasDisability"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Engel durumu var
            </Label>
          </div>

          {hasDisability && (
            <div className="ml-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disabilityStatus">Engellilik Durumu</Label>
                <ParameterSelect
                  parameter="ENGELLILIK_DURUMU"
                  value={watch('disabilityStatus')}
                  onValueChange={(value) => setValue('disabilityStatus', value as any)}
                  placeholder="Engellilik durumu seçin"
                  className={errors.disabilityStatus ? 'border-red-500' : ''}
                />
                {errors.disabilityStatus && (
                  <p className="text-sm text-red-500">{errors.disabilityStatus.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="disabilityDetail">Engellilik Detayı</Label>
                <Textarea
                  id="disabilityDetail"
                  {...register('disabilityDetail')}
                  placeholder="Engellilik hakkında detaylı bilgi giriniz..."
                  rows={3}
                  className={errors.disabilityDetail ? 'border-red-500' : ''}
                />
                {errors.disabilityDetail && (
                  <p className="text-sm text-red-500">{errors.disabilityDetail.message}</p>
                )}
              </div>

              {/* Disability percentage field removed - not in schema */}
            </div>
          )}
        </div>

        {/* Health Insurance */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="has_health_insurance"
              checked={has_health_insurance}
              onCheckedChange={(checked) => setValue('has_health_insurance', checked as boolean)}
            />
            <Label
              htmlFor="has_health_insurance"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Sağlık sigortası var
            </Label>
          </div>

          {has_health_insurance && (
            <div className="ml-7 space-y-2">
              <Label htmlFor="socialSecurity">Sosyal Güvenlik Durumu</Label>
              <ParameterSelect
                parameter="SOSYAL_GUVENLIK_DURUMU"
                value={String(watch('socialSecurity') ?? '')}
                onValueChange={(value) => setValue('socialSecurity', value as any)}
                placeholder="Sosyal güvenlik durumu seçin"
                className={errors.socialSecurity ? 'border-red-500' : ''}
              />
              {errors.socialSecurity && (
                <p className="text-sm text-red-500">{errors.socialSecurity.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            💡 <strong>Not:</strong> Sağlık bilgileri gizlidir ve sadece uygun yardım türünün
            belirlenmesi için kullanılır. Tıbbi raporlar gerektiğinde ayrıca talep edilecektir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
