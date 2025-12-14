# Dernek Yönetim Sistemi - Geliştirme Kılavuzu

## İçindekiler

- [Başlangıç](#başlangıç)
- [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)
- [Proje Yapısı](#proje-yapısı)
- [Kod Standartları](#kod-standartları)
- [Bileşen Oluşturma](#bileşen-oluşturma)
- [Hook Oluşturma](#hook-oluşturma)
- [Durum Yönetimi](#durum-yönetimi)
- [API İntegrasyonu](#api-integrasyonu)
- [Test Yazma](#test-yazma)
- [Hata Ayıklama](#hata-ayıklama)
- [Sık Karşılaşılan Hatalar](#sık-karşılaşılan-hatalar)
- [Katkı Akışı](#katkı-akışı)

---

## Başlangıç

### Gereksinimler

- **Node.js**: v20.x veya daha yüksek
- **npm**: v9.0.0 veya daha yüksek
- **Git**: 2.0 veya daha yüksek
- **Appwrite**: Cloud account veya self-hosted instance

### Hızlı Başlangıç

```bash
# Depoyu klonla
git clone https://github.com/your-org/dernek-nextjs.git
cd dernek-nextjs

# Bağımlılıkları yükle
npm install

# Ortam dosyasını oluştur
cp .env.example .env.local

# .env.local dosyasını düzenle (Appwrite kredileri, vb.)
# NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
# APPWRITE_API_KEY=...

# Geliştirme sunucusunu başlat
npm run dev

# Tarayıcıda aç
# http://localhost:3000/login
```

---

## Geliştirme Ortamı Kurulumu

### Ortam Değişkenleri (.env.local)

```bash
# Uygulama Yapılandırması
NEXT_PUBLIC_APP_NAME="Dernek Yönetim Sistemi"
NEXT_PUBLIC_APP_VERSION="0.1.0"
NEXT_PUBLIC_ENABLE_REALTIME="true"
NEXT_PUBLIC_ENABLE_ANALYTICS="false"

# Appwrite Yapılandırması
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-appwrite-api-key

# Güvenlik
CSRF_SECRET=your-csrf-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# Email (İsteğe bağlı)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
```

### Appwrite Kurulumu

```bash
# Appwrite Cloud'da proje oluştur
# 1. https://cloud.appwrite.io adresine git
# 2. Proje oluştur
# 3. Veritabanı oluştur
# 4. Koleksiyonları oluştur (beneficiaries, donations, etc.)
# 5. API anahtarı oluştur
# 6. Kredileri .env.local dosyasına yapıştır
```

### Eğitim Veri Yüklemesi

```bash
# Appwrite Veri Taşıyıcısını kullan
# veya
# Appwrite Console'da manual olarak ekle
```

---

## Proje Yapısı

```
dernek-nextjs/
├── public/                    # Statik dosyalar
│   ├── favicon.ico
│   └── manifest.json         # PWA manifestosu
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes (97+ endpoints)
│   │   │   ├── auth/
│   │   │   ├── beneficiaries/
│   │   │   ├── donations/
│   │   │   ├── scholarships/
│   │   │   ├── finance/
│   │   │   ├── users/
│   │   │   ├── messages/
│   │   │   ├── meetings/
│   │   │   └── tasks/
│   │   ├── (dashboard)/      # Dashboard layout
│   │   │   ├── genel/        # Ana sayfa
│   │   │   ├── yardim/       # Yardımcı yönetimi
│   │   │   ├── bagis/        # Bağış yönetimi
│   │   │   ├── burs/         # Burs yönetimi
│   │   │   ├── fon/          # Mali yönetim
│   │   │   └── ayarlar/      # Sistem ayarları
│   │   ├── login/            # Giriş sayfası
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React bileşenleri
│   │   ├── ui/               # UI bileşenleri (Radix UI)
│   │   ├── forms/            # Form bileşenleri
│   │   ├── tables/           # Tablo bileşenleri
│   │   ├── charts/           # Grafik bileşenleri
│   │   ├── modals/           # Modal bileşenleri
│   │   └── common/           # Ortak bileşenler
│   ├── hooks/                # Custom React hooks (28+)
│   ├── lib/
│   │   ├── appwrite/         # Appwrite entegrasyonu
│   │   │   ├── api/          # API wrapper'ları
│   │   │   ├── server.ts     # Server client
│   │   │   └── client.ts     # Client SDK
│   │   ├── auth/             # Kimlik doğrulama
│   │   ├── api/              # API helper'ları
│   │   ├── validations/      # Zod şemaları (18+)
│   │   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── constants/        # Sabitler
│   │   ├── services/         # İş mantığı
│   │   └── export/           # Dışa aktarma (Excel, PDF)
│   ├── stores/               # Zustand state stores
│   ├── types/                # TypeScript type'ları
│   ├── contexts/             # React contexts
│   ├── middleware.ts         # Edge middleware
│   └── __tests__/            # Test dosyaları
├── .env.example              # Ortam şablonu
├── .eslintrc.json           # ESLint yapılandırması
├── tsconfig.json            # TypeScript yapılandırması
├── tailwind.config.js       # Tailwind CSS yapılandırması
├── vitest.config.ts         # Test yapılandırması
├── next.config.ts           # Next.js yapılandırması
└── package.json             # Proje bağımlılıkları
```

---

## Kod Standartları

### TypeScript

**Tip Belirtme Kuralları:**

```typescript
// İyi ✓
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Kötü ✗
function getUser(id) {  // Tip yok
  // ...
}

const user: any = {};  // any kullanmaktan kaçın
```

**Generics Kullanımı:**

```typescript
// Iyi ✓
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

function handleResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error);
}

// Kötü ✗
interface ApiResponse {
  success: boolean;
  data: any;  // any kullanmak yerine generic kullan
}
```

### ESLint ve Prettier

```bash
# ESLint kontrol et
npm run lint

# ESLint otomatik düzeltme yap
npm run lint:fix

# TypeScript kontrol et
npm run typecheck
```

**ESLint Kuralları:**

- Unused variables: error
- Missing types: error
- Implicit any: error
- Console statements (production): warning
- Unused imports: error

### Kod Stili

**Naming Conventions:**

```typescript
// Fonksiyonlar: camelCase
function fetchBeneficiaries() {}
const getUserPermissions = () => {}

// Sınıflar ve Arayüzler: PascalCase
class UserService {}
interface BeneficiaryData {}
type UserRole = 'admin' | 'user';

// Sabitler: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10485760;
const API_TIMEOUT = 30000;

// Özel değişkenler: _leadingUnderscore
const _privateData = {};

// React Bileşenleri: PascalCase
function BeneficiaryList() {}
const UserProfile = () => {};
```

**Dosya Yapısı:**

- `components/BeneficiaryForm.tsx`
- `hooks/useBeneficiaryForm.ts`
- `lib/validations/beneficiary.ts`
- `stores/beneficiaryStore.ts`
- `types/beneficiary.ts`

### Yorumlar ve Dokümantasyon

```typescript
/**
 * Yardımcı listesini alır ve filtreler
 *
 * @param {Object} filters - Filtre parametreleri
 * @param {string} filters.status - Yardımcı durumu
 * @param {number} filters.page - Sayfa numarası
 * @returns {Promise<BeneficiaryPage>} Filtrelenmiş yardımcı listesi
 *
 * @example
 * const beneficiaries = await fetchBeneficiaries({
 *   status: 'AKTIF',
 *   page: 1
 * });
 */
async function fetchBeneficiaries(filters: BeneficiaryFilters): Promise<BeneficiaryPage> {
  // Uygulama...
}
```

---

## Bileşen Oluşturma

### Fonksiyonel Bileşen Şablonu

```typescript
// src/components/BeneficiaryCard.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface BeneficiaryCardProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'AKTIF' | 'PASIF';
  onClick?: () => void;
  className?: string;
}

/**
 * Yardımcı kartı bileşeni
 * Yardımcı bilgilerini görüntüler
 */
export function BeneficiaryCard({
  id,
  name,
  email,
  phone,
  status,
  onClick,
  className,
}: BeneficiaryCardProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-4 hover:shadow-lg transition-shadow',
        status === 'AKTIF' ? 'border-green-200' : 'border-gray-200',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) onClick();
      }}
    >
      <h3 className="font-semibold text-lg">{name}</h3>
      <p className="text-sm text-gray-600">{email}</p>
      <p className="text-sm text-gray-600">{phone}</p>
      <span className={cn(
        'inline-block text-xs px-2 py-1 rounded mt-2',
        status === 'AKTIF'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      )}>
        {status}
      </span>
    </div>
  );
}
```

### Form Bileşeni Şablonu

```typescript
// src/components/BeneficiaryForm.tsx

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { beneficiarySchema, type BeneficiaryInput } from '@/lib/validations/beneficiary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface BeneficiaryFormProps {
  onSubmit: (data: BeneficiaryInput) => Promise<void>;
  initialData?: Partial<BeneficiaryInput>;
  isLoading?: boolean;
}

export function BeneficiaryForm({
  onSubmit,
  initialData,
  isLoading = false,
}: BeneficiaryFormProps) {
  const form = useForm<BeneficiaryInput>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: initialData,
  });

  const handleSubmit = async (data: BeneficiaryInput) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Hata işleme
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <Input
                placeholder="Tam ad soyad girin"
                {...field}
                disabled={isLoading}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                placeholder="email@example.com"
                {...field}
                disabled={isLoading}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </form>
    </Form>
  );
}
```

### Server Bileşeni

```typescript
// src/app/(dashboard)/yardim/page.tsx

import { getBeneficiaries } from '@/lib/appwrite/api';
import { BeneficiaryList } from '@/components/BeneficiaryList';

export const metadata = {
  title: 'Yardımcılar | Dernek Yönetim Sistemi',
  description: 'Yardımcı listesi ve yönetimi',
};

export default async function BeneficiariesPage() {
  const beneficiaries = await getBeneficiaries({
    page: 1,
    limit: 20,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Yardımcılar</h1>
      <BeneficiaryList beneficiaries={beneficiaries} />
    </div>
  );
}
```

---

## Hook Oluşturma

### Custom Hook Şablonu

```typescript
// src/hooks/useBeneficiaryForm.ts

'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { BeneficiaryInput } from '@/lib/validations/beneficiary';

interface UseBeneficiaryFormOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Yardımcı formu yönetimi hook'u
 * Form gönderimi, yükleme ve hata durumlarını yönetir
 */
export function useBeneficiaryForm(options?: UseBeneficiaryFormOptions) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: BeneficiaryInput) => {
      return apiClient.beneficiaries.create(data);
    },
    onSuccess: () => {
      setErrors({});
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      options?.onError?.(error);
    },
  });

  const submit = useCallback(
    async (data: BeneficiaryInput) => {
      mutation.mutate(data);
    },
    [mutation]
  );

  return {
    submit,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
    errors,
    isSuccess: mutation.isSuccess,
  };
}
```

### Appwrite Query Hook

```typescript
// src/hooks/useAppwriteBeneficiaries.ts

'use client';

import { useAppwriteQuery } from '@/hooks/useAppwriteQuery';
import { apiClient } from '@/lib/api-client';
import type { BeneficiaryFilters } from '@/lib/appwrite/api';

export function useAppwriteBeneficiaries(filters?: BeneficiaryFilters) {
  return useAppwriteQuery({
    queryKey: ['beneficiaries', filters],
    queryFn: () => apiClient.beneficiaries.list(filters),
    entity: 'beneficiaries',
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}
```

### Realtime Hook

```typescript
// src/hooks/useRealtimeBeneficiaries.ts

'use client';

import { useEffect, useState } from 'react';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';

export function useRealtimeBeneficiaries() {
  const [updates, setUpdates] = useState<any[]>([]);
  const { subscribe, unsubscribe } = useAppwriteRealtime();

  useEffect(() => {
    const unsubscribeFn = subscribe('beneficiaries', (data) => {
      setUpdates((prev) => [data, ...prev]);
    });

    return () => {
      unsubscribeFn();
    };
  }, [subscribe]);

  return updates;
}
```

---

## Durum Yönetimi

### Zustand Store Oluşturma

```typescript
// src/stores/beneficiaryStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Beneficiary } from '@/types';

interface BeneficiaryState {
  beneficiaries: Beneficiary[];
  selectedId: string | null;
  filters: Record<string, string>;

  // Actions
  setBeneficiaries: (beneficiaries: Beneficiary[]) => void;
  addBeneficiary: (beneficiary: Beneficiary) => void;
  updateBeneficiary: (id: string, updates: Partial<Beneficiary>) => void;
  removeBeneficiary: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setFilters: (filters: Record<string, string>) => void;
}

export const useBeneficiaryStore = create<BeneficiaryState>()(
  devtools(
    persist(
      immer((set) => ({
        beneficiaries: [],
        selectedId: null,
        filters: {},

        setBeneficiaries: (beneficiaries) =>
          set({ beneficiaries }),

        addBeneficiary: (beneficiary) =>
          set((state) => {
            state.beneficiaries.push(beneficiary);
          }),

        updateBeneficiary: (id, updates) =>
          set((state) => {
            const index = state.beneficiaries.findIndex(
              (b) => b.id === id
            );
            if (index !== -1) {
              state.beneficiaries[index] = {
                ...state.beneficiaries[index],
                ...updates,
              };
            }
          }),

        removeBeneficiary: (id) =>
          set((state) => {
            state.beneficiaries = state.beneficiaries.filter(
              (b) => b.id !== id
            );
          }),

        setSelectedId: (id) => set({ selectedId: id }),

        setFilters: (filters) => set({ filters }),
      })),
      {
        name: 'beneficiary-store',
      }
    )
  )
);
```

### Context Kullanımı

```typescript
// src/contexts/BeneficiaryContext.tsx

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Beneficiary } from '@/types';

interface BeneficiaryContextType {
  selectedBeneficiary: Beneficiary | null;
  selectBeneficiary: (beneficiary: Beneficiary) => void;
  clearSelection: () => void;
}

const BeneficiaryContext = createContext<BeneficiaryContextType | undefined>(
  undefined
);

export function BeneficiaryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<Beneficiary | null>(null);

  const selectBeneficiary = useCallback((beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBeneficiary(null);
  }, []);

  return (
    <BeneficiaryContext.Provider
      value={{
        selectedBeneficiary,
        selectBeneficiary,
        clearSelection,
      }}
    >
      {children}
    </BeneficiaryContext.Provider>
  );
}

export function useBeneficiaryContext() {
  const context = useContext(BeneficiaryContext);
  if (!context) {
    throw new Error(
      'useBeneficiaryContext must be used within BeneficiaryProvider'
    );
  }
  return context;
}
```

---

## API İntegrasyonu

### API Client Kurulumu

```typescript
// src/lib/api-client.ts

import { AxiosInstance } from 'axios';
import { apiInstance } from '@/lib/api-instance';

const createApiClient = (instance: AxiosInstance) => ({
  beneficiaries: {
    list: async (filters) =>
      (
        await instance.get('/beneficiaries', {
          params: filters,
        })
      ).data,

    get: async (id: string) =>
      (await instance.get(`/beneficiaries/${id}`)).data,

    create: async (data) =>
      (await instance.post('/beneficiaries', data)).data,

    update: async (id: string, data: Partial<Beneficiary>) =>
      (await instance.put(`/beneficiaries/${id}`, data)).data,

    delete: async (id: string) =>
      (await instance.delete(`/beneficiaries/${id}`)).data,
  },

  donations: {
    list: async (filters) =>
      (await instance.get('/donations', { params: filters }))
        .data,

    get: async (id: string) =>
      (await instance.get(`/donations/${id}`)).data,

    create: async (data) =>
      (await instance.post('/donations', data)).data,

    update: async (id: string, data: Partial<Donation>) =>
      (await instance.put(`/donations/${id}`, data)).data,

    delete: async (id: string) =>
      (await instance.delete(`/donations/${id}`)).data,
  },

  // Diğer modüller...
});

export const apiClient = createApiClient(apiInstance);
```

### Veri Getirme Patterni

```typescript
// Bileşende
'use client';

import { useAppwriteQuery } from '@/hooks/useAppwriteQuery';
import { apiClient } from '@/lib/api-client';

export function BeneficiaryList() {
  const { data: beneficiaries, isLoading, error } = useAppwriteQuery({
    queryKey: ['beneficiaries', { status: 'AKTIF' }],
    queryFn: () =>
      apiClient.beneficiaries.list({ status: 'AKTIF' }),
    entity: 'beneficiaries',
  });

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error.message}</div>;

  return (
    <ul>
      {beneficiaries?.map((b) => (
        <li key={b.id}>{b.name}</li>
      ))}
    </ul>
  );
}
```

---

## Test Yazma

### Unit Test

```typescript
// src/lib/__tests__/beneficiary.test.ts

import { describe, it, expect } from 'vitest';
import { validateBeneficiaryData } from '@/lib/validations/beneficiary';

describe('Beneficiary Validation', () => {
  it('should validate valid beneficiary data', () => {
    const data = {
      name: 'Ali Yılmaz',
      tcNo: '12345678901',
      phone: '+90 555 123 4567',
      address: 'Ankara, Keçiören',
      email: 'ali@example.com',
    };

    const result = validateBeneficiaryData(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject invalid TC number', () => {
    const data = {
      name: 'Ali Yılmaz',
      tcNo: 'invalid',
      phone: '+90 555 123 4567',
      address: 'Ankara, Keçiören',
    };

    const result = validateBeneficiaryData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('TC'))).toBe(true);
  });
});
```

### Bileşen Testi

```typescript
// src/components/__tests__/BeneficiaryCard.test.tsx

import { render, screen } from '@testing-library/react';
import { BeneficiaryCard } from '@/components/BeneficiaryCard';
import { describe, it, expect, vi } from 'vitest';

describe('BeneficiaryCard', () => {
  it('should render beneficiary data', () => {
    render(
      <BeneficiaryCard
        id="1"
        name="Ali Yılmaz"
        email="ali@example.com"
        phone="+90 555 123 4567"
        status="AKTIF"
      />
    );

    expect(screen.getByText('Ali Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('ali@example.com')).toBeInTheDocument();
    expect(screen.getByText('+90 555 123 4567')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <BeneficiaryCard
        id="1"
        name="Ali Yılmaz"
        email="ali@example.com"
        phone="+90 555 123 4567"
        status="AKTIF"
        onClick={onClick}
      />
    );

    const card = container.firstChild;
    card?.dispatchEvent(new MouseEvent('click'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Entegrasyon Testi

```typescript
// src/__tests__/integration/beneficiary-api.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '@/lib/api-client';

describe('Beneficiary API Integration', () => {
  let beneficiaryId: string;

  it('should create a beneficiary', async () => {
    const response = await apiClient.beneficiaries.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+90 555 123 4567',
      address: 'Test Address',
    });

    expect(response.success).toBe(true);
    expect(response.data.id).toBeDefined();
    beneficiaryId = response.data.id;
  });

  it('should fetch beneficiary', async () => {
    const response = await apiClient.beneficiaries.get(
      beneficiaryId
    );

    expect(response.success).toBe(true);
    expect(response.data.name).toBe('Test User');
  });

  it('should update beneficiary', async () => {
    const response = await apiClient.beneficiaries.update(
      beneficiaryId,
      {
        name: 'Updated User',
      }
    );

    expect(response.success).toBe(true);
    expect(response.data.name).toBe('Updated User');
  });

  it('should delete beneficiary', async () => {
    const response = await apiClient.beneficiaries.delete(
      beneficiaryId
    );

    expect(response.success).toBe(true);
  });
});
```

### Test Çalıştırma

```bash
# Tüm testleri çalıştır
npm run test

# UI ile testleri çalıştır
npm run test:ui

# Tek seferde testleri çalıştır
npm run test:run

# Test kapsamasını göster
npm run test:coverage
```

---

## Hata Ayıklama

### Browser DevTools

```typescript
// React DevTools: Chrome Extension
// Redux DevTools: Zustand middleware ile otomatik
// Network tab: API çağrılarını incele

// useAppwriteQuery ile debugging:
useAppwriteQuery({
  queryKey: ['beneficiaries'],
  queryFn: fetchBeneficiaries,
  enabled: true,
  // React Query DevTools açılır (development'da)
});
```

### Server Side Debugging

```typescript
// src/lib/logger.ts
import logger from '@/lib/logger';

logger.debug('Beneficiary fetched', { id, timestamp: new Date() });
logger.info('Login successful', { userId });
logger.warn('High memory usage', { usage: '85%' });
logger.error('API error', { error, endpoint: '/api/beneficiaries' });
```

### Performance Debugging

```bash
# Bundle analizi
npm run analyze

# CPU profile
# Chrome DevTools > Performance tab

# Memory profiling
# Chrome DevTools > Memory tab

# Lighthouse audit
# Chrome DevTools > Lighthouse
```

---

## Sık Karşılaşılan Hatalar

### 1. "Session Expired" Hatası

**Nedeni**: Session timeout veya CSRF token geçerliliğini kaybetmiş

**Çözüm**:
```typescript
// Otomatik re-authentication
const apiInstance = axios.create({
  // ...
});

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Yeni CSRF token al
      const csrfResponse = await fetch('/api/csrf');
      const { token } = await csrfResponse.json();

      // Oturum yenile
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. "CORS Error"

**Nedeni**: Cross-origin request'i engelle

**Çözüm**:
- API same-origin'de olmalı
- Tarayıcı console'da error'u kontrol et
- next.config.ts'de headers kontrol et

### 3. "Type Safety Error"

**Nedeni**: TypeScript type mismatch

**Çözüm**:
```typescript
// Type güvenliğini sağla
const data: Beneficiary = {
  // Tüm required alanları ekle
  id: '123',
  name: 'Ali',
  // ...
};

// Veya type assertion kullan (en son çare)
const data = response.data as Beneficiary;
```

### 4. "Infinite Re-render"

**Nedeni**: Hook dependency array'i yanlış

**Çözüm**:
```typescript
// Kötü ✗
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData her render'da değişir

// İyi ✓
const fetchData = useCallback(() => {
  // ...
}, [dependencies]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 5. "Appwrite Connection Error"

**Nedeni**: Appwrite endpoint/credentials yanlış

**Çözüm**:
```bash
# .env.local kontrol et
echo $NEXT_PUBLIC_APPWRITE_ENDPOINT
echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID

# Appwrite console'da kontrol et
# Endpoint URL doğru mu?
# Project ID doğru mu?
# Database ID doğru mu?
```

---

## Katkı Akışı

### Branch Stratejisi

```bash
# Main branch'ten yeni branch oluştur
git checkout -b feature/beneficiary-export

# Kod yaz, test et
npm run lint
npm run test:run
npm run typecheck

# Commit yap
git commit -m "feat: add beneficiary export feature"

# Push yap
git push origin feature/beneficiary-export

# Pull request oluştur
# GitHub'da PR'ı açıp reviewers ekle
```

### Commit Mesajları

```
feat: add beneficiary export feature
fix: resolve beneficiary validation error
docs: update API documentation
style: fix code formatting
refactor: restructure beneficiary service
test: add beneficiary form tests
chore: update dependencies
```

### Code Review Checklist

- [ ] Kod standartlarına uyuyor mu? (lint, format)
- [ ] TypeScript type safety? (tsc --noEmit)
- [ ] Test yazılmış mı? (80%+ coverage)
- [ ] Dokumentasyon güncellenmiş mi?
- [ ] API endpoints doğru mu?
- [ ] Error handling yapılmış mı?
- [ ] Accessibility sağlanmış mı?
- [ ] Performance etkileri kontrol edilmiş mi?

---

## Kaynaklar

- [Next.js Dokumentasyonu](https://nextjs.org/docs)
- [React Dokumentasyonu](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [React Hook Form](https://react-hook-form.com)
- [TanStack Query](https://tanstack.com/query/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vitest](https://vitest.dev)
- [Appwrite Docs](https://appwrite.io/docs)

---

*Son güncelleme: 2025-12-14*
