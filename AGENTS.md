# AGENTS.md - Dernek Yönetim Sistemi

## Commands
- **Dev**: `npm run dev` | **Build**: `npm run build` | **TypeCheck**: `npm run typecheck`
- **Test all**: `npm run test:run` | **Single test**: `npm run test:run -- src/__tests__/path/to/file.test.ts`
- **Lint**: `npm run lint:check` | **Fix**: `npm run lint:fix --max-warnings 0`

## Architecture
**Stack**: Next.js 16 (App Router) + Appwrite BaaS + React 19 + Zustand + React Query + Vitest
- `src/app/` - Routes & 87 API endpoints | `src/components/` - UI (Radix) + forms + tables
- `src/lib/` - Appwrite SDK, API utils (Zod), auth, security | `src/stores/` - Zustand (auth, notifications)
- `src/hooks/` - useAppwriteQuery, useAppwriteMutation | `src/types/` - TypeScript definitions

## Code Style
- **TypeScript**: strict mode, path aliases (`@/*`, `@/components/*`, `@/lib/*`, etc.)
- **Imports**: external → internal libs → relative | **Naming**: camelCase vars, PascalCase components
- **No console.log** in production (only warn/error) | Prefix unused vars with `_`
- **Error handling**: Zod validation, Appwrite error handling in API routes
- **Testing**: Vitest + Testing Library, 70% coverage target, tests in `src/__tests__/`
- **Security**: CSRF validation, rate limiting (100 req/15min), HttpOnly cookies, input sanitization
