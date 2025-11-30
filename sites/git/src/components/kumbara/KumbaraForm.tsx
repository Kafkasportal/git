'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';
import { kumbaraCreateSchema } from '@/lib/validations/kumbara';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FormError } from '@/components/errors/FormError';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { DonorInfoSection } from './sections/DonorInfoSection';
import { DonationDetailsSection } from './sections/DonationDetailsSection';
import { PiggyBankInfoSection } from './sections/PiggyBankInfoSection';
import { LocationSection } from './sections/LocationSection';
import { NotesAndDocumentsSection } from './sections/NotesAndDocumentsSection';

interface KumbaraFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function KumbaraForm({ onSuccess, onCancel }: KumbaraFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const queryClient = useQueryClient();

  const form = useForm<KumbaraCreateInput>({
    resolver: zodResolver(kumbaraCreateSchema) as Resolver<KumbaraCreateInput>,
    defaultValues: {
      donor_name: '',
      donor_phone: '',
      amount: 0,
      currency: 'TRY',
      donation_type: 'Kumbara',
      donation_purpose: 'Kumbara Bağışı',
      payment_method: 'Nakit',
      receipt_number: '',
      kumbara_location: '',
      kumbara_institution: '',
      collection_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      is_kumbara: true,
      notes: '',
    },
    mode: 'onChange',
  });

  // Handle file upload - memoized for performance
  const handleFileSelect = useCallback(
    (file: File | null, sanitizedFilename?: string) => {
      setUploadedFile(file);
      if (file) {
        const fileName = sanitizedFilename || file.name;
        setUploadedFileName(fileName);
        form.setValue('receipt_file_id', fileName, { shouldValidate: true });
      } else {
        setUploadedFileName('');
        form.setValue('receipt_file_id', undefined, { shouldValidate: false });
      }
    },
    [form]
  );

  const { mutate: createKumbaraDonation, isPending } = useMutation({
    mutationFn: async (data: KumbaraCreateInput) => {
      const response = await fetch('/api/kumbara', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = error.error || 'Kumbara bağışı oluşturulamadı';
        const errorDetails = error.details
          ? Array.isArray(error.details)
            ? error.details.join(', ')
            : error.details
          : '';
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      return response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['kumbara-donations'] });

      // Show success message with QR code
      if (response.data?.qr_code) {
        toast.success(
          <div className="space-y-2">
            <p>Kumbara bağışı başarıyla kaydedildi!</p>
            <p className="text-sm">QR Kod oluşturuldu. Kumbara detaylarını görmek için tıklayın.</p>
          </div>,
          {
            duration: 5000,
          }
        );
      } else {
        toast.success('Kumbara bağışı başarıyla kaydedildi');
      }

      // Reset form
      form.reset();
      setUploadedFile(null);
      setUploadedFileName('');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    },
  });

  // Form completion progress - memoized for performance
  // Use useWatch hook instead of form.watch() for React Compiler compatibility
  const watchedFields = useWatch({
    control: form.control,
    name: [
      'donor_name',
      'donor_phone',
      'amount',
      'currency',
      'kumbara_location',
      'kumbara_institution',
      'collection_date',
      'receipt_number',
    ] as const,
  });

  // Watch currency separately for type safety
  const currentCurrency =
    (useWatch({
      control: form.control,
      name: 'currency',
      defaultValue: 'TRY',
    }) as 'TRY' | 'USD' | 'EUR') || 'TRY';

  const requiredFields = useMemo(
    () =>
      [
        'donor_name',
        'donor_phone',
        'amount',
        'currency',
        'kumbara_location',
        'kumbara_institution',
        'collection_date',
        'receipt_number',
      ] as const,
    []
  );

  const progress = useMemo(() => {
    // watchedFields is an array, access by index
    const fieldValues = [
      watchedFields[0], // donor_name
      watchedFields[1], // donor_phone
      watchedFields[2], // amount
      watchedFields[3], // currency
      watchedFields[4], // kumbara_location
      watchedFields[5], // kumbara_institution
      watchedFields[6], // collection_date
      watchedFields[7], // receipt_number
    ];

    const completedFields = fieldValues.filter((value) => {
      return value !== undefined && value !== null && value !== '';
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [watchedFields, requiredFields]);

  const onSubmit = useCallback(
    async (data: KumbaraCreateInput) => {
      try {
        const finalData = { ...data };

        // Upload file if present
        if (uploadedFile) {
          try {
            // Get CSRF token
            const csrfResponse = await fetch('/api/csrf');
            const { token } = await csrfResponse.json();

            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('bucket', 'receipts');

            const uploadResponse = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: {
                'X-CSRF-Token': token,
              },
              body: formData,
            });

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              if (uploadResult.success && uploadResult.data?.fileId) {
                finalData.receipt_file_id = uploadResult.data.fileId;
              }
            } else {
              const error = await uploadResponse.json().catch(() => ({}));
              toast.error(`Dosya yükleme hatası: ${error.error || 'Bilinmeyen hata'}`);
              return;
            }
          } catch (uploadError) {
            logger.error('File upload failed', { error: uploadError });
            toast.error('Dosya yükleme işlemi başarısız');
            return;
          }
        }

        // Clean up location coordinates - only send if both lat and lng are valid
        if (finalData.location_coordinates) {
          const { lat, lng } = finalData.location_coordinates;
          if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
            finalData.location_coordinates = undefined;
          }
        }

        createKumbaraDonation(finalData);
      } catch (_error) {
        logger.error('Kumbara donation creation failed', { error: _error });
        toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    },
    [uploadedFile, createKumbaraDonation]
  );

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: onCancel,
    onCtrlEnter: () => {
      if (form.formState.isValid) {
        form.handleSubmit(onSubmit)();
      }
    },
    onCtrlS: () => {
      if (form.formState.isValid) {
        form.handleSubmit(onSubmit)();
      }
    },
    enabled: !isPending,
  });

  return (
    <ErrorBoundary fallback={<FormError onClose={onCancel} />}>
      <div className="w-full" role="region" aria-label="Kumbara Bağışı Formu">
        <div className="mb-2 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="form-title" className="text-base font-bold flex items-center gap-1.5">
                <span className="text-lg" role="img" aria-label="Kumbara ikonu">
                  🐷
                </span>
                Yeni Kumbara Bağışı
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Formu doldurunuz. <span className="text-red-500 font-semibold">*</span> zorunlu
              </p>
            </div>
            {/* Progress Indicator */}
            <div
              className="flex flex-col items-end gap-1"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Form tamamlanma durumu"
            >
              <div className="text-xs font-medium text-muted-foreground">%{progress}</div>
              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2.5"
            aria-labelledby="form-title"
          >
            {/* Bağışçı Bilgileri */}
            <DonorInfoSection control={form.control} />

            {/* Bağış Detayları */}
            <DonationDetailsSection control={form.control} currentCurrency={currentCurrency} />

            {/* Kumbara Bilgileri */}
            <PiggyBankInfoSection control={form.control} />

            {/* Konum Bilgileri */}
            <LocationSection control={form.control} />

            {/* Notlar ve Belgeler */}
            <NotesAndDocumentsSection
              control={form.control}
              onFileSelect={handleFileSelect}
              uploadedFileName={uploadedFileName}
              isPending={isPending}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isValid}
                className="flex-1 h-8 text-xs font-semibold"
                data-testid="saveButton"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <span className="mr-1.5">💾</span>
                    Kaydet
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
                className="h-8 px-4 text-xs"
                data-testid="cancelButton"
              >
                <span className="mr-1.5">✖️</span>
                İptal
              </Button>
            </div>

            {/* Form Validation Summary */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-0.5">
                      Hataları düzeltin
                    </p>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-0.5">
                      {Object.entries(form.formState.errors)
                        .slice(0, 2)
                        .map(([field, error]) => (
                          <li key={field}>
                            •{' '}
                            {typeof error === 'object' && error !== null && 'message' in error
                              ? (error as { message?: string }).message || `${field} hatalı`
                              : `${field} hatalı`}
                          </li>
                        ))}
                      {Object.keys(form.formState.errors).length > 2 && (
                        <li>• +{Object.keys(form.formState.errors).length - 2} hata daha</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </ErrorBoundary>
  );
}
