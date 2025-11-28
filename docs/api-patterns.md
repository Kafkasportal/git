# API Route Standardization Guide

## Overview

All API routes should follow a consistent pattern using the middleware factory (`src/lib/api/middleware.ts`). This ensures:

- ✅ Consistent error handling
- ✅ Automatic logging
- ✅ Built-in rate limiting
- ✅ Module access control
- ✅ CSRF protection
- ✅ Type-safe responses

## Pattern

### Before (Current)

```typescript
// ❌ 200+ lines with duplicated logic
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess('beneficiaries');
    const { searchParams } = new URL(request.url);
    const params = normalizeQueryParams(searchParams);
    const response = await api.beneficiaries.list(params);
    // ... more logic
  } catch (error) {
    logger.error('Error', error);
    return errorResponse(...);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyCsrfToken(request);
    // ... more duplicated error handling
  } catch (error) {
    // ... duplicated error handling
  }
}
```

### After (Standardized)

```typescript
// ✅ ~80 lines with clean, reusable logic
import { buildApiRoute } from '@/lib/api/middleware';

export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request) => {
  // Clean handler logic
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);
  const response = await api.beneficiaries.list(params);
  return successResponse(response);
});

export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 20, windowMs: 60000 },
})(async (request) => {
  // Clean handler logic
  const { data, error } = await parseBody(request);
  if (error) return errorResponse(error, 400);
  // ... validation and creation
  return successResponse(createdItem, 'Created', 201);
});
```

## Step-by-Step Refactoring

### Step 1: Update imports

```typescript
// OLD
import { buildErrorResponse, requireModuleAccess } from '@/lib/api/auth-utils';
import { verifyCsrfToken } from '@/lib/api/auth-utils';

// NEW
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
```

### Step 2: Wrap handler with buildApiRoute

```typescript
// OLD
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess('module-name');
    // ...
  } catch (error) {
    // error handling
  }
}

// NEW
export const GET = buildApiRoute({
  requireModule: 'module-name',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request) => {
  // No try-catch needed! Middleware handles it
  // ...
  return successResponse(data);
});
```

### Step 3: Use standardized response helpers

```typescript
// OLD
return NextResponse.json({
  success: true,
  data: beneficiaries,
  total,
  message: `${total} kayıt bulundu`,
});

// NEW
return successResponse({ beneficiaries, total }, `${total} kayıt bulundu`);
```

### Step 4: Use parseBody for request parsing

```typescript
// OLD
let body: BeneficiaryData | null = null;
try {
  body = (await request.json()) as BeneficiaryData;
} catch (error) {
  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
}

// NEW
const { data, error } = await parseBody<BeneficiaryData>(request);
if (error) return errorResponse(error, 400);
```

### Step 5: Use schema validation

```typescript
// OLD
function validateBeneficiaryData(data: BeneficiaryData): ValidationResult {
  const errors: string[] = [];
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Ad Soyad en az 2 karakter olmalıdır');
  }
  // ... 20+ lines of custom validation
  return { isValid: errors.length === 0, errors };
}

// NEW
import { beneficiarySchema } from '@/lib/validations/beneficiary';

const result = beneficiarySchema.safeParse(data);
if (!result.success) {
  return errorResponse(
    'Doğrulama hatası',
    400,
    result.error.errors.map((e) => e.message)
  );
}
```

## Available Middleware Options

```typescript
interface MiddlewareOptions {
  requireModule?: string; // Module name for access control
  allowedMethods?: string[]; // GET, POST, PUT, PATCH, DELETE
  rateLimit?: {
    // Optional rate limiting
    maxRequests: number;
    windowMs: number; // milliseconds
  };
  requireAuth?: boolean; // Additional auth check
}
```

## Rate Limiting Examples

```typescript
// Light rate limiting (for public endpoints)
rateLimit: { maxRequests: 100, windowMs: 60000 }  // 100 req/min

// Medium rate limiting (for standard CRUD)
rateLimit: { maxRequests: 50, windowMs: 60000 }   // 50 req/min

// Strict rate limiting (for sensitive operations)
rateLimit: { maxRequests: 10, windowMs: 60000 }   // 10 req/min

// No rate limiting (for system endpoints)
// Omit rateLimit option
```

## Response Format

All responses should use standardized format:

### Success Response

```typescript
successResponse(data, message?, status)

// Response JSON:
{
  "success": true,
  "data": {...},
  "message": "Success message"  // optional
}
```

### Error Response

```typescript
errorResponse(error, status, details?)

// Response JSON:
{
  "success": false,
  "error": "Error message",
  "details": [...]  // optional array of error details
}
```

## Common Patterns

### GET List with Pagination

```typescript
export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
})(async (request) => {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);

  const response = await api.beneficiaries.list(params);

  return successResponse({
    data: response.documents,
    total: response.total,
    page: params.page,
  });
});
```

### POST Create with Validation

```typescript
export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
})(async (request) => {
  const { data, error } = await parseBody<BeneficiaryInput>(request);
  if (error) return errorResponse(error, 400);

  const validation = beneficiarySchema.safeParse(data);
  if (!validation.success) {
    return errorResponse(
      'Doğrulama hatası',
      400,
      validation.error.errors.map((e) => e.message)
    );
  }

  const result = await api.beneficiaries.create(validation.data);
  return successResponse(result, 'Created', 201);
});
```

### PATCH Update

```typescript
export const PATCH = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['PATCH'],
})(async (request) => {
  const { id } = await params; // Dynamic params
  const { data, error } = await parseBody<Partial<BeneficiaryInput>>(request);
  if (error) return errorResponse(error, 400);

  // Validation is optional for partial updates
  const result = await api.beneficiaries.update(id, data);
  return successResponse(result, 'Updated');
});
```

### DELETE Remove

```typescript
export const DELETE = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['DELETE'],
})(async (request) => {
  const { id } = await params;

  const result = await api.beneficiaries.delete(id);
  return successResponse(null, 'Deleted');
});
```

## Testing

### Before Middleware Refactoring

Each route needed its own tests for:

- Auth checks
- Error handling
- Validation
- Logging

### After Middleware Refactoring

Middleware is tested once centrally:

- Route tests focus on business logic only
- Error handling is guaranteed by middleware
- Auth checks are guaranteed by middleware

```typescript
describe('GET /api/beneficiaries', () => {
  it('should return beneficiaries list', async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  // Middleware tests are in middleware.test.ts
  // No need to test error handling here!
});
```

## Routes to Refactor (Priority Order)

### High Priority (Most Used)

- [ ] `/api/beneficiaries/route.ts` - ~250 lines
- [ ] `/api/donations/route.ts` - ~180 lines
- [ ] `/api/messages/send-bulk` - ~150 lines
- [ ] `/api/kumbara/route.ts` - ~120 lines
- [ ] `/api/meetings/route.ts` - ~140 lines

### Medium Priority

- [ ] `/api/partners/route.ts` - ~100 lines
- [ ] `/api/scholarships/route.ts` - ~130 lines
- [ ] `/api/users/route.ts` - ~110 lines
- [ ] `/api/analytics/route.ts` - ~80 lines

### Low Priority (System/Webhook Routes)

- [ ] `/api/health/route.ts`
- [ ] `/api/csrf/route.ts`
- [ ] `/api/webhooks/*`

## Checklist for Refactoring Each Route

- [ ] Remove `buildErrorResponse` usage
- [ ] Remove manual `try-catch` blocks
- [ ] Add `buildApiRoute()` wrapper with options
- [ ] Replace `NextResponse.json()` with `successResponse()` / `errorResponse()`
- [ ] Extract validation to Zod schema or use schema.safeParse()
- [ ] Use `parseBody()` for request parsing
- [ ] Update tests to focus on business logic
- [ ] Verify all error cases still handled
- [ ] Test with rate limiting enabled
- [ ] Document in PR what changed

## Example PR Commit Message

```
refactor(api): standardize beneficiaries route with middleware

- Remove 150+ lines of duplicated error handling
- Use buildApiRoute() for consistent middleware
- Replace custom validation with beneficiarySchema (Zod)
- Add automatic rate limiting (100 req/min for GET, 20 for POST)
- Simplify response handling with successResponse/errorResponse
- Benefits: cleaner code, consistent errors, automatic logging
```

## Questions?

Refer to:

- `src/lib/api/middleware.ts` - Middleware implementations
- `src/lib/api/route-helpers.ts` - Response helpers
- `src/app/api/beneficiaries/_example-refactored.ts` - Working example
