import { test, expect } from "@playwright/test";

/**
 * Authentication E2E Tests
 * Tests login, logout, and session management flows
 */

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login page with all elements", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Kafkasder|Giriş/i);

    // Check email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Check password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check login button
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
  });

  test("should show validation errors for empty form submission", async ({
    page,
  }) => {
    // Click login without entering credentials
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Should show error messages
    await expect(page.locator("text=email", { exact: false })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Enter invalid credentials
    await page.fill(
      'input[type="email"], input[name="email"]',
      "invalid@test.com",
    );
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"], .error, .toast')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should redirect to dashboard on successful login (development mode)", async ({
    page,
  }) => {
    // In development mode, test credentials should be auto-filled
    // or we can use test credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Wait for potential auto-fill
    await page.waitForTimeout(1000);

    // If not auto-filled, use admin credentials
    const emailValue = await emailInput.inputValue();
    if (!emailValue) {
      await emailInput.fill("admin@kafkasder.com");
      await passwordInput.fill("Admin123!");
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (genel page)
    await expect(page).toHaveURL(/genel|dashboard/, { timeout: 15000 });
  });
});

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing protected route without auth", async ({
    page,
  }) => {
    // Try to access protected route
    await page.goto("/yardim/ihtiyac-sahipleri");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
