# Testing Guide - Dernek Yönetim Sistemi

## Quick Start

```bash
# Run all tests
npm run test:run

# Run tests with UI
npm run test:ui

# Check coverage
npm run test:coverage

# Run specific test file
npm run test:run -- src/__tests__/stores/authStore.test.ts

# Watch mode
npm run test
```

## Coverage Target

**Minimum Branch Coverage: 70%** (enforced in CI/CD)

Current Status: **70.07%** ✅

### Coverage Metrics Breakdown

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Statements | 70% | 79.03% | ✅ |
| Branches | 70% | 70.07% | ✅ |
| Functions | 70% | 77.1% | ✅ |
| Lines | 70% | 79.23% | ✅ |

## Test File Organization

```
src/__tests__/
├── api/                    # API route tests
│   ├── route-helpers.test.ts    # ✅ 97.56% coverage (NEW)
│   ├── users.test.ts
│   ├── errors.test.ts
│   └── ...
├── stores/
│   └── authStore.test.ts   # ✅ 78.33% coverage
├── lib/
│   ├── auth/
│   │   └── session.test.ts # ✅ 72.54% coverage
│   ├── beneficiary/
│   │   └── workflow-engine.test.ts # ✅ 72.11% coverage
│   └── ...
├── components/
├── hooks/
└── properties/             # Property-based tests (advanced)
```

## Writing Tests

### Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup mocks, state
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('Function Name', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });

    it('should handle error case', async () => {
      // Test error scenarios
      expect(() => {
        myFunction(invalidInput);
      }).toThrow('Expected error message');
    });
  });
});
```

### Common Patterns

#### Testing Async Functions

```typescript
it('should handle async operation', async () => {
  const mockFetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: 'test' })
  });

  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

#### Testing Zustand Stores

```typescript
import { act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

it('should update store state', () => {
  act(() => {
    useAuthStore.getState().setUser(testUser);
  });

  const state = useAuthStore.getState();
  expect(state.user).toEqual(testUser);
});
```

#### Testing Error Handling

```typescript
it('should handle 2FA error', () => {
  const error = new Error('2FA required') as Error & { requiresTwoFactor?: boolean };
  error.requiresTwoFactor = true;
  
  expect(error.requiresTwoFactor).toBe(true);
  expect(error.message).toContain('2FA');
});
```

#### Mocking Next.js Request/Response

```typescript
import { NextRequest } from 'next/server';

const mockRequest = {
  json: vi.fn().mockResolvedValue({ data: 'test' })
} as unknown as NextRequest;

const result = await parseBody(mockRequest);
expect(result.data).toBeDefined();
```

## Key Testing Patterns

### 1. localStorage Mocking

```typescript
beforeEach(() => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
});
```

### 2. fetch Mocking

```typescript
beforeEach(() => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
});
```

### 3. Testing with act()

```typescript
import { act } from '@testing-library/react';

// For state updates
await act(async () => {
  await asyncOperation();
});

// Verify state after act
const state = getState();
expect(state.isLoading).toBe(false);
```

## Coverage Improvement Strategy

### Files with Room for Improvement

| File | Current | Target | Priority |
|------|---------|--------|----------|
| authStore.ts | 78.33% | 85%+ | Medium |
| workflow-engine.ts | 72.11% | 80%+ | Medium |
| session.ts | 72.54% | 80%+ | Low |
| appwrite/server.ts | 39.28% | N/A | - |
| appwrite/client.ts | 31.66% | N/A | - |

### How to Add Coverage

1. **Identify uncovered branches:**
   ```bash
   npm run test:coverage
   # Look for "Uncovered Line #s" column
   ```

2. **Review source code:**
   - Open the source file
   - Find the uncovered lines
   - Understand the logic path

3. **Write targeted tests:**
   - Create test case for that specific path
   - Ensure both success and failure cases
   - Handle edge cases (null, empty, invalid)

4. **Verify improvement:**
   ```bash
   npm run test:coverage
   # Check if coverage increased
   ```

## Known Issues & Workarounds

### Issue: Module-Level Code Not Covered
**Problem:** Code that runs when module is imported (e.g., `appwrite/server.ts`)  
**Solution:** These cannot be easily tested in isolation. Focus on functions instead.

### Issue: localStorage in SSR Context
**Problem:** localStorage is undefined on server side  
**Solution:** Tests mock localStorage, but actual code must check `typeof window`

### Issue: Failed Tests in Unrelated Files
**Problem:** Some API route tests fail due to mock issues  
**Status:** Does not affect coverage threshold; will be fixed separately

## Debugging Tests

### Run Single Test File
```bash
npm run test:run -- src/__tests__/stores/authStore.test.ts
```

### Run Tests Matching Pattern
```bash
npm run test:run -- --grep "2FA"
```

### Run with Verbose Output
```bash
npm run test:run -- --reporter=verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Best Practices

### DO
✅ Test both success and failure paths  
✅ Use descriptive test names  
✅ Group related tests with `describe()`  
✅ Mock external dependencies  
✅ Use `beforeEach`/`afterEach` for setup/cleanup  
✅ Test edge cases (null, empty, invalid)  
✅ Keep tests focused and small  

### DON'T
❌ Use hardcoded timeouts (use promises instead)  
❌ Test implementation details (test behavior)  
❌ Skip error cases  
❌ Create interdependent tests  
❌ Use `console.log` in tests (use debugging instead)  
❌ Leave test data in source files  

## CI/CD Integration

The coverage threshold is enforced in CI/CD:
- **Minimum:** 70% branch coverage
- **Current:** 70.07% (passing)
- **Action:** Builds fail if coverage drops below 70%

Before pushing code:
```bash
npm run test:coverage
npm run typecheck
npm run lint:check
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Matchers](https://vitest.dev/api/expect.html)
- Project: [COVERAGE_IMPROVEMENT.md](./COVERAGE_IMPROVEMENT.md)
