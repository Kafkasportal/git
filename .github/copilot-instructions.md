# Copilot Instructions - Kafkasder Panel

## Project Overview

Non-profit association management system built with **Next.js 16**, **React 19**, **TypeScript**, and **Appwrite** backend. Manages beneficiaries, donations, scholarships, meetings, and multi-channel communication (WhatsApp/SMS/Email).

## Architecture

### Backend: Appwrite

All data operations go through Appwrite. Key files:

- `src/lib/appwrite/client.ts` - Browser SDK
- `src/lib/appwrite/server.ts` - Server SDK (API routes)
- `src/lib/appwrite/config.ts` - Collection/bucket IDs

```typescript
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';

const docs = await databases.listDocuments(
  appwriteConfig.databaseId,
  appwriteConfig.collections.beneficiaries,
  [Query.equal('status', 'active')]
);
```

### API Routes Pattern

Use `buildApiRoute()` middleware for all routes (`src/lib/api/middleware.ts`):

```typescript
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';

export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request) => {
  const data = await api.beneficiaries.list();
  return successResponse(data);
});
```

### Frontend Structure

```
src/app/(dashboard)/   # Dashboard pages (Turkish route names: bagis, yardim, burs, fon, kullanici, is, mesaj, ayarlar)
src/components/        # UI components (Radix UI + Tailwind)
src/hooks/             # Custom hooks (useStandardForm, useFormMutation, useApiCache)
src/lib/validations/   # Zod schemas for all entities
```

## Critical Rules

### 1. No console.log - Use Logger

```typescript
import { logger } from '@/lib/logger';
logger.info('User action', { userId });
logger.error('Operation failed', error);
```

### 2. Zod Validation Required

All inputs must be validated with schemas from `src/lib/validations/`:

```typescript
import { beneficiarySchema } from '@/lib/validations/beneficiary';
const result = beneficiarySchema.safeParse(data);
```

### 3. Phone Format: `5XXXXXXXXX`

Use `phoneSchema` from `src/lib/validations/shared-validators.ts`. Sanitize with `sanitizePhone()` before validation.

### 4. CSRF Protection

Mutating operations require CSRF tokens:

```typescript
import { fetchWithCsrf } from '@/lib/csrf';
await fetchWithCsrf('/api/resource', { method: 'POST', body: JSON.stringify(data) });
```

## Form Pattern

Use `useStandardForm` hook for all forms:

```typescript
import { useStandardForm } from '@/hooks/useStandardForm';
import { beneficiarySchema } from '@/lib/validations/beneficiary';

const form = useStandardForm({
  schema: beneficiarySchema,
  mutationFn: (data) => api.create(data),
  queryKey: 'beneficiaries',
  collection: 'beneficiaries', // Required for offline sync
  onSuccess: () => router.push('/list'),
});
```

## Adding New Resources

1. **Config**: Add collection ID to `src/lib/appwrite/config.ts`
2. **Validation**: Create schema in `src/lib/validations/[resource].ts`
3. **API Route**: Create `src/app/api/[resource]/route.ts` using `buildApiRoute()`
4. **API Client**: Add to `src/lib/api/crud-factory.ts`

## Commands

```bash
npm run dev              # Development server
npm run typecheck        # TypeScript check (run before commits)
npm run lint:fix         # ESLint with auto-fix
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:backend     # Verify Appwrite connection
npm run appwrite:setup   # Initialize Appwrite collections
```

## Key Files Reference

| Purpose         | File                           |
| --------------- | ------------------------------ |
| Appwrite config | `src/lib/appwrite/config.ts`   |
| API middleware  | `src/lib/api/middleware.ts`    |
| CRUD factory    | `src/lib/api/crud-factory.ts`  |
| Form hook       | `src/hooks/useStandardForm.ts` |
| Offline sync    | `src/lib/offline-sync.ts`      |
| Auth store      | `src/stores/authStore.ts`      |
| Logger          | `src/lib/logger.ts`            |

## Testing

- Unit tests: `src/__tests__/` (Vitest + React Testing Library)
- E2E tests: `e2e/` (Playwright)
- Use `npm run test:e2e:example` for standalone Playwright validation
