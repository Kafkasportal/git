# Argos Visual Testing Setup

This project uses [Argos CI](https://argos-ci.com) for visual regression testing.

## Configuration

The Argos project token is configured in the GitHub Actions workflow. The token should be stored as a GitHub secret named `ARGOS_TOKEN`.

**Token**: `argos_49188c6c4bf9042c7c877bf47aaa3cb484`

## GitHub Secret Setup

To add the Argos token as a GitHub secret:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ARGOS_TOKEN`
5. Value: `argos_49188c6c4bf9042c7c877bf47aaa3cb484`
6. Click **Add secret**

## CI/CD Integration

The visual testing job runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The job:
1. Builds the Next.js application
2. Starts the production server
3. Runs Argos visual tests
4. Uploads screenshots to Argos CI

## Local Testing

To run visual tests locally:

```bash
# Make sure your app is running
npm run dev

# In another terminal, run visual tests
npm run test:visual
```

## Using Playwright with Argos

If you want to use Playwright for visual testing, you'll need to:

1. Install Playwright:
```bash
npm install -D @playwright/test playwright
npx playwright install
```

2. Create a `playwright.config.ts` file with Argos integration

3. Create visual test files in `src/__tests__/visual/` or similar

Example Playwright test with Argos:
```typescript
import { test, expect } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

test('homepage visual test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await argosScreenshot(page, 'homepage');
});
```

## Documentation

- [Argos CI Documentation](https://docs.argos-ci.com)
- [Argos Playwright Integration](https://docs.argos-ci.com/playwright)
- [Argos GitHub Action](https://github.com/argos-ci/argos-action)
