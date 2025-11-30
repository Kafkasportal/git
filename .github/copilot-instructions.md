# Copilot Instructions for Dernek Yönetim Sistemi

## Project Overview
This is a **Next.js 16 + Appwrite** non-profit association management system. The codebase is primarily in **Turkish** (UI text, error messages, comments).

## Architecture Summary

### Stack
- **Frontend**: React 19, Next.js 16 App Router, Tailwind CSS, Radix UI primitives
- **State**: Zustand (client state), TanStack React Query (server state)
- **Backend**: Appwrite (auth, database, storage, realtime)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library

### Key Directories
```
src/
├── app/api/          # 87+ API route handlers (Next.js route handlers)
├── lib/api/          # CRUD factory, middleware, route-helpers
├── lib/appwrite/     # Appwrite SDK wrappers (client.ts, server.ts)
├── lib/validations/  # Zod schemas per entity (beneficiary.ts, user.ts, etc.)
├── stores/           # Zustand stores (authStore.ts, notificationStore.ts)
├── hooks/            # Custom hooks (useAppwriteQuery, useAppwriteMutation)
├── components/ui/    # Radix-based UI primitives
├── components/forms/ # Domain-specific form components
```

## Critical Patterns

### API Route Pattern
Always use `buildApiRoute` middleware factory for consistent auth, rate limiting, and error handling:

```typescript
// src/app/api/[entity]/route.ts
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';

export const GET = buildApiRoute({
  requireModule: 'workflow',      // Module-based access control
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest) => {
  // Handler logic
  return successResponse(data);
});

export const POST = buildApiRoute({
  requireModule: 'workflow',
  supportOfflineSync: true,       // Enable offline queue support
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();
  const { data, error } = await parseBody(request);
  // ...
});
```

### Data Fetching Pattern
Use hooks from `src/hooks/` that wrap React Query:
- `useAppwriteQuery` - Read operations with caching
- `useAppwriteMutation` - Write operations with offline queue support, auto cache invalidation

```typescript
// Component data fetching
const { data, isLoading } = useAppwriteQuery({
  queryKey: ['beneficiaries', filters],
  queryFn: () => api.beneficiaries.getBeneficiaries(filters),
});
```

### CRUD Factory
For client-side API calls, use `src/lib/api/crud-factory.ts` or the wrapper `src/lib/api/api-client.ts`:
```typescript
import { apiClient as api } from '@/lib/api/api-client';
await api.beneficiaries.createBeneficiary(data);
```

### Form Validation
All Zod schemas are in `src/lib/validations/`. Key patterns:
- TC Kimlik No validation with algorithm check (`tcKimlikNoSchema`)
- Phone validation via `phoneSchema` from `shared-validators.ts`
- Import shared validators: `import { phoneSchema } from '@/lib/validations/shared-validators'`

### State Management
- **Auth state**: `useAuthStore` from `src/stores/authStore.ts`
- **Server state**: React Query via `useAppwriteQuery`/`useAppwriteMutation`

## Commands

```bash
npm run dev          # Development server
npm run dev:turbo    # Turbopack dev server (faster)
npm run build        # Production build
npm run typecheck    # TypeScript checking (run before commits)
npm run lint:fix     # Fix linting issues
npm run test         # Run Vitest tests
npm run test:run     # Run tests once (CI)
npm run test:coverage # Coverage report (70% threshold)
```

## Coding Conventions

1. **No `console.log`** - Use `logger` from `@/lib/logger` instead (enforced by ESLint)
2. **Turkish error messages** - All user-facing text in Turkish
3. **Unused vars** - Prefix with `_` (e.g., `_unused`)
4. **Path aliases** - Use `@/` for imports from `src/`
5. **UI Components** - Build on Radix primitives in `components/ui/`

## Testing

- Test setup: `src/__tests__/setup.ts` (mocks matchMedia, ResizeObserver, IntersectionObserver)
- Mock `buildApiRoute` in API tests: `vi.fn((_options) => (handler) => handler)`
- Coverage thresholds: 70% for lines, functions, branches, statements

## Security

- CSRF protection via `verifyCsrfToken()` for all mutations
- Rate limiting via `buildApiRoute` middleware
- Input sanitization: `src/lib/sanitization.ts`
- XSS prevention with DOMPurify (`isomorphic-dompurify`)
