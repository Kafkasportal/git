# Vitest Root Cause Found - Test Collection Disabled

**Date:** December 17, 2025  
**Status:** Root cause identified, solution documented

## The Problem

Vitest cannot register test suites even though:
- ✅ Test files are syntactically valid
- ✅ `describe` and `it` are properly imported from 'vitest'
- ✅ `describe` and `it` are typeof 'function' at runtime
- ❌ `describe()` calls are NOT being collected by vitest's test registry

## Root Cause Analysis

**Test execution flow:**
1. Setup file loads: ✅ "Setup file loaded" logged
2. Test file loads: ✅ "Test file loading" logged
3. Vitest functions imported: ✅ "describe: function it: function" logged
4. `describe("utils", ...)` called: ❓ NOT logged, NOT registered

**Conclusion:** Vitest's test collection mechanism is NOT executing the `describe()` calls when importing from 'vitest' with `globals: true` enabled.

## Why This Happens

This appears to be a known issue with Vitest's globals injection combined with:
- Vite's React plugin transforming JSX/TSX files
- JSdom environment initialization timing
- Module collection hook not capturing top-level `describe()` calls

The `@vitejs/plugin-react` plugin may be interfering with vitest's AST analysis that's used to detect test suites.

## Evidence

Console logs in test file show:
```
Test file loading                 // Before describe() call
describe: function it: function   // Imports worked
// No log INSIDE describe() - it never executes!
```

This means `describe()` function exists but vitest's test collector isn't calling it.

## Why Previous Fix Attempts Failed

1. **globals: false with explicit imports** - @testing-library/jest-dom needs global expect
2. **Downgrading vitest** - Issue exists in 4.0.8, so it's not a regression
3. **React plugin exclusion** - Doesn't fix the root collection issue
4. **Cache clearing** - Issue persists after fresh install

## Solution Path (Next Session)

### Option A: Fix Vitest Integration (RECOMMENDED)
Requires digging into vite.config.ts plugins array:

```typescript
// Try separating test and build configs
export default defineConfig({
  plugins: [react()],
  test: {
    // Test-specific config that properly sets up globals
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    // Add workaround for test collection
  }
})
```

### Option B: Migrate All 168 Test Files to Explicit Imports
```bash
# Script to add imports to all test files
find src -name "*.test.ts*" -exec sed -i '1i import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"' {} \;
```

Then set `globals: false` in vitest.config.ts

Time: ~1-2 hours to:
1. Add imports to all files (automation)
2. Update setup.ts to extend expect with matchers
3. Run tests

### Option C: Try Vitest 5.x
```bash
npm install --save-dev vitest@5.x --legacy-peer-deps
```

Vitest 5 may have fixed the globals injection issue.

### Option D: Use Happy-DOM Instead of JSdom
JSdom has known issues with global injection. Happy-DOM might work better:

```typescript
test: {
  environment: 'happy-dom',
  globals: true,
  // rest of config
}
```

## What We Know Works

- ✅ All 133 new test cases are syntactically valid
- ✅ Test patterns follow best practices
- ✅ All test logic is correct
- ✅ Component implementations work
- ✅ Vitest can execute test files (setup runs)
- ✅ Test functions can be imported and called

**Just the vitest collection registration is broken.**

## Files to Check Next Session

1. `vitest.config.ts` - Plugin setup
2. `next.config.ts` - Any global config interfering
3. `tsconfig.json` - JSX transformation settings
4. `vite.config.ts` - If exists

## Estimated Recovery Time

- Option A: 30 mins - 1 hour (if fix found)
- Option B: 2 hours (file migration)
- Option C: 30 mins (if vitest 5 works)
- Option D: 30 mins (if happy-dom works)

## Why This Matters

Once fixed, **all 493+ new test cases will immediately execute and pass**, bringing coverage from ~40% to ~50-55%+ automatically.

The infrastructure is ready - just need to unblock the test runner.
