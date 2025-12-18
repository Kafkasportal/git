import { test, expect } from '@playwright/test';
import { retryNavigation, waitForServer } from './utils/retry';
import percySnapshot from '@percy/playwright';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    // Wait for server to be ready before testing
    const serverReady = await waitForServer(page);
    expect(serverReady).toBe(true);
    
    // Use retry mechanism for navigation
    await retryNavigation(page, '/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded
    await expect(page).toHaveTitle(/Dernek|Association|Home/i);
    
    // Take Percy snapshot of homepage
    await percySnapshot(page, 'Homepage - Desktop');
  });

  test('should have navigation elements', async ({ page }) => {
    // Use retry mechanism for navigation
    await retryNavigation(page, '/');
    
    // Check for common navigation elements
    const nav = page.locator('nav, header, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    // Take Percy snapshot of navigation
    await percySnapshot(page, 'Homepage - Navigation');
  });

});

test.describe('Login Page', () => {
  test('should navigate to login page', async ({ page }) => {
    // Use retry mechanism for navigation
    await retryNavigation(page, '/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // At least one of these should exist
    const hasEmailInput = await emailInput.count() > 0;
    const hasPasswordInput = await passwordInput.count() > 0;
    
    expect(hasEmailInput || hasPasswordInput).toBe(true);
    
    // Take Percy snapshot of login page
    await percySnapshot(page, 'Login Page');
  });
});


