# Kafkasder Panel - Browser MCP Examples

Project-specific examples for using Browser MCP tools with the Kafkasder Panel application.

## Quick Navigation

- [Login & Authentication](#login--authentication)
- [Beneficiaries (İhtiyaç Sahipleri)](#beneficiaries-ihtiyaç-sahipleri)
- [Donations (Bağış)](#donations-bağış)
- [Dashboard](#dashboard)
- [Forms & Validation](#forms--validation)
- [Navigation](#navigation)

## Prerequisites

Start your development server:
```bash
npm run dev
```

## Login & Authentication

### Test Login Page Elements

```
"Navigate to http://localhost:3000/login and verify:
1. The page title is 'Dernek Yönetim Sistemi'
2. The login form is visible
3. Email and password fields are present
4. 'Giriş Yap' button is visible
5. Google and GitHub login buttons are available"
```

### Test Form Validation

```
"Test login form validation:
1. Go to login page
2. Try to submit empty form
3. Check if email field gets focused (HTML5 validation)
4. Fill in email only, try to submit
5. Verify password validation triggers"
```

### Test Password Visibility Toggle

```
"Test password visibility toggle:
1. Navigate to login page
2. Type a password in the password field
3. Click the 'Parolayı göster' button
4. Verify password becomes visible
5. Click again to hide it"
```

### Test Remember Me Functionality

```
"Test remember me checkbox:
1. Go to login page
2. Check the 'Beni hatırla (7 gün)' checkbox
3. Fill in login credentials
4. Submit form
5. Verify checkbox state is maintained"
```

## Beneficiaries (İhtiyaç Sahipleri)

### Test Beneficiary List Page

```
"Test beneficiaries list:
1. Log in first (if needed)
2. Navigate to http://localhost:3000/yardim/ihtiyac-sahipleri
3. Verify page loads correctly
4. Check if beneficiary list table is visible
5. Verify search functionality is present
6. Check for 'Add New' or 'Yeni Ekle' button"
```

### Test Creating a Beneficiary

```
"Test creating a new beneficiary:
1. Go to beneficiaries page
2. Click 'Yeni İhtiyaç Sahibi Ekle' or similar button
3. Take a snapshot to see form structure
4. Fill in required fields:
   - Name (Ad): Test Beneficiary
   - TC No: 12345678901
   - Phone: 5551234567
   - Address: Test Address
   - City: Istanbul
   - District: Kadıköy
   - Neighborhood: Test Neighborhood
   - Family Size: 4
5. Submit the form
6. Wait for success message
7. Verify new beneficiary appears in the list"
```

### Test Beneficiary Search

```
"Test beneficiary search:
1. Navigate to beneficiaries page
2. Find the search input field
3. Type a search query (beneficiary name)
4. Wait for results to filter
5. Verify results match the search query
6. Clear search and verify all beneficiaries show again"
```

### Test Beneficiary Form Validation

```
"Test beneficiary form validation:
1. Open beneficiary creation form
2. Try to submit empty form
3. Check which fields show validation errors
4. Fill fields one by one and verify errors disappear
5. Test invalid TC No format (should be 11 digits)
6. Test invalid phone format (should start with 5)"
```

### Test Editing Beneficiary

```
"Test editing a beneficiary:
1. Go to beneficiaries list
2. Click on edit button for a beneficiary
3. Modify some fields
4. Save changes
5. Verify changes are reflected in the list"
```

## Donations (Bağış)

### Test Donation List

```
"Test donations list:
1. Navigate to http://localhost:3000/bagis/liste
2. Verify donations table loads
3. Check filters are available
4. Verify export functionality if present
5. Test sorting columns"
```

### Test Creating Donation

```
"Test creating a donation:
1. Go to donations page
2. Click 'Yeni Bağış' button
3. Fill in donation form:
   - Amount: 1000
   - Donor name: Test Donor
   - Date: Today's date
   - Type: Cash/Online/etc
4. Submit form
5. Verify donation appears in list"
```

### Test Kumbara (Piggy Bank) Feature

```
"Test Kumbara campaign feature:
1. Navigate to http://localhost:3000/bagis/kumbara
2. Take a snapshot to see the interface
3. If creating new campaign:
   - Click 'Yeni Kampanya' button
   - Fill in campaign details
   - Set goal amount
   - Submit
4. Verify campaign displays correctly
5. Test donation to campaign if applicable"
```

## Dashboard

### Test Dashboard Load

```
"Test dashboard:
1. Navigate to http://localhost:3000/genel
2. Verify dashboard loads (may need authentication)
3. Check if main cards/sections are visible
4. Verify navigation menu is present
5. Test responsive layout on different viewport sizes"
```

### Test Dashboard Analytics

```
"Test dashboard analytics:
1. Go to dashboard
2. Verify statistics cards are visible
3. Check if charts/graphs load
4. Verify data is displayed correctly
5. Test refresh functionality"
```

## Forms & Validation

### Test Form Field Interactions

```
"Test form field behavior:
1. Navigate to any form page
2. Test tab navigation between fields
3. Test keyboard shortcuts (Enter to submit)
4. Test field focus states
5. Test field clearing (Ctrl+A, Delete)"
```

### Test Error Messages

```
"Test form error handling:
1. Submit form with invalid data
2. Wait for error messages
3. Verify error messages are clear
4. Fix errors one by one
5. Verify errors disappear as fields are corrected"
```

### Test Required Field Indicators

```
"Test required field indicators:
1. Open any form with required fields
2. Check if required fields are marked (asterisk, etc.)
3. Submit form without required fields
4. Verify validation highlights required fields
5. Check accessibility (ARIA labels)"
```

## Navigation

### Test Main Navigation

```
"Test main navigation:
1. Log in to the application
2. Verify sidebar/nav menu is visible
3. Click each main navigation item:
   - Ana Sayfa (Home)
   - Bağış Yönetimi (Donations)
   - Yardım Programları (Aid Programs)
   - Burs Sistemi (Scholarships)
   - Finansal Yönetim (Finance)
   - İletişim (Messages)
   - İş Yönetimi (Tasks)
4. Verify correct pages load for each
5. Test breadcrumbs update"
```

### Test Sub-navigation

```
"Test sub-navigation:
1. Hover over main navigation items
2. Check if sub-menus appear
3. Click sub-menu items
4. Verify correct sub-pages load
5. Test mobile navigation (if applicable)"
```

### Test Breadcrumbs

```
"Test breadcrumbs:
1. Navigate deep into the application
2. Verify breadcrumbs show correct path
3. Click on breadcrumb items
4. Verify navigation works correctly
5. Test breadcrumb on mobile view"
```

## Search Functionality

### Test Global Search

```
"Test global search:
1. Press Ctrl+K (or Cmd+K on Mac) to open search
2. Type a search query
3. Verify search results appear
4. Click on a result
5. Verify navigation to correct page"
```

### Test Page-Specific Search

```
"Test page search:
1. Go to beneficiaries or donations page
2. Find the search input
3. Type a query
4. Wait for filtered results
5. Verify results match query
6. Test search with special characters"
```

## User Management

### Test User List

```
"Test user management:
1. Navigate to http://localhost:3000/kullanici
2. Verify user list table loads
3. Check user roles are displayed
4. Test user filtering/sorting
5. Verify edit/delete buttons are present"
```

### Test Creating User

```
"Test creating a user:
1. Go to user management page
2. Click 'Yeni Kullanıcı' button
3. Fill in user form:
   - Name
   - Email
   - Role selection
4. Submit form
5. Verify user appears in list"
```

## Settings

### Test Settings Navigation

```
"Test settings pages:
1. Navigate to http://localhost:3000/ayarlar
2. Verify settings menu/sidebar is visible
3. Test navigation to:
   - Genel Ayarlar (General)
   - Tema Ayarları (Theme)
   - Marka ve Organizasyon (Branding)
   - İletişim Ayarları (Communication)
   - Güvenlik Ayarları (Security)
4. Verify each settings page loads correctly"
```

### Test Theme Settings

```
"Test theme customization:
1. Go to theme settings
2. Take snapshot to see theme options
3. Change primary color
4. Preview theme changes
5. Save settings
6. Verify theme is applied"
```

## Task Management (İş Yönetimi)

### Test Kanban Board

```
"Test task kanban board:
1. Navigate to http://localhost:3000/is/gorevler
2. Verify kanban columns are visible
3. Check if tasks are displayed
4. Test dragging tasks between columns
5. Test creating new task
6. Test task details modal"
```

### Test Meetings

```
"Test meetings page:
1. Go to http://localhost:3000/is/toplantilar
2. Verify calendar view loads
3. Test creating new meeting
4. Test editing meeting
5. Verify meeting details display correctly"
```

## Notifications

### Test Notification System

```
"Test notifications:
1. Trigger a notification (if possible)
2. Verify notification appears
3. Check notification content
4. Test dismissing notification
5. Test notification history if available"
```

## Responsive Design

### Test Mobile View

```
"Test mobile responsiveness:
1. Resize browser to mobile size (375x667)
2. Navigate through pages
3. Verify mobile menu works
4. Check forms are usable
5. Verify tables are scrollable/responsive"
```

### Test Tablet View

```
"Test tablet responsiveness:
1. Resize browser to tablet size (768x1024)
2. Test navigation
3. Verify layouts adapt correctly
4. Test form interactions
5. Check dashboard cards layout"
```

## Performance Testing

### Test Page Load Times

```
"Test page performance:
1. Navigate to each main page
2. Check network requests
3. Verify images load
4. Check for console errors
5. Test with slow network throttling"
```

### Test Offline Functionality

```
"Test offline mode:
1. Enable offline mode in browser DevTools
2. Navigate to pages
3. Verify offline indicators
4. Test form submissions queue
5. Test sync when back online"
```

## Debugging Workflows

### Debug Login Issues

```
"Debug login problems:
1. Navigate to login page
2. Check console for errors
3. List network requests
4. Try login and monitor requests
5. Check for CSRF token issues
6. Verify API responses"
```

### Debug Form Submission

```
"Debug form submission:
1. Open form
2. Fill in data
3. Take snapshot before submit
4. Submit form
5. Monitor network requests
6. Check console for errors
7. Take snapshot after submit
8. Compare before/after states"
```

### Debug Navigation Issues

```
"Debug navigation problems:
1. Click navigation link
2. Monitor network requests
3. Check for redirect loops
4. Verify authentication state
5. Check URL changes
6. Review console errors"
```

## Tips for Effective Testing

### 1. Always Take Snapshots First

Before interacting with a page, take a snapshot to understand the structure:
```
"Take a snapshot of the current page"
```

### 2. Use Step-by-Step Approach

Break complex workflows into steps:
```
"Step 1: Navigate to the page"
"Step 2: Take a snapshot"
"Step 3: Click the button"
"Step 4: Wait for the form"
"Step 5: Fill in the fields"
```

### 3. Monitor Network Requests

When testing API interactions:
```
"List all network requests made by the page"
```

### 4. Check Console Messages

Always check for errors:
```
"Show me all console messages"
```

### 5. Use Screenshots for Visual Verification

```
"Take a full-page screenshot before and after the change"
```

## Common Patterns

### Pattern: Full Login Flow

```
"Complete login flow:
1. Navigate to login page
2. Fill in email: admin@example.com
3. Fill in password: password123
4. Check remember me
5. Click login button
6. Wait for redirect to dashboard
7. Verify dashboard loads successfully
8. Check user menu is visible"
```

### Pattern: Create and Verify

```
"Create and verify pattern:
1. Navigate to list page
2. Count current items
3. Click 'Add New' button
4. Fill in form
5. Submit
6. Wait for success
7. Verify new item appears in list
8. Verify count increased by 1"
```

### Pattern: Edit and Verify

```
"Edit and verify pattern:
1. Go to list page
2. Find an item to edit
3. Click edit button
4. Modify values
5. Save changes
6. Verify changes are reflected
7. Verify other fields unchanged"
```

## Next Steps

After exploring with Browser MCP:

1. **Generate Playwright Tests**: Convert successful Browser MCP sessions into automated tests
2. **Document Findings**: Update test documentation with discovered issues
3. **Fix Issues**: Address any bugs or UX problems found
4. **Improve Coverage**: Add tests for untested features

## See Also

- [Browser MCP Guide](./playwright-mcp-browser.md) - Comprehensive guide
- [Browser MCP Examples](./browser-mcp-examples.md) - General examples
- [Testing Guide](./testing.md) - Project testing documentation
- [E2E Tests README](../e2e/README.md) - Playwright test documentation

