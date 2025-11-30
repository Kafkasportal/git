/**
 * Financial Information Step for BeneficiaryFormWizard
 * Maddi Durum Adımı
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { ParameterSelect } from '../ParameterSelect';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

export function FinancialInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BeneficiaryFormData>();

  const has_debt = watch('has_debt');
  const has_vehicle = watch('has_vehicle');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Maddi Durum
        </CardTitle>
        <CardDescription>İhtiyaç sahibinin ekonomik durumu ve gelir bilgileri</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Income Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyIncome">Aylık Gelir (TL)</Label>
            <Input
              id="monthlyIncome"
              type="number"
              min={0}
              step={0.01}
              {...register('monthlyIncome', { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.monthlyIncome ? 'border-red-500' : ''}
            />
            {errors.monthlyIncome && (
              <p className="text-sm text-red-500">{errors.monthlyIncome.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Hanedeki toplam aylık gelir</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workStatus">Çalışma Durumu</Label>
            <ParameterSelect
              parameter="CALISMA_DURUMU"
              value={watch('workStatus')}
              onValueChange={(value) => setValue('workStatus', value as any)}
              placeholder="Çalışma durumu seçin"
              className={errors.workStatus ? 'border-red-500' : ''}
            />
            {errors.workStatus && (
              <p className="text-sm text-red-500">{errors.workStatus.message}</p>
            )}
          </div>
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label htmlFor="sector">Sektör</Label>
          <ParameterSelect
            parameter="SEKTOR"
            value={watch('sector') as unknown as string}
            onValueChange={(value) => setValue('sector', value as any)}
            placeholder="Çalışılan sektör seçin"
            className={errors.sector ? 'border-red-500' : ''}
          />
          {errors.sector && <p className="text-sm text-red-500">{errors.sector.message}</p>}
        </div>

        {/* Financial Status Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="has_debt"
              checked={has_debt}
              onCheckedChange={(checked) => setValue('has_debt', checked as boolean)}
            />
            <Label
              htmlFor="has_debt"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Borcu var
            </Label>
          </div>
          {/* Debt amount field removed - not in schema */}

          <div className="flex items-center space-x-3">
            <Checkbox
              id="has_vehicle"
              checked={has_vehicle}
              onCheckedChange={(checked) => setValue('has_vehicle', checked as boolean)}
            />
            <Label
              htmlFor="has_vehicle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Aracı var (araba, motorsiklet vb.)
            </Label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            💡 <strong>Not:</strong> Gelir bilgileri gizlidir ve sadece yardım değerlendirmesi için
            kullanılır. Lütfen hanedeki tüm gelir kaynaklarını belirtiniz.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
