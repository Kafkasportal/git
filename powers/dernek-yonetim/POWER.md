---
name: "dernek-yonetim"
displayName: "Dernek Yönetim Sistemi"
description: "KAFKASDER Dernek Yönetim Sistemi için kapsamlı geliştirici rehberi. Next.js 16, React 19, Appwrite, TypeScript projesi için API, component, type referansları ve best practices."
keywords: ["dernek", "kafkasder", "nextjs", "appwrite", "react", "typescript", "stk", "non-profit"]
author: "KAFKASDER"
---

# Dernek Yönetim Sistemi - Geliştirici Rehberi

## Genel Bakış

Bu power, KAFKASDER Dernek Yönetim Sistemi projesinde geliştirme yaparken ihtiyaç duyacağın tüm bilgileri içerir.

### Teknoloji Stack

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| Next.js | 16.x | App Router, SSR/SSG |
| React | 19.2 | UI Framework |
| TypeScript | 5.x | Type Safety (strict mode) |
| Tailwind CSS | 4.x | Styling |
| Radix UI | Latest | Accessible Components |
| Zustand | 5.x | State Management |
| React Query | 5.x | Server State |
| React Hook Form | 7.x | Form Handling |
| Zod | 4.x | Validation |
| Appwrite | 21.4 | BaaS (Database, Auth, Storage) |

## Proje Yapısı

```
src/
├── app/                    # Next.js App Router routes
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API routes (99 endpoint)
│   ├── auth/              # Authentication pages
│   └── login/             # Login page
├── components/            # React components (200+)
│   ├── ui/               # Radix UI components
│   ├── forms/            # Form components
│   ├── tables/           # Table components
│   └── ...               # Feature-specific components
├── lib/                   # Utilities & services
│   ├── appwrite/         # Appwrite SDK wrappers
│   ├── api/              # API utilities & validation
│   ├── auth/             # Authentication utilities
│   ├── security/         # Security utilities
│   └── validations/      # Zod schemas
├── hooks/                 # Custom React hooks (29+)
├── stores/                # Zustand stores
├── types/                 # TypeScript definitions (60+)
└── __tests__/            # Test files
```

## Komutlar

```bash
# Development
npm run dev              # Development server
npm run dev:turbo        # Turbopack ile (daha hızlı)

# Build
npm run build            # Production build
npm run start            # Production server

# Test
npm run test             # Watch mode
npm run test:run         # CI mode
npm run test:coverage    # Coverage raporu

# Code Quality
npm run lint:check       # Lint kontrolü
npm run lint:fix         # Lint düzelt
npm run typecheck        # TypeScript check
```

## API Endpoint Yapısı

### Response Format

**Başarılı (2xx):**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Hata (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Ana Endpoint'ler

| Modül | Endpoint | Açıklama |
|-------|----------|----------|
| Auth | `/api/auth/login` | Kullanıcı girişi |
| Auth | `/api/auth/logout` | Çıkış |
| Auth | `/api/auth/session` | Session bilgisi |
| Users | `/api/users` | Kullanıcı CRUD |
| Beneficiaries | `/api/beneficiaries` | Yardım alıcılar |
| Donations | `/api/donations` | Bağışlar |
| Kumbara | `/api/kumbara` | Kumbara yönetimi |
| Scholarships | `/api/scholarships` | Burslar |
| Finance | `/api/finance/transactions` | Finansal işlemler |
| Meetings | `/api/meetings` | Toplantılar |
| Tasks | `/api/tasks` | Görevler |
| Messages | `/api/messages` | Mesajlar |
| Settings | `/api/settings` | Ayarlar |
| Errors | `/api/errors` | Hata kayıtları |
| Audit | `/api/audit-logs` | Denetim logları |

## Component Kullanımı

### UI Components (Radix + Tailwind)

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
```

### Form Components

```tsx
import { FormField } from '@/components/forms/form-field'
import { SelectField } from '@/components/forms/select-field'
import { DatePicker } from '@/components/forms/date-picker'
import { FileUpload } from '@/components/forms/file-upload'
```

### Feature Components

```tsx
// Users
import { UserList, UserCard, UserTable } from '@/components/users'

// Beneficiaries
import { BeneficiaryList, BeneficiaryCard } from '@/components/beneficiary'

// Donations
import { KumbaraList, KumbaraAnalytics } from '@/components/kumbara'

// Dashboard
import { Widgets, StatCard } from '@/components/dashboard'
```

## State Management

### Zustand Store Kullanımı

```tsx
import { useAuthStore } from '@/stores/authStore'

// Component içinde
const { user, isAuthenticated, login, logout } = useAuthStore()

// Store state'e erişim
const user = useAuthStore((state) => state.user)
```

### React Query Kullanımı

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

// Veri çekme
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

// Veri güncelleme
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

## Form Handling

### React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli email girin'),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})
```

## Güvenlik

### Uygulanan Önlemler

- ✅ CSRF Protection (Token tabanlı)
- ✅ Rate Limiting (100 req/15 min)
- ✅ XSS Prevention (DOMPurify)
- ✅ Session Security (HttpOnly cookies)
- ✅ Input Validation (Zod schemas)
- ✅ Password Hashing (bcryptjs)

### API Route Güvenliği

```tsx
import { validateCSRFToken } from '@/lib/security'
import { rateLimit } from '@/lib/api'

export const POST = async (req: NextRequest) => {
  // CSRF kontrolü
  await validateCSRFToken(req)
  
  // Rate limiting
  await rateLimit(req)
  
  // Input validation
  const body = await req.json()
  const data = schema.parse(body)
  
  // İşlem...
}
```

## Kod Standartları

### Naming Conventions

- **Dosyalar**: kebab-case (`user-form.tsx`)
- **Components**: PascalCase (`UserForm`)
- **Functions**: camelCase (`getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserProps`)

### Import Sırası

```tsx
// 1. External packages
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal utilities
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

// 3. Components
import { Button } from '@/components/ui/button'

// 4. Types
import type { User } from '@/types'

// 5. Relative imports
import { localHelper } from './helper'
```

## Test Yazımı

### Test Yapısı

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Coverage Hedefi

- **Minimum**: 70% branch coverage
- **Mevcut**: 70.07%

## Kurumsal Renk Paleti

### Primary Blue
- `corporate-primary-600`: #0052CC (Ana buton, linkler)
- `corporate-primary-700`: #003A99 (Hover)
- `corporate-primary-50`: #F0F5FF (Arka plan)

### Semantic Colors
- Success: #28A745
- Warning: #FFC107
- Error: #DC3545
- Info: #17A2B8

### Gray Scale
- `corporate-gray-900`: #1A202C (Ana metin)
- `corporate-gray-600`: #718096 (İkincil metin)
- `corporate-gray-200`: #E8EBF0 (Border)
- `corporate-gray-50`: #FAFBFC (Arka plan)

## Sık Kullanılan Tipler

```typescript
// User
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'staff' | 'user'
  permissions: Permission[]
}

// Beneficiary
interface Beneficiary {
  id: string
  name: string
  status: 'active' | 'inactive' | 'pending'
  category: 'orphan' | 'elder' | 'disability' | 'poor'
}

// Donation
interface Donation {
  id: string
  amount: number
  type: 'cash' | 'kumbara' | 'in-kind'
  status: 'pending' | 'completed' | 'failed'
}

// API Response
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { message: string; code: string }
}
```

## Troubleshooting

### Cache Sorunları
```bash
rm -rf .next
npm run dev
```

### Tam Temizlik
```bash
npm run clean:all
npm install
npm run dev
```

### TypeScript Hataları
```bash
npm run typecheck
```

## Dokümantasyon Konumları

- `docs/guides/development.md` - Geliştirici rehberi
- `docs/guides/testing.md` - Test rehberi
- `docs/guides/deployment.md` - Deployment rehberi
- `docs/reference/api-endpoints.md` - API referansı
- `docs/reference/components.md` - Component referansı
- `docs/reference/types.md` - TypeScript tipleri
- `docs/design/design-system.md` - Tasarım sistemi
