# 🧪 Test Yazımı

Bu döküman, Dernek Yönetim Sistemi'nin test stratejisini ve örneklerini açıklar.

## 📊 Test Altyapısı

| Araç | Kullanım |
|------|----------|
| **Vitest** | Test runner |
| **Testing Library** | React bileşen testleri |
| **MSW** | API mocking |
| **jsdom** | DOM simülasyonu |

---

## 📁 Test Yapısı

```
src/__tests__/
├── api/                    # API route testleri
│   ├── beneficiaries.test.ts
│   ├── donations.test.ts
│   ├── users.test.ts
│   └── ...
│
├── components/             # Bileşen testleri
│   ├── DonationForm.test.tsx
│   └── ...
│
├── hooks/                  # Hook testleri
│   ├── useStandardForm.test.ts
│   ├── useOnlineStatus.test.ts
│   └── ...
│
├── lib/                    # Utility testleri
│   ├── security.test.ts
│   ├── validations.test.ts
│   └── ...
│
├── integration/            # Entegrasyon testleri
│   └── auth-flow.test.ts
│
├── mocks/                  # Mock dosyaları
│   ├── handlers.ts
│   └── server.ts
│
└── setup.ts               # Test setup
```

---

## ⚙️ Konfigürasyon

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// MSW server setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(() => ({ value: 'mock-token' })),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
```

---

## 📝 API Route Testleri

### Mock Request Helper

```typescript
// src/__tests__/mocks/helpers.ts
import { NextRequest } from 'next/server';

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, cookies = {} } = options;
  
  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  
  // Add cookies
  Object.entries(cookies).forEach(([key, value]) => {
    request.cookies.set(key, value);
  });
  
  return request;
}
```

### GET Endpoint Testi

```typescript
// src/__tests__/api/beneficiaries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/beneficiaries/route';
import { createMockRequest } from '../mocks/helpers';

// Mock Appwrite
vi.mock('@/lib/appwrite/api', () => ({
  appwriteBeneficiaries: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn(() => ({
    user: { id: 'user-1', role: 'Yönetici', permissions: ['beneficiaries:access'] },
  })),
  verifyCsrfToken: vi.fn(),
}));

import { appwriteBeneficiaries } from '@/lib/appwrite/api';

describe('GET /api/beneficiaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return beneficiaries list', async () => {
    const mockData = {
      documents: [
        { $id: '1', name: 'Test User', tc_no: '12345678901' },
        { $id: '2', name: 'Another User', tc_no: '98765432109' },
      ],
      total: 2,
    };
    
    vi.mocked(appwriteBeneficiaries.list).mockResolvedValue(mockData);
    
    const request = createMockRequest('/api/beneficiaries');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });
  
  it('should handle pagination', async () => {
    vi.mocked(appwriteBeneficiaries.list).mockResolvedValue({
      documents: [],
      total: 100,
    });
    
    const request = createMockRequest('/api/beneficiaries?page=2&limit=10');
    const response = await GET(request);
    
    expect(appwriteBeneficiaries.list).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        skip: 10, // page 2
      })
    );
  });
  
  it('should handle search', async () => {
    vi.mocked(appwriteBeneficiaries.list).mockResolvedValue({
      documents: [],
      total: 0,
    });
    
    const request = createMockRequest('/api/beneficiaries?search=ahmet');
    await GET(request);
    
    expect(appwriteBeneficiaries.list).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'ahmet',
      })
    );
  });
});
```

### POST Endpoint Testi

```typescript
describe('POST /api/beneficiaries', () => {
  it('should create new beneficiary', async () => {
    const newBeneficiary = {
      name: 'Yeni Kullanıcı',
      tc_no: '12345678901',
      phone: '5551234567',
      address: 'Test Mahallesi, Test Sokak No:1',
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Caferağa',
      family_size: 4,
    };
    
    vi.mocked(appwriteBeneficiaries.create).mockResolvedValue({
      $id: 'new-id',
      ...newBeneficiary,
    });
    
    const request = createMockRequest('/api/beneficiaries', {
      method: 'POST',
      body: newBeneficiary,
      headers: { 'x-csrf-token': 'valid-token' },
      cookies: { 'csrf-token': 'valid-token' },
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.$id).toBe('new-id');
  });
  
  it('should validate required fields', async () => {
    const invalidData = {
      name: 'A', // Too short
      tc_no: '123', // Invalid
    };
    
    const request = createMockRequest('/api/beneficiaries', {
      method: 'POST',
      body: invalidData,
      headers: { 'x-csrf-token': 'valid-token' },
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });
  
  it('should reject duplicate TC number', async () => {
    vi.mocked(appwriteBeneficiaries.create).mockRejectedValue(
      new Error('Document with same tc_no already exists')
    );
    
    const request = createMockRequest('/api/beneficiaries', {
      method: 'POST',
      body: {
        name: 'Test User',
        tc_no: '12345678901',
        phone: '5551234567',
        address: 'Test Adres Test Adres',
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Test',
        family_size: 1,
      },
      headers: { 'x-csrf-token': 'valid-token' },
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(409);
  });
});
```

---

## 🎨 Bileşen Testleri

### Form Bileşeni Testi

```typescript
// src/__tests__/components/DonationForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationForm } from '@/components/forms/DonationForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Wrapper for providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('DonationForm', () => {
  it('should render all required fields', () => {
    render(<DonationForm />, { wrapper: createWrapper() });
    
    expect(screen.getByLabelText(/bağışçı adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tutar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument();
  });
  
  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<DonationForm />, { wrapper: createWrapper() });
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /kaydet/i }));
    
    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText(/bağışçı adı en az 2 karakter/i)).toBeInTheDocument();
    });
  });
  
  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    render(<DonationForm />, { wrapper: createWrapper() });
    
    const phoneInput = screen.getByLabelText(/telefon/i);
    await user.type(phoneInput, '123'); // Invalid
    await user.tab(); // Trigger blur validation
    
    await waitFor(() => {
      expect(screen.getByText(/telefon.*10 haneli/i)).toBeInTheDocument();
    });
  });
  
  it('should submit form with valid data', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { $id: '123' } }),
    });
    
    render(<DonationForm onSuccess={onSuccess} />, { wrapper: createWrapper() });
    
    // Fill form
    await user.type(screen.getByLabelText(/bağışçı adı/i), 'Test Bağışçı');
    await user.type(screen.getByLabelText(/telefon/i), '5551234567');
    await user.type(screen.getByLabelText(/tutar/i), '1000');
    
    // Select values
    await user.click(screen.getByRole('combobox', { name: /bağış türü/i }));
    await user.click(screen.getByRole('option', { name: /nakdi/i }));
    
    // Submit
    await user.click(screen.getByRole('button', { name: /kaydet/i }));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
  
  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock slow response
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<DonationForm />, { wrapper: createWrapper() });
    
    // Fill minimum required fields and submit
    await user.type(screen.getByLabelText(/bağışçı adı/i), 'Test');
    await user.type(screen.getByLabelText(/telefon/i), '5551234567');
    await user.type(screen.getByLabelText(/tutar/i), '100');
    
    await user.click(screen.getByRole('button', { name: /kaydet/i }));
    
    // Check loading state
    expect(screen.getByText(/kaydediliyor/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should call onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    
    render(<DonationForm onCancel={onCancel} />, { wrapper: createWrapper() });
    
    await user.click(screen.getByRole('button', { name: /iptal/i }));
    
    expect(onCancel).toHaveBeenCalled();
  });
});
```

---

## 🪝 Hook Testleri

### Custom Hook Testi

```typescript
// src/__tests__/hooks/useOnlineStatus.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });
  
  it('should return true when online', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current).toBe(true);
  });
  
  it('should return false when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current).toBe(false);
  });
  
  it('should update when going offline', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current).toBe(true);
    
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current).toBe(false);
  });
  
  it('should update when going online', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current).toBe(false);
    
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current).toBe(true);
  });
});
```

### useStandardForm Hook Testi

```typescript
// src/__tests__/hooks/useStandardForm.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { z } from 'zod';
import { useStandardForm } from '@/hooks/useStandardForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const schema = z.object({
  name: z.string().min(2, 'En az 2 karakter'),
  email: z.string().email('Geçerli email girin'),
});

type FormData = z.infer<typeof schema>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useStandardForm', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(
      () =>
        useStandardForm<FormData>({
          schema,
          mutationFn: vi.fn(),
          queryKey: 'test',
          defaultValues: { name: 'Test', email: '' },
        }),
      { wrapper }
    );
    
    expect(result.current.form.getValues('name')).toBe('Test');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });
  
  it('should validate on submit', async () => {
    const mutationFn = vi.fn();
    
    const { result } = renderHook(
      () =>
        useStandardForm<FormData>({
          schema,
          mutationFn,
          queryKey: 'test',
          defaultValues: { name: '', email: '' },
        }),
      { wrapper }
    );
    
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    // Should not call mutation with invalid data
    expect(mutationFn).not.toHaveBeenCalled();
    
    // Should have errors
    expect(result.current.form.formState.errors.name).toBeDefined();
    expect(result.current.form.formState.errors.email).toBeDefined();
  });
  
  it('should call mutation with valid data', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: '123' });
    
    const { result } = renderHook(
      () =>
        useStandardForm<FormData>({
          schema,
          mutationFn,
          queryKey: 'test',
          defaultValues: { name: 'Valid Name', email: 'valid@email.com' },
        }),
      { wrapper }
    );
    
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    await waitFor(() => {
      expect(mutationFn).toHaveBeenCalledWith({
        name: 'Valid Name',
        email: 'valid@email.com',
      });
    });
  });
});
```

---

## 🔧 Utility Testleri

### Validasyon Testi

```typescript
// src/__tests__/lib/validations.test.ts
import { describe, it, expect } from 'vitest';
import {
  tcKimlikNoSchema,
  requiredPhoneSchema,
  requiredEmailSchema,
} from '@/lib/validations/shared-validators';

describe('TC Kimlik No Validator', () => {
  it('should accept valid TC numbers', () => {
    const validNumbers = ['10000000146', '12345678934'];
    
    validNumbers.forEach(tc => {
      const result = tcKimlikNoSchema.safeParse(tc);
      expect(result.success).toBe(true);
    });
  });
  
  it('should reject TC starting with 0', () => {
    const result = tcKimlikNoSchema.safeParse('01234567890');
    expect(result.success).toBe(false);
  });
  
  it('should reject wrong length', () => {
    expect(tcKimlikNoSchema.safeParse('1234567890').success).toBe(false);
    expect(tcKimlikNoSchema.safeParse('123456789012').success).toBe(false);
  });
  
  it('should reject non-numeric', () => {
    const result = tcKimlikNoSchema.safeParse('1234567890a');
    expect(result.success).toBe(false);
  });
});

describe('Phone Validator', () => {
  it('should accept valid Turkish mobile numbers', () => {
    const validNumbers = ['5551234567', '5001234567', '5991234567'];
    
    validNumbers.forEach(phone => {
      const result = requiredPhoneSchema.safeParse(phone);
      expect(result.success).toBe(true);
    });
  });
  
  it('should sanitize and accept formatted numbers', () => {
    const formattedNumbers = [
      '+905551234567',
      '905551234567',
      '05551234567',
      '0555 123 45 67',
      '+90 (555) 123-4567',
    ];
    
    formattedNumbers.forEach(phone => {
      const result = requiredPhoneSchema.safeParse(phone);
      expect(result.success).toBe(true);
      expect(result.data).toBe('5551234567');
    });
  });
  
  it('should reject non-mobile numbers', () => {
    // Landline
    const result = requiredPhoneSchema.safeParse('2121234567');
    expect(result.success).toBe(false);
  });
});
```

### Security Utility Testi

```typescript
// src/__tests__/lib/security.test.ts
import { describe, it, expect } from 'vitest';
import { RateLimiter, PasswordSecurity, FileSecurity } from '@/lib/security';

describe('RateLimiter', () => {
  beforeEach(() => {
    RateLimiter.resetAll();
  });
  
  it('should allow requests within limit', () => {
    const result = RateLimiter.checkLimit('test-ip', 5, 60000);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
  
  it('should block after exceeding limit', () => {
    const identifier = 'test-ip-2';
    
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      RateLimiter.checkLimit(identifier, 5, 60000);
    }
    
    // 6th request should be blocked
    const result = RateLimiter.checkLimit(identifier, 5, 60000);
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
  
  it('should reset after window expires', async () => {
    const identifier = 'test-ip-3';
    
    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      RateLimiter.checkLimit(identifier, 5, 100); // 100ms window
    }
    
    // Wait for window to expire
    await new Promise(r => setTimeout(r, 150));
    
    // Should be allowed again
    const result = RateLimiter.checkLimit(identifier, 5, 100);
    expect(result.allowed).toBe(true);
  });
});

describe('PasswordSecurity', () => {
  it('should accept strong passwords', () => {
    const result = PasswordSecurity.validateStrength('SecurePass123!');
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject weak passwords', () => {
    const result = PasswordSecurity.validateStrength('weak');
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  it('should require uppercase', () => {
    const result = PasswordSecurity.validateStrength('lowercase123!');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Şifre en az bir büyük harf içermelidir');
  });
});

describe('FileSecurity', () => {
  it('should accept allowed file types', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = FileSecurity.validateFile(file);
    
    expect(result.valid).toBe(true);
  });
  
  it('should reject disallowed file types', () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    const result = FileSecurity.validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Desteklenmeyen dosya türü');
  });
  
  it('should reject oversized files', () => {
    const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    const result = FileSecurity.validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('büyük');
  });
});
```

---

## 🏃 Test Çalıştırma

### Tüm Testler

```bash
npm run test
```

### Watch Mode

```bash
npm run test -- --watch
```

### Belirli Dosya

```bash
npm run test -- src/__tests__/api/beneficiaries.test.ts
```

### Coverage

```bash
npm run test:coverage
```

### UI Mode

```bash
npm run test:ui
```

---

## ✅ Best Practices

### 1. Test Isolation

```typescript
// ✓ İyi - Her test bağımsız
beforeEach(() => {
  vi.clearAllMocks();
  RateLimiter.resetAll();
});

// ✗ Kötü - Testler birbirine bağımlı
let counter = 0;
it('first test', () => { counter++; });
it('second test', () => { expect(counter).toBe(1); });
```

### 2. Descriptive Names

```typescript
// ✓ İyi
it('should return 401 when session token is missing', async () => {});

// ✗ Kötü
it('test error', async () => {});
```

### 3. AAA Pattern

```typescript
it('should create beneficiary', async () => {
  // Arrange
  const mockData = { name: 'Test', tc_no: '12345678901' };
  vi.mocked(appwriteBeneficiaries.create).mockResolvedValue(mockData);
  
  // Act
  const response = await POST(createMockRequest('/api/beneficiaries', {
    method: 'POST',
    body: mockData,
  }));
  
  // Assert
  expect(response.status).toBe(201);
});
```

### 4. Mock Scope

```typescript
// ✓ İyi - Test içinde mock
it('specific test', () => {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true });
  // ...
});

// △ Dikkatli - Global mock
vi.mock('@/lib/api', () => ({
  getData: vi.fn(),
}));
```

