/**
 * Family Information Step for BeneficiaryFormWizard
 * Aile Bilgileri Adımı
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

export function FamilyInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BeneficiaryFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Aile Bilgileri
        </CardTitle>
        <CardDescription>İhtiyaç sahibinin ailesi hakkında detaylı bilgiler</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Family Member Count */}
        <div className="space-y-2">
          <Label htmlFor="familyMemberCount">Aile Birey Sayısı</Label>
          <Input
            id="familyMemberCount"
            type="number"
            min={1}
            max={50}
            {...register('familyMemberCount', { valueAsNumber: true })}
            placeholder="Ailede yaşayan toplam kişi sayısı"
            className={errors.familyMemberCount ? 'border-red-500' : ''}
          />
          {errors.familyMemberCount && (
            <p className="text-sm text-red-500">{errors.familyMemberCount.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Hanede birlikte yaşayan toplam kişi sayısı (kendisi dahil)
          </p>
        </div>

        {/* Family Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="children_count">Çocuk Sayısı</Label>
            <Input
              id="children_count"
              type="number"
              min={0}
              max={50}
              {...register('children_count', { valueAsNumber: true })}
              placeholder="0"
              className={errors.children_count ? 'border-red-500' : ''}
            />
            {errors.children_count && (
              <p className="text-sm text-red-500">{errors.children_count.message}</p>
            )}
            <p className="text-sm text-muted-foreground">18 yaş altı çocuk sayısı</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orphan_children_count">Yetim Çocuk Sayısı</Label>
            <Input
              id="orphan_children_count"
              type="number"
              min={0}
              max={50}
              {...register('orphan_children_count', { valueAsNumber: true })}
              placeholder="0"
              className={errors.orphan_children_count ? 'border-red-500' : ''}
            />
            {errors.orphan_children_count && (
              <p className="text-sm text-red-500">{errors.orphan_children_count.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Anne veya babası vefat etmiş çocuk sayısı
            </p>
          </div>
        </div>

        {/* Vulnerable Family Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="elderly_count">Yaşlı Sayısı</Label>
            <Input
              id="elderly_count"
              type="number"
              min={0}
              max={50}
              {...register('elderly_count', { valueAsNumber: true })}
              placeholder="0"
              className={errors.elderly_count ? 'border-red-500' : ''}
            />
            {errors.elderly_count && (
              <p className="text-sm text-red-500">{errors.elderly_count.message}</p>
            )}
            <p className="text-sm text-muted-foreground">65 yaş üstü yaşlı kişi sayısı</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disabled_count">Engelli Sayısı</Label>
            <Input
              id="disabled_count"
              type="number"
              min={0}
              max={50}
              {...register('disabled_count', { valueAsNumber: true })}
              placeholder="0"
              className={errors.disabled_count ? 'border-red-500' : ''}
            />
            {errors.disabled_count && (
              <p className="text-sm text-red-500">{errors.disabled_count.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Ailedeki engelli kişi sayısı</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Not:</strong> Aile bilgileri, yardım ihtiyacının tespiti için önemlidir.
            Lütfen güncel ve doğru bilgileri giriniz.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
