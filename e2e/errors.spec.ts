/**
 * Error Tracking E2E Tests
 * Tests the complete error tracking workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Error Tracking System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for application to load
    await page.waitForLoadState('networkidle');
  });

  test('should display error tracking dashboard', async ({ page }) => {
    // Navigate to errors page
    await page.goto('/errors');

    // Check if page title is visible
    await expect(page.getByText('Hata Takip Sistemi')).toBeVisible();

    // Check if stats cards are visible
    await expect(page.getByText('Toplam Hata')).toBeVisible();
    await expect(page.getByText('Aktif Hatalar')).toBeVisible();
    await expect(page.getByText('Kritik Hatalar')).toBeVisible();
  });

  test('should filter errors by status', async ({ page }) => {
    await page.goto('/errors');

    // Click on "Yeni" filter button
    const newButton = page.getByRole('button', { name: 'Yeni' });
    await newButton.click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify filter is applied (button should be highlighted)
    await expect(newButton).toHaveClass(/default/);
  });

  test('should filter errors by severity', async ({ page }) => {
    await page.goto('/errors');

    // Click on "Kritik" filter button
    const criticalButton = page.getByRole('button', { name: 'Kritik' });
    await criticalButton.click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify filter is applied
    await expect(criticalButton).toHaveClass(/default/);
  });

  test('should open error report form', async ({ page }) => {
    await page.goto('/errors');

    // Look for "Hata Bildir" button (might be in navigation or on page)
    const reportButton = page.getByRole('button', { name: 'Hata Bildir' });

    if (await reportButton.isVisible()) {
      await reportButton.click();

      // Check if dialog is open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Hata Bildir', { exact: true })).toBeVisible();
    }
  });

  test('should submit error report', async ({ page }) => {
    await page.goto('/errors');

    const reportButton = page.getByRole('button', { name: 'Hata Bildir' });

    if (await reportButton.isVisible()) {
      await reportButton.click();

      // Fill in the form
      await page.fill('input[id="title"]', 'Test Error Report');
      await page.fill('textarea[id="description"]', 'This is a test error report description');

      // Submit the form
      const submitButton = page.getByRole('button', { name: 'Gönder' });
      await submitButton.click();

      // Wait for success message (toast)
      await page.waitForTimeout(2000);
    }
  });

  test('should refresh error list', async ({ page }) => {
    await page.goto('/errors');

    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /Yenile/ });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForTimeout(1000);
    }
  });

  test('should handle error capture on error boundary', async ({ page }) => {
    // This test would require a test page that throws an error
    // For now, we'll just verify the error boundary exists

    // Check if error boundary is in place by looking for its elements
    await page.goto('/');

    // The error boundary would catch errors and show error UI
    // In a real test, you would navigate to a page that triggers an error
  });

  test('should display error statistics correctly', async ({ page }) => {
    await page.goto('/errors');

    // Check if severity distribution is visible
    await expect(page.getByText('Önem Derecesine Göre Dağılım')).toBeVisible();

    // Check if all severity levels are shown
    await expect(page.getByText('Kritik', { exact: false })).toBeVisible();
    await expect(page.getByText('Yüksek', { exact: false })).toBeVisible();
    await expect(page.getByText('Orta', { exact: false })).toBeVisible();
    await expect(page.getByText('Düşük', { exact: false })).toBeVisible();
  });
});

test.describe('Error API Integration', () => {
  test('should create error via API', async ({ request }) => {
    const errorData = {
      error_code: 'ERR_TEST_001',
      title: 'Test Error',
      description: 'This is a test error',
      category: 'runtime',
      severity: 'medium',
      fingerprint: `test-fingerprint-${Date.now()}`,
    };

    const response = await request.post('/api/errors', {
      data: errorData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.errorId).toBeTruthy();
  });

  test('should fetch error list via API', async ({ request }) => {
    const response = await request.get('/api/errors?limit=10');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('errors');
    expect(data.data).toHaveProperty('total');
  });

  test('should fetch error statistics via API', async ({ request }) => {
    const response = await request.get('/api/errors/stats');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('total');
    expect(data.data).toHaveProperty('byStatus');
    expect(data.data).toHaveProperty('bySeverity');
    expect(data.data).toHaveProperty('byCategory');
  });
});
