/**
 * Address Information Step for AdvancedBeneficiaryForm
 * Adres Bilgileri Adımı
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { ParameterSelect } from '../ParameterSelect';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

export function AddressInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BeneficiaryFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Adres Bilgileri
        </CardTitle>
        <CardDescription>İhtiyaç sahibinin yaşadığı adres bilgileri</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">İl *</Label>
            <ParameterSelect
              parameter="IL"
              value={watch('city')}
              onValueChange={(value) => setValue('city', value as any)}
              placeholder="İl seçin"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">İlçe *</Label>
            <Input
              id="district"
              {...register('district')}
              placeholder="İlçe"
              className={errors.district ? 'border-red-500' : ''}
            />
            {errors.district && <p className="text-sm text-red-500">{errors.district.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Mahalle/Köy *</Label>
            <Input
              id="neighborhood"
              {...register('neighborhood')}
              placeholder="Mahalle/Köy"
              className={errors.neighborhood ? 'border-red-500' : ''}
            />
            {errors.neighborhood && (
              <p className="text-sm text-red-500">{errors.neighborhood.message}</p>
            )}
          </div>
        </div>

        {/* Full Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Açık Adres *</Label>
          <Textarea
            id="address"
            {...register('address')}
            placeholder="Sokak, cadde, apartman, daire no gibi detayları içeren açık adres..."
            rows={3}
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
        </div>

        {/* Housing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="livingPlace">Konut Durumu</Label>
            <ParameterSelect
              parameter="KONUT_DURUMU"
              value={watch('livingPlace')}
              onValueChange={(value) => setValue('livingPlace', value as any)}
              placeholder="Konut durumu seçin"
              className={errors.livingPlace ? 'border-red-500' : ''}
            />
            {errors.livingPlace && (
              <p className="text-sm text-red-500">{errors.livingPlace.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPreference">İletişim Tercihi</Label>
            <ParameterSelect
              parameter="ILETISIM_TERCIHI"
              value={watch('contactPreference')}
              onValueChange={(value) => setValue('contactPreference', value as any)}
              placeholder="İletişim tercihi seçin"
              className={errors.contactPreference ? 'border-red-500' : ''}
            />
            {errors.contactPreference && (
              <p className="text-sm text-red-500">{errors.contactPreference.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
