# Architecture Documentation

Dernek Yönetim Sistemi mimari dokümantasyonu.

## 🏗️ Genel Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React 19   │  │  Next.js 16  │  │  Tailwind    │ │
│  │  Components  │  │   App Router │  │     CSS     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Zustand    │  │ React Query  │  │ React Hook   │ │
│  │   State      │  │   Cache      │  │    Form      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/SSE
┌─────────────────────────────────────────────────────────┐
│                  Next.js API Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Route      │  │  Middleware  │  │  Auth Utils  │ │
│  │  Handlers    │  │   (CSRF, RL)  │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Validation   │  │   Error      │  │   Logger     │ │
│  │   (Zod)      │  │   Handler    │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕ SDK
┌─────────────────────────────────────────────────────────┐
│                  Appwrite Backend                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Database    │  │   Storage    │  │   Auth       │ │
│  │  (MongoDB)   │  │   (S3-like)  │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Realtime    │  │   Functions  │  │   Webhooks   │ │
│  │  (SSE/WS)    │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API routes (87 endpoints)
│   ├── auth/              # Auth pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/            # React components
│   ├── ui/               # UI primitives (Radix UI)
│   ├── forms/            # Form components
│   ├── tables/           # Table components
│   └── ...
│
├── hooks/                 # Custom React hooks
│   ├── useAppwriteQuery.ts
│   ├── useAppwriteMutation.ts
│   └── ...
│
├── lib/                   # Utility libraries
│   ├── appwrite/         # Appwrite SDK wrappers
│   ├── api/              # API utilities
│   ├── auth/             # Authentication
│   ├── validations/      # Zod schemas
│   └── ...
│
├── stores/                # Zustand stores
│   ├── authStore.ts
│   └── notificationStore.ts
│
├── types/                 # TypeScript types
│   ├── database.ts
│   ├── beneficiary.ts
│   └── ...
│
└── __tests__/            # Test files
    ├── api/
    ├── components/
    └── lib/
```

## 🔄 Data Flow

### 1. Read Operation (Query)

```
Component
  ↓
useAppwriteQuery hook
  ↓
React Query cache check
  ↓ (cache miss)
API Route Handler
  ↓
Appwrite SDK (client/server)
  ↓
Appwrite Database
  ↓
Response → Cache → Component
```

### 2. Write Operation (Mutation)

```
Component
  ↓
useAppwriteMutation hook
  ↓
API Route Handler
  ↓
CSRF Validation
  ↓
Rate Limiting Check
  ↓
Input Validation (Zod)
  ↓
Appwrite SDK
  ↓
Database Update
  ↓
Cache Invalidation
  ↓
Component Update
```

## 🔐 Authentication Flow

```
1. User Login
   ↓
2. POST /api/auth/login
   ↓
3. Appwrite Auth SDK
   ↓
4. Session Cookie Set
   ↓
5. CSRF Token Generated
   ↓
6. User Redirected to Dashboard
```

### Session Management

- **Client-side**: Zustand store (`authStore`)
- **Server-side**: Appwrite session cookies
- **CSRF Protection**: Token-based validation
- **Session Refresh**: Automatic token refresh

## 📊 State Management

### Client State (Zustand)

- **authStore**: Authentication state
- **notificationStore**: Notification state

### Server State (React Query)

- **Queries**: Data fetching & caching
- **Mutations**: Data modifications
- **Cache**: Automatic cache management
- **Refetch**: Background updates

## 🗄️ Database Schema

### Collections

1. **users**: Kullanıcı bilgileri
2. **beneficiaries**: İhtiyaç sahipleri
3. **donations**: Bağışlar
4. **scholarships**: Burslar
5. **finance_records**: Finans kayıtları
6. **meetings**: Toplantılar
7. **messages**: Mesajlar
8. **todos**: Yapılacaklar
9. **errors**: Hata kayıtları
10. **audit_logs**: Denetim kayıtları

### Indexes

- Primary: `$id` (auto-generated)
- Secondary: `_id` (custom ID)
- Search: Full-text search indexes
- Relations: Foreign key relationships

## 🔒 Security Architecture

### Layers

1. **Network Layer**
   - HTTPS enforcement
   - Security headers
   - CORS configuration

2. **Application Layer**
   - CSRF protection
   - Rate limiting
   - Input sanitization
   - XSS prevention

3. **Data Layer**
   - SQL injection prevention
   - Data validation (Zod)
   - Access control (Appwrite)

### Security Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

## 🚀 Performance Optimizations

### Client-side

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo, useMemo

### Server-side

- **Caching**: React Query cache
- **ISR**: Incremental Static Regeneration
- **SSR**: Server-side rendering
- **API Caching**: HTTP cache headers

### Build Optimizations

- **Bundle Analysis**: Webpack bundle analyzer
- **Package Optimization**: optimizePackageImports
- **CSS Optimization**: Critical CSS extraction
- **Minification**: SWC minification

## 📡 Real-time Architecture

### Server-Sent Events (SSE)

```
Client
  ↓
GET /api/notifications/stream
  ↓
EventSource API
  ↓
Appwrite Realtime SDK
  ↓
Database Changes
  ↓
Event Stream
  ↓
Client Update
```

### Event Types

- `connected`: Connection established
- `notification`: New notification
- `heartbeat`: Keep-alive ping
- `error`: Error event

## 🔄 Caching Strategy

### Client Cache (React Query)

- **Stale Time**: 2 minutes (default)
- **Cache Time**: 5 minutes
- **Refetch**: On window focus, reconnect

### HTTP Cache

- **Static Assets**: 1 year
- **API Responses**: No cache (dynamic)
- **Images**: 1 year (immutable)

### Appwrite Cache

- **Query Cache**: In-memory
- **Document Cache**: Per-request
- **Collection Cache**: TTL-based

## 🧪 Testing Architecture

### Test Types

1. **Unit Tests**: Individual functions/components
2. **Integration Tests**: API routes
3. **E2E Tests**: Full user flows (future)

### Test Tools

- **Vitest**: Test runner
- **Testing Library**: Component testing
- **MSW**: API mocking

### Coverage Goals

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## 📦 Build & Deployment

### Build Process

1. **Type Checking**: TypeScript compilation
2. **Linting**: ESLint validation
3. **Testing**: Test suite execution
4. **Building**: Next.js production build
5. **Optimization**: Bundle optimization

### Deployment Targets

- **Vercel**: Recommended (Next.js optimized)
- **Appwrite Sites**: Native Appwrite hosting
- **Docker**: Self-hosted option

## 🔍 Monitoring & Observability

### Metrics

- **Performance**: Web Vitals
- **Errors**: Error tracking (Appwrite)
- **Analytics**: Custom analytics events
- **Rate Limiting**: Request monitoring

### Logging

- **Client**: Browser console (dev only)
- **Server**: Structured logging (logger.ts)
- **Errors**: Error tracker service

## 🎯 Design Patterns

### Used Patterns

1. **Repository Pattern**: Appwrite API wrappers
2. **Factory Pattern**: CRUD operations factory
3. **Middleware Pattern**: API route middleware
4. **Observer Pattern**: Real-time subscriptions
5. **Strategy Pattern**: Validation strategies

## 📚 Technology Stack

- **Frontend**: React 19, Next.js 16
- **Styling**: Tailwind CSS 4
- **State**: Zustand, React Query
- **Forms**: React Hook Form, Zod
- **Backend**: Appwrite (BaaS)
- **Database**: MongoDB (via Appwrite)
- **Storage**: Appwrite Storage
- **Auth**: Appwrite Auth
- **Testing**: Vitest, Testing Library

---

Daha fazla bilgi için diğer dokümantasyon dosyalarına bakın.

