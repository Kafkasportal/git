# 🏗️ Mimari Yapı

Bu döküman, Dernek Yönetim Sistemi'nin mimari yapısını ve tasarım kararlarını açıklar.

## 📊 Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │   Zustand   │  │   TanStack Query    │  │
│  │ Components  │  │   Store     │  │   (Cache & Fetch)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   API Routes (/api/*)                    ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ ││
│  │  │Middleware│  │  Auth    │  │  CSRF    │  │  Rate   │ ││
│  │  │  Stack   │→ │  Check   │→ │  Verify  │→ │  Limit  │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └────┬────┘ ││
│  └─────────────────────────────────────────────────┼───────┘│
└────────────────────────────────────────────────────┼────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPWRITE BACKEND                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ Databases  │  │  Storage   │  │  Authentication        │ │
│  │(Collections)│  │ (Buckets)  │  │  (Sessions)            │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Veri Akış Mimarisi

### 1. İstemci Katmanı

```typescript
// Zustand Store - Global State
const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        isAuthenticated: false,
        // ... actions
      }))
    )
  )
);

// TanStack Query - Server State
const { data, isLoading } = useQuery({
  queryKey: ['beneficiaries', filters],
  queryFn: () => beneficiaries.getAll(filters),
  staleTime: 5 * 60 * 1000, // 5 dakika
});
```

### 2. API Katmanı

#### CRUD Factory Pattern

```typescript
// lib/api/crud-factory.ts
export function createCrudOperations<T>(entityName: string) {
  return {
    async getAll(params?: QueryParams): Promise<ConvexResponse<T[]>> {
      return apiRequest<T[]>(`/api/${entityName}`, undefined, cacheKey);
    },
    async getById(id: string): Promise<ConvexResponse<T>> {
      return apiRequest<T>(`/api/${entityName}/${id}`);
    },
    async create(data: CreateDocumentData<T>): Promise<ConvexResponse<T>> {
      return apiRequest<T>(`/api/${entityName}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    // ... update, delete
  };
}

// Kullanım
export const beneficiaries = createCrudOperations('beneficiaries');
export const donations = createCrudOperations('donations');
```

### 3. API Route Middleware Stack

```typescript
// lib/api/middleware.ts
export function buildApiRoute(options: RouteOptions) {
  return (handler: RouteHandler) => async (request: NextRequest) => {
    try {
      // 1. CORS kontrolü
      // 2. Rate limiting
      // 3. Auth doğrulaması
      // 4. CSRF doğrulaması
      // 5. İzin kontrolü
      // 6. Handler çalıştır
      return await handler(request);
    } catch (error) {
      return handleError(error);
    }
  };
}
```

## 🔐 Kimlik Doğrulama Akışı

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │     │  /api/auth  │     │  Appwrite   │
│   Form      │────▶│   /login    │────▶│   Session   │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  HttpOnly   │◀────│  Session    │
                    │  Cookie     │     │  Token      │
                    └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Zustand    │
                    │  authStore  │
                    └─────────────┘
```

### Session Yönetimi

```typescript
// API'den oturum doğrulama
const userResp = await fetch('/api/auth/user', {
  credentials: 'include', // HttpOnly cookie gönder
});

// authStore güncelleme
set((state) => {
  state.user = user;
  state.isAuthenticated = true;
  state.isInitialized = true;
});
```

## 📁 Dosya Yapısı Detayı

### `/src/app/(dashboard)/`

Protected routes için layout wrapper:

```tsx
// (dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  
  if (!isInitialized || !isAuthenticated) {
    return <LoadingOverlay />;
  }
  
  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### `/src/lib/appwrite/`

Appwrite SDK wrapper'ları:

```
lib/appwrite/
├── config.ts       # Konfigürasyon ve collection ID'leri
├── server.ts       # Server-side Appwrite client
├── client.ts       # Client-side Appwrite client
├── api.ts          # Collection bazlı API fonksiyonları
└── types.ts        # Input/Output tipleri
```

### `/src/lib/validations/`

Zod validasyon şemaları:

```
lib/validations/
├── shared-validators.ts  # Ortak field validatörleri
├── beneficiary.ts        # İhtiyaç sahibi şeması
├── donation.ts           # Bağış şeması
├── user.ts              # Kullanıcı şeması
└── forms.ts             # Form-spesifik şemalar
```

## 🎨 Bileşen Mimarisi

### UI Bileşen Hiyerarşisi

```
components/
├── ui/                    # Temel/Atomik bileşenler
│   ├── button.tsx        # Base button
│   ├── input.tsx         # Base input
│   └── card.tsx          # Base card
│
├── forms/                 # Form bileşenleri
│   ├── DonationForm.tsx  # Bağış formu
│   └── BeneficiaryForm/  # Çok adımlı form
│       ├── index.tsx
│       └── steps/
│
└── [feature]/            # Özellik bileşenleri
    └── FeatureComponent.tsx
```

### Form Bileşeni Pattern'i

```tsx
// useStandardForm hook kullanımı
const { form, handleSubmit, isSubmitting } = useStandardForm({
  schema: donationSchema,
  queryKey: ['donations'],
  mutationFn: async (data) => {
    return await donations.create(data);
  },
  successMessage: 'Kayıt başarılı',
});

return (
  <form onSubmit={handleSubmit}>
    <Controller
      name="donor_name"
      control={form.control}
      render={({ field, fieldState }) => (
        <Input {...field} error={fieldState.error?.message} />
      )}
    />
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? <Loader2 /> : 'Kaydet'}
    </Button>
  </form>
);
```

## 🔄 State Yönetimi Stratejisi

| State Türü | Araç | Kullanım Alanı |
|------------|------|----------------|
| **Server State** | TanStack Query | API verileri, cache |
| **Global UI State** | Zustand | Auth, tema, sidebar |
| **Local UI State** | React useState | Form, modal, toggle |
| **URL State** | Next.js Router | Sayfa, filtreler |
| **Form State** | React Hook Form | Form değerleri |

## 📊 Performans Optimizasyonları

### 1. Route-Based Code Splitting

```tsx
// Lazy load büyük bileşenler
const LazyGoogleAnalytics = lazyLoadComponent(
  () => import('@/components/analytics/GoogleAnalytics')
);
```

### 2. Query Prefetching

```tsx
// Dashboard layout'ta route-based prefetch
useEffect(() => {
  if (pathname.startsWith('/yardim/ihtiyac-sahipleri')) {
    prefetchData(queryClient, ['beneficiaries'], () => 
      beneficiaries.getAll({ limit: 20 })
    );
  }
}, [pathname]);
```

### 3. Virtualized Tables

```tsx
// Büyük veri setleri için virtualized rendering
<VirtualizedDataTable
  data={beneficiaries}
  columns={columns}
  rowHeight={52}
  overscan={5}
/>
```

### 4. API Response Caching

```typescript
// CRUD Factory'de cache TTL
const CACHE_TTL = {
  beneficiaries: 5 * 60 * 1000, // 5 dakika
  donations: 3 * 60 * 1000,     // 3 dakika
  messages: 1 * 60 * 1000,      // 1 dakika (real-time)
};
```

## 🧪 Test Mimarisi

```
__tests__/
├── api/              # API route testleri
│   ├── beneficiaries.test.ts
│   └── donations.test.ts
├── components/       # Bileşen testleri
│   └── DonationForm.test.tsx
├── hooks/            # Hook testleri
│   └── useStandardForm.test.ts
├── lib/              # Utility testleri
│   └── security.test.ts
└── integration/      # E2E testleri
```

### Test Pattern'i

```typescript
describe('Beneficiaries API', () => {
  it('should list beneficiaries with pagination', async () => {
    const response = await GET(createMockRequest('/api/beneficiaries?page=1'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## 📐 Tasarım Prensipleri

1. **DRY (Don't Repeat Yourself)**
   - CRUD Factory pattern
   - Shared validators
   - Reusable hooks

2. **Single Responsibility**
   - Her bileşen tek bir iş yapar
   - API route'lar tek endpoint için

3. **Composition over Inheritance**
   - HOC yerine hooks
   - Slot-based bileşenler

4. **Type Safety**
   - Strict TypeScript
   - Zod runtime validation
   - API response types

5. **Security by Default**
   - CSRF koruması tüm mutasyonlarda
   - Rate limiting tüm endpoint'lerde
   - Input sanitization

