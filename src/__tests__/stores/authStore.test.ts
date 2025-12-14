/**
 * AuthStore Tests
 * Tests for Zustand authentication store
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock logger
vi.mock('@/lib/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock CSRF client
vi.mock('@/lib/csrf-client', () => ({
    getCsrfTokenFromCookie: vi.fn(() => 'mock-csrf-token'),
}));

// Import after mocks
import { useAuthStore, backendUserToStoreUser } from '@/stores/authStore';

describe('AuthStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        // Mock localStorage
        const localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Reset store state
        useAuthStore.setState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
            error: null,
            _hasHydrated: false,
            showLoginModal: false,
            rememberMe: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.session).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('Demo Login', () => {
        it('should set demo user on demoLogin', () => {
            act(() => {
                useAuthStore.getState().demoLogin();
            });

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).not.toBeNull();
            expect(state.user?.email).toBe('demo@dernek.org');
            expect(state.user?.role).toBe('admin');
        });

        it('should save demo session to localStorage', () => {
            act(() => {
                useAuthStore.getState().demoLogin();
            });

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'auth-session',
                expect.stringContaining('isDemo')
            );
        });

        it('should set demo session cookie', () => {
            // Mock document.cookie
            let cookieValue = '';
            Object.defineProperty(document, 'cookie', {
                get: () => cookieValue,
                set: (value) => { cookieValue = value; },
                configurable: true,
            });

            act(() => {
                useAuthStore.getState().demoLogin();
            });

            expect(cookieValue).toContain('auth-session=');
        });

        it('should have all required permissions for demo user', () => {
            act(() => {
                useAuthStore.getState().demoLogin();
            });

            const state = useAuthStore.getState();
            expect(state.user?.permissions).toContain('donations:read');
            expect(state.user?.permissions).toContain('users:manage');
            expect(state.user?.permissions).toContain('settings:write');
        });
    });

    describe('Logout', () => {
        it('should clear user on logout', async () => {
            // Setup authenticated state
            act(() => {
                useAuthStore.getState().demoLogin();
            });

            expect(useAuthStore.getState().isAuthenticated).toBe(true);

            // Mock window.location
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { replace: vi.fn() },
                configurable: true,
            });

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await act(async () => {
                await useAuthStore.getState().logout(() => { });
            });

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.session).toBeNull();

            // Restore location
            Object.defineProperty(window, 'location', { value: originalLocation, configurable: true });
        });

        it('should clear localStorage on logout', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { replace: vi.fn() },
                configurable: true,
            });

            await act(async () => {
                await useAuthStore.getState().logout(() => { });
            });

            expect(localStorage.removeItem).toHaveBeenCalledWith('auth-session');
            expect(localStorage.removeItem).toHaveBeenCalledWith('rememberMe');

            Object.defineProperty(window, 'location', { value: originalLocation, configurable: true });
        });

        it('should call callback after logout', async () => {
            const callback = vi.fn();

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await act(async () => {
                await useAuthStore.getState().logout(callback);
            });

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('Permission Helpers', () => {
        beforeEach(() => {
            act(() => {
                useAuthStore.getState().demoLogin();
            });
        });

        it('should check hasPermission correctly', () => {
            const state = useAuthStore.getState();

            expect(state.hasPermission('donations:read')).toBe(true);
            expect(state.hasPermission('nonexistent:permission')).toBe(false);
        });

        it('should check hasRole correctly', () => {
            const state = useAuthStore.getState();

            expect(state.hasRole('admin')).toBe(true);
            expect(state.hasRole('ADMIN')).toBe(true); // case insensitive
            expect(state.hasRole('user')).toBe(false);
        });

        it('should check hasAnyPermission correctly', () => {
            const state = useAuthStore.getState();

            expect(state.hasAnyPermission(['donations:read', 'nonexistent:perm'])).toBe(true);
            expect(state.hasAnyPermission(['nonexistent1', 'nonexistent2'])).toBe(false);
        });

        it('should check hasAllPermissions correctly', () => {
            const state = useAuthStore.getState();

            expect(state.hasAllPermissions(['donations:read', 'donations:write'])).toBe(true);
            expect(state.hasAllPermissions(['donations:read', 'nonexistent'])).toBe(false);
        });

        it('should return false for unauthenticated users', () => {
            // Logout first
            useAuthStore.setState({ user: null, isAuthenticated: false });

            const state = useAuthStore.getState();
            expect(state.hasPermission('donations:read')).toBe(false);
            expect(state.hasRole('admin')).toBe(false);
            expect(state.hasAnyPermission(['donations:read'])).toBe(false);
            expect(state.hasAllPermissions(['donations:read'])).toBe(false);
        });
    });

    describe('UI Actions', () => {
        it('should set showLoginModal', () => {
            act(() => {
                useAuthStore.getState().setShowLoginModal(true);
            });

            expect(useAuthStore.getState().showLoginModal).toBe(true);

            act(() => {
                useAuthStore.getState().setShowLoginModal(false);
            });

            expect(useAuthStore.getState().showLoginModal).toBe(false);
        });

        it('should clear error', () => {
            useAuthStore.setState({ error: 'Test error' });

            act(() => {
                useAuthStore.getState().clearError();
            });

            expect(useAuthStore.getState().error).toBeNull();
        });

        it('should set rememberMe', () => {
            act(() => {
                useAuthStore.getState().setRememberMe(true);
            });

            expect(useAuthStore.getState().rememberMe).toBe(true);
        });

        it('should set hydrated state', () => {
            act(() => {
                useAuthStore.getState().setHydrated(true);
            });

            expect(useAuthStore.getState()._hasHydrated).toBe(true);
        });
    });

    describe('Internal Actions', () => {
        it('should setUser', () => {
            const testUser = {
                id: 'test-1',
                email: 'test@test.com',
                name: 'Test User',
                role: 'user',
                avatar: null,
                permissions: [],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            act(() => {
                useAuthStore.getState().setUser(testUser);
            });

            expect(useAuthStore.getState().user).toEqual(testUser);
        });

        it('should setLoading', () => {
            act(() => {
                useAuthStore.getState().setLoading(true);
            });

            expect(useAuthStore.getState().isLoading).toBe(true);
        });

        it('should setError', () => {
            act(() => {
                useAuthStore.getState().setError('Test error message');
            });

            expect(useAuthStore.getState().error).toBe('Test error message');
        });
    });

    describe('backendUserToStoreUser', () => {
        it('should convert backend user to store user', () => {
            const backendUser = {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'admin',
                avatar: 'avatar.png',
                permissions: ['donations:read' as const],
                isActive: true,
                phone: '+905551234567',
                labels: ['label1'],
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
            };

            const storeUser = backendUserToStoreUser(backendUser);

            expect(storeUser.id).toBe('user-1');
            expect(storeUser.email).toBe('test@example.com');
            expect(storeUser.name).toBe('Test User');
            expect(storeUser.role).toBe('admin');
            expect(storeUser.avatar).toBe('avatar.png');
            expect(storeUser.permissions).toContain('donations:read');
            expect(storeUser.phone).toBe('+905551234567');
        });

        it('should handle missing optional fields', () => {
            const backendUser = {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
            };

            const storeUser = backendUserToStoreUser(backendUser);

            expect(storeUser.avatar).toBeNull();
            expect(storeUser.permissions).toEqual([]);
            expect(storeUser.isActive).toBe(true);
        });
    });
});

describe('Auth Selectors', () => {
    it('should export selectors', async () => {
        const { authSelectors } = await import('@/stores/authStore');

        expect(typeof authSelectors.user).toBe('function');
        expect(typeof authSelectors.isAuthenticated).toBe('function');
        expect(typeof authSelectors.isLoading).toBe('function');
        expect(typeof authSelectors.error).toBe('function');
        expect(typeof authSelectors.permissions).toBe('function');
        expect(typeof authSelectors.role).toBe('function');
        expect(typeof authSelectors.session).toBe('function');
        expect(typeof authSelectors.hasHydrated).toBe('function');
    });
});
