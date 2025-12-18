import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { retryNavigation } from './utils/retry';
import percySnapshot from '@percy/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should not have any automatically detectable accessibility violations', async ({ page }) => {
    await retryNavigation(page, '/');
    await page.waitForLoadState('networkidle');
    
    // Take Percy snapshot before accessibility check
    await percySnapshot(page, 'Accessibility Test - Homepage');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('homepage should meet WCAG 2.1 Level AA standards', async ({ page }) => {
    await retryNavigation(page, '/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations Found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should be accessible', async ({ page }) => {
    await retryNavigation(page, '/login');
    await page.waitForLoadState('networkidle');
    
    // Take Percy snapshot of login page
    await percySnapshot(page, 'Accessibility Test - Login Page');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations on Login Page:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work on homepage', async ({ page }) => {
    await retryNavigation(page, '/');
    await page.waitForLoadState('networkidle');

    // Check for keyboard-accessible elements
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all interactive elements should have accessible names', async ({ page }) => {
    await retryNavigation(page, '/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    // Filter for critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      console.log('Critical Accessibility Issues:');
      criticalViolations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(criticalViolations).toEqual([]);
  });
});

