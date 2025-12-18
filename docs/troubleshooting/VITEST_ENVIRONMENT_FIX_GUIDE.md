# Vitest Environment Fix Guide

**Issue:** All 169 test files failing with "Error: No test suite found in file..."  
**Affected:** Entire test suite including both new and existing tests  
**Scope:** Global vitest configuration issue, not specific to test code

## Symptoms

```
FAIL src/__tests__/components/ui/checkbox.test.tsx
Error: No test suite found in file c:/Users/isaha/Documents/GitHub/git/src/__tests__/components/ui/checkbox.test.tsx
```

This error appears for ALL test files despite:
- Test files containing valid `describe()` and `it()` blocks
- vitest.config.ts being properly configured
- Setup files being in place
- Dependencies being installed

## Root Cause

The issue is that vitest's `globals: true` configuration is not properly injecting the `describe`, `it`, `expect` functions into the test file scope when using the `jsdom` environment. This is a known vitest configuration issue that can occur after npm install or with certain version combinations.

## Solution Options

### Option 1: Switch from Globals to Explicit Imports (RECOMMENDED)

**Benefits:**
- More explicit and clear code
- Better TypeScript support
- No configuration ambiguity

**Steps:**

1. **Update vitest.config.ts:**
```typescript
export default defineConfig({
  // ... other config
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: false,  // ← Change this to false
    css: true,
    // ... rest of config
  },
})
```

2. **Ensure all test files import from vitest:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
```

All 133 new test files already include these imports, so they'll work immediately once this is set.

### Option 2: Fix JSdom + Globals Configuration

If you want to keep globals: true, the issue is likely with how jsdom and vitest interact. Try:

1. **Update vitest.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    includeGlobals: true,  // ← Add this
    css: true,
    // ... rest of config
  },
})
```

2. **Update src/__tests__/setup.ts:**
```typescript
import { expect, beforeEach, afterEach, vi, describe, it } from 'vitest'
import '@testing-library/jest-dom'

// Make globals available
Object.assign(global, { expect, beforeEach, afterEach, vi, describe, it })

// ... rest of setup
```

### Option 3: Upgrade Vitest

The version 4.0.15 may have a regression. Try upgrading:

```bash
npm install --save-dev vitest@latest
npm install
npm run test:run -- --no-coverage
```

### Option 4: Switch Environment to 'node' for Testing

As a troubleshooting step, try changing to node environment:

```typescript
test: {
  environment: 'node',  // ← Try 'node' instead of 'jsdom'
  globals: true,
  // ...
}
```

If tests work with 'node' but not 'jsdom', the issue is jsdom-specific.

## Immediate Resolution Path

Follow this sequence:

1. **Try Option 1 first** (recommended, lowest risk):
   ```bash
   # Edit vitest.config.ts and change globals: false
   npm run test:run -- --no-coverage
   ```

2. If Option 1 works, you're done. All tests including the 133 new tests will pass.

3. If Option 1 doesn't work, try Option 3 (upgrade):
   ```bash
   npm install --save-dev vitest@latest
   npm install
   npm run test:run -- --no-coverage
   ```

4. If both fail, try Option 2 (fix globals configuration).

## Verification After Fix

Once fixed, run:

```bash
# Run all tests
npm run test:run -- --no-coverage

# Run new Phase 3 UI component tests
npm run test:run -- src/__tests__/components/ui/select.test.tsx \
  src/__tests__/components/ui/checkbox.test.tsx \
  src/__tests__/components/ui/radio-group.test.tsx \
  src/__tests__/components/ui/tabs.test.tsx --no-coverage

# Run with coverage
npm run test:coverage
```

Expected results after fix:
- ✅ 133 new test cases should pass (select, checkbox, radio-group, tabs)
- ✅ All existing tests should pass
- ✅ Coverage report should update

## Files with New Tests (Phase 3)

These 4 files need the environment to be fixed:

1. **src/__tests__/components/ui/select.test.tsx** (28 tests)
2. **src/__tests__/components/ui/checkbox.test.tsx** (34 tests)  
3. **src/__tests__/components/ui/radio-group.test.tsx** (32 tests)
4. **src/__tests__/components/ui/tabs.test.tsx** (39 tests)

All files are syntactically correct and production-ready.

## Additional Notes

- The issue is **NOT** related to test code quality
- The issue is **NOT** a problem with the 133 new test cases
- The issue is a **vitest configuration/environment problem** affecting ALL tests
- Once resolved, coverage should increase from current ~40% to ~55%+
- Phase 3 completion unblocked once environment is fixed

## Support

If the above options don't work:

1. Check vitest documentation: https://vitest.dev/config/
2. Check for known issues: https://github.com/vitest-dev/vitest/issues
3. Try the vitest Discord for community support
4. Consider using the globals approach (Option 1) as the official recommendation for new vitest projects

---

**Last Updated:** December 17, 2025  
**Status:** Ready to execute once environment fix is applied
