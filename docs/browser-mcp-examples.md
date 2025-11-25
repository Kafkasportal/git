# Browser MCP Practical Examples

Quick reference guide with practical examples for using Browser MCP tools with the Kafkasder Panel application.

## Quick Start

### 1. Test Your Local Application

Make sure your dev server is running:
```bash
npm run dev
```

Then ask:
```
"Navigate to http://localhost:3000 and show me what's on the page"
```

### 2. Test Login Flow

```
"Test the login:
1. Go to http://localhost:3000/login
2. Show me the login form structure
3. Fill in test credentials
4. Submit and verify redirect"
```

### 3. Test Dashboard

```
"Navigate to http://localhost:3000 and verify:
1. Main navigation is visible
2. Dashboard cards are present
3. User menu is accessible"
```

## Common Commands

### Navigation Commands

```
"Navigate to http://localhost:3000/login"
"Go back to the previous page"
"Navigate to http://localhost:3000/dashboard"
```

### Inspection Commands

```
"Take a snapshot of the current page"
"Take a full-page screenshot"
"Show me console messages"
"List all network requests"
```

### Interaction Commands

```
"Click the 'Submit' button"
"Fill in the email field with test@example.com"
"Type 'password123' in the password field"
"Hover over the user menu"
"Press Enter"
"Select 'Option 1' from the dropdown"
```

### Waiting Commands

```
"Wait for the page to load"
"Wait for 'Loading...' text to disappear"
"Wait 3 seconds"
```

## Example Workflows

### Workflow: Test Beneficiary Creation

```
"Test creating a new beneficiary:
1. Navigate to http://localhost:3000/beneficiaries
2. Click 'Add New' or 'Create' button
3. Show me the form structure
4. Fill in required fields:
   - Name: Test Beneficiary
   - TC No: 12345678901
   - Phone: 5551234567
   - Address: Test Address
5. Submit the form
6. Wait for success message
7. Verify the new beneficiary appears in the list"
```

### Workflow: Test Search Functionality

```
"Test the beneficiary search:
1. Go to beneficiaries page
2. Find the search input field
3. Type a search query
4. Wait for results to update
5. Verify results are filtered correctly
6. Take a screenshot of results"
```

### Workflow: Test Form Validation

```
"Test form validation:
1. Navigate to beneficiary form
2. Try to submit empty form
3. Check if validation errors appear
4. Verify error messages are correct
5. Fill in one field at a time
6. Check errors disappear as fields are completed"
```

### Workflow: Test Navigation

```
"Test the main navigation:
1. Go to homepage
2. Click each menu item
3. Verify correct pages load
4. Check breadcrumbs update
5. Test back button functionality"
```

## Integration with Existing Playwright Tests

### Convert Browser MCP Session to Playwright Test

After using Browser MCP to test manually, you can generate a Playwright test:

**Browser MCP Session:**
```
"Test login with admin credentials"
```

**Generated Playwright Test:**
```typescript
// e2e/login-mcp-generated.spec.ts
import { test, expect } from '@playwright/test';

test('login with admin credentials (generated from MCP)', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

## Debugging Examples

### Debug: Page Not Loading

```
"Debug why the page isn't loading:
1. Navigate to http://localhost:3000/problem-page
2. Check console messages for errors
3. List network requests
4. Take a screenshot
5. Identify the issue"
```

### Debug: Element Not Found

```
"Debug missing element:
1. Take a snapshot of the page
2. Search for the element text
3. Check if element exists with different selector
4. Verify page loaded completely"
```

### Debug: Form Not Submitting

```
"Debug form submission:
1. Take snapshot before submit
2. Fill in form fields
3. Check console for errors
4. Click submit
5. Monitor network requests
6. Check for error messages
7. Take snapshot after submit"
```

## Best Practices

### ✅ DO:

- **Take snapshots before interactions** - Understand page structure first
- **Wait for dynamic content** - Use `browser_wait_for` before interacting
- **Check console messages** - Catch JavaScript errors early
- **Use descriptive requests** - Clear instructions get better results
- **Combine with Playwright** - Use MCP for exploration, Playwright for automation

### ❌ DON'T:

- **Skip waiting** - Don't interact before content loads
- **Assume element exists** - Always take snapshot first
- **Ignore errors** - Check console messages regularly
- **Rush interactions** - Let AI describe what it sees
- **Replace Playwright** - Use both tools for different purposes

## Tips and Tricks

### 1. Step-by-Step Approach

Break complex tasks into steps:
```
"First, navigate to the page and take a snapshot"
"Now click the button"
"Wait for the form to appear"
"Fill in the fields"
```

### 2. Use Snapshots for Discovery

```
"Take a snapshot and list all buttons on the page"
"Show me all form fields"
"What links are available?"
```

### 3. Visual Verification

```
"Take a screenshot before and after the change"
"Compare the two screenshots"
```

### 4. Error Investigation

```
"When the error occurs:
1. Take a screenshot
2. Check console messages
3. List network requests
4. Analyze the issue"
```

## Common Patterns

### Pattern: Login Before Testing

```
"First, log in:
1. Go to login page
2. Enter credentials
3. Submit
4. Wait for dashboard
5. Now test [your feature]"
```

### Pattern: Clean State

```
"Reset the application state:
1. Navigate to settings
2. Click reset button
3. Confirm reset
4. Wait for completion
5. Start testing"
```

### Pattern: Multi-Step Form

```
"Test multi-step form:
1. Navigate to form
2. Complete step 1
3. Click 'Next'
4. Complete step 2
5. Click 'Next'
6. Review step 3
7. Submit
8. Verify success"
```

## Troubleshooting

### Issue: Browser Not Responding

**Solution:**
```
"Take a snapshot to check page state"
```

### Issue: Element Not Clickable

**Solution:**
```
"Wait for element to be visible, then click"
```

### Issue: Form Values Not Persisting

**Solution:**
```
"Check console for errors, verify field names match"
```

### Issue: Network Errors

**Solution:**
```
"List network requests to see failed calls"
```

## Next Steps

1. **Try the examples above** with your local application
2. **Experiment with different scenarios** using Browser MCP
3. **Generate Playwright tests** from successful Browser MCP sessions
4. **Read the full guide**: [playwright-mcp-browser.md](./playwright-mcp-browser.md)

## Quick Reference Card

| Task | Command |
|------|---------|
| Navigate | `"Go to http://localhost:3000"` |
| Inspect | `"Take a snapshot"` |
| Click | `"Click the Submit button"` |
| Type | `"Type 'text' in the email field"` |
| Wait | `"Wait for page to load"` |
| Screenshot | `"Take a screenshot"` |
| Debug | `"Show console messages"` |
| Network | `"List network requests"` |

---

**Remember**: Browser MCP is best for exploration and debugging. Use Playwright for automated tests in CI/CD!

