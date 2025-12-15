# AGENTS.md - Dernek Yönetim Sistemi

## Build & Test Commands

- **Dev**: `npm run dev` (or `npm run dev:turbo` for faster builds)
- **Build**: `npm run build` (or `npm run build:fast` to skip env validation)
- **Start**: `npm run start`
- **Test all**: `npm run test:run` (CI mode)
- **Test single file**: `npm run test:run -- src/__tests__/path/to/file.test.ts`
- **Test with UI**: `npm run test:ui`
- **Coverage**: `npm run test:coverage`
- **Lint check**: `npm run lint:check`
- **Lint fix**: `npm run lint:fix --max-warnings 0`
- **TypeCheck**: `npm run typecheck`

## Architecture & Codebase

**Type**: Next.js 16 (App Router) + Appwrite BaaS + React 19 + Zustand + React Query

**Core Structure**:
- `src/app/` - Next.js routes (dashboard, auth, 87 API endpoints)
- `src/components/` - React components (UI/Radix, forms, tables)
- `src/lib/` - Utilities & services
  - `appwrite/` - Appwrite SDK wrappers
  - `api/` - API utilities & validation (Zod schemas)
  - `auth/` - Authentication utilities
  - `config/` - Configuration (navigation, constants)
  - `contexts/` - React Context providers
  - `security/` - Security utilities
- `src/stores/` - Zustand state (authStore, notificationStore)
- `src/hooks/` - Custom hooks (useAppwriteQuery, useAppwriteMutation)
- `src/types/` - TypeScript definitions
- `src/styles/` - Global CSS (theme variables, animations)

**Database**: Appwrite (MongoDB) with 10+ collections (users, beneficiaries, donations, scholarships, meetings, etc.)

**State**: Zustand (client) + React Query (server cache) + SSE for real-time

## Code Style & Guidelines

**TypeScript**: `strict: true`, ES2017 target, JSX: `react-jsx`
- Path aliases: `@/*`, `@/components/*`, `@/lib/*`, `@/hooks/*`, `@/stores/*`, `@/types/*`, `@/data/*`

**Imports**: Use path aliases. Group: external → internal libs → relative.

**Code Quality**:
- No `console.log` in production (only `console.warn/error`; exceptions in tests, scripts, logger.ts, API routes)
- `prefer-const`, `no-var`, `object-shorthand`
- Unused vars/params: prefix with `_` to suppress errors

**Naming**: camelCase vars/functions, PascalCase components/types, UPPER_SNAKE_CASE constants

**Error Handling**: Use Appwrite error handling in api routes, validate all input with Zod schemas, throw typed errors

**Formatting**: Tailwind CSS 4, Radix UI primitives for components, Next.js Image for images

**Testing**: Vitest + Testing Library in `src/__tests__/` (70% coverage target: lines, functions, branches, statements)

**Security**: CSRF validation, rate limiting (100 req/15min), XSS prevention via input sanitization, session via HttpOnly cookies, security headers in place

