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
  sessionRefreshIntervalId: number | null;

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
  refreshSession: () => Promise<void>;
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

const SESSION_REFRESH_INTERVAL = 1000 * 60 * 5; // Refresh every 5 minutes

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
          sessionRefreshIntervalId: null,
          showLoginModal: false,
          rememberMe: false,

          // Initialize authentication
          initializeAuth: () => {
            // Run async validation
            (async () => {
              const { refreshSession } = get();

              set((state) => {
                state.isLoading = true;
                // Clear any existing interval before attempting re-initialization
                if (state.sessionRefreshIntervalId) {
                  clearInterval(state.sessionRefreshIntervalId);
                  state.sessionRefreshIntervalId = null;
                }
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
                    let userFromStorage: User | null = null;
                    if (stored) {
                      try {
                        const localData = JSON.parse(stored);
                        // Check if localStorage has old wildcard permission or invalid permissions
                        const hasOldWildcard =
                          Array.isArray(localData.permissions) &&
                          localData.permissions.includes('*');
                        const hasInvalidPermissions =
                          !Array.isArray(localData.permissions) ||
                          localData.permissions.length === 0;

                        if (
                          localData.userId === sessionData.data.userId &&
                          !hasOldWildcard &&
                          !hasInvalidPermissions
                        ) {
                          userFromStorage = {
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
                        }
                      } catch {
                        // Invalid localStorage data
                      }
                    }

                    if (userFromStorage) {
                      set((state) => {
                        state.user = userFromStorage;
                        state.isAuthenticated = true;
                        state.isInitialized = true;
                        state.isLoading = false;
                      });
                    } else {
                      // Fetch user data from server if not in storage or invalid
                      const userResp = await fetch('/api/auth/user', {
                        method: 'GET',
                        cache: 'no-store',
                        credentials: 'include',
                      });

                      if (userResp.ok) {
                        const userData = await userResp.json();
                        if (userData.success && userData.data) {
                          const user = userData.data;
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
                        }
                      }
                    }

                    // Start periodic session refresh only if authenticated
                    if (get().isAuthenticated) {
                      const intervalId = window.setInterval(() => {
                        refreshSession();
                      }, SESSION_REFRESH_INTERVAL) as unknown as number; // Cast to number
                      set((state) => {
                        state.sessionRefreshIntervalId = intervalId;
                      });
                    }
                    return;
                  }
                }

                // No valid server session, clear localStorage and state
                localStorage.removeItem('auth-session');
                set((state) => {
                  state.isAuthenticated = false;
                  state.user = null;
                  state.isInitialized = true;
                  state.isLoading = false;
                  if (state.sessionRefreshIntervalId) {
                    clearInterval(state.sessionRefreshIntervalId);
                    state.sessionRefreshIntervalId = null;
                  }
                });
              } catch (_error) {
                logger.error(
                  'Error during initializeAuth, attempting localStorage fallback:',
                  _error
                );
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
                      // Start periodic session refresh if successful from localStorage
                      if (get().isAuthenticated) {
                        const intervalId = window.setInterval(() => {
                          refreshSession();
                        }, SESSION_REFRESH_INTERVAL) as unknown as number; // Cast to number
                        set((state) => {
                          state.sessionRefreshIntervalId = intervalId;
                        });
                      }
                      return;
                    }
                  } catch (e) {
                    logger.error('Invalid localStorage data during initializeAuth fallback:', e);
                  }
                }

                set((state) => {
                  state.isAuthenticated = false;
                  state.user = null;
                  state.isInitialized = true;
                  state.isLoading = false;
                  if (state.sessionRefreshIntervalId) {
                    clearInterval(state.sessionRefreshIntervalId);
                    state.sessionRefreshIntervalId = null;
                  }
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
                // Clear any existing interval
                if (state.sessionRefreshIntervalId) {
                  clearInterval(state.sessionRefreshIntervalId);
                }
                // Start new periodic session refresh
                state.sessionRefreshIntervalId = window.setInterval(() => {
                  get().refreshSession();
                }, SESSION_REFRESH_INTERVAL) as unknown as number; // Cast to number
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
              if (state.sessionRefreshIntervalId) {
                clearInterval(state.sessionRefreshIntervalId);
                state.sessionRefreshIntervalId = null;
              }
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

          refreshSession: async () => {
            const { logout, setUser, setLoading, setError } = get();
            setLoading(true);
            try {
              const sessionResp = await fetch('/api/auth/session', {
                method: 'GET',
                cache: 'no-store',
                credentials: 'include',
              });

              if (sessionResp.ok) {
                const sessionData = await sessionResp.json();
                if (sessionData.success && sessionData.data?.userId) {
                  // Session is still valid on the server
                  set((state) => {
                    state.isAuthenticated = true;
                    // Potentially refresh session object from server if it contains new expiry
                    state.session = {
                      userId: sessionData.data.userId,
                      accessToken: 'stored-in-httponly-cookie',
                      expire: sessionData.data.expire,
                    };
                  });

                  // Attempt to load user from localStorage (it should exist if isAuthenticated is true)
                  const stored = localStorage.getItem('auth-session');
                  if (stored) {
                    try {
                      const localData = JSON.parse(stored);
                      setUser({
                        id: localData.userId,
                        email: localData.email,
                        name: localData.name,
                        role: localData.role,
                        permissions: localData.permissions ?? [],
                        avatar: localData.avatar ?? null,
                        isActive: true, // Assuming active if session is valid
                        createdAt: localData.createdAt || new Date().toISOString(),
                        updatedAt: localData.updatedAt || new Date().toISOString(),
                      });
                    } catch (e) {
                      logger.error(
                        'Failed to parse auth-session from localStorage during refresh',
                        e
                      );
                      // If localStorage is corrupt, force logout
                      logout();
                    }
                  } else {
                    // If session is valid but no localstorage, fetch user data
                    const userResp = await fetch('/api/auth/user', {
                      method: 'GET',
                      cache: 'no-store',
                      credentials: 'include',
                    });

                    if (userResp.ok) {
                      const userData = await userResp.json();
                      if (userData.success && userData.data) {
                        const user = userData.data;
                        setUser(user);
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
                      } else {
                        // User data fetch failed, but session was valid, should not happen often
                        logger.warn('Session valid but failed to fetch user data during refresh');
                        logout();
                      }
                    } else {
                      // Failed to fetch user with valid session, indicates an issue
                      logger.warn('Failed to fetch user during session refresh, logging out');
                      logout();
                    }
                  }
                } else {
                  // Server session not successful or no user ID, treat as invalid
                  logger.info('Server session invalid during refresh, logging out');
                  logout();
                }
              } else {
                // Session response not OK, meaning cookie is probably expired or invalid
                logger.info('Session response not OK during refresh, logging out');
                logout();
              }
            } catch (error) {
              logger.error('Error during session refresh:', error);
              setError('Session refresh failed due to network error.');
              logout(); // Log out on network errors during refresh
            } finally {
              setLoading(false);
            }
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
