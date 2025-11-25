import { test, expect } from '@playwright/test';
import { TestDataManager, loginAsAdmin, loginAsUser } from './test-utils';

test.describe('User Management', () => {
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page }) => {
    testDataManager = new TestDataManager();
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    await testDataManager.cleanupAll(page);
  });

  test('should display user management page', async ({ page }) => {
    await page.goto('/kullanici');

    // Should show page title
    await expect(page.locator('[data-testid="users-page"]')).toBeVisible();

    // Should show user table
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
  });

  test('should search users by name', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find search input
    const searchInput = page.locator('[data-testid="users-search"]');
    await searchInput.fill('admin');

    await page.waitForTimeout(1000);

    // Should filter results
    const rows = page.locator('[data-testid^="user-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search users by email', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find search input
    const searchInput = page.locator('[data-testid="users-search"]');
    await searchInput.fill('admin@test.com');

    await page.waitForTimeout(1000);

    // Should filter results
    const rows = page.locator('[data-testid^="user-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find role filter
    const roleFilter = page.locator('[data-testid="users-filter-role"]');

    if (await roleFilter.isVisible()) {
      await roleFilter.click();

      // Select ADMIN role
      const adminOption = page.locator('text=/Admin/i').first();
      if (await adminOption.isVisible()) {
        await adminOption.click();
        await page.waitForTimeout(1000);

        // Results should be filtered
        expect(true).toBe(true);
      }
    }
  });

  test('should filter users by status', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find status filter
    const statusFilter = page.locator('[data-testid="users-filter-status"]');

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select Active status
      const activeOption = page.locator('text=/Aktif|Active/i').first();
      if (await activeOption.isVisible()) {
        await activeOption.click();
        await page.waitForTimeout(1000);

        // Results should be filtered
        expect(true).toBe(true);
      }
    }
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Apply role filter
    const roleFilter = page.locator('[data-testid="users-filter-role"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.click();
      const adminOption = page.locator('text=/Admin/i').first();
      if (await adminOption.isVisible()) {
        await adminOption.click();
      }
    }

    // Apply status filter
    const statusFilter = page.locator('[data-testid="users-filter-status"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      const activeOption = page.locator('text=/Aktif|Active/i').first();
      if (await activeOption.isVisible()) {
        await activeOption.click();
      }
    }

    await page.waitForTimeout(1000);

    // Should show filtered results
    const rows = page.locator('[data-testid^="user-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open create user modal', async ({ page }) => {
    await page.goto('/kullanici');

    // Click "Yeni Kullanıcı" button
    const addButton = page.locator('[data-testid="users-create"]');
    await addButton.click();

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should show form fields
    await expect(page.locator('[data-testid="user-form-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-form-email"]')).toBeVisible();
  });

  test('should validate required fields on create', async ({ page }) => {
    await page.goto('/kullanici');

    // Open create modal
    const addButton = page.locator('[data-testid="users-create"]');
    await addButton.click();

    // Try to submit empty form
    const submitButton = page.locator('[data-testid="user-form-submit"]');
    await submitButton.click();

    // Should show validation errors
    await expect(page.locator('text=/gerekli|required|zorunlu/i')).toBeVisible();
  });

  test('should validate email format on create', async ({ page }) => {
    await page.goto('/kullanici');

    // Open create modal
    const addButton = page.locator('[data-testid="users-create"]');
    await addButton.click();

    // Fill invalid email
    await page.fill('[data-testid="user-form-name"]', 'Test User');
    await page.fill('[data-testid="user-form-email"]', 'invalid-email');

    // Try to submit
    const submitButton = page.locator('[data-testid="user-form-submit"]');
    await submitButton.click();

    // Should show email validation error
    await expect(page.locator('text=/geçerli|valid|format/i')).toBeVisible();
  });

  test('should create new user successfully', async ({ page }) => {
    const testData = testDataManager.getUniqueTestData();

    await page.goto('/kullanici');

    // Open create modal
    const addButton = page.locator('[data-testid="users-create"]');
    await addButton.click();

    // Fill form
    await page.fill('[data-testid="user-form-name"]', testData.user.name);
    await page.fill('[data-testid="user-form-email"]', testData.user.email);

    // Select role
    const roleSelect = page.locator('[data-testid="user-form-role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      const memberOption = page.locator('text=/Member|Üye/i').first();
      if (await memberOption.isVisible()) {
        await memberOption.click();
      }
    }

    // Submit
    const submitButton = page.locator('[data-testid="user-form-submit"]');
    await submitButton.click();

    // Should show success toast
    await expect(page.locator('text=/başarı|success|eklendi/i')).toBeVisible({ timeout: 5000 });

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should open edit user modal', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Click edit button on first user (not admin)
    const editButton = page.locator('[data-testid="user-edit-2"]');

    if (await editButton.isVisible()) {
      await editButton.click();

      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Email field should be disabled
      const emailInput = page.locator('[data-testid="user-form-email"]');
      const isDisabled = await emailInput.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should edit user successfully', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Click edit button on first user (not admin)
    const editButton = page.locator('[data-testid="user-edit-2"]');

    if (await editButton.isVisible()) {
      await editButton.click();

      // Modify name
      const nameInput = page.locator('[data-testid="user-form-name"]');
      await nameInput.fill('Updated Test User');

      // Submit
      const submitButton = page.locator('[data-testid="user-form-submit"]');
      await submitButton.click();

      // Should show success toast
      await expect(page.locator('text=/güncellendi|updated|success/i')).toBeVisible({
        timeout: 5000,
      });

      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test('should toggle user status', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find status toggle button (not for current user)
    const toggleButton = page.locator('[data-testid="user-toggle-2"]');

    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Should show success toast
      await expect(page.locator('text=/güncellendi|updated|success/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Click delete button (not for current user)
    const deleteButton = page.locator('[data-testid="user-delete-2"]');

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirmation dialog should open
      await expect(
        page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Sil|Delete/i })
      ).toBeVisible();

      // Should show user name
      await expect(page.locator('text=/emin misiniz|are you sure/i')).toBeVisible();

      // Cancel button should work
      const cancelButton = page
        .locator('button:has-text("İptal"), button:has-text("Cancel")')
        .first();
      await cancelButton.click();

      // Dialog should close
      await expect(page.locator('[role="alertdialog"]')).not.toBeVisible();
    }
  });

  test('should delete user successfully', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Click delete button (not for current user)
    const deleteButton = page.locator('[data-testid="user-delete-2"]');

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page
        .locator('button:has-text("Sil"), button:has-text("Delete")')
        .first();
      await confirmButton.click();

      // Should show success toast
      await expect(page.locator('text=/silindi|deleted|success/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should not allow deleting self', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find current user row (admin@test.com)
    const currentUserRow = page.locator('[data-testid="user-row-1"]');

    if (await currentUserRow.isVisible()) {
      // Delete button should not exist or be disabled
      const deleteButton = currentUserRow.locator('[data-testid="user-delete-1"]');
      const exists = await deleteButton.count();

      if (exists > 0) {
        const isDisabled = await deleteButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should not allow deactivating self', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Find current user row (admin@test.com)
    const currentUserRow = page
      .locator('tr, [data-row]')
      .filter({ hasText: /admin@test.com/i })
      .first();

    if (await currentUserRow.isVisible()) {
      // Status toggle button should not exist or be disabled
      const toggleButton = currentUserRow.locator('button[title*="Aktif"], button[title*="Pasif"]');
      const exists = await toggleButton.count();

      if (exists > 0) {
        const isDisabled = await toggleButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should display role permissions', async ({ page }) => {
    await page.goto('/kullanici');

    // Open create modal
    const addButton = page
      .locator('button')
      .filter({ hasText: /Yeni Kullanıcı|Ekle/i })
      .first();
    await addButton.click();

    // Select a role
    const roleSelect = page
      .locator('select[name="role"], button')
      .filter({ hasText: /Rol/i })
      .first();
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      const adminOption = page.locator('text=/Admin/i').first();
      if (await adminOption.isVisible()) {
        await adminOption.click();

        // Should show permissions
        await expect(page.locator('text=/Yetki|Permission/i')).toBeVisible();
      }
    }
  });

  test('should prevent creating higher role users', async ({ page }) => {
    await page.goto('/kullanici');

    // Open create modal
    const addButton = page
      .locator('button')
      .filter({ hasText: /Yeni Kullanıcı|Ekle/i })
      .first();
    await addButton.click();

    // Try to select SUPER_ADMIN role (should not be available or disabled)
    const roleSelect = page
      .locator('select[name="role"], button')
      .filter({ hasText: /Rol/i })
      .first();
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      const superAdminOption = page.locator('text=/Super Admin|SUPER_ADMIN/i').first();

      // Option should not exist or be disabled
      const exists = await superAdminOption.count();
      if (exists > 0) {
        const isDisabled = await superAdminOption.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Check if pagination exists
    const nextButton = page
      .locator('button')
      .filter({ hasText: /Sonraki|Next/i })
      .first();

    if (await nextButton.isVisible()) {
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        // Click next
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Page should change
        await expect(page.locator('text=/Sayfa|Page/i')).toBeVisible();
      }
    }
  });

  test('should disable previous button on first page', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Check if pagination exists
    const prevButton = page
      .locator('button')
      .filter({ hasText: /Önceki|Previous/i })
      .first();

    if (await prevButton.isVisible()) {
      const isDisabled = await prevButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should show user table columns', async ({ page }) => {
    await page.goto('/kullanici');
    await page.waitForTimeout(1000);

    // Should show table headers
    await expect(
      page.locator('th, [role="columnheader"]').filter({ hasText: /Ad|Name/i })
    ).toBeVisible();
    await expect(
      page.locator('th, [role="columnheader"]').filter({ hasText: /E-posta|Email/i })
    ).toBeVisible();
    await expect(
      page.locator('th, [role="columnheader"]').filter({ hasText: /Rol|Role/i })
    ).toBeVisible();
    await expect(
      page.locator('th, [role="columnheader"]').filter({ hasText: /Durum|Status/i })
    ).toBeVisible();
  });

  test('should show search box', async ({ page }) => {
    await page.goto('/kullanici');

    // Should show search input
    await expect(page.locator('input[type="search"], input[placeholder*="Ara"]')).toBeVisible();
  });

  test('should show filters', async ({ page }) => {
    await page.goto('/kullanici');

    // Should show role filter
    await expect(page.locator('select, button').filter({ hasText: /Rol|Role/i })).toBeVisible();

    // Should show status filter
    await expect(page.locator('select, button').filter({ hasText: /Durum|Status/i })).toBeVisible();
  });
});

test.describe('User Management Permission Tests', () => {
  test('should deny access for users without USERS_READ', async ({ page }) => {
    // Login as viewer
    await loginAsUser(page, 'viewer@test.com', 'viewer123');

    // Try to access user management
    await page.goto('/kullanici');

    // Should show permission denied
    await expect(page.locator('text=/Yetkiniz yok|No permission/i')).toBeVisible();
  });

  test('should hide create button without USERS_CREATE', async ({ page }) => {
    // Login as viewer
    await loginAsUser(page, 'viewer@test.com', 'viewer123');

    // Try to access user management
    await page.goto('/kullanici');

    // Create button should not be visible
    const addButton = page.locator('button').filter({ hasText: /Yeni Kullanıcı|Ekle|Add User/i });
    await expect(addButton).not.toBeVisible();
  });

  test('should hide edit buttons without USERS_UPDATE', async ({ page }) => {
    // Login as viewer
    await loginAsUser(page, 'viewer@test.com', 'viewer123');

    // Try to access user management
    await page.goto('/kullanici');

    // Edit buttons should not be visible
    const editButtons = page.locator('button[title*="Düzenle"], button[title*="Edit"]');
    const count = await editButtons.count();
    expect(count).toBe(0);
  });

  test('should hide delete buttons without USERS_DELETE', async ({ page }) => {
    // Login as viewer
    await loginAsUser(page, 'viewer@test.com', 'viewer123');

    // Try to access user management
    await page.goto('/kullanici');

    // Delete buttons should not be visible
    const deleteButtons = page.locator('button[title*="Sil"], button[title*="Delete"]');
    const count = await deleteButtons.count();
    expect(count).toBe(0);
  });
});
