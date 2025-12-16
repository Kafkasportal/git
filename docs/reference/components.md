# Component Library Documentation

Organized React component reference for the Dernek Yönetim Sistemi.

## UI Components

Core Radix UI components wrapped with Tailwind CSS.

| Component | Location | Usage |
|-----------|----------|-------|
| Button | `ui/button.tsx` | Primary action element |
| Card | `ui/card.tsx` | Container with shadow |
| Dialog | `ui/dialog.tsx` | Modal dialogs |
| Input | `ui/input.tsx` | Text input field |
| Label | `ui/label.tsx` | Form labels |
| Select | `ui/select.tsx` | Dropdown selection |
| Tabs | `ui/tabs.tsx` | Tab navigation |
| Badge | `ui/badge.tsx` | Status badges |
| Tooltip | `ui/tooltip.tsx` | Hover tooltips |
| Modal | `ui/modal.tsx` | Modal overlay |
| Dropdown | `ui/dropdown-menu.tsx` | Context menus |
| ThemeProvider | `ui/theme-provider.tsx` | Theme management |

## Layout Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ModernSidebar | `layouts/modern-sidebar.tsx` | Navigation sidebar |
| DashboardLayout | `layouts/dashboard-layout.tsx` | Main dashboard layout |
| Header | `layouts/header.tsx` | Top navigation |
| Footer | `layouts/footer.tsx` | Page footer |

## Form Components

Reusable form components with validation.

| Component | Location | Purpose |
|-----------|----------|---------|
| FormField | `forms/form-field.tsx` | Generic form field wrapper |
| SelectField | `forms/select-field.tsx` | Select with validation |
| DatePicker | `forms/date-picker.tsx` | Date selection |
| FileUpload | `forms/file-upload.tsx` | File upload handler |
| BeneficiaryForm | `forms/BeneficiaryForm.tsx` | Beneficiary entry |
| StudentForm | `forms/StudentForm.tsx` | Student/Scholarship entry |
| UserForm | `forms/UserForm.tsx` | User management |
| DonationForm | `forms/DonationForm.tsx` | Donation entry |

## Feature Components

Domain-specific components for business features.

### Users
- `users/UserList.tsx` - User listing
- `users/UserCard.tsx` - User card display
- `users/UserTable.tsx` - User data table

### Beneficiaries
- `beneficiary/BeneficiaryList.tsx` - Beneficiary listing
- `beneficiary/BeneficiaryCard.tsx` - Beneficiary details
- `beneficiary/BeneficiaryMap.tsx` - Geographic distribution
- `beneficiary/BeneficiaryWorkflow.tsx` - Status workflow

### Donations
- `kumbara/KumbaraList.tsx` - Kumbara listing
- `kumbara/KumbaraAnalytics.tsx` - Analytics charts

### Financial
- `analytics/FinancialChart.tsx` - Financial dashboard
- `charts/RevenueChart.tsx` - Revenue visualization

### Meetings & Tasks
- `meetings/MeetingList.tsx` - Meeting scheduling
- `tasks/TaskBoard.tsx` - Kanban task board
- `tasks/TaskCard.tsx` - Individual task

### Dashboard
- `dashboard/Widgets.tsx` - Dashboard widgets
- `dashboard/RealtimeUpdates.tsx` - Live updates
- `dashboard/StatCard.tsx` - Statistics card

### Communication
- `messages/MessageThread.tsx` - Message view
- `notifications/NotificationCenter.tsx` - Notification hub
- `notifications/AlertBanner.tsx` - Alert display

## Data Table Components

Reusable table patterns with sorting, filtering, pagination.

| Component | Location | Features |
|-----------|----------|----------|
| DataTable | `tables/data-table.tsx` | Generic table |
| UserTable | `tables/user-table.tsx` | User listing |
| BeneficiaryTable | `tables/beneficiary-table.tsx` | Beneficiary listing |
| DonationTable | `tables/donation-table.tsx` | Donation records |
| FinanceTable | `tables/finance-table.tsx` | Financial records |

## Utility Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ErrorBoundary | `errors/error-boundary.tsx` | Error handling |
| SuspenseBoundary | `ui/suspense-boundary.tsx` | Async loading |
| LoadingSpinner | `ui/loading-spinner.tsx` | Loading state |
| EmptyState | `ui/empty-state.tsx` | Empty data display |
| Pagination | `ui/pagination.tsx` | Page navigation |

## Development Tools

| Component | Location | Purpose |
|-----------|----------|---------|
| ReactQueryDevtools | `devtools/ReactQueryDevtools.tsx` | React Query debugging |
| ErrorTracker | `devtools/ErrorTracker.tsx` | Error monitoring |

## PWA Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ServiceWorkerRegister | `pwa/ServiceWorkerRegister.tsx` | PWA service worker |
| NetworkStatusIndicator | `pwa/NetworkStatusIndicator.tsx` | Connection status |

## Component Structure

```
src/components/
├── ui/                    # Radix + Tailwind primitives
├── layouts/              # Page layouts
├── forms/                # Form components
├── tables/               # Data tables
├── users/                # User feature
├── beneficiary/          # Beneficiary feature
├── kumbara/              # Donation feature
├── scholarships/         # Scholarship feature
├── analytics/            # Analytics feature
├── charts/               # Chart components
├── dashboard/            # Dashboard widgets
├── meetings/             # Meeting components
├── tasks/                # Task management
├── messages/             # Messaging components
├── notifications/        # Notification system
├── documents/            # Document handling
├── consents/             # Consent management
├── auth/                 # Auth-related components
├── errors/               # Error components
├── devtools/             # Developer tools
├── pwa/                  # Progressive Web App
├── workflow/             # Workflow visualization
└── workflow-engine/      # Workflow logic

Total: 32 component directories, 200+ components
```

## Best Practices

### Component Props
- Use TypeScript interfaces for props
- Default values for optional props
- Destructure props in function signature

### Styling
- Use Tailwind CSS classes
- Apply `cn()` for conditional classes
- Use `classVariance` for component variants

### Hooks
- Use custom hooks for logic extraction
- Memoize heavy computations
- Clean up subscriptions in useEffect

### Testing
- 70% coverage target
- Test user interactions
- Mock external dependencies

---

**Component Count**: 200+
**Framework**: React 19
**UI Library**: Radix UI
**Styling**: Tailwind CSS 4
