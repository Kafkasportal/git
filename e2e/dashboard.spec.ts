import { test, expect } from "@playwright/test";

/**
 * Dashboard E2E Tests
 * Tests main dashboard functionality and components
 */

// Reusable login helper
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill("admin@kafkasder.com");
  await passwordInput.fill("Admin123!");
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  await expect(page).toHaveURL(/genel|dashboard/, { timeout: 15000 });
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should display dashboard with KPI cards", async ({ page }) => {
    // Check for KPI cards
    const kpiCards = page.locator('[class*="card"], [data-testid*="kpi"]');
    await expect(kpiCards.first()).toBeVisible();

    // Check for specific KPI titles
    await expect(page.locator("text=Bekleyen İşlemler")).toBeVisible();
    await expect(page.locator("text=Takipteki İş Kayıtları")).toBeVisible();
  });

  test("should display charts section", async ({ page }) => {
    // Check for chart containers
    await expect(page.locator("text=Bağış Trendi")).toBeVisible();
    await expect(page.locator("text=Yardım Kategorileri")).toBeVisible();
  });

  test("should display quick actions", async ({ page }) => {
    // Check for quick action links
    await expect(page.locator("text=Hızlı Erişim")).toBeVisible();
    await expect(page.locator("text=İhtiyaç Sahipleri").first()).toBeVisible();
    await expect(page.locator("text=Bağışlar").first()).toBeVisible();
  });

  test("should display system status", async ({ page }) => {
    // Check for system status section
    await expect(page.locator("text=Sistem Durumu")).toBeVisible();

    // Check for active badges
    const activeBadges = page.locator("text=Aktif");
    await expect(activeBadges.first()).toBeVisible();
  });

  test("should navigate to beneficiaries page", async ({ page }) => {
    // Click on İhtiyaç Sahipleri link
    await page.click("text=İhtiyaç Sahipleri >> nth=0");

    // Should navigate to beneficiaries page
    await expect(page).toHaveURL(/ihtiyac-sahipleri/);
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should display sidebar navigation", async ({ page }) => {
    // Check for sidebar
    const sidebar = page.locator('nav, [role="navigation"], aside');
    await expect(sidebar.first()).toBeVisible();
  });

  test("should navigate between pages", async ({ page }) => {
    // Navigate to Bağışlar
    await page.click("text=Bağış >> nth=0");
    await expect(page).toHaveURL(/bagis/);

    // Navigate back to dashboard
    await page.click("text=Genel >> nth=0");
    await expect(page).toHaveURL(/genel/);
  });
});
