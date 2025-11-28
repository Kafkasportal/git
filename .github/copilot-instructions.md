# Copilot Instructions - Kafkasder Panel

AI asistanlar (GitHub Copilot, Claude, Cursor vb.) için proje rehberi.

## Proje Özeti

**Kafkasder Panel** - Next.js 16, React 19 ve Appwrite ile geliştirilmiş dernek yönetim sistemi.

**Özellikler**: İhtiyaç sahibi yönetimi, bağış takibi, burs yönetimi, toplantı yönetimi, görev otomasyonu, WhatsApp/SMS/Email entegrasyonu, finansal raporlama, güvenlik denetimi, offline-first PWA.

## Mimari

### Appwrite Backend

Tüm veri işlemleri Appwrite üzerinden yapılır. API katmanı auth, rate limiting ve CSRF koruması ekler.

```
Browser → API Routes (src/app/api/) → Appwrite SDK → Appwrite Cloud
```

**Temel dosyalar:**
- `src/lib/appwrite/config.ts` - Collection ve bucket ID'leri
- `src/lib/appwrite/client.ts` - Client-side SDK
- `src/lib/appwrite/server.ts` - Server-side SDK
- `src/lib/api/crud-factory.ts` - Generic CRUD factory

### Frontend Yapısı

```
src/app/(dashboard)/     # Dashboard sayfaları (Türkçe URL)
├── genel/               # Ana sayfa
├── bagis/               # Bağışlar
├── yardim/              # Yardım yönetimi
├── burs/                # Burslar
├── fon/                 # Finans
├── partner/             # Partnerler
├── kullanici/           # Kullanıcılar
├── is/                  # Görevler/Toplantılar
├── mesaj/               # Mesajlar
└── ayarlar/             # Ayarlar
```

## Kritik Kurallar

### 1. console.log YASAK - Logger Kullan

```typescript
import logger from '@/lib/logger';
logger.info('Kullanıcı girişi', { userId });
logger.error('İşlem başarısız', error);
```

### 2. Zod Validation Zorunlu

Tüm inputlar validate edilmeli. Şemalar `src/lib/validations/` altında:

```typescript
import { beneficiarySchema } from '@/lib/validations/beneficiary';
const result = beneficiarySchema.safeParse(data);
```

### 3. Mutation'larda CSRF Zorunlu

Client'tan POST/PUT/DELETE için `fetchWithCsrf` kullan:

```typescript
import { fetchWithCsrf } from '@/lib/csrf';
await fetchWithCsrf('/api/resource', { method: 'POST', body: JSON.stringify(data) });
```

### 4. API Route Pattern

`buildApiRoute` middleware ile tutarlı auth, rate limiting ve hata yönetimi:

```typescript
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/route-helpers';
import { verifyCsrfToken } from '@/lib/api/auth-utils';

export const GET = buildApiRoute({
  requireModule: 'beneficiaries',  // ':access' otomatik eklenir
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request) => {
  const response = await appwriteBeneficiaries.list(params);
  return successResponse(response);
});

export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  supportOfflineSync: true,
})(async (request) => {
  await verifyCsrfToken(request);
  // ...
  return successResponse(data, 'Kayıt oluşturuldu');
});
```

### 5. Form Pattern

`useStandardForm` hook ile Zod şeması ve offline sync:

```typescript
import { useStandardForm } from '@/hooks/useStandardForm';
import { beneficiarySchema } from '@/lib/validations/beneficiary';

const { form, handleSubmit, isSubmitting } = useStandardForm({
  schema: beneficiarySchema,
  mutationFn: (data) => fetchWithCsrf('/api/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  queryKey: 'beneficiaries',
  collection: 'beneficiaries',  // Offline sync için zorunlu!
  successMessage: 'Kayıt başarılı',
});
```

## İzin Sistemi

```typescript
// src/types/permissions.ts
export const MODULE_PERMISSIONS = {
  BENEFICIARIES: 'beneficiaries:access',
  DONATIONS: 'donations:access',
  SCHOLARSHIPS: 'scholarships:access',
  SETTINGS: 'settings:access',
  // ...
};

// API'de kullanım - sadece modül adı ver, ':access' otomatik eklenir
buildApiRoute({ requireModule: 'beneficiaries' })

// Auth store'da izin kontrolü
import { useAuthStore } from '@/stores/authStore';
const canEdit = useAuthStore(state => state.hasPermission('beneficiaries:access'));
const isAdmin = useAuthStore(state => state.hasRole('ADMIN'));
```

## Türkçe Konvansiyonlar

### Status Enum'ları (Veritabanında Türkçe)
```typescript
status: 'TASLAK' | 'AKTIF' | 'PASIF' | 'SILINDI'
// YANLIŞ: status: 'active'
// DOĞRU: status: 'AKTIF'
```

### Diğer Enum'lar
```typescript
// Cinsiyet
gender: 'ERKEK' | 'KADIN'

// Medeni durum
maritalStatus: 'EVLI' | 'BEKAR' | 'DUL' | 'BOSANMIS'

// Eğitim
education: 'ILKOKUL' | 'ORTAOKUL' | 'LISE' | 'UNIVERSITE' | 'LISANSUSTU'
```

### Hata/Başarı Mesajları (Türkçe)
```typescript
return errorResponse('Kayıt bulunamadı', 404);
return successResponse(data, 'İşlem başarılı');
toast.success('Kayıt başarıyla oluşturuldu');
```

## Yaygın Hatalar

### 1. Telefon Normalizasyonu
```typescript
// YANLIŞ: Ham input kullanmak
const phone = formData.phone; // +905551234567 olabilir

// DOĞRU: Önce sanitize, sonra validate
import { sanitizePhone } from '@/lib/sanitization';
const normalized = sanitizePhone(formData.phone); // 5551234567 döner
```

### 2. TC Kimlik Doğrulama
```typescript
// YANLIŞ: Sadece uzunluk kontrolü
if (tcNo.length === 11) { /* geçerli */ }

// DOĞRU: Şema ile algoritma doğrulaması
import { tcKimlikNoSchema } from '@/lib/validations/shared-validators';
const result = tcKimlikNoSchema.safeParse(tcNo);
```

### 3. Offline Sync Collection Eksikliği
```typescript
// YANLIŞ: collection belirtmemek
useFormMutation({ mutationFn, queryKey: 'beneficiaries' });

// DOĞRU: collection zorunlu
useFormMutation({
  mutationFn,
  queryKey: 'beneficiaries',
  collection: 'beneficiaries',  // Offline sync için şart!
});
```

## Yeni Kaynak Ekleme

1. **Appwrite Collection** - Appwrite Console'da collection oluştur
2. **Config** - `src/lib/appwrite/config.ts`'e collection ID ekle
3. **Validation** - `src/lib/validations/[resource].ts` şema oluştur
4. **API Route** - `src/app/api/[resource]/route.ts` oluştur (`buildApiRoute` ile)
5. **API Client** - `src/lib/api/crud-factory.ts`'e ekle

## Komutlar

```bash
npm run dev              # Development server
npm run typecheck        # TypeScript kontrolü
npm run lint             # ESLint kontrolü
npm run test             # Unit testleri (Vitest)
npm run appwrite:setup   # Appwrite database kurulumu
npm run test:backend     # Backend bağlantı kontrolü
```

## Path Alias'ları

```typescript
@/*           → ./src/*
@/components  → ./src/components
@/lib         → ./src/lib
@/hooks       → ./src/hooks
@/types       → ./src/types
@/stores      → ./src/stores
```

## Kritik Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `src/lib/appwrite/config.ts` | Collection/bucket ID'leri |
| `src/lib/api/middleware.ts` | API route factory |
| `src/lib/api/route-helpers.ts` | Response helper'ları |
| `src/lib/api/auth-utils.ts` | Auth middleware |
| `src/stores/authStore.ts` | Auth state (Zustand) |
| `src/types/permissions.ts` | İzin sabitleri |
| `src/lib/validations/shared-validators.ts` | Ortak validatörler |
| `src/lib/csrf.ts` | CSRF koruması |
| `src/lib/sanitization.ts` | Input temizleme |
| `src/lib/offline-sync.ts` | Offline mutation queue |
| `src/lib/logger.ts` | Structured logging |

## UI Componentleri

shadcn/ui + Radix primitives. Componentler `src/components/ui/` altında:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

## Debugging

```bash
# Appwrite bağlantı kontrolü
npm run test:backend

# Build hataları
npm run clean:all && npm install && npm run build

# Type hataları
npm run typecheck
```

## Test

```bash
# Belirli dosya
npm run test -- path/to/file.test.ts
```

Test dosyaları: `src/__tests__/`
