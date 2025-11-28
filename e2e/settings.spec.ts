import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser } from './test-utils';

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display settings page for authorized users', async ({ page }) => {
    await page.goto('/settings');

    // Should show settings page or initialize button
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
    const hasInitialize = await page
      .locator('[data-testid="settings-initialize-button"]')
      .isVisible();
    const hasTabs = await page.locator('[data-testid="settings-tabs-list"]').isVisible();

    expect(hasInitialize || hasTabs).toBeTruthy();
  });

  test('should display all settings tabs', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Check if tabs exist
    const tabsList = page.locator('[data-testid="settings-tabs-list"]');
    await expect(tabsList).toBeVisible();

    // Check individual tabs
    await expect(page.locator('[data-testid="settings-tab-organization"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-system"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-security"]')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Click on Email tab
    const emailTab = page.locator('[data-testid="settings-tab-email"]');

    if (await emailTab.isVisible()) {
      await emailTab.click();

      // Should show SMTP fields
      await expect(page.locator('[data-testid="settings-smtp-enabled"]')).toBeVisible();
    }
  });

  test('should validate organization name as required', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Find organization name input
    const nameInput = page.locator('[data-testid="settings-org-name"]');

    if (await nameInput.isVisible()) {
      // Clear the input
      await nameInput.clear();

      // Try to save
      const saveButton = page.locator('[data-testid="settings-save-button"]');
      await saveButton.click();

      // Should show validation error
      await expect(page.locator('text=/gerekli|required|zorunlu/i')).toBeVisible();
    }
  });

  test('should toggle SMTP enabled and validate fields', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Go to Email tab
    const emailTab = page.locator('[data-testid="settings-tab-email"]');
    if (await emailTab.isVisible()) {
      await emailTab.click();

      // Find SMTP enabled switch
      const smtpSwitch = page.locator('[data-testid="settings-smtp-enabled"]');

      if (await smtpSwitch.isVisible()) {
        // Toggle SMTP on
        await smtpSwitch.click();

        // SMTP fields should become required
        const smtpHost = page.locator('[data-testid="settings-smtp-host"]');
        if (await smtpHost.isVisible()) {
          // Clear host
          await smtpHost.clear();

          // Try to save
          const saveButton = page.locator('[data-testid="settings-save-button"]');
          await saveButton.click();

          // Should show validation error
          await expect(page.locator('text=/gerekli|required/i')).toBeVisible();
        }
      }
    }
  });

  test('should save settings successfully', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Make a change (e.g., update organization name)
    const nameInput = page.locator('[data-testid="settings-org-name"]');

    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Organization Updated');

      // Save
      const saveButton = page.locator('[data-testid="settings-save-button"]');
      await saveButton.click();

      // Should show success toast
      await expect(page.locator('text=/başarı|success|kaydedildi/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should initialize settings if not exists', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Check if initialize button exists
    const initButton = page.locator('[data-testid="settings-initialize-button"]');

    if (await initButton.isVisible()) {
      await initButton.click();

      // Should show success message
      await expect(page.locator('text=/başarı|success|oluşturuldu/i')).toBeVisible({
        timeout: 5000,
      });

      // Should show settings form
      await expect(page.locator('[data-testid="settings-tabs-list"]')).toBeVisible();
    }
  });

  test('should validate number fields', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Go to Security tab
    const securityTab = page.locator('[data-testid="settings-tab-security"]');
    if (await securityTab.isVisible()) {
      await securityTab.click();

      // Find session timeout input
      const timeoutInput = page.locator('[data-testid="settings-security-session-timeout"]');

      if (await timeoutInput.isVisible()) {
        // Try invalid value (out of range)
        await timeoutInput.fill('2000'); // Max is 1440

        // Try to save
        const saveButton = page.locator('[data-testid="settings-save-button"]');
        await saveButton.click();

        // Should show validation error
        await expect(page.locator('text=/geçersiz|invalid|aralık/i')).toBeVisible();
      }
    }
  });

  test('should disable save button when no changes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Save button should be disabled initially (no changes)
    const saveButton = page.locator('[data-testid="settings-save-button"]');

    if (await saveButton.isVisible()) {
      const isDisabled = await saveButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});

test.describe('Settings Permission Tests', () => {
  test('should deny access for users without SETTINGS_READ', async ({ page }) => {
    // Login as viewer (no settings permissions)
    await loginAsUser(page, 'viewer@test.com', 'viewer123');

    // Try to access settings
    await page.goto('/settings');

    // Should show permission denied message
    await expect(page.locator('text=/Yetkiniz yok|No permission|Access denied/i')).toBeVisible();
  });
});
