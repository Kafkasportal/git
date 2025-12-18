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

See `src/test-utils/test-patterns.ts` for established testing patterns.

## E2E Testing with Playwright

End-to-end tests are located in the `e2e/` directory.

```bash
# Run E2E tests locally
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### E2E Test Structure

```
e2e/
├── homepage.spec.ts     # Homepage tests
├── visual.spec.ts       # Visual regression tests (Argos)
└── ...                  # Add more test files here
```

## Cross-Browser Testing with BrowserStack

Run your E2E tests on real browsers and devices using BrowserStack.

### Setup

1. Copy `browserstack.yml.example` to `browserstack.yml`
2. Add your BrowserStack credentials (get from [BrowserStack Settings](https://www.browserstack.com/accounts/settings))
3. Run tests:

```bash
npm run test:browserstack
```

### Configured Platforms

| Platform | Browser | Device |
|----------|---------|--------|
| Windows 11 | Chrome (latest) | Desktop |
| macOS Sequoia | Safari (WebKit) | Desktop |
| Android 14 | Chrome | Samsung Galaxy S24 |

### Environment Variables (Optional)

```bash
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_access_key
```

## Troubleshooting

If you encounter issues with the test environment, please refer to the troubleshooting guides in `docs/troubleshooting/`:

- [Vitest Diagnostics](../troubleshooting/VITEST_DIAGNOSTICS.md)
- [Environment Fix Guide](../troubleshooting/VITEST_ENVIRONMENT_FIX_GUIDE.md)
- [Recovery Guide](../troubleshooting/VITEST_RECOVERY_GUIDE.md)
