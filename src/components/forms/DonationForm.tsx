'use client';

import React, { useState } from 'react';
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
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';
import logger from '@/lib/logger';

// ✅ Use validation schema from centralized location
import { donationSchema, type DonationFormData } from '@/lib/validations/forms';

// ✅ Use CRUD factory API client (mimariye uygun)
import { donations } from '@/lib/api/api-client';

// ✅ Use useStandardForm hook (mimariye uygun pattern)
import { useStandardForm } from '@/hooks/useStandardForm';

// ✅ Use types from database types
import type { DonationDocument } from '@/types/database';

interface DonationFormProps {
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
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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

export function DonationForm({ onSuccess, onCancel }: DonationFormProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fieldValidation, setFieldValidation] = useState<
    Record<string, 'valid' | 'invalid' | 'pending'>
  >({});
  const [amountDisplay, setAmountDisplay] = useState<string>('');

  // Real-time field validation
  const validateField = async (fieldName: keyof DonationFormData, value: unknown) => {
    try {
      await donationSchema.shape[fieldName].parseAsync(value);
      setFieldValidation((prev) => ({ ...prev, [fieldName]: 'valid' }));
    } catch {
      setFieldValidation((prev) => ({ ...prev, [fieldName]: 'invalid' }));
    }
  };

  // ✅ Use useStandardForm hook (mimariye uygun!)
  const { form, handleSubmit, isSubmitting } = useStandardForm<DonationFormData, DonationDocument>({
    defaultValues: {
      currency: 'TRY',
      amount: 0,
      status: 'pending' as const,
      donor_name: '',
      donor_phone: '',
      donor_email: '',
      donation_type: '',
      payment_method: '',
      donation_purpose: '',
      receipt_number: '',
      notes: '',
      receipt_file_id: '',
    },
    schema: donationSchema,
    queryKey: ['donations'],
    successMessage: 'Bağış başarıyla kaydedildi',
    errorMessage: 'Bağış kaydedilirken hata oluştu',
    // ✅ Use CRUD factory mutation (mimariye uygun!)
    mutationFn: async (data: DonationFormData) => {
      let uploadedFileId: string | undefined = undefined;

      // Upload receipt file if provided
      if (receiptFile) {
        try {
          const formData = new FormData();
          formData.append('file', receiptFile);
          formData.append('bucket', 'receipts');

          const response = await fetch('/api/storage/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            uploadedFileId = result.data?.fileId;
          }
        } catch (error) {
          logger.error('File upload error', { error });
        }
      }

      // Validate amount
      if (isNaN(data.amount) || data.amount <= 0) {
        throw new Error('Geçerli bir tutar giriniz');
      }

      // ✅ Call CRUD factory create method
      const response = await donations.create({
        ...data,
        amount: data.amount,
        receipt_file_id: uploadedFileId,
      });

      if (!response.data) {
        throw new Error(response.error || 'Bağış kaydedilemedi');
      }

      return response.data as any;
    },
    onSuccess: (_data) => {
      setReceiptFile(null);
      setAmountDisplay('');
      onSuccess?.();
    },
    resetOnSuccess: true,
  });

  // Watch form values for controlled inputs
  const currency = form.watch('currency');
  const paymentMethod = form.watch('payment_method');

  return (
    <Card className="w-full max-w-2xl mx-auto relative">
      <CardHeader>
        <CardTitle>Yeni Bağış Ekle</CardTitle>
        <CardDescription>Bağış bilgilerini girerek yeni kayıt oluşturun</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-lg shadow-lg border">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Bağış kaydediliyor...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Donör Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Donör Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithValidation
                label="Donör Adı"
                error={form.formState.errors.donor_name?.message}
                validation={fieldValidation.donor_name}
                required
                errorId="donor_name-error"
              >
                <Input
                  id="donor_name"
                  {...form.register('donor_name')}
                  placeholder="Ahmet Yılmaz"
                  onChange={(e) => {
                    form.register('donor_name').onChange(e);
                    if (e.target.value.length > 0) {
                      void validateField('donor_name', e.target.value);
                    }
                  }}
                  aria-describedby={
                    form.formState.errors.donor_name ? 'donor_name-error' : undefined
                  }
                  aria-invalid={!!form.formState.errors.donor_name}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>

              <FieldWithValidation
                label="Telefon"
                error={form.formState.errors.donor_phone?.message}
                validation={fieldValidation.donor_phone}
                required
                errorId="donor_phone-error"
              >
                <Input
                  id="donor_phone"
                  {...form.register('donor_phone')}
                  placeholder="0555 123 45 67"
                  onChange={(e) => {
                    // Format Turkish phone number
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 10) value = value.slice(0, 10);

                    // Format as 0555 123 45 67
                    if (value.length >= 4) {
                      value = `${value.slice(0, 4)} ${value.slice(4)}`;
                    }
                    if (value.length >= 7) {
                      value = `${value.slice(0, 8)} ${value.slice(8)}`;
                    }
                    if (value.length >= 10) {
                      value = `${value.slice(0, 11)} ${value.slice(11)}`;
                    }

                    e.target.value = value;
                    form.register('donor_phone').onChange(e);
                    if (value.replace(/\s/g, '').length > 0) {
                      void validateField('donor_phone', value.replace(/\s/g, ''));
                    }
                  }}
                  maxLength={14}
                  aria-describedby={
                    form.formState.errors.donor_phone ? 'donor_phone-error' : undefined
                  }
                  aria-invalid={!!form.formState.errors.donor_phone}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>
            </div>

            <FieldWithValidation
              label="Email"
              error={form.formState.errors.donor_email?.message}
              validation={fieldValidation.donor_email}
              errorId="donor_email-error"
            >
              <Input
                id="donor_email"
                type="email"
                {...form.register('donor_email')}
                placeholder="ahmet@example.com"
                onChange={(e) => {
                  form.register('donor_email').onChange(e);
                  if (e.target.value.length > 0) {
                    void validateField('donor_email', e.target.value);
                  }
                }}
                aria-describedby={
                  form.formState.errors.donor_email ? 'donor_email-error' : undefined
                }
                aria-invalid={!!form.formState.errors.donor_email}
                disabled={isSubmitting}
              />
            </FieldWithValidation>
          </div>

          {/* Bağış Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bağış Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWithValidation
                label="Tutar"
                error={form.formState.errors.amount?.message}
                validation={fieldValidation.amount}
                required
                errorId="amount-error"
              >
                <Input
                  id="amount"
                  value={amountDisplay}
                  placeholder="1.000,00"
                  onChange={(e) => {
                    // Format currency input for Turkish locale
                    let value = e.target.value.replace(/[^\d,]/g, '');

                    // Allow only one comma
                    const parts = value.split(',');
                    if (parts.length > 2) {
                      value = `${parts[0]},${parts.slice(1).join('')}`;
                    }

                    // Limit decimal places to 2
                    if (parts[1] && parts[1].length > 2) {
                      value = `${parts[0]},${parts[1].substring(0, 2)}`;
                    }

                    setAmountDisplay(value);

                    // Convert to number for form state and validation
                    const cleanedValue = value.replace(/\./g, '').replace(',', '.');
                    const numValue = parseFloat(cleanedValue);

                    if (!isNaN(numValue) && numValue > 0) {
                      form.setValue('amount', numValue, { shouldValidate: true });
                      void validateField('amount', numValue);
                    } else {
                      form.setValue('amount', 0, { shouldValidate: false });
                    }
                  }}
                  aria-describedby={form.formState.errors.amount ? 'amount-error' : undefined}
                  aria-invalid={!!form.formState.errors.amount}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>

              <FieldWithValidation
                label="Para Birimi"
                error={form.formState.errors.currency?.message}
                validation={fieldValidation.currency}
                required
                errorId="currency-error"
              >
                <Select
                  value={currency || 'TRY'}
                  onValueChange={(value) => {
                    form.setValue('currency', value as 'TRY' | 'USD' | 'EUR');
                    void validateField('currency', value);
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    aria-describedby={form.formState.errors.currency ? 'currency-error' : undefined}
                  >
                    <SelectValue placeholder="Para birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">₺ TRY</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithValidation>

              <FieldWithValidation
                label="Makbuz No"
                error={form.formState.errors.receipt_number?.message}
                validation={fieldValidation.receipt_number}
                required
                errorId="receipt_number-error"
              >
                <Input
                  id="receipt_number"
                  {...form.register('receipt_number')}
                  placeholder="MB2024001"
                  onChange={(e) => {
                    form.register('receipt_number').onChange(e);
                    if (e.target.value.length > 0) {
                      void validateField('receipt_number', e.target.value);
                    }
                  }}
                  aria-describedby={
                    form.formState.errors.receipt_number ? 'receipt_number-error' : undefined
                  }
                  aria-invalid={!!form.formState.errors.receipt_number}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithValidation
                label="Bağış Türü"
                error={form.formState.errors.donation_type?.message}
                validation={fieldValidation.donation_type}
                required
                errorId="donation_type-error"
              >
                <Input
                  id="donation_type"
                  {...form.register('donation_type')}
                  placeholder="Nakdi, Ayni, Gıda..."
                  onChange={(e) => {
                    form.register('donation_type').onChange(e);
                    if (e.target.value.length > 0) {
                      void validateField('donation_type', e.target.value);
                    }
                  }}
                  aria-describedby={
                    form.formState.errors.donation_type ? 'donation_type-error' : undefined
                  }
                  aria-invalid={!!form.formState.errors.donation_type}
                  disabled={isSubmitting}
                />
              </FieldWithValidation>

              <FieldWithValidation
                label="Ödeme Yöntemi"
                error={form.formState.errors.payment_method?.message}
                validation={fieldValidation.payment_method}
                required
                errorId="payment_method-error"
              >
                <Select
                  value={paymentMethod || ''}
                  onValueChange={(value) => {
                    form.setValue('payment_method', value);
                    void validateField('payment_method', value);
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    aria-describedby={
                      form.formState.errors.payment_method ? 'payment_method-error' : undefined
                    }
                  >
                    <SelectValue placeholder="Ödeme yöntemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nakit">Nakit</SelectItem>
                    <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                    <SelectItem value="Banka Transferi">Banka Transferi</SelectItem>
                    <SelectItem value="Havale">Havale</SelectItem>
                    <SelectItem value="EFT">EFT</SelectItem>
                    <SelectItem value="Çek">Çek</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithValidation>
            </div>

            <FieldWithValidation
              label="Bağış Amacı"
              error={form.formState.errors.donation_purpose?.message}
              validation={fieldValidation.donation_purpose}
              required
              errorId="donation_purpose-error"
            >
              <Input
                id="donation_purpose"
                {...form.register('donation_purpose')}
                placeholder="Ramazan paketi, Eğitim yardımı, Sağlık desteği..."
                onChange={(e) => {
                  form.register('donation_purpose').onChange(e);
                  if (e.target.value.length > 0) {
                    void validateField('donation_purpose', e.target.value);
                  }
                }}
                aria-describedby={
                  form.formState.errors.donation_purpose ? 'donation_purpose-error' : undefined
                }
                aria-invalid={!!form.formState.errors.donation_purpose}
                disabled={isSubmitting}
              />
            </FieldWithValidation>
          </div>

          {/* Ek Bilgiler */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ek Bilgiler</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Ek açıklamalar, özel notlar..."
                rows={3}
                disabled={isSubmitting}
              />
              {form.formState.errors.notes && (
                <p className="text-sm text-red-600">{form.formState.errors.notes.message}</p>
              )}
            </div>

            <FileUpload
              onFileSelect={setReceiptFile}
              accept="image/*,.pdf"
              maxSize={5}
              placeholder="Makbuz yükleyin (PNG, JPG, PDF - max 5MB)"
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
              data-testid="saveButton"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Bağış Ekle'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
                data-testid="cancelButton"
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
