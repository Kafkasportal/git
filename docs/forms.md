# 📝 Form Yönetimi

Bu döküman, Dernek Yönetim Sistemi'ndeki form yapısını ve validasyon sistemini açıklar.

## 🏗️ Form Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                      FORM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │ React Hook   │    │     Zod      │    │   TanStack   │  │
│   │    Form      │───▶│   Schema     │───▶│    Query     │  │
│   │              │    │  Validation  │    │   Mutation   │  │
│   └──────────────┘    └──────────────┘    └──────────────┘  │
│          │                   │                    │          │
│          ▼                   ▼                    ▼          │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  useStandardForm                     │   │
│   │          (Unified Form + Mutation Hook)              │   │
│   └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    Form Component                    │   │
│   │        (Controller + Field Components)               │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 useStandardForm Hook

Ana form hook'u - React Hook Form, Zod validasyonu ve TanStack Query mutation'ı birleştirir.

### Temel Kullanım

```typescript
import { useStandardForm } from '@/hooks/useStandardForm';
import { donationSchema, type DonationFormData } from '@/lib/validations/forms';
import { donations } from '@/lib/api/crud-factory';

function DonationForm() {
  const { form, handleSubmit, isSubmitting, isValid } = useStandardForm({
    // Zod validasyon şeması
    schema: donationSchema,
    
    // Varsayılan değerler
    defaultValues: {
      amount: 0,
      currency: 'TRY',
      status: 'pending',
    },
    
    // CRUD factory mutation
    mutationFn: async (data) => {
      const response = await donations.create(data);
      if (!response.data) throw new Error(response.error);
      return response.data;
    },
    
    // React Query cache invalidation
    queryKey: ['donations'],
    
    // Mesajlar
    successMessage: 'Bağış başarıyla kaydedildi',
    errorMessage: 'Bağış kaydedilirken hata oluştu',
    
    // Callbacks
    onSuccess: (data) => {
      console.log('Oluşturuldu:', data);
      onClose();
    },
    
    // Başarıdan sonra formu sıfırla
    resetOnSuccess: true,
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Controller
        name="amount"
        control={form.control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type="number"
            error={fieldState.error?.message}
          />
        )}
      />
      
      <Button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </form>
  );
}
```

### Hook Seçenekleri

```typescript
interface UseStandardFormOptions<TFormData, TResponse> {
  // Gerekli
  schema: ZodType<TFormData>;           // Validasyon şeması
  mutationFn: (data: TFormData) => Promise<TResponse>;  // API çağrısı
  queryKey: string | string[];          // Cache key
  
  // İsteğe Bağlı
  defaultValues?: Partial<TFormData>;   // Varsayılan değerler
  successMessage?: string;              // Başarı mesajı
  errorMessage?: string;                // Hata mesajı
  onSuccess?: (data: TResponse) => void;  // Başarı callback
  onError?: (error: unknown) => void;   // Hata callback
  transformData?: (data: TFormData) => TFormData;  // Veri dönüştürme
  resetOnSuccess?: boolean;             // Başarıda form sıfırlama
  showSuccessToast?: boolean;           // Başarı toast göster
  showErrorToast?: boolean;             // Hata toast göster
  collection?: string;                  // Offline sync için
}
```

### Return Değerleri

```typescript
interface UseStandardFormReturn<TFormData, TResponse> {
  form: UseFormReturn<TFormData>;   // React Hook Form instance
  handleSubmit: () => Promise<void>;  // Submit handler
  isSubmitting: boolean;            // Loading durumu
  isDirty: boolean;                 // Form değişti mi
  isValid: boolean;                 // Form geçerli mi
  isSuccess: boolean;               // Mutation başarılı mı
  isError: boolean;                 // Mutation hatalı mı
  error: unknown;                   // Hata objesi
  data: TResponse | undefined;      // Mutation response
  reset: () => void;                // Formu sıfırla
}
```

---

## ✅ Zod Validasyon Şemaları

### Paylaşılan Validatörler

```typescript
// lib/validations/shared-validators.ts

// TC Kimlik No (algoritma kontrolü ile)
export const tcKimlikNoSchema = z
  .string()
  .length(11, 'TC Kimlik No 11 haneli olmalıdır')
  .regex(/^\d{11}$/, 'TC Kimlik No sadece rakam içermelidir')
  .refine((value) => {
    if (value[0] === '0') return false;
    // ... algoritma kontrolü
    return true;
  }, 'Geçersiz TC Kimlik No');

// Telefon (otomatik temizleme ile)
export const requiredPhoneSchema = z.preprocess(
  sanitizePhoneNumber,
  z.string()
    .min(10, 'Telefon numarası gereklidir')
    .regex(/^5\d{9}$/, 'Telefon 10 haneli olmalı ve 5 ile başlamalı')
);

// E-posta
export const requiredEmailSchema = z
  .string()
  .min(1, 'Email adresi gereklidir')
  .email('Geçerli bir email adresi giriniz');

// Türkçe isim
export const turkishNameSchema = z
  .string()
  .min(2, 'Ad en az 2 karakter olmalıdır')
  .max(50, 'Ad en fazla 50 karakter olmalıdır')
  .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'Sadece harf içerebilir');

// Tutar
export const amountSchema = z
  .number()
  .min(0, 'Tutar negatif olamaz')
  .max(999999999, 'Tutar çok büyük');
```

### Form Şeması Örneği

```typescript
// lib/validations/forms.ts
import { z } from 'zod';
import {
  requiredPhoneSchema,
  emailSchema,
  amountSchema,
} from './shared-validators';

export const donationSchema = z.object({
  donor_name: z.string().min(2, 'Bağışçı adı en az 2 karakter olmalıdır'),
  donor_phone: requiredPhoneSchema,
  donor_email: emailSchema,
  amount: amountSchema.min(1, 'Tutar en az 1 olmalıdır'),
  currency: z.enum(['TRY', 'USD', 'EUR']),
  donation_type: z.string().min(1, 'Bağış türü seçiniz'),
  payment_method: z.string().min(1, 'Ödeme yöntemi seçiniz'),
  donation_purpose: z.string().min(1, 'Bağış amacı seçiniz'),
  receipt_number: z.string().min(1, 'Makbuz numarası giriniz'),
  notes: z.string().max(500, 'Notlar en fazla 500 karakter olabilir').optional(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  receipt_file_id: z.string().optional(),
});

export type DonationFormData = z.infer<typeof donationSchema>;
```

---

## 🎨 Form Bileşenleri

### Controller Pattern

```tsx
import { Controller } from 'react-hook-form';

// Input kontrolü
<Controller
  name="donor_name"
  control={form.control}
  render={({ field, fieldState }) => (
    <div className="space-y-2">
      <Label htmlFor="donor_name">
        Bağışçı Adı <span className="text-red-500">*</span>
      </Label>
      <Input
        {...field}
        id="donor_name"
        placeholder="Bağışçı adını girin"
        aria-invalid={!!fieldState.error}
        aria-describedby={fieldState.error ? 'donor_name-error' : undefined}
      />
      {fieldState.error && (
        <p id="donor_name-error" className="text-sm text-red-600" role="alert">
          {fieldState.error.message}
        </p>
      )}
    </div>
  )}
/>
```

### Select Kontrolü

```tsx
<Controller
  name="currency"
  control={form.control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="Para birimi seçin" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
        <SelectItem value="USD">USD - Dolar</SelectItem>
        <SelectItem value="EUR">EUR - Euro</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
```

### Checkbox Kontrolü

```tsx
<Controller
  name="is_urgent"
  control={form.control}
  render={({ field }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="is_urgent"
        checked={field.value}
        onCheckedChange={field.onChange}
      />
      <Label htmlFor="is_urgent">Acil yardım</Label>
    </div>
  )}
/>
```

### File Upload

```tsx
<FileUpload
  label="Makbuz Dosyası"
  accept="application/pdf,image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  onFileSelect={(file) => setReceiptFile(file)}
  onError={(error) => toast.error(error)}
  preview={true}
/>
```

---

## 🔄 Veri Dönüştürme

### transformData Kullanımı

```typescript
const { form, handleSubmit } = useStandardForm({
  schema: beneficiarySchema,
  mutationFn: (data) => beneficiaries.create(data),
  queryKey: ['beneficiaries'],
  
  // Form verisini API formatına dönüştür
  transformData: (data) => ({
    ...data,
    // Telefon numarasını temizle
    phone: data.phone.replace(/\D/g, ''),
    // Tarihi ISO formatına çevir
    birth_date: data.birth_date ? new Date(data.birth_date).toISOString() : undefined,
    // Boolean'ları normalize et
    has_disability: Boolean(data.has_disability),
  }),
});
```

---

## 🔍 Gerçek Zamanlı Validasyon

### Field-Level Validasyon

```tsx
const [fieldValidation, setFieldValidation] = useState<
  Record<string, 'valid' | 'invalid' | 'pending'>
>({});

const validateField = async (fieldName: keyof FormData, value: unknown) => {
  try {
    setFieldValidation(prev => ({ ...prev, [fieldName]: 'pending' }));
    await schema.shape[fieldName].parseAsync(value);
    setFieldValidation(prev => ({ ...prev, [fieldName]: 'valid' }));
  } catch {
    setFieldValidation(prev => ({ ...prev, [fieldName]: 'invalid' }));
  }
};

// Input'ta kullanım
<Input
  {...field}
  onBlur={(e) => {
    field.onBlur();
    validateField('donor_name', e.target.value);
  }}
/>
```

### Validasyon İkonu

```tsx
function ValidationIcon({ status }: { status: 'valid' | 'invalid' | 'pending' | undefined }) {
  switch (status) {
    case 'valid':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'invalid':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pending':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    default:
      return null;
  }
}
```

---

## 📱 Çok Adımlı Formlar

### Step Progress Komponenti

```tsx
<StepProgress
  steps={[
    { id: 1, title: 'Kişisel Bilgiler' },
    { id: 2, title: 'Adres Bilgileri' },
    { id: 3, title: 'Ekonomik Durum' },
    { id: 4, title: 'Onay' },
  ]}
  currentStep={currentStep}
  onStepClick={(step) => setCurrentStep(step)}
/>
```

### Step-Based Form

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  
  const { form, handleSubmit, isSubmitting } = useStandardForm({
    schema: fullFormSchema,
    // ...
  });
  
  const validateCurrentStep = async () => {
    const fieldsToValidate = stepFields[step];
    const result = await form.trigger(fieldsToValidate);
    return result;
  };
  
  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) setStep(s => s + 1);
  };
  
  const prevStep = () => setStep(s => s - 1);
  
  return (
    <form onSubmit={handleSubmit}>
      {step === 1 && <PersonalInfoStep form={form} />}
      {step === 2 && <AddressStep form={form} />}
      {step === 3 && <EconomicStep form={form} />}
      {step === 4 && <ConfirmationStep form={form} />}
      
      <div className="flex justify-between">
        {step > 1 && (
          <Button type="button" onClick={prevStep}>Geri</Button>
        )}
        {step < 4 ? (
          <Button type="button" onClick={nextStep}>İleri</Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        )}
      </div>
    </form>
  );
}
```

---

## 📋 Specialized Form Hooks

### useCreateForm

Yeni kayıt oluşturma için optimize edilmiş hook.

```typescript
import { useCreateForm } from '@/hooks/useStandardForm';

const { form, handleSubmit, isSubmitting } = useCreateForm({
  schema: beneficiarySchema,
  entityName: 'İhtiyaç Sahibi',
  queryKey: ['beneficiaries'],
  mutationFn: (data) => beneficiaries.create(data),
  // Otomatik mesaj: "İhtiyaç Sahibi başarıyla oluşturuldu"
});
```

### useUpdateForm

Güncelleme işlemleri için optimize edilmiş hook.

```typescript
import { useUpdateForm } from '@/hooks/useStandardForm';

const { form, handleSubmit, isSubmitting } = useUpdateForm({
  schema: beneficiarySchema,
  entityName: 'İhtiyaç Sahibi',
  queryKey: ['beneficiaries', id],
  defaultValues: existingData,
  mutationFn: (data) => beneficiaries.update(id, data),
  // Otomatik mesaj: "İhtiyaç Sahibi başarıyla güncellendi"
  // resetOnSuccess: false (varsayılan)
});
```

### useDeleteForm

Silme işlemleri için hook.

```typescript
import { useDeleteForm } from '@/hooks/useStandardForm';

const deleteMutation = useDeleteForm({
  entityName: 'İhtiyaç Sahibi',
  queryKey: ['beneficiaries'],
  mutationFn: () => beneficiaries.delete(id),
  onSuccess: () => {
    router.push('/yardim/ihtiyac-sahipleri');
  },
});

// Kullanım
<AlertDialog>
  <AlertDialogTrigger>
    <Button variant="destructive">Sil</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>İptal</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 🎯 Form Best Practices

### 1. Her Zaman Şema Kullanın

```typescript
// ✓ İyi
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// ✗ Kötü - Manuel validasyon
if (!name || name.length < 2) {
  setError('name', 'Ad en az 2 karakter olmalı');
}
```

### 2. Paylaşılan Validatörleri Kullanın

```typescript
// ✓ İyi
import { tcKimlikNoSchema, requiredPhoneSchema } from '@/lib/validations/shared-validators';

const schema = z.object({
  tc_no: tcKimlikNoSchema,
  phone: requiredPhoneSchema,
});

// ✗ Kötü - Tekrarlanan validasyon
const schema = z.object({
  tc_no: z.string().length(11).regex(/^\d{11}$/),
  phone: z.string().regex(/^5\d{9}$/),
});
```

### 3. Loading Durumunu Gösterin

```tsx
// ✓ İyi
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Kaydediliyor...
    </>
  ) : (
    'Kaydet'
  )}
</Button>

// ✗ Kötü - Loading gösterimi yok
<Button type="submit">Kaydet</Button>
```

### 4. Erişilebilirlik

```tsx
// ✓ İyi
<Label htmlFor="name">Ad Soyad</Label>
<Input
  id="name"
  aria-invalid={!!error}
  aria-describedby={error ? 'name-error' : undefined}
/>
{error && <p id="name-error" role="alert">{error}</p>}

// ✗ Kötü - Erişilebilirlik eksik
<Label>Ad Soyad</Label>
<Input />
{error && <p>{error}</p>}
```

### 5. Form Reset

```typescript
// useStandardForm ile otomatik reset
const { reset } = useStandardForm({
  resetOnSuccess: true, // Başarıda otomatik reset
});

// Manuel reset
const handleCancel = () => {
  reset();
  onClose();
};
```

---

## 🧪 Form Testleri

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationForm } from './DonationForm';

describe('DonationForm', () => {
  it('should show validation errors for empty required fields', async () => {
    render(<DonationForm />);
    
    // Submit boş form
    await userEvent.click(screen.getByRole('button', { name: /kaydet/i }));
    
    // Hata mesajlarını kontrol et
    await waitFor(() => {
      expect(screen.getByText(/bağışçı adı en az 2 karakter/i)).toBeInTheDocument();
      expect(screen.getByText(/telefon numarası gerekli/i)).toBeInTheDocument();
    });
  });
  
  it('should submit form with valid data', async () => {
    const onSuccess = vi.fn();
    render(<DonationForm onSuccess={onSuccess} />);
    
    // Formu doldur
    await userEvent.type(screen.getByLabelText(/bağışçı adı/i), 'Test Kullanıcı');
    await userEvent.type(screen.getByLabelText(/telefon/i), '5551234567');
    await userEvent.type(screen.getByLabelText(/tutar/i), '1000');
    
    // Submit
    await userEvent.click(screen.getByRole('button', { name: /kaydet/i }));
    
    // Başarı callback'i kontrol et
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

