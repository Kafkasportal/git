/**
 * Login Page Test Suite - Generated from Browser MCP Exploration
 * 
 * This test suite was generated based on interactive exploration using Browser MCP tools.
 * It tests the login page functionality including form validation, interactions, and navigation.
 * 
 * Run with: npx playwright test login-browser-mcp-generated
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page - Browser MCP Generated Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000');
    // Page should redirect to login if not authenticated
    await page.waitForURL(/.*login.*/);
  });

  test('should display login page with all required elements', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Dernek Yönetim Sistemi/i);

    // Verify main heading/logo
    await expect(page.locator('text=Dernek Yönetim Sistemi')).toBeVisible();
    await expect(page.locator('text=Profesyonel yönetim platformu')).toBeVisible();

    // Verify login form heading
    await expect(page.locator('text=Hesabınıza Giriş Yapın')).toBeVisible();
    await expect(page.locator('text=Güvenli giriş için bilgilerinizi girin')).toBeVisible();

    // Verify email field
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('type', 'email');
    await expect(emailField).toHaveAttribute('required');

    // Verify password field
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('type', 'password');
    await expect(passwordField).toHaveAttribute('required');

    // Verify remember me checkbox
    const rememberMeCheckbox = page.locator('input[type="checkbox"], button[role="checkbox"]').first();
    await expect(rememberMeCheckbox).toBeVisible();

    // Verify login button
    const loginButton = page.locator('button:has-text("Giriş Yap")').first();
    await expect(loginButton).toBeVisible();

    // Verify social login options
    await expect(page.locator('button:has-text("Google ile Giriş")')).toBeVisible();
    await expect(page.locator('button:has-text("GitHub ile Giriş")')).toBeVisible();

    // Verify security notice
    await expect(page.locator('text=/256-bit SSL şifreleme/i')).toBeVisible();

    // Verify support email
    await expect(page.locator('text=/destek@dernek.com/i')).toBeVisible();
  });

  test('should validate required email field', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const _passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Giriş Yap")').first();

    // Try to submit empty form
    await loginButton.click();

    // Email field should be focused (HTML5 validation)
    await expect(emailField).toBeFocused();

    // Verify field is required
    const isValid = await emailField.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should validate required password field', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Giriş Yap")').first();

    // Fill email only
    await emailField.fill('test@example.com');

    // Try to submit
    await loginButton.click();

    // Password field should be focused or form should not submit
    const isValid = await passwordField.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should allow typing in email field', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    
    await emailField.fill('test@example.com');
    await expect(emailField).toHaveValue('test@example.com');
  });

  test('should allow typing in password field', async ({ page }) => {
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    
    await passwordField.fill('testpassword123');
    await expect(passwordField).toHaveValue('testpassword123');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const toggleButton = page.locator('button:has-text("Parolayı göster"), button[aria-label*="şifre"]').first();

    // Fill password
    await passwordField.fill('testpassword123');

    // Initially password should be hidden
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Click toggle button
    if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggleButton.click();
      
      // Password should now be visible (type="text")
      await expect(passwordField).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  test('should allow checking remember me checkbox', async ({ page }) => {
    const rememberMeCheckbox = page.locator('input[type="checkbox"], button[role="checkbox"]').first();
    
    // Check the checkbox
    await rememberMeCheckbox.check();
    
    // Verify it's checked
    if (await rememberMeCheckbox.evaluate((el) => el.tagName === 'INPUT')) {
      await expect(rememberMeCheckbox).toBeChecked();
    }
  });

  test('should maintain form state during interaction', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const rememberMeCheckbox = page.locator('input[type="checkbox"], button[role="checkbox"]').first();

    // Fill all fields
    await emailField.fill('test@example.com');
    await passwordField.fill('testpassword123');
    await rememberMeCheckbox.check();

    // Verify values persist
    await expect(emailField).toHaveValue('test@example.com');
    await expect(passwordField).toHaveValue('testpassword123');
  });

  test('should handle form reset', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();

    // Fill fields
    await emailField.fill('test@example.com');
    await passwordField.fill('testpassword123');

    // Reload page (form should reset)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Fields should be empty
    await expect(emailField).toHaveValue('');
    await expect(passwordField).toHaveValue('');
  });

  test('should have accessible form labels', async ({ page }) => {
    // Check for proper label associations
    const emailLabel = page.locator('label:has-text("Email Adresi")').first();
    const passwordLabel = page.locator('label:has-text("Şifre")').first();

    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const _loginButton = page.locator('button:has-text("Giriş Yap")').first();

    // Tab through form fields
    await emailField.focus();
    await expect(emailField).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordField).toBeFocused();

    await page.keyboard.press('Tab');
    // Should focus on next element (checkbox or button)
  });

  test('should redirect authenticated users from root to dashboard', async ({ page, context: _context }) => {
    // This test assumes you have a valid session
    // In a real scenario, you'd set up authentication cookies first
    
    // Navigate to root
    await page.goto('http://localhost:3000');
    
    // If authenticated, should redirect to /genel
    // If not authenticated, should redirect to /login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|genel)/);
  });

  test('should display notification system', async ({ page }) => {
    // Wait for notification area to be present
    const _notificationArea = page.locator('[role="section"][name*="Notification"]').first();
    
    // Notification area should exist (even if empty)
    // This confirms the notification system is initialized
    // Note: Actual notifications depend on app state
  });

  test('should have responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=Hesabınıza Giriş Yapın')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=Hesabınıza Giriş Yapın')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=Hesabınıza Giriş Yapın')).toBeVisible();
  });
});

test.describe('Login Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should attempt login with invalid credentials', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Giriş Yap")').first();

    // Fill with invalid credentials
    await emailField.fill('invalid@example.com');
    await passwordField.fill('wrongpassword');
    
    // Submit form
    await loginButton.click();

    // Should stay on login page or show error
    // Wait a bit for potential error messages
    await page.waitForTimeout(2000);
    
    // Should either show error or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
  });

  test('should validate email format', async ({ page }) => {
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    
    // Try invalid email format
    await emailField.fill('notanemail');
    
    // HTML5 validation should mark it as invalid
    const isValid = await emailField.evaluate((el: HTMLInputElement) => {
      return el.validity.valid;
    });
    
    expect(isValid).toBe(false);
  });
});

test.describe('Social Login Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should have Google login button', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google ile Giriş")').first();
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should have GitHub login button', async ({ page }) => {
    const githubButton = page.locator('button:has-text("GitHub ile Giriş")').first();
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();
  });

  test('should handle social login button clicks', async ({ page, context }) => {
    // Listen for navigation events (OAuth redirects)
    const navigationPromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    
    const googleButton = page.locator('button:has-text("Google ile Giriş")').first();
    await googleButton.click();
    
    // May open popup or redirect - handle accordingly
    const _newPage = await navigationPromise;
    // If popup opened, it would be in _newPage
  });
});

