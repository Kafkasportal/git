# Mimari Dokümantasyonu

Bu dokümantasyon, Dernek Yönetim Sistemi'nin teknik mimarisini, tasarım kararlarını ve uygulama detaylarını açıklar.

## İçindekiler

- [Genel Mimari](#genel-mimari)
- [Teknoloji Stack Detayları](#teknoloji-stack-detayları)
- [Dizin Yapısı](#dizin-yapısı)
- [Veri Akışı](#veri-akışı)
- [State Management](#state-management)
- [Database Şeması](#database-şeması)
- [API Mimarisi](#api-mimarisi)
- [Security Architecture](#security-architecture)
- [Performance Optimization](#performance-optimization)
- [Tasarım Kararları](#tasarım-kararları)

---

## Genel Mimari

### Mimari Yaklaşım

Dernek Yönetim Sistemi, **modern full-stack** bir web uygulamasıdır ve şu mimari yaklaşımları kullanır:

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │           React 19 + Next.js 16 App                │ │
│  │                                                     │ │
│  │  ┌──────────────┐        ┌──────────────┐         │ │
│  │  │   Zustand    │        │ React Query  │         │ │
│  │  │ (Client State)│       │(Server State)│         │ │
│  │  └──────────────┘        └──────────────┘         │ │
│  │           │                     │                  │ │
│  │           └─────────┬───────────┘                  │ │
│  │                     │                              │ │
│  │              ┌──────▼──────┐                       │ │
│  │              │ Components  │                       │ │
│  │              └─────────────┘                       │ │
│  └─────────────────────┬────────────────────────────┘ │
└────────────────────────┼─────────────────────────────┘
                         │ HTTPS
                         │
┌────────────────────────▼─────────────────────────────┐
│              Edge Middleware (Vercel Edge)            │
│  ┌─────────────────────────────────────────────────┐ │
│  │  • CSRF Validation                              │ │
│  │  • Session Check                                │ │
│  │  • Permission Validation                        │ │
│  │  • Route Protection                             │ │
│  └─────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│            Next.js Server (Node.js Runtime)           │
│  ┌─────────────────────────────────────────────────┐ │
│  │           API Routes (97 endpoints)             │ │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────┐  │ │
│  │  │   Auth    │  │Beneficiary│  │ Donation   │  │ │
│  │  │   APIs    │  │   APIs    │  │   APIs     │  │ │
│  │  └───────────┘  └───────────┘  └────────────┘  │ │
│  │                                                  │ │
│  │  ┌───────────────────────────────────────────┐  │ │
│  │  │     Business Logic Layer                  │  │ │
│  │  │  • Validation (Zod)                       │  │ │
│  │  │  • Sanitization (DOMPurify)               │  │ │
│  │  │  • Rate Limiting                          │  │ │
│  │  │  • Error Handling                         │  │ │
│  │  └───────────────────────────────────────────┘  │ │
│  └─────────────────────┬───────────────────────────┘ │
└────────────────────────┼─────────────────────────────┘
                         │ Appwrite SDK
                         │
┌────────────────────────▼─────────────────────────────┐
│                Appwrite BaaS (Backend)                │
│  ┌─────────────────────────────────────────────────┐ │
│  │                    Services                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ Database │  │  Auth    │  │ Storage  │      │ │
│  │  │(MongoDB) │  │ Service  │  │ Service  │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘      │ │
│  │                                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │Realtime  │  │Functions │  │  Teams   │      │ │
│  │  │  (SSE)   │  │          │  │          │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘      │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Katmanlı Mimari

1. **Presentation Layer** (React Components)
   - UI components (Radix UI primitives)
   - Feature components
   - Layout components
   - Forms

2. **State Management Layer**
   - Zustand stores (client state)
   - React Query (server state)
   - Context providers

3. **Business Logic Layer** (API Routes + Lib)
   - API endpoints
   - Data validation
   - Business rules
   - Transformations

4. **Data Access Layer** (Appwrite SDK)
   - Database operations
   - File storage
   - Authentication
   - Real-time subscriptions

5. **Infrastructure Layer** (Appwrite)
   - MongoDB database
   - Object storage
   - Authentication service
   - Serverless functions

---

## Teknoloji Stack Detayları

### Frontend Technologies

#### Next.js 16 App Router
- **Neden Next.js?**
  - Server-side rendering (SSR) için performans
  - Static site generation (SSG) desteği
  - API routes ile full-stack development
  - Image optimization
  - Automatic code splitting

- **App Router (vs Pages Router)**
  - React Server Components desteği
  - Streaming & Suspense
  - Nested layouts
  - Server actions
  - Edge runtime support

#### React 19
- **Yeni Özellikler**
  - Improved concurrent rendering
  - Automatic batching
  - Transitions API
  - Suspense for data fetching

- **Neden React 19?**
  - Better performance
  - Improved developer experience
  - Forward compatibility

#### TypeScript 5
- **Strict Mode Aktif**
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `strictFunctionTypes: true`

- **Avantajları**
  - Type safety
  - IDE autocomplete
  - Refactoring kolaylığı
  - Runtime hatalarını compile-time'da yakala

#### Radix UI
- **Neden Radix?**
  - Headless (styling freedom)
  - Accessibility built-in (WCAG 2.1 AA)
  - Keyboard navigation
  - Focus management
  - Composable primitives

- **Kullanılan Komponenler**
  - Dialog, Dropdown, Popover
  - Select, Checkbox, Radio
  - Accordion, Tabs, Tooltip
  - ve 30+ daha fazla

#### Tailwind CSS 4
- **Neden Tailwind?**
  - Utility-first approach
  - Consistent design system
  - Minimal CSS bundle
  - Easy customization

- **Tailwind 4 Özellikleri**
  - Native CSS variables
  - Lightning CSS compiler (10x faster)
  - Improved IntelliSense

### State Management

#### Zustand (Client State)
```typescript
// Avantajları:
- Minimal boilerplate (Redux'a göre %90 daha az kod)
- No providers needed
- DevTools support
- TypeScript first-class support
- Middleware support (persist, devtools, immer)
```

**Store'lar:**
1. `authStore` - Authentication state
2. `uiStore` - UI preferences (sidebar, theme)
3. `notificationStore` - Toast notifications
4. `settingsStore` - App settings

#### React Query (Server State)
```typescript
// Avantajları:
- Automatic caching
- Background refetching
- Stale-while-revalidate pattern
- Optimistic updates
- Infinite scroll support
- Devtools
```

**Kullanım Alanları:**
- API data fetching
- Mutation operations
- Real-time updates (with Appwrite SSE)
- Pagination & infinite scroll

### Backend & Database

#### Appwrite BaaS
```typescript
// Neden Appwrite?
- Open-source (self-hostable)
- REST API + SDK'lar
- Built-in authentication
- Real-time subscriptions
- File storage
- Serverless functions
- Multi-tenancy support
```

**Appwrite Services:**
1. **Database (MongoDB)**
   - Document-based NoSQL
   - Collections & relationships
   - Indexes for performance
   - Query filtering & sorting

2. **Authentication**
   - Email/password
   - OAuth providers
   - JWT sessions
   - MFA/2FA

3. **Storage**
   - File upload/download
   - Image transformations
   - File permissions

4. **Realtime**
   - WebSocket/SSE
   - Subscribe to document changes
   - Live dashboards

5. **Functions**
   - Serverless execution
   - Scheduled jobs
   - Event-driven

---

## Dizin Yapısı

### `/src` Klasörü

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected route group
│   ├── api/               # API routes
│   ├── login/             # Public routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home redirect
│   ├── providers.tsx      # Context providers
│   ├── globals.css        # Global styles
│   └── middleware.ts      # Edge middleware
│
├── components/            # React components
│   ├── ui/               # Base UI primitives
│   ├── forms/            # Form components
│   ├── tables/           # Table components
│   ├── layouts/          # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── charts/           # Chart components
│   └── [feature]/        # Feature-specific components
│
├── lib/                   # Utilities & services
│   ├── appwrite/         # Appwrite SDK wrappers
│   │   ├── api/          # Business logic layer
│   │   │   ├── base.ts   # Generic CRUD operations
│   │   │   └── [domain].ts # Domain-specific logic
│   │   ├── client.ts     # Client-side SDK
│   │   ├── server.ts     # Server-side SDK
│   │   └── config.ts     # Configuration
│   ├── api/              # API utilities
│   ├── auth/             # Auth utilities
│   ├── security/         # Security utilities
│   ├── validations/      # Zod schemas
│   └── utils/            # General utilities
│
├── hooks/                 # Custom React hooks
│   ├── useAppwriteQuery.ts
│   ├── useAppwriteMutation.ts
│   ├── useAppwriteRealtime.ts
│   └── [feature-hook].ts
│
├── stores/                # Zustand state stores
│   ├── authStore.ts
│   ├── uiStore.ts
│   ├── notificationStore.ts
│   └── settingsStore.ts
│
├── types/                 # TypeScript definitions
│   ├── database.ts        # Database document types
│   ├── permissions.ts     # Permission types
│   ├── auth.ts            # Auth types
│   └── [feature].ts       # Feature-specific types
│
├── contexts/              # React contexts
│
└── __tests__/            # Test files
    ├── lib/              # Library tests
    ├── components/       # Component tests
    ├── integration/      # Integration tests
    └── mocks/            # Mock data & handlers
```

### Dizin Organizasyon Prensipleri

1. **Feature-Based Organization**
   - Her özellik kendi klasöründe
   - İlgili component, hook, type bir arada

2. **Separation of Concerns**
   - UI components ayrı (`/components`)
   - Business logic ayrı (`/lib`)
   - State management ayrı (`/stores`, `/contexts`)

3. **Reusability**
   - Generic utilities `/lib/utils`
   - Shared components `/components/ui`
   - Common hooks `/hooks`

---

## Veri Akışı

### 1. Client → Server → Database Flow

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  React Component                │
│  - Form submit                  │
│  - Button click                 │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Custom Hook                    │
│  - useAppwriteMutation()        │
│  - useBeneficiaryForm()         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  React Query Mutation           │
│  - mutationFn                   │
│  - onSuccess / onError          │
└──────┬──────────────────────────┘
       │ Fetch API
       ▼
┌─────────────────────────────────┐
│  Next.js API Route              │
│  /api/beneficiaries/route.ts    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Middleware & Validation        │
│  1. CSRF check                  │
│  2. Session validation          │
│  3. Permission check            │
│  4. Zod schema validation       │
│  5. Sanitization (XSS)          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Business Logic                 │
│  /lib/appwrite/api/             │
│  beneficiaries.ts               │
└──────┬──────────────────────────┘
       │ Appwrite SDK
       ▼
┌─────────────────────────────────┐
│  Appwrite Database              │
│  - Create document              │
│  - Update document              │
│  - Delete document              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Response                       │
│  - Success data                 │
│  - Error message                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  React Query Cache Update       │
│  - Invalidate queries           │
│  - Optimistic update            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  UI Update                      │
│  - Re-render component          │
│  - Show notification            │
└─────────────────────────────────┘
```

### 2. Real-time Data Flow (SSE)

```
┌─────────────────────────────────┐
│  Component Mount                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  useAppwriteRealtime()          │
│  - Subscribe to collection      │
└──────┬──────────────────────────┘
       │ EventSource (SSE)
       ▼
┌─────────────────────────────────┐
│  Appwrite Realtime Service      │
│  - Listen for changes           │
└──────┬──────────────────────────┘
       │
       ▼ (Event occurs)
┌─────────────────────────────────┐
│  Event Received                 │
│  - database.documents.create    │
│  - database.documents.update    │
│  - database.documents.delete    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  React Query Cache Invalidate   │
│  - queryClient.invalidateQueries│
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Component Re-fetch & Re-render │
└─────────────────────────────────┘
```

---

## State Management

### State Kategorileri

#### 1. Server State (React Query)
```typescript
// API'den gelen data
- Beneficiaries list
- Donations list
- User data
- Settings
- Analytics data

// Özellikleri:
- Asynchronous
- Cached
- Can become stale
- Shared across components
```

#### 2. Client State (Zustand)
```typescript
// UI state ve kullanıcı tercihleri
- Authentication status
- Sidebar open/close
- Theme (light/dark)
- Notification queue
- Modal visibility

// Özellikleri:
- Synchronous
- Client-owned
- Always up-to-date
- Persisted to localStorage
```

#### 3. Local Component State (useState)
```typescript
// Component-specific geçici state
- Form inputs
- Toggle states
- Temporary filters
- Loading states

// Özellikleri:
- Scoped to component
- Not shared
- Ephemeral
```

### State Management Pattern

```typescript
// 1. Server State (React Query)
const { data: beneficiaries, isLoading } = useAppwriteQuery({
  queryKey: ['beneficiaries'],
  queryFn: () => beneficiaryAPI.list()
});

// 2. Client State (Zustand)
const { user, isAuthenticated } = useAuthStore();
const { theme, toggleTheme } = useUIStore();

// 3. Local State (React useState)
const [isOpen, setIsOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
```

### Zustand Store Pattern

```typescript
// authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const user = await authAPI.login(email, password);
        set({ user, isAuthenticated: true });
      },

      logout: async () => {
        await authAPI.logout();
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

---

## Database Şeması

### Appwrite Collections

#### 1. Users Collection
```typescript
interface User {
  $id: string;              // Appwrite document ID
  $createdAt: string;       // ISO timestamp
  $updatedAt: string;       // ISO timestamp

  // User Info
  email: string;            // Unique
  name: string;
  phone?: string;
  avatar?: string;          // File ID

  // Role & Permissions
  role: 'admin' | 'manager' | 'user' | 'viewer';
  permissions: string[];    // ['read:beneficiaries', 'write:donations']

  // Settings
  settings: {
    theme: 'light' | 'dark';
    language: 'tr' | 'en';
    notifications: boolean;
  };

  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;

  // Status
  status: 'active' | 'inactive' | 'locked';
  lastLoginAt?: string;
  failedLoginAttempts: number;
}
```

#### 2. Beneficiaries Collection
```typescript
interface Beneficiary {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Personal Info
  firstName: string;
  lastName: string;
  tcNo: string;             // Turkish ID number (encrypted)
  birthDate: string;
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';

  // Contact
  phone: string;
  email?: string;
  address: {
    street: string;
    district: string;
    city: string;
    postalCode: string;
  };

  // Family
  dependents: {
    id: string;
    name: string;
    relationship: string;
    birthDate: string;
  }[];

  // Financial
  monthlyIncome?: number;
  employmentStatus: string;

  // Aid Info
  aidType: string[];        // ['food', 'cash', 'education']
  aidFrequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';

  // Documents
  documents: {
    id: string;             // File ID in Appwrite Storage
    type: string;           // 'id_card', 'proof_of_address'
    uploadedAt: string;
  }[];

  // Status
  status: 'draft' | 'active' | 'archived';

  // Metadata
  createdBy: string;        // User ID
  notes?: string;
}
```

#### 3. Donations Collection
```typescript
interface Donation {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Donor Info
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  donorAddress?: string;
  isAnonymous: boolean;

  // Donation Details
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  category: 'fitre' | 'zekat' | 'kurban' | 'general' | 'sadaka';
  purpose?: string;

  // Payment
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
  paymentReference?: string;

  // Receipt
  receiptNumber: string;    // Auto-generated
  receiptIssued: boolean;
  receiptFileId?: string;

  // Dates
  donationDate: string;

  // Metadata
  campaignId?: string;
  notes?: string;
  receivedBy: string;       // User ID
}
```

#### 4. Scholarships Collection
```typescript
interface Scholarship {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Student Info
  studentId: string;        // Reference to Students collection

  // Scholarship Details
  type: 'primary' | 'secondary' | 'university';
  amount: number;
  frequency: 'monthly' | 'semester' | 'yearly';

  // Sponsor
  sponsorId?: string;       // Donor/Partner ID
  sponsorType: 'individual' | 'organization';

  // Dates
  startDate: string;
  endDate?: string;

  // Status
  status: 'active' | 'completed' | 'cancelled' | 'suspended';

  // Payments
  totalPaid: number;
  lastPaymentDate?: string;

  // Metadata
  notes?: string;
  createdBy: string;
}
```

#### 5. Finance Records Collection
```typescript
interface FinanceRecord {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Transaction
  type: 'income' | 'expense';
  category: string;         // Parameter reference
  amount: number;
  currency: 'TRY';

  // Details
  description: string;
  referenceNumber?: string;

  // Related Entities
  relatedTo?: {
    type: 'donation' | 'scholarship' | 'aid';
    id: string;
  };

  // Dates
  transactionDate: string;

  // Fund
  fundId?: string;          // Optional fund segregation

  // Metadata
  createdBy: string;
  approvedBy?: string;
  notes?: string;
}
```

### Database Relationships

```
Users ─────────┐
               │
               ├──► Beneficiaries (createdBy)
               │
               ├──► Donations (receivedBy)
               │
               ├──► Scholarships (createdBy)
               │
               └──► FinanceRecords (createdBy)

Beneficiaries ──► AidApplications (beneficiaryId)

Students ───────► Scholarships (studentId)

Donations ──────► FinanceRecords (relatedTo)

Scholarships ───► FinanceRecords (relatedTo)
```

### Indexes

**Performance için kritik indexler:**

```typescript
// Beneficiaries
- Index on: tcNo (unique)
- Index on: status
- Index on: createdAt (desc)
- Compound index: (status, createdAt)

// Donations
- Index on: donationDate (desc)
- Index on: category
- Index on: receivedBy
- Compound index: (donationDate, category)

// Scholarships
- Index on: studentId
- Index on: status
- Index on: startDate, endDate

// FinanceRecords
- Index on: transactionDate (desc)
- Index on: type
- Compound index: (type, transactionDate)
```

---

## API Mimarisi

### API Route Structure

```
/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── session/route.ts
│   ├── 2fa/
│   │   ├── setup/route.ts
│   │   └── verify/route.ts
│   └── oauth/
│       └── callback/route.ts
│
├── beneficiaries/
│   ├── route.ts              # GET (list), POST (create)
│   ├── [id]/route.ts         # GET, PUT, DELETE
│   ├── bulk/route.ts         # POST (bulk operations)
│   └── search/route.ts       # GET (advanced search)
│
├── donations/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── bulk/route.ts
│   ├── export/route.ts       # GET (Excel/PDF)
│   └── stats/route.ts        # GET (analytics)
│
├── scholarships/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── students/route.ts
│
├── financial/
│   ├── records/route.ts
│   ├── dashboard/route.ts
│   └── reports/route.ts
│
├── settings/
│   ├── parameters/route.ts
│   ├── theme/route.ts
│   └── organization/route.ts
│
├── users/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── batch/route.ts
│
├── search/route.ts           # Global search
├── csrf/route.ts             # CSRF token
└── health/route.ts           # Health check
```

### API Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Middleware Pipeline

```typescript
// Edge Middleware (/src/middleware.ts)
1. Check if public route → Allow
2. CSRF token validation (POST/PUT/PATCH/DELETE)
3. Session validation
4. Permission check
5. Rate limiting
6. Inject headers (user ID, session ID)

// API Route Handler
1. Parse request body
2. Validate with Zod schema
3. Sanitize inputs (XSS prevention)
4. Execute business logic
5. Transform response
6. Return formatted JSON
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────┐
│  Layer 1: Edge Middleware               │
│  • CSRF token validation                │
│  • Session verification                 │
│  • Permission checks                    │
└─────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  Layer 2: API Route Validation          │
│  • Zod schema validation                │
│  • Input sanitization (DOMPurify)       │
│  • Rate limiting                        │
└─────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  Layer 3: Business Logic                │
│  • Authorization checks                 │
│  • Data access control                  │
│  • Audit logging                        │
└─────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  Layer 4: Appwrite Security             │
│  • Document-level permissions           │
│  • Collection-level rules               │
│  • API key scopes                       │
└─────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────────┐
│ Login Form   │
└──────┬───────┘
       │ email, password
       ▼
┌──────────────────────────────┐
│ /api/auth/login              │
│ 1. Validate credentials      │
│ 2. Check account status      │
│ 3. Verify 2FA (if enabled)   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Appwrite Auth Service        │
│ Create session               │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Set HttpOnly Cookie          │
│ - Secure flag                │
│ - SameSite=Lax              │
│ - Max-Age=30d                │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Return User Data             │
│ Update Zustand Store         │
└──────────────────────────────┘
```

---

## Performance Optimization

### 1. Code Splitting
```typescript
// Dynamic imports
const BeneficiaryForm = dynamic(() =>
  import('@/components/forms/BeneficiaryForm')
);

// Route-based code splitting (Next.js automatic)
app/(dashboard)/beneficiaries/page.tsx
```

### 2. Image Optimization
```typescript
// Next.js Image component
<Image
  src="/photo.jpg"
  width={800}
  height={600}
  alt="Photo"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 3. Caching Strategy
```typescript
// React Query cache configuration
queryClient.setDefaultOptions({
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    cacheTime: 30 * 60 * 1000,     // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1
  }
});
```

### 4. Bundle Optimization
```typescript
// next.config.ts
export default {
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts'
    ]
  }
};
```

### 5. Database Query Optimization
```typescript
// Indexed queries
const beneficiaries = await databases.listDocuments(
  databaseId,
  beneficiariesCollectionId,
  [
    Query.equal('status', 'active'),
    Query.orderDesc('$createdAt'),
    Query.limit(20)
  ]
);
```

---

## Tasarım Kararları

### Neden Next.js App Router?
- ✅ Server Components → Daha az JavaScript
- ✅ Streaming & Suspense → Daha hızlı FCP
- ✅ Nested Layouts → Daha iyi UX
- ✅ Edge Runtime → Daha düşük latency

### Neden Appwrite?
- ✅ Open-source → Vendor lock-in yok
- ✅ Self-hostable → Data ownership
- ✅ Built-in auth → Daha az kod
- ✅ Real-time → Anlık güncellemeler

### Neden Zustand (Redux değil)?
- ✅ Minimal boilerplate → %90 daha az kod
- ✅ No providers → Daha temiz kod
- ✅ Better TypeScript → Tip güvenliği
- ✅ Smaller bundle → Daha hızlı yükleme

### Neden Radix UI?
- ✅ Accessibility → WCAG 2.1 AA uyumlu
- ✅ Headless → Full styling control
- ✅ Composable → Yeniden kullanılabilir
- ✅ Production-ready → Battle-tested

---

## Sonuç

Bu mimari, modern web development best practices'lerini takip ederek:

- ✅ **Performanslı**: Code splitting, caching, optimization
- ✅ **Güvenli**: Multi-layer security, validation, sanitization
- ✅ **Ölçeklenebilir**: Modular architecture, separation of concerns
- ✅ **Sürdürülebilir**: TypeScript, testing, documentation
- ✅ **Erişilebilir**: WCAG compliance, keyboard navigation

şeklinde tasarlanmıştır.
