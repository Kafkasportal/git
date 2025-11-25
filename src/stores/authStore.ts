'use client';

import logger from '@/lib/logger';
import { getCsrfTokenFromCookie } from '@/lib/csrf';

/**
 * Authentication Store (Zustand)
 * Real authentication using server-side API routes and Appwrite backend
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User } from '@/types/auth';
import type { PermissionValue } from '@/types/permissions';

interface Session {
  userId: string;
  accessToken: string;
  expire: string;
}

interface AuthState {
  // Auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // UI state
  showLoginModal: boolean;
  rememberMe: boolean;
}

interface AuthActions {
  // Authentication actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: (callback?: () => void) => void;
  initializeAuth: () => void;

  // Permission helpers
  hasPermission: (permission: PermissionValue | string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: Array<PermissionValue | string>) => boolean;
  hasAllPermissions: (permissions: Array<PermissionValue | string>) => boolean;

  // UI actions
  setShowLoginModal: (show: boolean) => void;
  clearError: () => void;
  setRememberMe: (remember: boolean) => void;
  setHydrated: (hydrated: boolean) => void;

  // Internal actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

// Convert backend user to Store user
export const backendUserToStoreUser = (backendUser: {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string | null;
  permissions?: PermissionValue[];
  isActive?: boolean;
  phone?: string;
  labels?: string[];
  createdAt?: string;
  updatedAt?: string;
}): User => ({
  id: backendUser.id,
  email: backendUser.email,
  name: backendUser.name,
  role: backendUser.role,
  avatar: backendUser.avatar ?? null,
  permissions: backendUser.permissions ?? [],
  isActive: backendUser.isActive ?? true,
  phone: backendUser.phone,
  labels: backendUser.labels,
  createdAt: backendUser.createdAt || new Date().toISOString(),
  updatedAt: backendUser.updatedAt || new Date().toISOString(),
});

export const useAuthStore = create<AuthStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Initial state
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false,
          error: null,
          _hasHydrated: false,
          showLoginModal: false,
          rememberMe: false,

          // Initialize authentication
          initializeAuth: () => {
            // Run async validation
            (async () => {
            set((state) => {
              state.isLoading = true;
            });

            try {
              // First, validate server-side session (cookie)
              const sessionResp = await fetch('/api/auth/session', {
                method: 'GET',
                cache: 'no-store',
                credentials: 'include',
              });

              if (sessionResp.ok) {
                const sessionData = await sessionResp.json();
                if (sessionData.success && sessionData.data?.userId) {
                  // Server session is valid, get user data
                  const stored = localStorage.getItem('auth-session');
                  if (stored) {
                    try {
                      const localData = JSON.parse(stored);
                      // Check if localStorage has old wildcard permission or invalid permissions
                      const hasOldWildcard = Array.isArray(localData.permissions) && localData.permissions.includes('*');
                      const hasInvalidPermissions = !Array.isArray(localData.permissions) || localData.permissions.length === 0;
                      
                      if (localData.userId === sessionData.data.userId && !hasOldWildcard && !hasInvalidPermissions) {
                        // LocalStorage matches server session and has valid permissions
                        set((state) => {
                          state.user = {
                            id: localData.userId,
                            email: localData.email,
                            name: localData.name,
                            role: localData.role,
                            permissions: localData.permissions ?? [],
                            avatar: localData.avatar ?? null,
                            isActive: true,
                            createdAt: localData.createdAt || new Date().toISOString(),
                            updatedAt: localData.updatedAt || new Date().toISOString(),
                          };
                          state.isAuthenticated = true;
                          state.isInitialized = true;
                          state.isLoading = false;
                        });
                        return;
                      }
                      // If old wildcard or invalid permissions, fetch from server
                    } catch {
                      // Invalid localStorage data, will fetch from server
                    }
                  }

                  // Fetch user data from server
                  try {
                    const userResp = await fetch('/api/auth/user', {
                      method: 'GET',
                      cache: 'no-store',
                      credentials: 'include',
                    });

                    if (userResp.ok) {
                      const userData = await userResp.json();
                      if (userData.success && userData.data) {
                        const user = userData.data;
                        // Update localStorage
                        localStorage.setItem(
                          'auth-session',
                          JSON.stringify({
                            userId: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            permissions: user.permissions ?? [],
                            avatar: user.avatar ?? null,
                          })
                        );

                        set((state) => {
                          state.user = user;
                          state.isAuthenticated = true;
                          state.isInitialized = true;
                          state.isLoading = false;
                        });
                        return;
                      }
                    }
                  } catch {
                    // Failed to fetch user, but session is valid
                    // Use localStorage if available
                    const stored = localStorage.getItem('auth-session');
                    if (stored) {
                      try {
                        const localData = JSON.parse(stored);
                        set((state) => {
                          state.user = {
                            id: localData.userId,
                            email: localData.email,
                            name: localData.name,
                            role: localData.role,
                            permissions: localData.permissions ?? [],
                            avatar: localData.avatar ?? null,
                            isActive: true,
                            createdAt: localData.createdAt || new Date().toISOString(),
                            updatedAt: localData.updatedAt || new Date().toISOString(),
                          };
                          state.isAuthenticated = true;
                          state.isInitialized = true;
                          state.isLoading = false;
                        });
                        return;
                      } catch {
                        // Invalid localStorage
                      }
                    }
                  }
                }
              }

              // No valid server session, clear localStorage
              localStorage.removeItem('auth-session');
              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.isInitialized = true;
                state.isLoading = false;
              });
            } catch (_error) {
              // Network error - check localStorage as fallback
              const stored = localStorage.getItem('auth-session');
              if (stored) {
                try {
                  const localData = JSON.parse(stored);
                  if (localData.userId) {
                    set((state) => {
                      state.user = {
                        id: localData.userId,
                        email: localData.email,
                        name: localData.name,
                        role: localData.role,
                        permissions: localData.permissions ?? [],
                        avatar: localData.avatar ?? null,
                        isActive: true,
                        createdAt: localData.createdAt || new Date().toISOString(),
                        updatedAt: localData.updatedAt || new Date().toISOString(),
                      };
                      state.isAuthenticated = true;
                      state.isInitialized = true;
                      state.isLoading = false;
                    });
                    return;
                  }
                } catch {
                  // Invalid localStorage
                }
              }

              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.isInitialized = true;
                state.isLoading = false;
              });
            }
            })();
          },

          // Login action
          login: async (email: string, password: string, rememberMe = false) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
              state.rememberMe = rememberMe;
            });

            try {
              // Get CSRF token first
              const csrfResponse = await fetch('/api/csrf');

              if (!csrfResponse.ok) {
                throw new Error('Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.');
              }

              const csrfData = await csrfResponse.json();

              if (!csrfData.success) {
                throw new Error('Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.');
              }

              // Call server-side login API (sets HttpOnly cookie)
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfData.token,
                },
                body: JSON.stringify({ email, password, rememberMe }),
              });

              const result = await response.json();

              if (!result.success) {
                // Handle specific error cases
                if (response.status === 401) {
                  throw new Error('E-posta veya şifre hatalı. Lütfen kontrol edin.');
                } else if (response.status === 429) {
                  throw new Error(
                    'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.'
                  );
                } else if (response.status === 400) {
                  throw new Error('E-posta ve şifre alanları zorunludur.');
                } else {
                  throw new Error(result.error || 'Giriş yapılamadı. Lütfen tekrar deneyin.');
                }
              }

              const user = result.data.user;

              // Create session object (without actual token - stored in HttpOnly cookie)
              const sessionObj: Session = {
                userId: user.id,
                accessToken: 'stored-in-httponly-cookie', // Not stored client-side
                expire: result.data.session.expire,
              };

              // Save session info to localStorage (for persistence)
              localStorage.setItem(
                'auth-session',
                JSON.stringify({
                  userId: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  permissions: user.permissions ?? [],
                  avatar: user.avatar ?? null,
                })
              );

              set((state) => {
                state.user = user;
                state.session = sessionObj;
                state.isAuthenticated = true;
                state.isInitialized = true;
                state.isLoading = false;
                state.error = null;
              });
            } catch (error: unknown) {
              let errorMessage = 'Giriş yapılamadı. Lütfen tekrar deneyin.';

              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }

              // Network error handling
              if (
                errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('NetworkError')
              ) {
                errorMessage = 'İnternet bağlantınızı kontrol edin.';
              }

              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              throw new Error(errorMessage);
            }
          },

          // Logout action
          logout: async (callback?: () => void) => {
            try {
              // Call server-side logout API (clears HttpOnly cookie)
              const token = getCsrfTokenFromCookie();
              await fetch('/api/auth/logout', {
                method: 'POST',
                headers: token ? { 'x-csrf-token': token } : undefined,
              });
            } catch (error) {
              logger.error('Logout error', { error });
            }

            // Clear localStorage
            localStorage.removeItem('auth-session');

            set((state) => {
              state.user = null;
              state.session = null;
              state.isAuthenticated = false;
              state.error = null;
              state.showLoginModal = false;
            });

            if (callback) {
              callback();
            } else {
              window.location.replace('/login');
            }
          },

          // Permission helpers
          hasPermission: (permission: PermissionValue | string) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            return (user.permissions || []).includes(permission as PermissionValue);
          },

          hasRole: (role: string) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            if (!role) return false;
            return (user.role || '').toLowerCase() === role.toLowerCase();
          },

          hasAnyPermission: (permissions: Array<PermissionValue | string>) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            return permissions.some((permission) =>
              (user.permissions || []).includes(permission as PermissionValue)
            );
          },

          hasAllPermissions: (permissions: Array<PermissionValue | string>) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            return permissions.every((permission) =>
              (user.permissions || []).includes(permission as PermissionValue)
            );
          },

          // UI actions
          setShowLoginModal: (show: boolean) => {
            set((state) => {
              state.showLoginModal = show;
            });
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          setRememberMe: (remember: boolean) => {
            set((state) => {
              state.rememberMe = remember;
            });
          },

          setHydrated: (hydrated: boolean) => {
            set((state) => {
              state._hasHydrated = hydrated;
            });
          },

          // Internal actions
          setUser: (user: User | null) => {
            set((state) => {
              state.user = user;
            });
          },

          setSession: (session: Session | null) => {
            set((state) => {
              state.session = session;
            });
          },

          setLoading: (loading: boolean) => {
            set((state) => {
              state.isLoading = loading;
            });
          },

          setError: (error: string | null) => {
            set((state) => {
              state.error = error;
            });
          },
        })),
        {
          name: 'auth-store',
          storage: createJSONStorage(() => {
            // Safe localStorage wrapper for SSR
            if (typeof window === 'undefined') {
              return {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
              };
            }
            return localStorage;
          }),
          partialize: (state) => ({
            user: state.user,
            session: state.session,
            isAuthenticated: state.isAuthenticated,
            isInitialized: state.isInitialized,
            rememberMe: state.rememberMe,
          }),
          version: 1,
          onRehydrateStorage: () => (state) => {
            if (state) {
              state.isLoading = false;
              state._hasHydrated = true;
            }
          },
          skipHydration: false,
        }
      )
    ),
    { name: 'AuthStore' }
  )
);

// Selectors for performance optimization
export const authSelectors = {
  user: (state: AuthStore) => state.user,
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  isLoading: (state: AuthStore) => state.isLoading,
  error: (state: AuthStore) => state.error,
  permissions: (state: AuthStore) => state.user?.permissions ?? [],
  role: (state: AuthStore) => state.user?.role,
  session: (state: AuthStore) => state.session,
  hasHydrated: (state: AuthStore) => state._hasHydrated,
};
