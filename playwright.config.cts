import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disabled other browsers to focus on stability
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Global test timeout
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 10 * 1000,
  },

  // WebServer configuration - only needed for tests that require the local app
  // Skip webServer with: SKIP_WEBSERVER=true npx playwright test
  ...(process.env.SKIP_WEBSERVER !== 'true' && {
    webServer: {
      command: 'npm run build && npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // 2 minutes for build + start
    },
  }),
});
