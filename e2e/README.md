# E2E Tests - Playwright

This directory contains End-to-End (E2E) tests written with Playwright for the Kafkasder Panel application.

## Test Files

- **example.spec.ts** - Standalone example tests demonstrating Playwright capabilities
- **auth.spec.ts** - Authentication flow tests
- **beneficiaries.spec.ts** - Beneficiary management tests
- **donations.spec.ts** - Donation tracking tests
- **meetings.spec.ts** - Meeting management tests
- And more...

## Running Tests

### Quick Example Test (No App Required)

To run the standalone example test without starting the application:

```bash
SKIP_WEBSERVER=true npx playwright test example
```

This is useful for:

- Verifying Playwright installation
- Learning Playwright test patterns
- Quick validation without building the app

### Running Application Tests

To run tests that require the application to be running:

```bash
# Run all E2E tests
npm run test:e2e

# Or use Playwright directly
npx playwright test
```

The Playwright configuration will automatically:

1. Build the Next.js application
2. Start the development server
3. Run the tests
4. Stop the server when complete

### Interactive Mode

To run tests in interactive UI mode:

```bash
npm run e2e:ui
# or
npx playwright test --ui
```

### Running Specific Tests

```bash
# Run a specific test file
npx playwright test auth.spec.ts

# Run tests matching a pattern
npx playwright test beneficiar

# Run a specific test by line number
npx playwright test auth.spec.ts:18
```

## Test Structure

All tests follow a consistent pattern:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout } from './test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Utilities

- **test-utils.ts** - Helper functions for common operations
- **mock-api.ts** - API mocking utilities for stable tests

## Configuration

See `playwright.config.cts` in the root directory for Playwright configuration including:

- Browser settings
- Timeouts
- Test directory
- Reporter configuration
- WebServer configuration

## Tips

1. **Use SKIP_WEBSERVER** for tests that don't need the app (like example.spec.ts)
2. **Run in headed mode** for debugging: `npx playwright test --headed`
3. **View test report** after failures: `npx playwright show-report`
4. **Generate tests** interactively: `npx playwright codegen http://localhost:3000`

## Debugging

To debug a failing test:

```bash
# Run with debug mode
npx playwright test --debug

# View traces from failed tests
npx playwright show-trace test-results/[test-path]/trace.zip
```

## CI/CD

Tests automatically run in CI with:

- Single worker for stability
- Retry on failure (2 attempts)
- Screenshot/video capture on failure
- Trace recording on failure

## Learn More

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Guide](../docs/testing.md) - Project-specific testing guide
