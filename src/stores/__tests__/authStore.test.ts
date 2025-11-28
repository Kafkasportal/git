import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import { MODULE_PERMISSIONS, SPECIAL_PERMISSIONS } from '@/types/permissions';

// Mock UserRole enum
vi.mock('@/types/auth', () => ({
  UserRole: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    MEMBER: 'MEMBER',
    VIEWER: 'VIEWER',
    VOLUNTEER: 'VOLUNTEER',
  },
}));

// Mock permissions to ensure they are always defined
vi.mock('@/types/permissions', () => ({
  MODULE_PERMISSIONS: {
    BENEFICIARIES: 'beneficiaries:access',
    DONATIONS: 'donations:access',
    AID_APPLICATIONS: 'aid_applications:access',
    SCHOLARSHIPS: 'scholarships:access',
    MESSAGES: 'messages:access',
    FINANCE: 'finance:access',
    REPORTS: 'reports:access',
    SETTINGS: 'settings:access',
    WORKFLOW: 'workflow:access',
    PARTNERS: 'partners:access',
  },
  SPECIAL_PERMISSIONS: {
    USERS_MANAGE: 'users:manage',
  },
  ALL_PERMISSIONS: [
    'beneficiaries:access',
    'donations:access',
    'aid_applications:access',
    'scholarships:access',
    'messages:access',
    'finance:access',
    'reports:access',
    'settings:access',
    'workflow:access',
    'partners:access',
    'users:manage',
  ],
  PERMISSION_LABELS: {
    'beneficiaries:access': 'Hak Sahipleri',
    'donations:access': 'Bağışlar',
    'aid_applications:access': 'Yardım Başvuruları',
    'scholarships:access': 'Burslar',
    'messages:access': 'Mesajlaşma',
    'finance:access': 'Finans',
    'reports:access': 'Raporlar',
    'settings:access': 'Ayarlar',
    'workflow:access': 'Görev & Toplantılar',
    'partners:access': 'Ortak Yönetimi',
    'users:manage': 'Kullanıcı Yönetimi',
  },
}));

// Mock zustand/middleware/persist to disable persistence in tests
vi.mock('zustand/middleware', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persist: (creator: any) => creator, // Return the creator directly, effectively disabling persistence
  };
});

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Track login attempts for rate limiting test
let loginAttempts = 0;

// Helper to create a fresh store instance for testing
function createTestStore() {
  // Reset any global state
  return () => useAuthStore();
}

describe('AuthStore', () => {
  beforeAll(() => {
    // Mock window.location to prevent navigation errors
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000', assign: vi.fn(), replace: vi.fn() },
      writable: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock.mockClear();
    loginAttempts = 0; // Reset attempt counter

    // Setup default fetch mocks
    fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/csrf') {
        return {
          ok: true,
          json: async () => ({ success: true, token: 'mock-csrf-token' }),
        };
      }

      if (url === '/api/auth/login' && options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        loginAttempts++;

        // Rate limiting test: after 5 attempts, return 429
        if (body.email === 'wrong@email.com' && loginAttempts > 5) {
          return {
            ok: false,
            status: 429,
            json: async () => ({
              error: 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
            }),
          };
        }

        if (body.email === 'admin@test.com' && body.password === 'admin123') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                user: {
                  id: 'user-123',
                  name: 'Test Admin',
                  email: 'admin@test.com',
                  role: 'Dernek Başkanı',
                  permissions: [
                    MODULE_PERMISSIONS.BENEFICIARIES,
                    MODULE_PERMISSIONS.DONATIONS,
                    MODULE_PERMISSIONS.AID_APPLICATIONS,
                    SPECIAL_PERMISSIONS.USERS_MANAGE,
                  ],
                  avatar: null,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                session: {
                  expire: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                },
              },
            }),
          };
        }
        return {
          ok: false,
          json: async () => ({ error: 'Invalid credentials' }),
        };
      }

      if (url === '/api/auth/logout' && options?.method === 'POST') {
        // Clear localStorage on logout
        localStorage.clear();
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }

      throw new Error(`Unhandled fetch to ${url}`);
    });
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('admin@test.com', 'admin123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuthStore());

      try {
        await act(async () => {
          await result.current.login('wrong@email.com', 'wrongpass');
        });
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeTruthy();
        expect((error as Error).message).toBe('Invalid credentials');
      }
    });
  });

  describe('logout', () => {
    it('should clear user data and session', async () => {
      // Use a separate hook instance to avoid rate limiting interference
      const { result } = renderHook(createTestStore());

      // First login
      await act(async () => {
        await result.current.login('admin@test.com', 'admin123');
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('permissions', () => {
    it('should check user permissions correctly', async () => {
      // Use a separate hook instance to avoid rate limiting interference
      const { result } = renderHook(createTestStore());

      await act(async () => {
        await result.current.login('admin@test.com', 'admin123');
      });

      expect(result.current.hasPermission(MODULE_PERMISSIONS.BENEFICIARIES)).toBe(true);
      expect(result.current.hasRole('Dernek Başkanı')).toBe(true);
    });
  });

  // Run rate limiting test last to avoid interference
  describe('rate limiting', () => {
    it('should handle rate limiting', async () => {
      const { result } = renderHook(createTestStore());

      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        try {
          await act(async () => {
            await result.current.login('wrong@email.com', 'wrongpass');
          });
        } catch (_error) {
          // Expected error
        }
      }

      // This should trigger rate limiting
      try {
        await act(async () => {
          await result.current.login('wrong@email.com', 'wrongpass');
        });
        expect.fail('Expected rate limiting to trigger');
      } catch (error: unknown) {
        const err = error as { message?: string };
        expect(err.message).toContain('Çok fazla deneme');
      }
    });
  });
});
