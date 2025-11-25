# Playwright MCP Browser Guide

This guide explains how to use the Cursor IDE Browser MCP server for browser automation, similar to Playwright but through the Model Context Protocol (MCP).

## Overview

The **cursor-ide-browser** MCP server provides browser automation capabilities through MCP tools, allowing AI assistants to interact with web pages programmatically. This is particularly useful for:

- **Interactive Testing**: Testing web applications with AI assistance
- **Web Scraping**: Extracting data from websites
- **UI Validation**: Verifying page elements and interactions
- **Visual Debugging**: Taking screenshots and analyzing page structure
- **Automation Scripts**: Automating repetitive browser tasks

## Comparison: Playwright vs Browser MCP

| Feature | Playwright | Browser MCP |
|---------|-----------|-------------|
| **Execution** | Standalone tests, CI/CD | AI-assisted automation |
| **Syntax** | JavaScript/TypeScript | Natural language + MCP tools |
| **Use Case** | Automated testing | Interactive exploration & testing |
| **Page Access** | Direct page object | Via snapshot/accessibility tree |
| **Debugging** | Trace viewer, UI mode | AI can describe what it sees |
| **Best For** | Regression tests, CI | Exploratory testing, quick checks |

## Available Browser MCP Tools

### Navigation
- `browser_navigate` - Navigate to a URL
- `browser_navigate_back` - Go back to previous page
- `browser_resize` - Resize browser window

### Page Interaction
- `browser_snapshot` - Get accessibility snapshot (recommended over screenshot)
- `browser_take_screenshot` - Capture screenshot
- `browser_click` - Click on elements
- `browser_type` - Type text into inputs
- `browser_hover` - Hover over elements
- `browser_press_key` - Press keyboard keys
- `browser_select_option` - Select dropdown options

### Utilities
- `browser_wait_for` - Wait for text/appearance/time
- `browser_console_messages` - Get console messages
- `browser_network_requests` - Get network request logs

## Usage Examples

### Example 1: Basic Navigation and Screenshot

**Natural Language Request:**
```
"Navigate to https://example.com and take a screenshot"
```

**MCP Tool Calls (Automated):**
```json
{
  "tool": "browser_navigate",
  "params": {
    "url": "https://example.com"
  }
}
{
  "tool": "browser_take_screenshot",
  "params": {
    "fullPage": true,
    "filename": "example-page.png"
  }
}
```

### Example 2: Form Interaction

**Natural Language Request:**
```
"Go to the login page, fill in the email field with user@example.com, 
type password123 in the password field, and click the submit button"
```

**MCP Tool Flow:**
1. Navigate to login page
2. Take snapshot to see form structure
3. Type email into email input
4. Type password into password input
5. Click submit button
6. Wait for navigation/response
7. Take snapshot to verify result

### Example 3: Element Verification

**Natural Language Request:**
```
"Check if the page has a heading that says 'Welcome' and verify it's visible"
```

**MCP Tool Flow:**
1. Take snapshot (shows all accessible elements)
2. AI analyzes snapshot for heading text
3. Report visibility status

## Using Browser MCP with Your Project

### Testing Your Application Locally

1. **Start your development server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

2. **Ask AI to test:**
   ```
   "Navigate to http://localhost:3000 and test the login form"
   ```

3. **The AI will:**
   - Navigate to the page
   - Take a snapshot to see the structure
   - Interact with elements as needed
   - Report findings

### Example Test Scenarios

#### Login Flow Test
```
"Test the login flow:
1. Go to http://localhost:3000/login
2. Take a snapshot to see the form
3. Fill in email: admin@example.com
4. Fill in password: test123
5. Click the login button
6. Wait for navigation
7. Verify we're on the dashboard page"
```

#### Form Validation Test
```
"Test the beneficiary form:
1. Navigate to the beneficiaries page
2. Click 'Add New' button
3. Try to submit empty form
4. Check if validation errors appear
5. Fill in required fields
6. Submit and verify success"
```

#### UI Element Check
```
"Check the dashboard:
1. Navigate to http://localhost:3000
2. Verify the main navigation menu is visible
3. Check if all menu items are present
4. Take a screenshot for visual verification"
```

## Best Practices

### 1. Use Snapshots Before Interactions

**Good:**
```
"Take a snapshot first, then click the submit button"
```

**Why:** Snapshots provide accessibility tree information that helps AI understand page structure better than screenshots alone.

### 2. Wait for Dynamic Content

**Good:**
```
"Wait for 'Loading complete' text to appear, then take snapshot"
```

**Why:** Modern web apps load content asynchronously. Always wait for content before interacting.

### 3. Combine with Playwright for CI/CD

**Use Browser MCP for:**
- Quick exploratory testing
- Debugging during development
- Visual verification
- Interactive test creation

**Use Playwright for:**
- Automated regression tests
- CI/CD pipelines
- Performance testing
- Multi-browser testing

### 4. Element Selection Strategy

**Prefer accessibility-based selection:**
- Use element descriptions: "Submit button"
- Use text content: "Login"
- Use roles: "heading", "button", "textbox"

**The AI will use refs from snapshots**, which is more reliable than CSS selectors.

## Integration with Playwright Tests

You can use Browser MCP to **generate** Playwright tests:

1. **Use Browser MCP to explore:**
   ```
   "Test the login flow and describe each step"
   ```

2. **AI generates Playwright test:**
   ```typescript
   test('login flow', async ({ page }) => {
     await page.goto('http://localhost:3000/login');
     await page.fill('[name="email"]', 'admin@example.com');
     await page.fill('[name="password"]', 'test123');
     await page.click('button[type="submit"]');
     await expect(page).toHaveURL(/.*dashboard/);
   });
   ```

3. **Save as Playwright test file** in `e2e/` directory

## Configuration

### Verify Browser MCP is Available

The browser MCP server should be automatically available in Cursor IDE. You can verify by asking:

```
"What browser automation tools are available?"
```

### MCP Server Configuration

If you need to configure the browser MCP server, add it to your MCP settings (`.cursor/mcp_settings.json`):

```json
{
  "mcpServers": {
    "cursor-ide-browser": {
      "command": "npx",
      "args": ["-y", "@cursor/browser-mcp"],
      "env": {}
    }
  }
}
```

**Note:** In Cursor IDE, the browser MCP is typically built-in and doesn't require separate configuration.

## Debugging Tips

### 1. Check Console Messages
```
"Show me all console messages from the page"
```

Useful for debugging JavaScript errors or warnings.

### 2. Check Network Requests
```
"Show me all network requests made by the page"
```

Helps identify failed API calls or slow resources.

### 3. Take Multiple Snapshots
```
"Take a snapshot before and after clicking the button"
```

Compare snapshots to see what changed.

### 4. Use Screenshots for Visual Debugging
```
"Take a full-page screenshot and save it as debug.png"
```

Visual comparison helps catch layout issues.

## Common Workflows

### Workflow 1: Testing a New Feature

1. Start dev server
2. Ask AI to navigate to feature page
3. Test interactions step by step
4. If issues found, take snapshots/screenshots
5. Fix issues
6. Repeat until working
7. Generate Playwright test for CI/CD

### Workflow 2: Debugging a Failing Test

1. Run Playwright test to see failure
2. Use Browser MCP to manually reproduce
3. Take snapshots at failure point
4. Identify issue with AI assistance
5. Fix the code
6. Verify with Browser MCP
7. Run Playwright test again

### Workflow 3: Visual Regression Testing

1. Take screenshot of page state
2. Make changes
3. Take screenshot again
4. Compare with AI assistance
5. Document visual changes

## Limitations

### Browser MCP Limitations

- **Single Browser**: Only Chrome/Chromium
- **Manual Triggers**: Requires explicit AI requests
- **Not for CI/CD**: Better suited for development/debugging
- **Performance**: Slower than programmatic Playwright

### When to Use Playwright Instead

- Running automated tests in CI/CD
- Testing multiple browsers
- Performance benchmarks
- Large test suites
- Headless execution needed

## Example: Testing Your Application

### Test Authentication

```
"Test the authentication system:
1. Navigate to http://localhost:3000/login
2. Verify login form is visible
3. Try logging in with invalid credentials
4. Check for error message
5. Log in with valid credentials
6. Verify redirect to dashboard
7. Check if user menu is visible"
```

### Test Form Submission

```
"Test the beneficiary creation form:
1. Go to beneficiaries page
2. Click 'Add New Beneficiary'
3. Fill in all required fields
4. Submit the form
5. Wait for success message
6. Verify new beneficiary appears in list"
```

### Test Search Functionality

```
"Test the search feature:
1. Navigate to the beneficiaries page
2. Take a snapshot to find the search box
3. Type a search query
4. Wait for results to update
5. Verify results match the query
6. Take a screenshot of results"
```

## Resources

- [Playwright Documentation](../e2e/README.md)
- [MCP Setup Guide](./mcp-setup.md)
- [Testing Guide](./testing.md)
- [Browser MCP Tools Reference](https://cursor.sh/docs/mcp/browser)

## Summary

The Browser MCP tools provide an **interactive, AI-assisted** way to test and explore web applications, complementing your Playwright E2E test suite. Use Browser MCP for:

- ✅ Quick exploratory testing
- ✅ Interactive debugging
- ✅ Visual verification
- ✅ Test script generation
- ✅ Rapid iteration during development

Use Playwright for:
- ✅ Automated regression tests
- ✅ CI/CD integration
- ✅ Multi-browser testing
- ✅ Performance benchmarks

Together, they provide a comprehensive testing strategy!

