# CLAUDE.md - Project Guide for Claude Code

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Dernek Yönetim Sistemi** - A modern non-profit association management system built with Next.js 16, React 19, Appwrite, and TypeScript.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript
- **Backend**: Appwrite BaaS (MongoDB, Auth, Storage, Realtime)
- **State Management**: Zustand + React Query
- **UI**: Radix UI + Tailwind CSS 4
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Testing Library

## Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:turbo        # Dev with Turbopack (faster)

# Quality checks
npm run lint:check       # Lint check
npm run lint:fix         # Fix lint errors
npm run typecheck        # TypeScript check

# Testing
npm run test             # Watch mode
npm run test:run         # CI mode (single run)
npm run test:coverage    # Generate coverage report

# Build
npm run build            # Production build
npm run build:fast       # Skip env validation
```

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   └── login/             # Login page
├── components/            # React components
│   ├── ui/                # Base UI components (Radix)
│   ├── forms/             # Form components
│   └── [feature]/         # Feature-specific components
├── lib/                   # Utilities & services
│   ├── appwrite/          # Appwrite SDK wrappers
│   ├── api/               # API utilities
│   ├── auth/              # Auth utilities
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript definitions
└── __tests__/             # Test files
```

## Development Patterns

### Naming Conventions
- **Files**: kebab-case (`user-form.tsx`)
- **Components**: PascalCase (`UserForm`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserProps`)

### Import Order
```typescript
// 1. External packages
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal utilities & services
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

// 3. Components
import { Button } from '@/components/ui/button'

// 4. Types
import type { User } from '@/types'

// 5. Relative imports
import { localHelper } from './helper'
```

### Component Pattern
```typescript
interface ComponentProps {
  id: string
  onAction: () => void
}

export const Component: React.FC<ComponentProps> = ({ id, onAction }) => {
  // implementation
}
```

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ /* ... */ })

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    // ... logic
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Hook Pattern (React Query)
```typescript
export const useResource = () => {
  return useQuery({
    queryKey: ['resource'],
    queryFn: async () => {
      const res = await fetch('/api/resource')
      return res.json()
    },
  })
}
```

## Testing Guidelines

**Coverage Target: 70% minimum**

### Test Location
- Unit tests: `src/__tests__/` (mirroring source structure)
- Component tests: `src/__tests__/components/`
- API tests: `src/__tests__/api/`
- Hook tests: `src/__tests__/hooks/`

### Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do expected behavior', () => {
    // Arrange
    const input = { /* test data */ }

    // Act
    const result = myFunction(input)

    // Assert
    expect(result).toBe(expectedValue)
  })
})
```

### Before Committing
```bash
npm run test:run && npm run typecheck && npm run lint:check
```

## Key Files Reference

- **API utilities**: `src/lib/api/`
- **Auth logic**: `src/lib/auth/`
- **Validation schemas**: `src/lib/validations/`
- **Appwrite config**: `src/lib/appwrite/`
- **Global types**: `src/types/`
- **Middleware**: `src/middleware.ts`
- **Providers**: `src/app/providers.tsx`

## Common Tasks

### Adding a New Feature
1. Create API route in `src/app/api/[feature]/route.ts`
2. Add Zod validation schema in `src/lib/validations/`
3. Create custom hook in `src/hooks/`
4. Build component in `src/components/[feature]/`
5. Write tests in `src/__tests__/`

### Adding a New API Endpoint
1. Create route file in appropriate `src/app/api/` subdirectory
2. Use Zod for input validation
3. Use `handleApiError()` for error handling
4. Add tests in `src/__tests__/api/`

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
APPWRITE_API_KEY=
CSRF_SECRET=
SESSION_SECRET=
```

See `.env.example` for full list.

## Troubleshooting

### Cache Issues
```bash
rm -rf .next
npm run dev
```

### Full Reset
```bash
npm run clean:all
npm install
npm run dev
```

## Documentation

- [Development Guide](./docs/guides/development.md)
- [Testing Guide](./docs/guides/testing.md)
- [Deployment Guide](./docs/guides/deployment.md)
- [API Reference](./docs/reference/api-endpoints.md)
- [Component Reference](./docs/reference/components.md)
