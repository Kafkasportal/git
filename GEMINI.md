# Project Context: Kafkasder Panel (Dernek Yönetim Sistemi)

## Overview

**Kafkasder Panel** is a modern, secure, and scalable management system for non-profit associations ("Dernek"). It digitizes operations such as beneficiary management, donation tracking, scholarship programs, meeting minutes, and financial reporting. The system is built with an **Offline-First PWA** architecture, ensuring functionality even without internet access.

## Tech Stack

### Frontend

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Library:** React 19
- **Styling:** Tailwind CSS 4, Radix UI, Lucide React, Framer Motion
- **State Management:** Zustand (Global/Auth), TanStack Query (Server State), React Context
- **Forms:** React Hook Form + Zod (Schema Validation)

### Backend

- **BaaS:** Appwrite 21.4 (Self-hosted or Cloud)
- **SDK:** Node Appwrite 20.3
- **API:** Next.js API Routes (Proxy Layer)

### Testing

- **Unit/Integration:** Vitest
- **E2E:** Playwright

## Key Commands

### Development

- **Start Dev Server:** `npm run dev` (Runs on `http://localhost:3000`)
- **Setup Appwrite:** `npm run appwrite:setup` (Initial database schema setup)
- **Quick Setup:** `npm run setup` (Runs quick setup script)

### Code Quality

- **Type Check:** `npm run typecheck`
- **Lint:** `npm run lint`
- **Format:** `npm run format`

### Testing

- **Run Unit Tests:** `npm run test`
- **Run E2E Tests:** `npm run test:e2e`
- **Backend Health:** `npm run test:backend`

### Production

- **Build:** `npm run build`
- **Start Production:** `npm run start`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes (main app logic)
│   ├── api/                # Backend API proxy routes (66+ endpoints)
│   └── login/              # Authentication pages
├── components/             # React components
│   ├── ui/                 # Base UI library (34+ atomic components)
│   ├── forms/              # Complex form components (e.g., BeneficiaryForm)
│   └── [feature]/          # Feature-specific components
├── lib/                    # Core utilities and logic
│   ├── appwrite/           # Appwrite client/server SDK wrappers
│   ├── validations/        # Zod schemas
│   └── utils.ts            # Helper functions
├── hooks/                  # Custom React hooks (e.g., useAppwriteMutation)
├── stores/                 # Zustand stores (authStore, etc.)
└── types/                  # TypeScript type definitions
scripts/                    # Setup and maintenance scripts (Appwrite setup, etc.)
docs/                       # Comprehensive documentation (PRD, API patterns, etc.)
```

## Development Conventions

- **Path Aliases:** Use `@/` for imports (e.g., `@/components/ui/button`, `@/lib/utils`).
- **Component Design:** Follow Atomic Design principles. Use `src/components/ui` for generic components and feature folders for specific logic.
- **Data Fetching:** Use `TanStack Query` for all server state. Do not fetch in `useEffect` directly if avoidable.
- **Forms:** Always use `React Hook Form` controlled by `Zod` schemas.
- **Styling:** Use Tailwind CSS utility classes. Use `cn()` utility for class merging.
- **Offline Sync:** Use custom mutation hooks (`useAppwriteMutation`, `useFormMutation`) to handle offline queuing automatically.
- **Security:** Ensure all API routes verify `CSRF` tokens and check `RBAC` permissions.

## Architecture Highlights

- **Offline-First:** Mutations are queued in IndexedDB when offline and synced automatically via a background Service Worker when online.
- **RBAC:** granular permission system (e.g., `view:donations`, `manage:users`) enforced at both UI and API levels.
- **API Proxy:** Next.js API routes act as a secure proxy to Appwrite, handling secret management and validation before reaching the DB.

## Important Files

- `docs/PRD-KAFKASDER-PANEL.md`: **Read this first.** Detailed Product Requirements Document.
- `src/lib/appwrite/config.ts`: Appwrite client configuration.
- `src/types/database.ts`: Database schema type definitions.
- `src/config/navigation.ts`: Sidebar navigation structure.
- `tailwind.config.js`: Theme configuration (colors, fonts, animations).
