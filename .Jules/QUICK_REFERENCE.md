# Quick Reference - Dernek Management System

## Project Status ✅ PRODUCTION READY

**Coverage:** 70.07% ✅ | **Build:** ✅ | **Lint:** ✅ | **TypeScript:** ✅

---

## Essential Commands

```bash
# Development
npm run dev              # Start dev server on :3000
npm run dev:turbo       # Faster dev with Turbo

# Building
npm run build           # Full build with validation
npm run build:fast      # Quick build (skip env check)

# Running
npm start              # Start production server

# Testing
npm run test           # Run tests (watch mode)
npm run test:run       # Run tests once (CI mode)
npm run test:ui        # Run with UI dashboard
npm run test:coverage  # Run with coverage report

# Quality
npm run lint:check     # Check for lint issues
npm run lint:fix       # Auto-fix lint issues
npm run typecheck      # Check TypeScript types
```

---

## Project Structure

```
src/
├── app/                    # Next.js routes
│   ├── api/               # API endpoints (87 routes)
│   ├── dashboard/         # Admin dashboard
│   ├── login/             # Authentication
│   └── [...routes]        # Feature routes
├── components/            # React components
│   ├── forms/            # Form components
│   ├── tables/           # Table components
│   ├── ui/               # Radix UI primitives
│   └── [...other]/       # Feature components
├── lib/                   # Core utilities
│   ├── appwrite/         # Database (Appwrite SDK)
│   ├── api/              # API utilities
│   ├── auth/             # Authentication
│   ├── beneficiary/      # Workflow engine
│   ├── config/           # Configuration
│   ├── security/         # Security utilities
│   └── [...utilities]/   # Other utilities
├── stores/               # Zustand state
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
└── __tests__/            # Test files
```

---

## Key Files

### Authentication
- `src/stores/authStore.ts` - Zustand auth state
- `src/lib/auth/session.ts` - Session utilities
- `src/app/api/auth/` - Auth endpoints

### State Management
- `src/stores/authStore.ts` - User authentication
- `src/stores/notificationStore.ts` - Notifications
- React Query for server state

### API Routes
- `/api/users` - User CRUD
- `/api/beneficiaries` - Aid recipient management
- `/api/donations` - Donation tracking
- `/api/aid-applications` - Aid application workflow
- [See API_ENDPOINTS.md for complete list]

### Workflow Engine
- `src/lib/beneficiary/workflow-engine.ts` - State machine
- Stages: draft → submitted → review → approved → distribution → complete
- Role-based transitions

---

## Environment Setup

### Required Environment Variables
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.example.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
SESSION_SECRET=min-16-character-secret
```

### Optional
```bash
NODE_ENV=development|production
ANALYZE=true  # Enable bundle analysis
SKIP_ENV_VALIDATION=true  # Skip env check in build
```

---

## Database Schema

**Collections (Appwrite MongoDB):**
- `users` - User accounts & profiles
- `beneficiaries` - Aid recipients
- `donations` - Donation records
- `scholarships` - Scholarship programs
- `finance` - Financial records
- `messages` - User communications
- `meetings` - Meeting management
- `partners` - Organization partners
- `tasks` - Task management
- `logs` - Activity audit log

---

## Testing Patterns

### Unit Testing
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('Feature', () => {
  it('should do something', () => {
    expect(value).toBe(expected)
  })
})
```

### Mocking APIs
```typescript
import { vi } from 'vitest'

global.fetch = vi.fn()
  .mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: 'value' })
  })
```

### Testing Async Code
```typescript
import { act } from '@testing-library/react'

await act(async () => {
  await someAsyncFunction()
})
```

### Mocking Zustand
```typescript
useAuthStore.setState({ user: mockUser, isAuthenticated: true })
const state = useAuthStore.getState()
```

---

## Common Tasks

### Add a New API Endpoint
1. Create route file: `src/app/api/[resource]/route.ts`
2. Implement handler with Zod validation
3. Use route helpers: `successResponse()`, `errorResponse()`
4. Add test in `src/__tests__/api/`

Example:
```typescript
import { successResponse, errorResponse } from '@/lib/api/route-helpers'

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return successResponse(data)
  } catch (error) {
    return errorResponse('Operation failed', 500)
  }
}
```

### Add a React Component
1. Create: `src/components/[category]/ComponentName.tsx`
2. Use Radix UI primitives from `src/components/ui/`
3. Style with Tailwind CSS classes
4. Add tests in `src/__tests__/components/`

### Add Authentication-Dependent Feature
1. Use `useAuthStore()` hook
2. Check permissions: `store.hasPermission('feature:read')`
3. Implement UI conditionally
4. Test with mock auth state

Example:
```typescript
export function Feature() {
  const { hasPermission } = useAuthStore()
  
  if (!hasPermission('feature:read')) {
    return <AccessDenied />
  }
  
  return <FeatureContent />
}
```

### Add a Form
1. Use `react-hook-form` + Zod validation
2. Create validation schema in `src/lib/validations/`
3. Build form with Radix UI form components
4. Handle submission with mutation hook

### Query Data from Appwrite
```typescript
import { useAppwriteQuery } from '@/hooks/useAppwriteQuery'

export function Component() {
  const { data, isLoading, error } = useAppwriteQuery(
    ['beneficiaries'],
    () => databases.listDocuments('db', 'beneficiaries')
  )
  
  if (isLoading) return <Loading />
  if (error) return <Error />
  
  return <Data data={data} />
}
```

---

## Code Style Guide

### TypeScript
- ✅ Use strict mode (enabled by default)
- ✅ Avoid `any` type
- ✅ Use path aliases: `@/lib/...`, `@/components/...`
- ✅ Name types with `PascalCase`
- ✅ Name variables with `camelCase`

### ESLint Rules
- ✅ Use `const` over `let` or `var`
- ✅ Use object shorthand: `{ name }` not `{ name: name }`
- ✅ No console.log (use logger instead)
- ✅ No unused variables (prefix with `_`)
- ✅ Prefer arrow functions

### Imports
```typescript
// External first
import { useState } from 'react'
import { NextRequest } from 'next/server'

// Internal libs
import { useAppwriteQuery } from '@/hooks/useAppwriteQuery'
import { formatDate } from '@/lib/utils/format'

// Relative imports (last)
import { Component } from './Component'
```

### Naming Conventions
```typescript
// Components: PascalCase
export function UserProfile() {}

// Variables: camelCase
const userName = 'John'

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3

// Types: PascalCase
interface User { id: string }
type Status = 'active' | 'inactive'

// Event handlers: handleEventName
const handleClick = () => {}
```

---

## Security Checklist

- ✅ All inputs validated with Zod
- ✅ CSRF tokens on POST/PUT/DELETE
- ✅ Session cookies HttpOnly
- ✅ Rate limiting enabled (100 req/15min)
- ✅ Authentication required on protected routes
- ✅ Permissions checked server-side
- ✅ No sensitive data in localStorage
- ✅ CORS properly configured
- ✅ Security headers set

---

## Performance Tips

- Use `useAppwriteQuery()` for data fetching (cached)
- Memoize expensive computations: `useMemo()`, `useCallback()`
- Use Next.js Image component for images
- Dynamic imports for large components
- Server-side rendering for SEO pages
- ISR for static content with updates

---

## Debugging

### View Logs
```typescript
import logger from '@/lib/logger'

logger.info('Message', { context: 'data' })
logger.warn('Warning', { issue: 'description' })
logger.error('Error', { error: err })
```

### Check Auth State
```typescript
const state = useAuthStore.getState()
console.error(state)  // Check user, permissions, etc.
```

### Test Coverage
```bash
npm run test:coverage
# See report in coverage/ directory
# Open coverage/index.html in browser
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Run `npm run clean:all` then `npm run build` |
| Tests fail | Check mocks are set up in beforeEach |
| Types fail | Run `npm run typecheck` for details |
| Lint fails | Run `npm run lint:fix` to auto-fix |
| Appwrite errors | Check APPWRITE_API_KEY and database IDs |
| Session expired | Clear localStorage and re-login |
| Build slow | Use `npm run dev:turbo` for development |

---

## Resources

- **Documentation:** See `.Jules/` folder for detailed guides
- **API Docs:** See `API_ENDPOINTS.md`
- **Component Docs:** See `COMPONENTS.md`
- **Types Reference:** See `TYPES_REFERENCE.md`
- **Development Guide:** See `DEVELOPMENT_GUIDE.md`

---

## Coverage Status

**Branch Coverage: 70.07%** ✅ (Threshold: 70%)

Recent improvements (Dec 15, 2024):
- Added 55+ tests for route helpers and auth error handling
- route-helpers.ts: 4.87% → 97.56%
- authStore.ts: 74.16% → 78.33%

See `COVERAGE_IMPROVEMENT.md` for details.

---

## Quick Links

- Production Build: `npm run build && npm run start`
- Local Dev: `npm run dev` → http://localhost:3000
- Test Dashboard: `npm run test:ui`
- Coverage Report: `npm run test:coverage` → `coverage/index.html`
- Type Check: `npm run typecheck`

---

**Last Updated:** December 15, 2024  
**Status:** ✅ Production Ready
