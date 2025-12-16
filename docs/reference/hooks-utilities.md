# Hooks & Utilities Documentation

Comprehensive reference for custom React hooks and utility functions.

## Custom Hooks

### Data Fetching

| Hook | Location | Purpose |
|------|----------|---------|
| `useAppwriteQuery` | `hooks/` | Fetch data from Appwrite |
| `useAppwriteMutation` | `hooks/` | Mutate data in Appwrite |
| `useInfiniteScroll` | `hooks/` | Infinite scroll pagination |
| `usePagination` | `hooks/` | Pagination logic |

### State Management

| Hook | Location | Purpose |
|------|----------|---------|
| `useAuthStore` | `stores/authStore.ts` | Auth state (Zustand) |
| `useNotificationStore` | `stores/notificationStore.ts` | Notifications |
| `useSettings` | `lib/contexts/settings-context.tsx` | Settings state |
| `useTheme` | `lib/contexts/settings-context.tsx` | Theme management |

### Form & Input

| Hook | Location | Purpose |
|------|----------|---------|
| `useForm` | React Hook Form | Form state management |
| `useFormContext` | React Hook Form | Form context access |
| `useWatch` | React Hook Form | Watch field changes |
| `useController` | React Hook Form | Control individual fields |

### DOM & Browser

| Hook | Location | Purpose |
|------|----------|---------|
| `useMediaQuery` | `hooks/` | Responsive design |
| `useLocalStorage` | `hooks/` | Local storage state |
| `useSessionStorage` | `hooks/` | Session storage state |
| `useDebounce` | `hooks/` | Debounce values |
| `useThrottle` | `hooks/` | Throttle functions |
| `usePrevious` | `hooks/` | Track previous value |
| `useAsync` | `hooks/` | Handle async operations |
| `useKeyboardNavigation` | `lib/contexts/keyboard-navigation-context.tsx` | Keyboard shortcuts |

### Performance

| Hook | Location | Purpose |
|------|----------|---------|
| `useMemo` | React | Memoize computations |
| `useCallback` | React | Memoize callbacks |
| `useTransition` | React 19 | Async state transitions |

## Utility Functions

### API Utilities (`lib/api/`)

| Function | Purpose |
|----------|---------|
| `handleApiError()` | Standardized error handling |
| `validateInput()` | Input validation with Zod |
| `sanitizeInput()` | XSS prevention |
| `formatResponse()` | Response formatting |
| `buildQueryString()` | Query parameter builder |

### Appwrite SDK (`lib/appwrite/`)

| Function | Purpose |
|----------|---------|
| `initAppwrite()` | SDK initialization |
| `createDocument()` | Document creation |
| `queryDocuments()` | Document queries |
| `updateDocument()` | Document updates |
| `deleteDocument()` | Document deletion |
| `uploadFile()` | File upload |
| `subscribeToChanges()` | Real-time subscriptions |

### Authentication (`lib/auth/`)

| Function | Purpose |
|----------|---------|
| `verifySession()` | Session validation |
| `getPermissions()` | Get user permissions |
| `hasPermission()` | Check permission |
| `validateCSRFToken()` | CSRF protection |
| `generateSessionToken()` | Token generation |

### Security (`lib/security/`)

| Function | Purpose |
|----------|---------|
| `sanitize()` | HTML sanitization |
| `encrypt()` | Data encryption |
| `decrypt()` | Data decryption |
| `hashPassword()` | Password hashing |
| `comparePassword()` | Password verification |
| `rateLimit()` | Rate limiting |

### Data Formatting (`lib/utils/`)

| Function | Purpose |
|----------|---------|
| `formatDate()` | Date formatting |
| `formatCurrency()` | Currency formatting |
| `formatPhoneNumber()` | Phone number formatting |
| `parseFormData()` | Form data parsing |
| `cloneDeep()` | Deep cloning |
| `debounce()` | Function debouncing |
| `throttle()` | Function throttling |

### Validation (`lib/validations/`)

| Schema | Purpose |
|--------|---------|
| `UserSchema` | User validation |
| `BeneficiarySchema` | Beneficiary validation |
| `DonationSchema` | Donation validation |
| `ScholarshipSchema` | Scholarship validation |
| `FinanceSchema` | Finance validation |
| `MeetingSchema` | Meeting validation |

## Store State Management (Zustand)

### AuthStore

```typescript
useAuthStore.getState() => {
  user: User | null
  isAuthenticated: boolean
  permissions: Permission[]
  
  methods: {
    login()
    logout()
    initializeAuth()
    setUser()
    updatePermissions()
  }
}
```

### NotificationStore

```typescript
useNotificationStore.getState() => {
  notifications: Notification[]
  
  methods: {
    addNotification()
    removeNotification()
    clearAll()
  }
}
```

## Context Providers

### SettingsContext

- Theme customization
- Color schemes
- Branding configuration
- User preferences

```typescript
useSettings() => {
  settings: Settings
  updateSettings()
}

useTheme() => {
  theme: Theme
  setTheme()
}
```

### KeyboardNavigationContext

- Keyboard shortcut management
- Accessibility support
- Command palette integration

```typescript
useKeyboardNavigation() => {
  shortcuts: Shortcut[]
  registerShortcut()
  unregisterShortcut()
}
```

## Export Utilities

### Excel Export

```typescript
exportToExcel(data, filename)
```

### PDF Export

```typescript
exportToPDF(content, filename, options)
```

### CSV Export

```typescript
exportToCSV(data, filename)
```

## Error Handling

```typescript
// Global error handlers
initGlobalErrorHandlers()

// Error tracking
initErrorTracker()
trackError(error, context)

// Typed errors
AppwriteError
ValidationError
NetworkError
```

## Cache Management

```typescript
// Persistent cache
persistentCache.set(key, value, ttl)
persistentCache.get(key)
persistentCache.clear()
persistentCache.cleanup()
```

## Query Configuration

### Optimized React Query Setup

- Automatic retries
- Stale-while-revalidate
- Cache deduplication
- Optimistic updates

```typescript
createOptimizedQueryClient()
```

## Middleware & Interceptors

### Request Middleware

- CSRF token injection
- Auth header setup
- Request logging

### Response Middleware

- Error normalization
- Response logging
- Cache invalidation

## Performance Utilities

| Function | Purpose |
|----------|---------|
| `memoize()` | Function memoization |
| `batch()` | Batch updates |
| `debounce()` | Debounce execution |
| `throttle()` | Throttle execution |
| `lazy()` | Code splitting |

---

**Hooks Count**: 29+
**Utilities Count**: 50+
**Stores**: 2 (Auth, Notifications)
**Contexts**: 2 (Settings, Keyboard Navigation)
