import { test, expect } from '@playwright/test';

/**
 * Example Playwright Test Suite
 *
 * This file demonstrates basic Playwright test patterns and serves as a
 * quick validation that Playwright is correctly installed and configured.
 *
 * Run with: SKIP_WEBSERVER=true npx playwright test example
 *
 * Note: These tests are self-contained and don't require external network access
 * or a running application server, making them ideal for quick validation.
 * The SKIP_WEBSERVER flag prevents Playwright from trying to start the Next.js
 * application, which significantly speeds up test execution for these standalone tests.
 */

test.describe('Example Test Suite - Basic Page Interactions', () => {
  test('basic test example - verify page title', async ({ page }) => {
    // Create a simple HTML page with a title
    await page.goto(
      'data:text/html,<html><head><title>Example Test Page</title></head><body><h1>Test Page</h1></body></html>'
    );

    // Expect the page to have the correct title
    await expect(page).toHaveTitle('Example Test Page');
  });

  test('basic test example - verify heading visibility', async ({ page }) => {
    // Create a page with various heading levels
    await page.goto(
      'data:text/html,<html><body><h1>Main Heading</h1><h2>Subheading</h2><p>Paragraph content</p></body></html>'
    );

    // Verify headings are visible
    await expect(page.getByRole('heading', { name: 'Main Heading', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Subheading', level: 2 })).toBeVisible();
  });

  test('basic test example - verify multiple elements', async ({ page }) => {
    // Create a page with multiple elements and content types
    const html = `
      <html>
        <body>
          <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div id="home"><h1>Home Page</h1></div>
          <div id="about"><h1>About Page</h1></div>
          <div id="contact"><h1>Contact Page</h1></div>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Verify all navigation links are visible
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();

    // Verify all content sections exist
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#about')).toBeVisible();
    await expect(page.locator('#contact')).toBeVisible();
  });

  test('basic test example - verify button interactions', async ({ page }) => {
    // Create a page with interactive elements
    const html = `
      <html>
        <body>
          <h1>Hello World</h1>
          <button id="testBtn">Click me</button>
          <input type="text" id="testInput" placeholder="Type here">
          <div id="output"></div>
          <script>
            document.getElementById('testBtn').addEventListener('click', function() {
              document.getElementById('output').textContent = 'Button clicked!';
            });
          </script>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Verify heading
    await expect(page.locator('h1')).toHaveText('Hello World');

    // Interact with button and verify JavaScript execution
    const button = page.locator('#testBtn');
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('#output')).toHaveText('Button clicked!');

    // Interact with input
    const input = page.locator('#testInput');
    await input.fill('Test input');
    await expect(input).toHaveValue('Test input');
  });

  test('basic test example - verify CSS selectors and classes', async ({ page }) => {
    // Create a page with various CSS classes and selectors
    const html = `
      <html>
        <body>
          <div class="container primary">
            <p class="text highlighted">Sample text</p>
            <span id="info" data-testid="info-span">Additional info</span>
          </div>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Text content assertions
    const paragraph = page.locator('p.text');
    await expect(paragraph).toBeVisible();
    await expect(paragraph).toHaveText('Sample text');
    await expect(paragraph).toHaveClass(/text/);
    await expect(paragraph).toHaveClass(/highlighted/);

    // Container assertions
    const container = page.locator('div.container');
    await expect(container).toBeVisible();
    await expect(container).toContainText('Sample text');
    await expect(container).toHaveClass(/primary/);

    // Test data-testid selector
    const infoSpan = page.getByTestId('info-span');
    await expect(infoSpan).toBeVisible();
    await expect(infoSpan).toHaveText('Additional info');
  });
});

test.describe('Example Form Testing', () => {
  test('basic test example - form inputs and validation', async ({ page }) => {
    // Create a form with various input types
    const html = `
      <html>
        <body>
          <form id="testForm">
            <input type="text" name="username" placeholder="Username" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="checkbox" id="terms" name="terms">
            <label for="terms">Accept terms</label>
            <select name="country">
              <option value="">Select country</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="tr">Turkey</option>
            </select>
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Fill text input
    await page.fill('input[name="username"]', 'testuser');
    await expect(page.locator('input[name="username"]')).toHaveValue('testuser');

    // Fill email input
    await page.fill('input[name="email"]', 'test@example.com');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');

    // Check checkbox
    await page.check('#terms');
    await expect(page.locator('#terms')).toBeChecked();

    // Select dropdown option
    await page.selectOption('select[name="country"]', 'tr');
    await expect(page.locator('select[name="country"]')).toHaveValue('tr');
  });

  test('basic test example - radio buttons', async ({ page }) => {
    // Create a form with radio buttons
    const html = `
      <html>
        <body>
          <form>
            <label><input type="radio" name="option" value="1"> Option 1</label>
            <label><input type="radio" name="option" value="2"> Option 2</label>
            <label><input type="radio" name="option" value="3"> Option 3</label>
          </form>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Select second radio button
    await page.check('input[name="option"][value="2"]');
    await expect(page.locator('input[name="option"][value="2"]')).toBeChecked();

    // Verify other radio buttons are not checked
    await expect(page.locator('input[name="option"][value="1"]')).not.toBeChecked();
    await expect(page.locator('input[name="option"][value="3"]')).not.toBeChecked();
  });
});

test.describe('Example Responsive Testing', () => {
  test('basic test example - viewport sizes', async ({ page }) => {
    // Create a responsive page
    const html = `
      <html>
        <head>
          <style>
            .mobile-only { display: none; }
            @media (max-width: 768px) {
              .mobile-only { display: block; }
              .desktop-only { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="mobile-only">Mobile View</div>
          <div class="desktop-only">Desktop View</div>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.desktop-only')).toBeVisible();
    const desktopViewport = page.viewportSize();
    expect(desktopViewport?.width).toBe(1280);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.mobile-only')).toBeVisible();
    const mobileViewport = page.viewportSize();
    expect(mobileViewport?.width).toBe(375);
  });
});

test.describe('Example Async Operations', () => {
  test('basic test example - waiting for elements', async ({ page }) => {
    // Create a page with delayed content
    const html = `
      <html>
        <body>
          <button id="loadBtn">Load Content</button>
          <div id="content"></div>
          <script>
            document.getElementById('loadBtn').addEventListener('click', function() {
              setTimeout(function() {
                document.getElementById('content').innerHTML = '<p>Loaded content</p>';
              }, 500);
            });
          </script>
        </body>
      </html>
    `;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);

    // Click button to trigger async content load
    await page.click('#loadBtn');

    // Wait for content to appear
    await expect(page.locator('#content p')).toBeVisible();
    await expect(page.locator('#content p')).toHaveText('Loaded content');
  });

  test('basic test example - page load timing', async ({ page }) => {
    // Create a simple page and measure load time
    const startTime = Date.now();
    await page.goto('data:text/html,<html><body><h1>Fast Loading Page</h1></body></html>');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Verify fast load time (under 5 seconds for a data URL)
    expect(loadTime).toBeLessThan(5000);
  });
});
