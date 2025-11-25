'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requiredPhoneSchema } from '@/lib/validations/shared-validators';
import { sanitizePhone } from '@/lib/sanitization';

// Validation schema
const beneficiarySchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  tc_no: z.string().length(11, 'TC Kimlik numarası 11 haneli olmalıdır'),
  phone: requiredPhoneSchema,
  address: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),
  city: z.string().min(2, 'Şehir adı girin'),
  district: z.string().min(2, 'İlçe adı girin'),
  neighborhood: z.string().min(2, 'Mahalle adı girin'),
  income_level: z.enum(['0-3000', '3000-5000', '5000-8000', '8000+']),
  family_size: z.number().min(1, 'Aile büyüklüğü en az 1 olmalıdır'),
  health_status: z.string().optional(),
  employment_status: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

interface BeneficiaryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Field validation component
interface FieldWithValidationProps {
  label: string;
  error?: string;
  validation?: 'valid' | 'invalid' | 'pending';
  required?: boolean;
  children: React.ReactNode;
  errorId?: string;
}

function FieldWithValidation({
  label,
  error,
  validation,
  required,
  children,
  errorId,
}: FieldWithValidationProps) {
  const getValidationIcon = () => {
    switch (validation) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </Label>
      <div className="relative">
        {children}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {getValidationIcon()}
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}

export function BeneficiaryForm({ onSuccess, onCancel }: BeneficiaryFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldValidation, setFieldValidation] = useState<
    Record<string, 'valid' | 'invalid' | 'pending'>
  >({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      family_size: 1,
      income_level: '0-3000',
      status: 'active',
    },
  });

  const createBeneficiaryMutation = useMutation({
    mutationFn: async (data: BeneficiaryFormData) => {
      // Map status values to Turkish
      const statusMap = {
        active: 'AKTIF',
        inactive: 'PASIF',
        archived: 'SILINDI',
      } as const;

      return api.beneficiaries.createBeneficiary({
        ...data,
        status: statusMap[data.status] || 'AKTIF',
      });
    },
    onSuccess: () => {
      toast.success('İhtiyaç sahibi başarıyla eklendi');
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(`İhtiyaç sahibi eklenirken hata oluştu: ${error.message}`);
    },
  });

  // Real-time field validation
  const validateField = useCallback(
    async (fieldName: keyof BeneficiaryFormData, value: unknown) => {
      try {
        await beneficiarySchema.shape[fieldName].parseAsync(value);
        setFieldValidation((prev) => ({ ...prev, [fieldName]: 'valid' }));
      } catch {
        setFieldValidation((prev) => ({ ...prev, [fieldName]: 'invalid' }));
      }
    },
    []
  );

  // Optimized onChange handlers
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      register('name').onChange(e);
      if (e.target.value.length > 0) {
        void validateField('name', e.target.value);
      }
    },
    [register, validateField]
  );

  const handleTCChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '');
      e.target.value = value;
      register('tc_no').onChange(e);
      if (value.length > 0) {
        void validateField('tc_no', value);
      }
    },
    [register, validateField]
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);

      e.target.value = value;
      register('phone').onChange(e);
      
      if (value.length === 10) {
        const sanitized = sanitizePhone(value);
        if (sanitized) validateField('phone', sanitized);
      }
    },
    [register, validateField]
  );

  const onSubmit = async (data: BeneficiaryFormData) => {
    setIsSubmitting(true);
    try {
      await createBeneficiaryMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto relative">
      <CardHeader>
        <CardTitle>Yeni İhtiyaç Sahibi Ekle</CardTitle>
        <CardDescription>İhtiyaç sahibi bilgilerini girerek yeni kayıt oluşturun</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-lg shadow-lg border">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">İhtiyaç sahibi kaydediliyor...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Kişisel Bilgiler */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Kişisel Bilgiler</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithValidation
                label="Ad Soyad"
                error={errors.name?.message}
                validation={fieldValidation.name}
                required
                errorId="name-error"
              >
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ahmet Yılmaz"
                  onChange={handleNameChange}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>

              <FieldWithValidation
                label="TC Kimlik No"
                error={errors.tc_no?.message}
                validation={fieldValidation.tc_no}
                required
                errorId="tc_no-error"
              >
                <Input
                  id="tc_no"
                  {...register('tc_no')}
                  placeholder="12345678901"
                  maxLength={11}
                  onChange={handleTCChange}
                  aria-describedby={errors.tc_no ? 'tc_no-error' : undefined}
                  aria-invalid={!!errors.tc_no}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>
            </div>

            <FieldWithValidation
              label="Telefon"
              error={errors.phone?.message}
              validation={fieldValidation.phone}
              required
              errorId="phone-error"
            >
              <Input
                id="phone"
                {...register('phone')}
                placeholder="5551234567"
                onChange={handlePhoneChange}
                maxLength={10}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                aria-invalid={!!errors.phone}
                disabled={isSubmitting}
              />
            </FieldWithValidation>
          </div>

          {/* Adres Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adres Bilgileri</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Adres *</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Mahalle, Cadde, Sokak, No"
                rows={3}
              />
              {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şehir *</Label>
                <Input id="city" {...register('city')} placeholder="İstanbul" />
                {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">İlçe *</Label>
                <Input id="district" {...register('district')} placeholder="Kadıköy" />
                {errors.district && (
                  <p className="text-sm text-red-600">{errors.district.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Mahalle *</Label>
                <Input id="neighborhood" {...register('neighborhood')} placeholder="Caferağa" />
                {errors.neighborhood && (
                  <p className="text-sm text-red-600">{errors.neighborhood.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ekonomik Bilgiler */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ekonomik Bilgiler</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="income_level">Gelir Düzeyi *</Label>
                <Select
                  value={watch('income_level')}
                  onValueChange={(value) =>
                    setValue(
                      'income_level',
                      value as '0-3000' | '3000-5000' | '5000-8000' | '8000+'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gelir düzeyi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-3000">0-3.000 ₺</SelectItem>
                    <SelectItem value="3000-5000">3.000-5.000 ₺</SelectItem>
                    <SelectItem value="5000-8000">5.000-8.000 ₺</SelectItem>
                    <SelectItem value="8000+">8.000 ₺+</SelectItem>
                  </SelectContent>
                </Select>
                {errors.income_level && (
                  <p className="text-sm text-red-600">{errors.income_level.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="family_size">Aile Büyüklüğü *</Label>
                <Input
                  id="family_size"
                  type="number"
                  min={1}
                  {...register('family_size', { valueAsNumber: true })}
                />
                {errors.family_size && (
                  <p className="text-sm text-red-600">{errors.family_size.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_status">İstihdam Durumu</Label>
              <Input
                id="employment_status"
                {...register('employment_status')}
                placeholder="Öğrenci, İşsiz, Çalışıyor..."
              />
              {errors.employment_status && (
                <p className="text-sm text-red-600">{errors.employment_status.message}</p>
              )}
            </div>
          </div>

          {/* Sağlık Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sağlık Bilgileri</h3>

            <div className="space-y-2">
              <Label htmlFor="health_status">Genel Sağlık Durumu</Label>
              <Textarea
                id="health_status"
                {...register('health_status')}
                placeholder="Hastalıklar, engellilik durumu vb."
                rows={3}
              />
              {errors.health_status && (
                <p className="text-sm text-red-600">{errors.health_status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Ek bilgiler, özel durumlar..."
                rows={3}
              />
              {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Durum</Label>
              <RadioGroup
                value={watch('status')}
                onValueChange={(value) =>
                  setValue('status', value as 'active' | 'inactive' | 'archived')
                }
                className="flex flex-row space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Aktif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive">Pasif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="archived" id="archived" />
                  <Label htmlFor="archived">Arşivlenmiş</Label>
                </div>
              </RadioGroup>
              {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'İhtiyaç Sahibi Ekle'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
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
