# Development Guide

Complete guide for developing features in the Dernek Yönetim Sistemi.

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 9.0.0
- Appwrite instance (Cloud or self-hosted)
- Git

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd dernek-nextjs

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Appwrite credentials

# Start development server
npm run dev
```

### Development Environment

- **Dev Server**: `npm run dev` (port 3000)
- **TypeScript Checking**: `npm run typecheck`
- **Linting**: `npm run lint:check` / `npm run lint:fix`
- **Testing**: `npm run test` (watch mode)
- **Test UI**: `npm run test:ui`

## Project Structure

See [COMPONENTS.md](./COMPONENTS.md) for component organization.

```
src/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/           # Custom hooks
├── lib/             # Utilities & services
├── stores/          # Zustand state
├── styles/          # Global CSS
├── types/           # TypeScript definitions
└── __tests__/       # Test files
```

## Code Standards

### TypeScript

- Use `strict: true` mode
- Always type function parameters and return values
- Use interfaces for object shapes
- Prefer `const` over `let` or `var`

```typescript
// Good
interface UserProps {
  id: string
  name: string
  email: string
}

const getUserData = (id: string): Promise<User> => {
  // implementation
}

// Avoid
const getUserData = (id) => {
  // no types
}
```

### React Components

- Use functional components with hooks
- Extract complex logic to custom hooks
- Memoize expensive computations
- Props validation with TypeScript

```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500',
      )}
    >
      {label}
    </button>
  )
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-form.tsx`)
- **Components**: PascalCase (e.g., `UserForm`)
- **Functions**: camelCase (e.g., `getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (e.g., `UserProps`)

### Import Organization

```typescript
// 1. External packages
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal utilities & services
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

// 3. Components
import { Button } from '@/components/ui/button'
import { UserForm } from '@/components/forms'

// 4. Types
import type { User } from '@/types'

// 5. Relative imports
import { localHelper } from './helper'
```

## Feature Development Workflow

### 1. Create API Endpoint

```bash
src/app/api/users/route.ts
```

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { databases } from '@/lib/appwrite'

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const data = createUserSchema.parse(body)
    
    const user = await databases.createDocument(
      'users',
      ID.unique(),
      data
    )
    
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 2. Create Custom Hook

```bash
src/hooks/useUsers.ts
```

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      return res.json()
    },
  })
}

export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

### 3. Create Form Component

```bash
src/components/forms/UserForm.tsx
```

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema } from '@/lib/validations'

interface UserFormProps {
  onSubmit: (data: CreateUserInput) => void
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <button type="submit">Create User</button>
    </form>
  )
}
```

### 4. Create Component

```bash
src/components/users/UserList.tsx
```

```typescript
import { useUsers } from '@/hooks/useUsers'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const UserList: React.FC = () => {
  const { data, isLoading, error } = useUsers()

  if (isLoading) return <LoadingSpinner />
  if (error) return <div>Error loading users</div>

  return (
    <div>
      {data?.items?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### 5. Write Tests

```bash
src/__tests__/api/users.test.ts
```

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/users/route'

describe('POST /api/users', () => {
  it('creates user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    })

    await POST(req as any)

    expect(res._getStatusCode()).toBe(201)
  })
})
```

## Testing

### Test Files Location

- Unit tests: `src/__tests__/` matching structure
- Component tests: `src/__tests__/components/`
- API tests: `src/__tests__/api/`
- Hook tests: `src/__tests__/hooks/`

### Running Tests

```bash
# Watch mode
npm run test

# CI mode (single run)
npm run test:run

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Test Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders button with label', () => {
    render(<Button label="Click me" onClick={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const { user } = render(
      <Button label="Click" onClick={handleClick} />
    )
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## State Management

### Using Zustand Store

```typescript
import { create } from 'zustand'

interface AppState {
  count: number
  increment: () => void
  decrement: () => void
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

### Using React Query

```typescript
// Fetch
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

// Mutate
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

## Error Handling

### API Errors

```typescript
import { handleApiError } from '@/lib/api'

try {
  const result = await databases.getDocument(...)
} catch (error) {
  return handleApiError(error)
}
```

### Form Validation Errors

```typescript
const { errors } = useForm({
  resolver: zodResolver(schema),
})

// Display errors
{errors.email && <span>{errors.email.message}</span>}
```

### Global Error Handling

```typescript
import { initGlobalErrorHandlers } from '@/lib/global-error-handler'

// In app initialization
useEffect(() => {
  initGlobalErrorHandlers()
}, [])
```

## Performance Tips

1. **Code Splitting**: Use dynamic imports for large components
   ```typescript
   const HeavyComponent = dynamic(() => import('./Heavy'))
   ```

2. **Memoization**: Prevent unnecessary re-renders
   ```typescript
   const MemoComponent = memo(Component)
   ```

3. **Lazy Loading**: Load lists gradually
   ```typescript
   const { data, fetchNextPage } = useInfiniteQuery(...)
   ```

4. **Caching**: Leverage React Query's built-in caching

5. **Debouncing**: Debounce expensive operations
   ```typescript
   const debouncedSearch = useDebounce(searchValue, 300)
   ```

## Debugging

### Browser DevTools

- React DevTools
- Redux DevTools (for Zustand inspection)
- React Query DevTools: `<ReactQueryDevtoolsWrapper />`

### Logging

```typescript
import logger from '@/lib/logger'

logger.info('User created', { userId: user.id })
logger.error('Operation failed', error)
```

### Error Tracking

```typescript
import { trackError } from '@/lib/error-tracker'

try {
  // operation
} catch (error) {
  trackError(error, { context: 'feature-name' })
}
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes
git add .
git commit -m "feat: Add feature description"

# Push and create PR
git push origin feature/feature-name
```

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Test changes
- `perf:` Performance improvement

## Build & Deployment

### Build

```bash
npm run build
```

### Production Start

```bash
npm run start
```

### Environment Variables

Required variables in `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
APPWRITE_API_KEY=
CSRF_SECRET=
SESSION_SECRET=
```

---

**Happy Coding!** 🚀
