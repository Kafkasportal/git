# Testing Guide - Kafkasder Panel

## Overview

This document provides a comprehensive guide to the testing infrastructure and test coverage for the Kafkasder Panel project.

## Test Framework Setup

### Technologies Used

- **Vitest**: Unit and integration testing framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end (E2E) testing
- **@testing-library/jest-dom**: Enhanced testing utilities

### Configuration

- **Vitest Config**: `vitest.config.ts`
- **Playwright Config**: `playwright.config.cts`
- **Test Setup**: `src/__tests__/setup.ts`

## Test Structure

```
src/__tests__/
├── hooks/                          # Custom React hooks tests
│   └── useStandardForm.test.ts      # Form hook testing
├── lib/
│   ├── api/
│   │   └── types.test.ts            # API type definitions
│   └── validations/
│       └── forms.test.ts            # Form validation schemas
├── integration/
│   └── api-client.test.ts           # API client CRUD operations
├── setup.ts                         # Global test setup
└── mocks/
    └── handlers.ts                 # API mock handlers

e2e/                                # End-to-end tests (Playwright)
├── example.spec.ts                 # Standalone example tests (no app required)
├── auth.spec.ts
├── beneficiaries.spec.ts
├── donations.spec.ts
├── meetings.spec.ts
├── test-utils.ts                   # E2E test utilities
├── mock-api.ts                     # API mocking utilities
├── README.md                       # E2E testing documentation
└── ...
```

### E2E Example Tests

The `e2e/example.spec.ts` file contains standalone tests that demonstrate Playwright capabilities without requiring the application to be running. These tests are perfect for:

- Verifying Playwright installation
- Learning Playwright test patterns
- Quick validation during development
- Testing basic browser interactions

**Features demonstrated:**

- Page navigation and assertions
- Form inputs and validation
- Button and element interactions
- CSS selectors and class verification
- Responsive design testing
- Async operations and waiting
- Multiple viewport sizes

**Run example tests:**

```bash
npm run test:e2e:example
# or
SKIP_WEBSERVER=true npx playwright test example
```

All example tests use self-contained HTML (data URLs) and do not require external network access or a running server.

## Test Coverage

### Unit Tests (1,381 lines added)

#### 1. Hook Tests: `useStandardForm.test.ts` (296 lines)

Tests for the standard form hook covering:

- **Form Initialization**
  - Default values population
  - Property existence checks
  - Form state initial values

- **Validation**
  - Zod schema validation
  - Error detection
  - Error clearing on valid input

- **Mutations**
  - Mutation function invocation
  - Data transformation
  - Success callbacks
  - Error handling

- **Form Management**
  - Form reset on success (configurable)
  - Manual reset functionality
  - Dirty state tracking

**Key Test Cases:**

```typescript
- initializes form with provided default values
- validates form data according to schema
- calls mutation function with form data on submit
- resets form on successful submission when resetOnSuccess is true
- transforms data before mutation if transformData is provided
- manually resets form via reset() function
```

#### 2. API Type Tests: `lib/api/types.test.ts` (314 lines)

Comprehensive type definition validation covering all 8 resources:

- **BeneficiaryCreateInput / BeneficiaryUpdateInput**
  - Required fields: name, tc_no, phone, address, city, district, neighborhood, family_size
  - Optional fields: email, gender, category
  - Partial updates validation

- **DonationCreateInput / DonationUpdateInput**
  - Required: donor_name, donor_phone, amount, currency, donation_type, donation_purpose, receipt_number, status
  - Payment methods: cash, check, credit_card, online, bank_transfer, sms, in_kind
  - Status transitions: pending → approved/rejected

- **TaskCreateInput / TaskUpdateInput**
  - Required: title, assigned_to, created_by
  - Priority levels: low, normal, high, urgent
  - Status tracking: pending, in_progress, completed

- **MeetingCreateInput / MeetingUpdateInput**
  - Meeting types: general, committee, board, other
  - Participant management
  - Schedule tracking

- **UserCreateInput / UserUpdateInput**
  - Role-based access control
  - Permission management
  - Active status tracking

- **FinanceRecordCreateInput / FinanceRecordUpdateInput**
  - Income/Expense distinction
  - Category tracking
  - Approval workflow

- **AidApplicationCreateInput / AidApplicationUpdateInput**
  - Application stages: draft, submitted, under_review, approved, rejected, completed
  - Priority levels: low, medium, high
  - Status management

- **PartnerCreateInput / PartnerUpdateInput**
  - Partner types: organization, individual
  - Partnership types: donor, supplier, volunteer, sponsor, service_provider
  - Status: active, inactive

**Key Test Cases:**

```typescript
- validates all Create input types
- validates all Update input types (partial)
- enum value validation
- type safety constraints
- required vs optional field validation
```

#### 3. API Client Integration Tests: `integration/api-client.test.ts` (484 lines)

Complete CRUD operation testing for all resources:

- **Beneficiary Operations**
  - Create with required fields
  - Retrieve by ID
  - Update partial data
  - Delete operations

- **Donation Operations**
  - Create with payment details
  - Status transitions
  - Payment method validation

- **Task Operations**
  - Create with assignments
  - Priority management
  - Status updates

- **Meeting Operations**
  - Create with participants
  - Meeting type management
  - Schedule updates

- **User Operations**
  - Create with roles
  - Permission management
  - Role updates

- **Finance Record Operations**
  - Income/Expense distinction
  - Approval workflow
  - Status tracking

- **Aid Application Operations**
  - Application stage progression
  - Priority management
  - Approval tracking

- **Partner Operations**
  - Relationship type management
  - Status tracking
  - Contact information

- **Error Handling**
  - Network errors
  - Validation errors
  - Error recovery

**Key Test Cases:**

```typescript
- should create [resource] with required fields
- should retrieve [resource] by ID
- should update [resource] with partial data
- should delete [resource]
- should handle API errors gracefully
- should handle validation errors
```

#### 4. Form Validation Tests: `lib/validations/forms.test.ts` (287 lines)

Comprehensive validation schema testing:

- **Email Validation**
  - Valid formats: user@domain.com, user.name@domain.co.uk
  - Invalid formats: missing @, double @@, invalid domain

- **Phone Number Validation**
  - Multiple formats: +90 555 123 4567, 0555-1234567
  - International format support
  - Minimum length enforcement

- **Turkish ID (TC No) Validation**
  - 11-digit requirement
  - Numeric only
  - Format validation

- **Complex Schemas**
  - Object composition
  - Optional field handling
  - Age/date validation

- **String Transformations**
  - Whitespace trimming
  - Case handling
  - Length validation

- **Conditional Validation**
  - Dependent field requirements
  - Enum-based conditions
  - Custom refinements

- **Union Types**
  - Discriminated unions
  - Type-specific fields
  - Multi-type support

**Key Test Cases:**

```typescript
- validates correct email addresses
- rejects invalid email addresses
- validates various phone formats
- validates 11-digit TC numbers
- validates complete complex objects
- provides specific error messages
- trims whitespace from input
- handles conditional validation
```

## Running Tests

### Available Test Commands

```bash
# Run all tests in watch mode
npm run test

# Run tests with UI (interactive)
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E example test (standalone, no app required)
npm run test:e2e:example
# or
npx playwright test example

# Open E2E test UI
npm run e2e:ui
```

### Example Test Output

```
✓ src/__tests__/hooks/useStandardForm.test.ts (14)
  ✓ useStandardForm (14)
    ✓ initializes form with provided default values
    ✓ returns correct form state properties
    ✓ validates form data according to schema
    ✓ clears errors when valid data is entered
    ✓ calls mutation function with form data on submit
    ✓ resets form on successful submission
    ✓ does not reset form when resetOnSuccess is false
    ✓ calls onSuccess callback with response data
    ✓ transforms data before mutation
    ✓ manually resets form via reset() function
    ...

✓ src/__tests__/lib/api/types.test.ts (18)
✓ src/__tests__/integration/api-client.test.ts (32)
✓ src/__tests__/lib/validations/forms.test.ts (28)

Test Files   4 passed (4)
     Tests  92 passed (92)
```

## Test Coverage Goals

### Current Coverage (AŞAMA 3)

- **Hook Coverage**: 100% of form hooks
- **API Type Coverage**: All 8 resources + Create/Update input pairs
- **API Client Coverage**: All CRUD operations
- **Validation Coverage**: Email, phone, TC number, complex schemas
- **Total New Tests**: 92 test cases (1,381 lines)

### Target Coverage: 30%

The new tests focus on high-value areas:

- Core business logic (forms, API operations)
- Type safety (API types, input validation)
- Error handling (validation, API errors)

## Best Practices

### Writing New Tests

1. **Use Descriptive Names**

   ```typescript
   it('should create beneficiary with required fields', async () => {
     // ...
   });
   ```

2. **Arrange-Act-Assert Pattern**

   ```typescript
   // Arrange
   const input = {
     /* ... */
   };

   // Act
   const result = await api.create(input);

   // Assert
   expect(result._id).toBeDefined();
   ```

3. **Mock External Dependencies**

   ```typescript
   mockApiClient.beneficiaries.create.mockResolvedValue({ _id: 'ben_123' });
   ```

4. **Test Error Paths**

   ```typescript
   mockApiClient.create.mockRejectedValue(new Error('Network error'));
   ```

5. **Use Type Safety**
   ```typescript
   const input: BeneficiaryCreateInput = {
     // TypeScript ensures all required fields
   };
   ```

### Test Organization

- Group related tests with `describe()`
- Use `beforeEach()` for test setup
- Keep tests focused and independent
- Mock external dependencies
- Use meaningful assertions

## Continuous Integration

### Pre-commit Hooks

Tests run automatically via Husky on:

- Code commits (linting + format)
- Git push (validate changes)

### CI/CD Pipeline

- Tests run in `test:run` mode (once, no watch)
- Coverage reports generated as HTML
- JUnit XML output for CI systems

## Common Issues & Solutions

### Issue: Tests timeout

**Solution**: Increase timeout in vitest.config.ts

```typescript
test: {
  testTimeout: 10000,  // 10 seconds
}
```

### Issue: "Module not found" errors

**Solution**: Check vitest.config.ts alias configuration

```typescript
alias: {
  '@': resolve(__dirname, './src'),
}
```

### Issue: React hooks not working in tests

**Solution**: Use `renderHook` from React Testing Library

```typescript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useMyHook());
```

## Future Test Improvements

### Planned for Next Phase

1. **Component Tests**
   - Form components (TaskForm, BeneficiaryForm)
   - UI components (buttons, inputs, modals)
   - List/table components

2. **E2E Test Expansion**
   - Complete beneficiary workflow
   - Donation submission process
   - Meeting scheduling flow

3. **Performance Tests**
   - Component render time
   - API response time
   - Form input latency

4. **Accessibility Tests**
   - WCAG compliance
   - Keyboard navigation
   - Screen reader support

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Zod Validation](https://zod.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Contributing Tests

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests pass before committing
3. Maintain test coverage above 30%
4. Document complex test scenarios
5. Keep tests DRY (Don't Repeat Yourself)

## Contact & Support

For questions about testing:

- Review TESTING_GUIDE.md (this file)
- Check existing test examples
- Run tests in watch mode: `npm run test`
