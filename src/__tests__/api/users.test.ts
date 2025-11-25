import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock auth utils
vi.mock('@/lib/api/auth-utils', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ 
    id: 'user-123', 
    name: 'Test User',
    permissions: ['users:read', 'users:write', 'users:delete']
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(true),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  readOnlyRateLimit: vi.fn().mockResolvedValue({ success: true }),
  dataModificationRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Appwrite users API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteUsers: {
    listUsers: vi.fn().mockResolvedValue({
      total: 2,
      users: [
        { $id: 'user-1', name: 'User 1', email: 'user1@test.com' },
        { $id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      ],
    }),
    createUser: vi.fn().mockResolvedValue({
      $id: 'new-user',
      name: 'New User',
      email: 'new@test.com',
    }),
    getUser: vi.fn().mockResolvedValue({
      $id: 'user-1',
      name: 'User 1',
      email: 'user1@test.com',
    }),
    updateUser: vi.fn().mockResolvedValue({
      $id: 'user-1',
      name: 'Updated User',
      email: 'user1@test.com',
    }),
    deleteUser: vi.fn().mockResolvedValue(true),
  },
}));

// Mock password utils
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  validatePasswordStrength: vi.fn().mockReturnValue({ valid: true, errors: [] }),
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  parseBody: vi.fn().mockImplementation(async (req: Request) => req.json()),
  handleApiError: vi.fn().mockImplementation((error: unknown) => ({
    error: error instanceof Error ? error.message : 'Unknown error',
  })),
}));

// Mock input sanitizer
vi.mock('@/lib/security', () => ({
  InputSanitizer: {
    validateEmail: vi.fn().mockReturnValue(true),
    sanitizeText: vi.fn().mockImplementation((text: string) => text),
  },
}));

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return list of users for authenticated user with permissions', async () => {
      const { GET } = await import('@/app/api/users/route');
      
      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toBeDefined();
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with valid data', async () => {
      const { POST } = await import('@/app/api/users/route');
      
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          name: 'New User',
          email: 'new@test.com',
          role: 'Üye',
          permissions: ['beneficiaries:read'],
          password: 'SecurePass123!',
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should reject user creation with invalid email', async () => {
      const { InputSanitizer } = await import('@/lib/security');
      vi.mocked(InputSanitizer.validateEmail).mockReturnValue(false);
      
      const { POST } = await import('@/app/api/users/route');
      
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
        body: JSON.stringify({
          name: 'New User',
          email: 'invalid-email',
          role: 'Üye',
          permissions: ['beneficiaries:read'],
          password: 'SecurePass123!',
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
