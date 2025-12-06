# AGENTS.md - Development Guidelines for Dernek Yönetim Sistemi

## Essential Commands
npm run dev:turbo    # Fast development server with Turbopack
npm run build        # Production build
npm run typecheck    # TypeScript checking (run before commits)
npm run lint:fix     # Auto-fix ESLint issues
npm run test:run     # Run all tests once (CI)
npm run test path/to/file.test.ts  # Run single test
npm run test:coverage # Coverage report (70% threshold)

## Code Style Guidelines
- Imports: External libs first, then @/ aliases (e.g., '@/lib/logger')
- Formatting: 2 spaces, LF line endings, trim trailing whitespace
- TypeScript: Strict mode enabled, unused vars prefixed with '_'
- No console.log - use logger from '@/lib/logger' instead
- Turkish language for all UI text and error messages

## Key Development Patterns
- API routes: Use buildApiRoute() middleware factory with auth/rate limiting
- Data fetching: useAppwriteQuery() for reads, useAppwriteMutation() for writes
- Forms: React Hook Form + Zod validation from '@/lib/validations/'
- State: Zustand for client state, React Query for server state
- Components: Build on Radix UI primitives in components/ui/

## Testing Requirements
- Framework: Vitest with jsdom environment
- Coverage: 70% threshold for lines/functions/branches/statements
- Test files: *.test.ts, *.test.tsx in src/__tests__/ or alongside source
- Mocks: Setup in src/__tests__/setup.ts (matchMedia, ResizeObserver)
- API tests: Mock buildApiRoute with vi.fn((_options) => (handler) => handler)