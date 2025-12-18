import { test, expect } from '@playwright/test';
import { retryNavigation, waitForServer } from './utils/retry';
import percySnapshot from '@percy/playwright';

/**
 * Sample test for BrowserStack verification
 * This is a simple test to verify BrowserStack integration is working
 */
test.describe('BrowserStack Sample Test', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Wait for server to be ready (especially important for BrowserStack)
    const serverReady = await waitForServer(page);
    expect(serverReady).toBe(true);
    
    // Use retry mechanism for navigation
    await retryNavigation(page, '/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Basic assertion that page loaded
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Log browser info for BrowserStack
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log('Browser User Agent:', userAgent);
    
    // Take Percy snapshot
    await percySnapshot(page, 'Sample Test - Homepage');
  });

  test('should have basic page structure', async ({ page }) => {
    // Use retry mechanism for navigation
    await retryNavigation(page, '/');
    
    // Check that body exists
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check that page has some content
    const hasContent = await page.locator('body').count() > 0;
    expect(hasContent).toBe(true);
    
    // Take Percy snapshot of page structure
    await percySnapshot(page, 'Sample Test - Page Structure');
  });
});

