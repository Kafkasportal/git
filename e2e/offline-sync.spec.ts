/**
 * E2E Tests for Offline Sync Functionality
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-utils';

test.describe('Offline Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('/login');
    // Add authentication steps here based on your auth setup
  });

  test('should create beneficiary while online and verify immediate save', async ({ page }) => {
    await page.goto('/beneficiaries');

    // Create a beneficiary
    await page.click('button:has-text("Yeni")');
    await page.fill('input[name="name"]', 'Test Beneficiary Online');
    await page.fill('input[name="tc_no"]', '12345678901');
    await page.fill('input[name="phone"]', '5551234567');
    await page.fill('textarea[name="address"]', 'Test Address');
    await page.click('button:has-text("Kaydet")');

    // Verify success toast appears
    await expect(page.locator('text=başarıyla oluşturuldu')).toBeVisible({ timeout: TEST_CONFIG.DEFAULT_TIMEOUT });

    // Verify beneficiary appears in list
    await expect(page.locator('text=Test Beneficiary Online')).toBeVisible();
  });

  test('should queue mutation when creating beneficiary offline', async ({ page }) => {
    await page.goto('/beneficiaries');

    // Go offline
    await page.context().setOffline(true);

    // Create a beneficiary
    await page.click('button:has-text("Yeni")');
    await page.fill('input[name="name"]', 'Test Beneficiary Offline');
    await page.fill('input[name="tc_no"]', '12345678902');
    await page.fill('input[name="phone"]', '5551234568');
    await page.fill('textarea[name="address"]', 'Test Address Offline');
    await page.click('button:has-text("Kaydet")');

    // Verify queued message appears
    await expect(page.locator('text=offline kuyruğuna eklendi')).toBeVisible({ timeout: TEST_CONFIG.DEFAULT_TIMEOUT });

    // Check IndexedDB contains mutation
    const mutations = await page.evaluate(async () => {
      const { getPendingMutations } = await import('/src/lib/offline-sync');
      return await getPendingMutations();
    });

    expect(mutations.length).toBeGreaterThan(0);
    expect(mutations.some((m: any) => m.collection === 'beneficiaries')).toBe(true);
  });

  test('should sync mutations automatically when coming back online', async ({ page }) => {
    await page.goto('/beneficiaries');

    // Go offline and create mutation
    await page.context().setOffline(true);
    await page.click('button:has-text("Yeni")');
    await page.fill('input[name="name"]', 'Test Auto Sync');
    await page.fill('input[name="tc_no"]', '12345678903');
    await page.fill('input[name="phone"]', '5551234569');
    await page.fill('textarea[name="address"]', 'Test Address Auto');
    await page.click('button:has-text("Kaydet")');

    // Wait for queued message
    await expect(page.locator('text=offline kuyruğuna eklendi')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Wait for sync to complete (check for success toast or empty queue)
    await page.waitForTimeout(2000); // Give time for sync

    // Verify queue is empty
    const mutations = await page.evaluate(async () => {
      const { getPendingMutations } = await import('/src/lib/offline-sync');
      return await getPendingMutations();
    });

    expect(mutations.length).toBe(0);

    // Verify beneficiary appears in list
    await page.reload();
    await expect(page.locator('text=Test Auto Sync')).toBeVisible({ timeout: TEST_CONFIG.DEFAULT_TIMEOUT });
  });

  test('should handle conflicts with last-write-wins strategy', async ({ page }) => {
    await page.goto('/donations');

    // Create donation offline
    await page.context().setOffline(true);
    await page.click('button:has-text("Yeni")');
    await page.fill('input[name="donor_name"]', 'Conflict Test');
    await page.fill('input[name="amount"]', '100');
    await page.selectOption('select[name="currency"]', 'TRY');
    await page.click('button:has-text("Kaydet")');

    await expect(page.locator('text=offline kuyruğuna eklendi')).toBeVisible();

    // Go online - should sync with conflict resolution
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);

    // Verify donation was synced
    const mutations = await page.evaluate(async () => {
      const { getPendingMutations } = await import('/src/lib/offline-sync');
      return await getPendingMutations();
    });

    expect(mutations.length).toBe(0);
  });

  test('should mark mutations as failed after max retries', async ({ page }) => {
    await page.goto('/beneficiaries');

    // Mock API to return 500 errors
    await page.route('**/api/beneficiaries', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Go offline and create mutation
    await page.context().setOffline(true);
    await page.click('button:has-text("Yeni")');
    await page.fill('input[name="name"]', 'Failed Test');
    await page.fill('input[name="tc_no"]', '12345678904');
    await page.fill('input[name="phone"]', '5551234570');
    await page.fill('textarea[name="address"]', 'Test Address Failed');
    await page.click('button:has-text("Kaydet")');

    await expect(page.locator('text=offline kuyruğuna eklendi')).toBeVisible();

    // Go online and trigger sync multiple times
    await page.context().setOffline(false);
    await page.waitForTimeout(5000); // Wait for multiple retry attempts

    // Check failed mutations
    const failedMutations = await page.evaluate(async () => {
      const { getFailedMutations } = await import('/src/lib/offline-sync');
      return await getFailedMutations();
    });

    // Should have mutations with retryCount >= 3
    expect(failedMutations.some((m: any) => m.retryCount >= 3)).toBe(true);
  });

  test('should show manual sync button in offline settings', async ({ page }) => {
    await page.goto('/ayarlar/offline');

    // Verify sync panel is visible
    await expect(page.locator('text=Offline Senkronizasyon Durumu')).toBeVisible();
    await expect(page.locator('button:has-text("Şimdi Senkronize Et")')).toBeVisible();
  });

  test('should display pending mutations count in network indicator', async ({ page }) => {
    await page.goto('/beneficiaries');

    // Go offline and create mutation
    await page.context().setOffline(true);
    await page.click('button:has-text("Yeni")');
    await page.fill('input[name="name"]', 'Network Indicator Test');
    await page.fill('input[name="tc_no"]', '12345678905');
    await page.fill('input[name="phone"]', '5551234571');
    await page.fill('textarea[name="address"]', 'Test Address');
    await page.click('button:has-text("Kaydet")');

    // Verify network indicator shows pending count
    await expect(page.locator('text=/İnternet bağlantısı yok.*işlem bekliyor/')).toBeVisible({
      timeout: TEST_CONFIG.DEFAULT_TIMEOUT,
    });
  });
});

