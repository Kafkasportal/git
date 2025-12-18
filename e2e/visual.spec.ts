import { test } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';
import { retryNavigation } from './utils/retry';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test('homepage visual snapshot', async ({ page }) => {
    await retryNavigation(page, '/');
    await page.waitForLoadState('networkidle');
    
    // Take Argos screenshot for visual comparison
    await argosScreenshot(page, 'homepage');
    
    // Take Percy snapshot
    await percySnapshot(page, 'Visual Test - Homepage');
  });

  test('login page visual snapshot', async ({ page }) => {
    await retryNavigation(page, '/login');
    await page.waitForLoadState('networkidle');
    
    await argosScreenshot(page, 'login-page');
    
    // Take Percy snapshot
    await percySnapshot(page, 'Visual Test - Login Page');
  });

});


