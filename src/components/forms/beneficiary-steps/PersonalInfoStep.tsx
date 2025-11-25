/**
 * Personal Information Step for AdvancedBeneficiaryForm
 * 927 satırlık formun parçalanmış versiyonu - Kişisel Bilgiler Adımı
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { ParameterSelect } from '../ParameterSelect';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

interface PersonalInfoStepProps {
  isUpdateMode?: boolean;
}

export function PersonalInfoStep({ isUpdateMode: _isUpdateMode = false }: PersonalInfoStepProps) {
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
          <User className="h-5 w-5" />
          Kişisel Bilgiler
        </CardTitle>
        <CardDescription>İhtiyaç sahibinin temel kişisel bilgileri</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Ad *</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Ad"
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Soyad *</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Soyad"
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Identity Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="identityNumber">TC Kimlik No *</Label>
            <Input
              id="identityNumber"
              {...register('identityNumber')}
              placeholder="TC Kimlik No"
              maxLength={11}
              className={errors.identityNumber ? 'border-red-500' : ''}
            />
            {errors.identityNumber && (
              <p className="text-sm text-red-500">{errors.identityNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Doğum Tarihi</Label>
            <Input
              id="birthDate"
              type="date"
              {...register('birthDate')}
              className={errors.birthDate ? 'border-red-500' : ''}
            />
            {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
          </div>
        </div>

        {/* Gender and Marital Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Cinsiyet</Label>
            <ParameterSelect
              parameter="CINSIYET"
              value={watch('gender')}
              onValueChange={(value) => setValue('gender', value as any)}
              placeholder="Cinsiyet seçin"
              className={errors.gender ? 'border-red-500' : ''}
            />
            {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Medeni Durum</Label>
            <ParameterSelect
              parameter="MEDENI_DURUM"
              value={watch('maritalStatus')}
              onValueChange={(value) => setValue('maritalStatus', value as any)}
              placeholder="Medeni durum seçin"
              className={errors.maritalStatus ? 'border-red-500' : ''}
            />
            {errors.maritalStatus && (
              <p className="text-sm text-red-500">{errors.maritalStatus.message}</p>
            )}
          </div>
        </div>

        {/* Nationality and Religion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nationality">Uyruk</Label>
            <ParameterSelect
              parameter="UYRUK"
              value={watch('nationality')}
              onValueChange={(value) => setValue('nationality', value)}
              placeholder="Uyruk seçin"
              className={errors.nationality ? 'border-red-500' : ''}
            />
            {errors.nationality && (
              <p className="text-sm text-red-500">{errors.nationality.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="religion">Din</Label>
            <ParameterSelect
              parameter="DIN"
              value={watch('religion')}
              onValueChange={(value) => setValue('religion', value as any)}
              placeholder="Din seçin"
              className={errors.religion ? 'border-red-500' : ''}
            />
            {errors.religion && <p className="text-sm text-red-500">{errors.religion.message}</p>}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mobilePhone">Cep Telefonu *</Label>
            <Input
              id="mobilePhone"
              {...register('mobilePhone')}
              placeholder="5XX XXX XX XX"
              className={errors.mobilePhone ? 'border-red-500' : ''}
            />
            {errors.mobilePhone && (
              <p className="text-sm text-red-500">{errors.mobilePhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="example@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Ek Notlar</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Kişi hakkında önemli notlar..."
            rows={3}
            className={errors.notes ? 'border-red-500' : ''}
          />
          {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
