# AI Agent Prompt: Kafkasder Panel - Dernek Yönetim Sistemi

## 🎯 Görev Tanımı

Bir sivil toplum kuruluşu (dernek) için kapsamlı bir yönetim sistemi geliştir. Sistem ihtiyaç sahiplerini, bağışları, bursları, toplantıları ve çok kanallı iletişimi (WhatsApp/SMS/Email) yönetecek.

---

## 🛠️ Teknoloji Yığını

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **State Management**:
  - Zustand (client state - auth, UI)
  - TanStack Query v5 (server state - API cache)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)

### Backend

- **BaaS**: Appwrite (self-hosted veya cloud)
  - Database (collections)
  - Authentication
  - Storage (file uploads)
  - Realtime subscriptions
- **API**: Next.js API Routes (thin proxy layer)

### Testing

- **Unit**: Vitest + React Testing Library
- **E2E**: Playwright

### DevOps

- **Linting**: ESLint 9
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Containerization**: Docker

---

## 📁 Proje Yapısı

```
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Protected routes (layout group)
│   │   │   ├── layout.tsx         # Sidebar + Header layout
│   │   │   ├── genel/             # Dashboard homepage
│   │   │   ├── yardim/            # Beneficiary management (ihtiyaç sahipleri)
│   │   │   ├── bagis/             # Donations
│   │   │   ├── burs/              # Scholarships
│   │   │   ├── fon/               # Finance/Accounting
│   │   │   ├── kullanici/         # User management
│   │   │   ├── is/                # Tasks & Meetings
│   │   │   ├── mesaj/             # Multi-channel messaging
│   │   │   ├── partner/           # Partner organizations
│   │   │   └── ayarlar/           # Settings
│   │   ├── api/                   # API routes
│   │   │   ├── auth/              # Login, logout, session
│   │   │   ├── beneficiaries/     # Beneficiary CRUD
│   │   │   ├── donations/         # Donation CRUD
│   │   │   ├── meetings/          # Meeting CRUD
│   │   │   ├── messages/          # Message sending
│   │   │   ├── csrf/              # CSRF token endpoint
│   │   │   └── health/            # Health check
│   │   ├── login/                 # Public login page
│   │   ├── layout.tsx             # Root layout
│   │   ├── providers.tsx          # Context providers wrapper
│   │   └── globals.css            # Global styles
│   │
│   ├── components/
│   │   ├── ui/                    # Base UI components (50+)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── forms/                 # Domain-specific forms
│   │   ├── tables/                # Data tables
│   │   ├── layouts/               # Layout components
│   │   └── [domain]/              # Domain components (meetings, messages, etc.)
│   │
│   ├── hooks/
│   │   ├── useStandardForm.ts     # Form + validation + mutation
│   │   ├── useFormMutation.ts     # TanStack mutation + offline
│   │   ├── useAppwriteQuery.ts    # Appwrite data fetching
│   │   ├── useOnlineStatus.ts     # Network status
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── appwrite/
│   │   │   ├── client.ts          # Browser SDK initialization
│   │   │   ├── server.ts          # Server SDK (API routes)
│   │   │   ├── config.ts          # Collection IDs, bucket IDs
│   │   │   └── api.ts             # CRUD wrappers
│   │   ├── api/
│   │   │   ├── middleware.ts      # buildApiRoute() factory
│   │   │   ├── route-helpers.ts   # successResponse, errorResponse
│   │   │   ├── auth-utils.ts      # requireModuleAccess, verifyCsrf
│   │   │   └── crud-factory.ts    # Generic CRUD operations
│   │   ├── validations/           # Zod schemas
│   │   │   ├── beneficiary.ts
│   │   │   ├── donation.ts
│   │   │   ├── shared-validators.ts
│   │   │   └── ...
│   │   ├── logger.ts              # Structured logging (NO console.log)
│   │   ├── csrf.ts                # CSRF token management
│   │   ├── rate-limit.ts          # Rate limiting
│   │   ├── sanitization.ts        # Input sanitization (DOMPurify)
│   │   └── offline-sync.ts        # IndexedDB queue + sync
│   │
│   ├── stores/
│   │   └── authStore.ts           # Zustand auth store
│   │
│   └── types/
│       ├── beneficiary.ts         # Beneficiary types + enums
│       ├── donation.ts
│       ├── auth.ts
│       ├── permissions.ts
│       └── database.ts            # Generic DB types
│
├── e2e/                           # Playwright E2E tests
├── scripts/                       # Setup scripts
├── public/
│   ├── sw.js                      # Service Worker
│   ├── manifest.json              # PWA manifest
│   └── offline.html               # Offline fallback
└── docs/                          # Documentation
```

---

## 🗄️ Veritabanı Şeması (Appwrite Collections)

### 1. users

```typescript
{
  id: string;                    // Appwrite document ID
  email: string;                 // Unique
  password_hash: string;         // bcrypt hash
  name: string;
  role: 'Admin' | 'Yonetici' | 'Personel' | 'Gonullu';
  permissions: string[];         // ['beneficiaries:read', 'donations:write', ...]
  phone?: string;
  avatar?: string;               // Storage file ID
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. beneficiaries (İhtiyaç Sahipleri)

```typescript
{
  id: string;
  // Temel Bilgiler
  firstName: string;
  lastName: string;
  tc_no: string;                 // 11 haneli TC Kimlik No (hashed)
  phone: string;                 // Format: 5XXXXXXXXX
  email?: string;

  // Adres
  address: string;
  city: string;
  district: string;
  neighborhood: string;

  // Kategorizasyon
  category: 'YETIM' | 'DUL' | 'YASLI' | 'ENGELLI' | 'OGRENCI' | 'AILE' | 'DIGER';
  fundRegion: 'TURKIYE' | 'KAFKASYA' | 'ORTADOGU' | 'DIGER';
  status: 'TASLAK' | 'AKTIF' | 'PASIF' | 'SILINDI';
  priority: 'low' | 'medium' | 'high';

  // Aile Bilgileri
  family_size: number;
  children_count: number;
  orphan_children_count: number;
  elderly_count: number;
  disabled_count: number;
  maritalStatus: 'BEKAR' | 'EVLI' | 'DUL' | 'BOSANMIS';

  // Ekonomik Durum
  income_level: string;
  income_source: string;
  has_debt: boolean;
  housing_type: string;
  has_vehicle: boolean;

  // Sağlık
  health_status: string;
  has_chronic_illness: boolean;
  chronic_illness_detail?: string;
  has_disability: boolean;
  disability_detail?: string;
  has_health_insurance: boolean;

  // Yardım Bilgileri
  aid_type: string;
  totalAidAmount: number;
  previous_aid: boolean;
  other_organization_aid: boolean;
  emergency: boolean;

  // Meta
  notes?: string;
  labels: string[];
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

### 3. donations (Bağışlar)

```typescript
{
  id: string;
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  donation_type: 'NAKDI' | 'AYNI';
  donation_purpose: 'GENEL' | 'YETIM' | 'EGITIM' | 'SAGLIK' | 'GIDA' | 'DIGER';
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'online';
  receipt_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  beneficiary_id?: string;       // Linked beneficiary
  notes?: string;
  createdAt: string;
  createdBy: string;
}
```

### 4. meetings (Toplantılar)

```typescript
{
  id: string;
  title: string;
  description?: string;
  meeting_type: 'general' | 'committee' | 'board' | 'other';
  scheduled_at: string;          // ISO datetime
  location?: string;
  participants: string[];        // User IDs
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
}
```

### 5. meeting_decisions (Toplantı Kararları)

```typescript
{
  id: string;
  meeting_id: string;
  decision_number: string;
  title: string;
  description: string;
  decision_type: 'KARAR' | 'GOREV' | 'BILGI';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string;
  due_date?: string;
  createdAt: string;
}
```

### 6. tasks (Görevler)

```typescript
{
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;           // User ID
  due_date?: string;
  meeting_id?: string;           // Linked meeting
  beneficiary_id?: string;       // Linked beneficiary
  createdAt: string;
  createdBy: string;
}
```

### 7. messages (Mesajlar)

```typescript
{
  id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient_type: 'beneficiary' | 'donor' | 'user';
  recipient_id: string;
  recipient_phone?: string;
  recipient_email?: string;
  template_id?: string;
  subject?: string;              // Email only
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  error_message?: string;
  createdAt: string;
  createdBy: string;
}
```

### 8. scholarships (Burslar)

```typescript
{
  id: string;
  beneficiary_id: string;
  academic_year: string;         // "2024-2025"
  education_level: 'ilkokul' | 'ortaokul' | 'lise' | 'universite';
  school_name: string;
  grade: string;
  monthly_amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  status: 'active' | 'suspended' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  notes?: string;
  createdAt: string;
}
```

### 9. partners (Partnerler)

```typescript
{
  id: string;
  name: string;
  type: 'organization' | 'individual';
  partnership_type: 'donor' | 'supplier' | 'volunteer' | 'sponsor';
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}
```

### 10. audit_logs (Denetim Kayıtları)

```typescript
{
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  resource_type: string;         // 'beneficiary', 'donation', etc.
  resource_id: string;
  changes?: object;              // Before/after diff
  ip_address: string;
  user_agent: string;
  createdAt: string;
}
```

### 11. system_settings

```typescript
{
  id: string;
  key: string; // Unique setting key
  value: string; // JSON stringified value
  category: 'general' | 'notification' | 'security' | 'theme';
  updatedAt: string;
  updatedBy: string;
}
```

### 12. theme_presets

```typescript
{
  id: string;
  name: string;
  description?: string;
  colors: {
    primary: string;             // Hex color
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography?: object;
  layout?: object;
  isDefault: boolean;
  isCustom: boolean;
  createdAt: string;
}
```

---

## 🔐 Kimlik Doğrulama Sistemi

### Login Flow

```
1. User submits email/password to /api/auth/login
2. Server validates credentials against Appwrite users collection
3. Password verified with bcrypt
4. Server creates session (HttpOnly cookie)
5. Returns user object with permissions
6. Client stores user in Zustand + localStorage backup
```

### Session Management

```typescript
// Cookie-based session (HttpOnly, Secure, SameSite=Strict)
// Session stored in Appwrite user_sessions collection

interface Session {
  userId: string;
  token: string; // Secure random token
  expire: string; // ISO datetime
  userAgent: string;
  ipAddress: string;
}
```

### Permission System

```typescript
// Fine-grained permissions
type Permission =
  | 'beneficiaries:read'
  | 'beneficiaries:write'
  | 'beneficiaries:delete'
  | 'donations:read'
  | 'donations:write'
  | 'donations:delete'
  | 'meetings:read'
  | 'meetings:write'
  | 'meetings:manage'
  | 'users:read'
  | 'users:write'
  | 'users:manage'
  | 'settings:read'
  | 'settings:manage'
  | 'reports:read'
  | 'reports:export';

// Role-based defaults
const ROLE_PERMISSIONS = {
  Admin: ['*'], // All permissions
  Yonetici: ['beneficiaries:*', 'donations:*', 'meetings:*', 'reports:*'],
  Personel: ['beneficiaries:read', 'beneficiaries:write', 'donations:read'],
  Gonullu: ['beneficiaries:read'],
};
```

---

## 🔒 Güvenlik Gereksinimleri

### 1. CSRF Koruması

```typescript
// Her mutating request için CSRF token zorunlu
// Token cookie'de + header'da eşleşmeli

// GET /api/csrf → Set-Cookie + JSON response
// POST/PUT/DELETE requests → x-csrf-token header

import { fetchWithCsrf } from '@/lib/csrf';
await fetchWithCsrf('/api/resource', { method: 'POST', body: data });
```

### 2. Rate Limiting

```typescript
// IP bazlı rate limiting
const RATE_LIMITS = {
  GET: { maxRequests: 100, windowMs: 60000 }, // 100/min
  POST: { maxRequests: 50, windowMs: 60000 }, // 50/min
  'auth/login': { maxRequests: 5, windowMs: 900000 }, // 5/15min
};
```

### 3. Input Validation

```typescript
// TÜM inputlar Zod ile validate edilmeli
// API route'ta validation
const result = beneficiarySchema.safeParse(data);
if (!result.success) {
  return errorResponse('Validation error', 400, result.error.errors);
}
```

### 4. Input Sanitization

```typescript
// XSS koruması için DOMPurify
import { sanitizeInput } from '@/lib/sanitization';
const cleanInput = sanitizeInput(userInput);
```

### 5. Sensitive Data Handling

```typescript
// TC Kimlik No → SHA256 hash olarak sakla
// Loglar'da mask: 123******89
// Password → bcrypt hash (cost factor: 12)
```

---

## 📝 API Route Pattern

### Middleware Factory

```typescript
// src/lib/api/middleware.ts

export function buildApiRoute(options: {
  requireModule?: string; // Permission check
  allowedMethods?: string[]; // HTTP method restriction
  rateLimit?: { maxRequests: number; windowMs: number };
  supportOfflineSync?: boolean; // Handle X-Force-Overwrite header
}) {
  return (handler: RouteHandler) => {
    // Apply middleware chain:
    // 1. Logging
    // 2. Error handling
    // 3. Rate limiting
    // 4. Auth check
    // 5. Module access check
    // 6. Method validation
    return wrappedHandler;
  };
}
```

### Standard Route Structure

```typescript
// src/app/api/[resource]/route.ts

import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';

export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request) => {
  const { searchParams } = new URL(request.url);
  const data = await appwriteBeneficiaries.list(params);
  return successResponse(data);
});

export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  supportOfflineSync: true,
})(async (request) => {
  await verifyCsrfToken(request);
  const { user } = await requireAuthenticatedUser();

  const { data, error } = await parseBody(request);
  if (error) return errorResponse(error, 400);

  const validation = beneficiarySchema.safeParse(data);
  if (!validation.success) {
    return errorResponse('Doğrulama hatası', 400, validation.error.errors);
  }

  const result = await appwriteBeneficiaries.create(validation.data);
  return successResponse(result, 'Oluşturuldu', 201);
});
```

### Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}

// Error
{
  "success": false,
  "error": "Hata mesajı",
  "details": ["Detay 1", "Detay 2"]  // Optional
}
```

---

## 🎨 Form Pattern

### useStandardForm Hook

```typescript
// Her form için bu hook kullanılmalı

import { useStandardForm } from '@/hooks/useStandardForm';
import { beneficiarySchema } from '@/lib/validations/beneficiary';

function BeneficiaryForm({ initialData, onSuccess }) {
  const form = useStandardForm({
    schema: beneficiarySchema,              // Zod validation
    defaultValues: initialData || {},
    mutationFn: initialData
      ? (data) => beneficiaries.update(initialData.id, data)
      : beneficiaries.create,
    queryKey: 'beneficiaries',              // TanStack Query invalidation
    collection: 'beneficiaries',            // Offline sync routing
    successMessage: 'Kaydedildi',
    onSuccess: () => {
      onSuccess?.();
      router.push('/yardim');
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <FormField
        control={form.form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ad</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* More fields */}
      <Button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </form>
  );
}
```

---

## 📱 Offline-First PWA

### Service Worker

```javascript
// public/sw.js
// Cache static assets
// Queue failed requests
// Background sync when online
```

### IndexedDB Offline Queue

```typescript
// src/lib/offline-sync.ts

interface OfflineMutation {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: Record<string, unknown>;
  retryCount: number;
}

// Queue mutation when offline
await queueOfflineMutation({
  type: 'create',
  collection: 'beneficiaries',
  data: formData,
});

// Sync when online
await syncPendingMutations();
// - Process oldest first
// - Exponential backoff on failure
// - Max 3 retries
// - Last-write-wins conflict resolution
```

### useFormMutation Hook

```typescript
// Automatically handles offline queueing

const mutation = useFormMutation({
  mutationFn: beneficiaries.create,
  queryKey: 'beneficiaries',
  collection: 'beneficiaries', // Required for offline routing
  enableOfflineQueue: true, // Default: true
  successMessage: 'Kaydedildi',
  errorMessage: 'Kayıt başarısız',
});

// If offline:
// 1. Queue to IndexedDB
// 2. Show "Kuyruğa eklendi" toast
// 3. Sync automatically when online
```

---

## 🎨 UI Component Guidelines

### Radix UI + Tailwind

```typescript
// Base components in src/components/ui/
// Use class-variance-authority for variants

// button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

### Data Table

```typescript
// TanStack Table + custom wrapper
// Features: sorting, filtering, pagination, column visibility, export

<DataTable
  columns={columns}
  data={beneficiaries}
  searchColumn="name"
  filterableColumns={['status', 'category', 'city']}
  exportable
/>
```

---

## 📊 Validation Schemas

### Phone Number

```typescript
// Format: 5XXXXXXXXX (10 digits, starts with 5)
export const phoneSchema = z
  .string()
  .regex(/^5\d{9}$/, 'Geçerli telefon numarası giriniz (5XXXXXXXXX)')
  .optional()
  .or(z.literal(''));

// Sanitize before validation
export function sanitizePhone(phone: string): string {
  // Remove +90, 0, spaces, dashes
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+90|90|0)/, '');
}
```

### TC Kimlik No

```typescript
export const tcKimlikNoSchema = z
  .string()
  .length(11, 'TC Kimlik No 11 haneli olmalıdır')
  .regex(/^\d{11}$/, 'TC Kimlik No sadece rakam içermelidir')
  .refine((value) => {
    // TC Kimlik No algorithm validation
    if (value[0] === '0') return false;

    const digits = value.split('').map(Number);
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = (oddSum * 7 - evenSum) % 10;

    if (digits[9] !== check10) return false;

    const sum10 = digits.slice(0, 10).reduce((sum, d) => sum + d, 0);
    return digits[10] === sum10 % 10;
  }, 'Geçersiz TC Kimlik No');
```

---

## 📋 Logger (NO console.log!)

```typescript
// src/lib/logger.ts
// ZORUNLU: console.log YASAK, her yerde logger kullan

import logger from '@/lib/logger';

// Levels: debug, info, warn, error, fatal
logger.info('User logged in', { userId: user.id });
logger.error('Operation failed', error, { context: 'beneficiary-create' });

// Features:
// - Structured JSON output in production
// - Colored output in development
// - Automatic sensitive data masking (password, tc_no, token)
// - Stack trace shortening in production
```

---

## 🧪 Test Yapısı

### Unit Tests (Vitest)

```typescript
// src/__tests__/hooks/useStandardForm.test.ts
// src/__tests__/lib/validations/beneficiary.test.ts
// src/__tests__/integration/api-client.test.ts

describe('useStandardForm', () => {
  it('should validate form data according to schema', () => {
    // ...
  });

  it('should call mutation function on submit', () => {
    // ...
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/beneficiaries.spec.ts

test('should create new beneficiary', async ({ page }) => {
  await page.goto('/yardim/yeni');
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'User');
  // ...
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/yardim');
});
```

---

## 🚀 Kurulum Komutları

```bash
# Geliştirme
npm run dev                    # Next.js dev server

# Kod Kalitesi
npm run typecheck              # TypeScript strict check
npm run lint                   # ESLint
npm run lint:fix               # ESLint with auto-fix
npm run format                 # Prettier

# Test
npm run test                   # Vitest watch mode
npm run test:run               # Vitest single run
npm run test:e2e               # Playwright

# Build
npm run build                  # Production build

# Appwrite
npm run appwrite:setup         # Initialize collections
npm run test:backend           # Test Appwrite connection
```

---

## ⚠️ Kritik Kurallar

1. **ASLA console.log kullanma** → `logger` kullan
2. **TÜM inputlar Zod ile validate edilmeli**
3. **Mutating operations CSRF token gerektirmeli**
4. **Telefon formatı: 5XXXXXXXXX**
5. **TC Kimlik No hashlenip saklanmalı**
6. **Her API route buildApiRoute() kullanmalı**
7. **Formlar useStandardForm hook kullanmalı**
8. **TypeScript strict mode - `any` yasak**
9. **Offline-first: tüm mutations kuyruğa alınabilmeli**
10. **Turkish UI text, English code**

---

## 🖥️ UI/UX Akışları ve Sayfa Yapıları

### İhtiyaç Sahibi (Beneficiary) Akışı

#### Liste Sayfası (`/yardim`)

```
┌─────────────────────────────────────────────────────────────┐
│  İhtiyaç Sahipleri                    [+ İhtiyaç Sahibi Ekle]│
├─────────────────────────────────────────────────────────────┤
│  🔍 Ara...    [Durum ▼] [Kategori ▼] [Şehir ▼] [Dışa Aktar] │
├─────────────────────────────────────────────────────────────┤
│  ☐ │ Ad Soyad      │ Telefon     │ Şehir   │ Durum  │ ...  │
│  ☐ │ Ahmet Yılmaz  │ 532...      │ İstanbul│ Aktif  │ [👁️]  │
│  ☐ │ Fatma Demir   │ 555...      │ Ankara  │ Taslak │ [👁️]  │
└─────────────────────────────────────────────────────────────┘
│  ◀ 1 2 3 ... 10 ▶   Toplam: 245 kayıt                       │
└─────────────────────────────────────────────────────────────┘
```

#### Hızlı Kayıt Modal (Quick Add) - Genel Bilgiler

**"+ İhtiyaç Sahibi Ekle" butonuna tıklandığında küçük bir modal açılır:**

```
┌──────────────────────────────────────────────┐
│  Hızlı Kayıt - Genel Bilgiler           [✕]  │
├──────────────────────────────────────────────┤
│                                              │
│  ── Kişisel Bilgiler ──────────────────────  │
│                                              │
│  Kategori *        [Yetim             ▼]     │
│                    (Yetim/Dul/Yaşlı/Engelli/ │
│                     Öğrenci/Aile/Diğer)      │
│                                              │
│  Ad *              [___________________]     │
│                                              │
│  Soyad *           [___________________]     │
│                                              │
│  Uyruk *           [Türkiye____________]     │
│                                              │
│  Doğum Tarihi      [📅 gg/aa/yyyy      ]     │
│                                              │
│  ── Kimlik Bilgileri ──────────────────────  │
│                                              │
│  TC Kimlik No      [___________________]     │
│                    (11 haneli, opsiyonel)    │
│                                              │
│  ☐ Mernis Doğrulaması Yapıldı                │
│                                              │
│  ── Dosya Bilgileri ───────────────────────  │
│                                              │
│  Fon Bölgesi *     [Türkiye           ▼]     │
│                    (Türkiye/Kafkasya/        │
│                     Ortadoğu/Diğer)          │
│                                              │
│  Dosya Bağlantısı * [Ana Dosya        ▼]     │
│                                              │
│  Dosya No *        [___________________]     │
│                    (Örn: YTM2024001)         │
│                                              │
├──────────────────────────────────────────────┤
│              [İptal]  [Kaydet ve Devam Et]   │
└──────────────────────────────────────────────┘
```

**Quick Add Schema (quickAddBeneficiarySchema):**

```typescript
// Sadece temel genel bilgiler - 9 alan
{
  // Kişisel (5 alan)
  category: BeneficiaryCategory,    // * Zorunlu - Enum
  firstName: string,                // * Zorunlu - Min 2 karakter
  lastName: string,                 // * Zorunlu - Min 2 karakter
  nationality: string,              // * Zorunlu - Min 2 karakter
  birthDate: Date,                  // Opsiyonel

  // Kimlik (2 alan)
  identityNumber: string,           // Opsiyonel - 11 hane TC algoritması
  mernisCheck: boolean,             // Default: false

  // Dosya (3 alan)
  fundRegion: FundRegion,           // * Zorunlu - Enum
  fileConnection: FileConnection,   // * Zorunlu - Enum
  fileNumber: string,               // * Zorunlu - Büyük harf + rakam
}
```

**Akış:**

1. Kullanıcı "İhtiyaç Sahibi Ekle" butonuna tıklar
2. Küçük hızlı kayıt modal'ı açılır (sadece genel bilgiler)
3. Zorunlu alanlar (\*) doldurulur
4. "Kaydet ve Devam Et" → POST /api/beneficiaries
5. Başarılı → Modal kapanır + `/yardim/[id]/duzenle` sayfasına yönlendirilir
6. Tam detay formu açılır (iletişim, adres, sağlık, yardım bilgileri için)

```typescript
// QuickAddBeneficiaryModal.tsx
function QuickAddBeneficiaryModal({ open, onOpenChange }) {
  const router = useRouter();

  const form = useStandardForm({
    schema: quickAddBeneficiarySchema,
    mutationFn: beneficiaries.create,
    queryKey: 'beneficiaries',
    collection: 'beneficiaries',
    onSuccess: (data) => {
      onOpenChange(false);
      router.push(`/yardim/${data.id}/duzenle`);
      toast.success('Kayıt oluşturuldu, detayları tamamlayın');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hızlı Kayıt</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit}>
          {/* Form fields */}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={form.isSubmitting}>
              Kaydet ve Devam Et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### Detay/Düzenleme Sayfası (`/yardim/[id]/duzenle`)

**Tabs ile organize edilmiş kapsamlı form:**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Geri    Ahmet Yılmaz                    [Kaydet] [Sil]   │
├─────────────────────────────────────────────────────────────┤
│  [Temel Bilgiler] [Kimlik] [Kişisel] [Sağlık] [Yardım]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  Temel Bilgiler                    │
│  │                     │                                     │
│  │       📷            │  Ad *         [Ahmet            ]   │
│  │    Fotoğraf         │  Soyad *      [Yılmaz           ]   │
│  │                     │  Uyruk        [Türkiye      ▼]      │
│  │   [Fotoğraf Yükle]  │  TC Kimlik    [12345678901    ]     │
│  └─────────────────────┘                                     │
│                                                              │
│  İletişim Bilgileri                                          │
│  ─────────────────────────────────────                       │
│  Cep Telefonu *    [532 123 4567     ]                       │
│  Sabit Telefon     [                 ]                       │
│  E-posta           [ahmet@email.com  ]                       │
│                                                              │
│  Adres Bilgileri                                             │
│  ─────────────────────────────────────                       │
│  Şehir *           [İstanbul      ▼]                         │
│  İlçe *            [Kadıköy       ▼]                         │
│  Mahalle           [Caferağa      ▼]                         │
│  Açık Adres        [____________________________]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Tab Yapısı:**

1. **Temel Bilgiler** - Kişisel bilgiler, iletişim, adres
2. **Kimlik Bilgileri** - TC, pasaport, vize bilgileri
3. **Kişisel Veriler** - Medeni hal, eğitim, meslek, gelir
4. **Sağlık Durumu** - Sağlık, engellilik, ilaçlar
5. **Yardım Bilgileri** - Yardım türü, öncelik, notlar

#### Görüntüleme Sayfası (`/yardim/[id]`)

**Read-only detay görünümü:**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Geri    Ahmet Yılmaz              [Düzenle] [Mesaj Gönder]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  Ahmet Yılmaz                                  │
│  │  📷     │  📞 532 123 4567  ✉️ ahmet@email.com           │
│  │         │  📍 İstanbul, Kadıköy                          │
│  └─────────┘  Durum: 🟢 Aktif   Kategori: Aile               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [Genel Bilgiler] [Yardım Geçmişi] [Belgeler] [Notlar]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Aile Bilgileri                    Ekonomik Durum           │
│  ─────────────────                 ───────────────           │
│  Hane Halkı: 4 kişi                Gelir: Düşük              │
│  Çocuk: 2                          Kaynak: İşsizlik Maaşı    │
│  Yetim: 1                          Borç: Var                 │
│                                                              │
│  Son Yardımlar                                               │
│  ──────────────────────────────────────────────────          │
│  📦 15.11.2024 - Gıda Yardımı - 1.500 TL                    │
│  💰 01.11.2024 - Nakdi Yardım - 3.000 TL                    │
│  📚 15.10.2024 - Eğitim Desteği - 2.000 TL                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Bağış (Donation) Akışı

#### Liste → Modal → Detay

```
/bagis (liste)
    │
    ├── [+ Bağış Ekle] → Modal (Hızlı kayıt)
    │                         │
    │                         └── Kaydet → /bagis/[id] (görüntüle)
    │
    └── [Satıra tıkla] → /bagis/[id] (görüntüle)
                              │
                              └── [Düzenle] → /bagis/[id]/duzenle
```

---

### Toplantı (Meeting) Akışı

#### Toplantı Detay Sayfası

```
┌─────────────────────────────────────────────────────────────┐
│  ← Geri    Yönetim Kurulu Toplantısı      [Düzenle] [Bitir] │
├─────────────────────────────────────────────────────────────┤
│  📅 25 Kasım 2024, 14:00   📍 Merkez Ofis                   │
│  Katılımcılar: Ahmet, Mehmet, Ayşe (+3)                     │
├─────────────────────────────────────────────────────────────┤
│  [Gündem] [Kararlar] [Görevler] [Tutanak]                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Kararlar                                    [+ Karar Ekle] │
│  ─────────────────────────────────────────────────────────  │
│  #2024-15  Burs miktarlarının artırılması     ✅ Onaylandı  │
│  #2024-16  Yeni ofis kiralanması              ⏳ Beklemede  │
│                                                              │
│  Görevler                                    [+ Görev Ekle] │
│  ─────────────────────────────────────────────────────────  │
│  📋 Bütçe raporu hazırla        → Mehmet     📅 30.11.2024  │
│  📋 Ofis araştırması yap        → Ayşe       📅 15.12.2024  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Karar/Görev ekleme:** Inline modal (Dialog) ile hızlı ekleme

---

### Mesaj Gönderme Akışı

#### Tek Kişiye Mesaj

```
İhtiyaç Sahibi Detay → [Mesaj Gönder] → Modal
```

```
┌──────────────────────────────────────────────┐
│  Mesaj Gönder                           [✕]  │
├──────────────────────────────────────────────┤
│  Alıcı: Ahmet Yılmaz (532 123 4567)         │
│                                              │
│  Kanal *  ○ WhatsApp  ○ SMS  ○ E-posta      │
│                                              │
│  Şablon   [Seçiniz                    ▼]     │
│           □ Özel Mesaj Yaz                   │
│                                              │
│  Mesaj *                                     │
│  ┌────────────────────────────────────────┐  │
│  │ Sayın Ahmet Yılmaz,                    │  │
│  │                                        │  │
│  │ Yardım başvurunuz onaylanmıştır...    │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│                        [İptal]  [Gönder]     │
└──────────────────────────────────────────────┘
```

#### Toplu Mesaj (`/mesaj/toplu`)

```
┌─────────────────────────────────────────────────────────────┐
│  Toplu Mesaj Gönder                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Alıcı Grubu                                                 │
│  ─────────────────────────────────────────────────────────  │
│  ○ Tüm İhtiyaç Sahipleri (245)                              │
│  ○ Aktif İhtiyaç Sahipleri (189)                            │
│  ○ Burs Öğrencileri (45)                                    │
│  ○ Bağışçılar (120)                                         │
│  ○ Özel Filtre...                                           │
│                                                              │
│  Kanal *  ☑ WhatsApp  ☑ SMS  ☐ E-posta                     │
│                                                              │
│  Şablon * [Bayram Tebriği              ▼]                   │
│                                                              │
│  Önizleme:                                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Sayın {ad} {soyad},                                    │ │
│  │ Kurban Bayramınızı en içten dileklerimizle kutlarız... │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📊 Tahmini: 189 WhatsApp + 56 SMS = 245 mesaj              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                              [İptal]  [Önizle]  [Gönder]    │
└─────────────────────────────────────────────────────────────┘
```

---

### Genel UI Patterns

#### 1. Liste Sayfası Pattern

```typescript
// Her liste sayfası bu yapıyı takip etmeli
export default function ResourceListPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kaynak Listesi</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ekle
        </Button>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onChange={setFilters} />

      {/* Data Table */}
      <DataTable columns={columns} data={data} />

      {/* Quick Add Modal */}
      <QuickAddModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
```

#### 2. Quick Add Modal Pattern

```typescript
// Hızlı ekleme her zaman modal ile
// Kayıt sonrası detay sayfasına yönlendir
onSuccess: (data) => {
  onOpenChange(false); // Modal'ı kapat
  router.push(`/resource/${data.id}/duzenle`); // Detaya git
  toast.success('Kayıt oluşturuldu, detayları tamamlayın');
};
```

#### 3. Detay Sayfası Pattern

```typescript
// Görüntüleme ve Düzenleme ayrı
/resource/[id]          → Görüntüleme (read-only cards)
/resource/[id]/duzenle  → Düzenleme (form with tabs)
```

#### 4. Action Buttons

```typescript
// Satır sonunda eylem butonları
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => router.push(`/resource/${id}`)}>
      <Eye className="mr-2 h-4 w-4" /> Görüntüle
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push(`/resource/${id}/duzenle`)}>
      <Pencil className="mr-2 h-4 w-4" /> Düzenle
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setDeleteId(id)} className="text-destructive">
      <Trash className="mr-2 h-4 w-4" /> Sil
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### 5. Confirmation Dialogs

```typescript
// Silme işlemleri için onay dialogu
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
      <AlertDialogDescription>
        Bu işlem geri alınamaz. Kayıt kalıcı olarak silinecektir.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>İptal</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
        Sil
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Sayfa Yönlendirme Özeti

| Eylem                | Akış                                                |
| -------------------- | --------------------------------------------------- |
| Liste → Ekle         | Modal açılır → Kaydet → Detay/Düzenle sayfasına git |
| Liste → Görüntüle    | `/resource/[id]` sayfasına git                      |
| Görüntüle → Düzenle  | `/resource/[id]/duzenle` sayfasına git              |
| Düzenle → Kaydet     | Aynı sayfada kal + toast göster                     |
| Düzenle → İptal/Geri | Liste sayfasına dön                                 |
| Herhangi → Sil       | Onay modal → Sil → Liste sayfasına dön              |

---

## 🔄 Yeni Kaynak Ekleme Adımları

1. **Appwrite Collection** → Appwrite Console'da oluştur
2. **Config** → `src/lib/appwrite/config.ts` → collection ID ekle
3. **Types** → `src/types/[resource].ts` → TypeScript types
4. **Validation** → `src/lib/validations/[resource].ts` → Zod schema (full + quick)
5. **API Route** → `src/app/api/[resource]/route.ts` → buildApiRoute()
6. **API Client** → `src/lib/api/crud-factory.ts` → createCrudOperations()
7. **Liste Sayfası** → `src/app/(dashboard)/[route]/page.tsx` + DataTable
8. **Quick Add Modal** → `src/components/[resource]/QuickAddModal.tsx`
9. **Detay Sayfası** → `src/app/(dashboard)/[route]/[id]/page.tsx`
10. **Düzenleme Sayfası** → `src/app/(dashboard)/[route]/[id]/duzenle/page.tsx` + Tabs
11. **Tests** → Unit + E2E testler

---

Bu dokümanı kullanarak uygulamayı sıfırdan oluştur. Her adımda güvenlik, validation ve offline-first prensiplerini uygula. Türkçe kullanıcı arayüzü, İngilizce kod kullan.
