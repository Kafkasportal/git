"use client";

import logger from "@/lib/logger";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";

/**
 * Authentication Store (Zustand)
 * Real authentication using server-side API routes and Appwrite backend
 */

import { create } from "zustand";
import {
  devtools,
  persist,
  subscribeWithSelector,
  createJSONStorage,
} from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { User } from "@/types/auth";
import type { PermissionValue } from "@/types/permissions";

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
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  demoLogin: () => void;
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

              // Check for demo session first (no API call needed)
              const stored = localStorage.getItem("auth-session");
              if (stored) {
                try {
                  const localData = JSON.parse(stored);
                  if (localData.isDemo && localData.isAuthenticated) {
                    // Demo session - restore demo user without API call
                    const demoUser: User = {
                      id: "demo-user-001",
                      email: "demo@dernek.org",
                      name: "Demo Kullanici",
                      role: "admin",
                      avatar: null,
                      permissions: [
                        "donations:read",
                        "donations:write",
                        "beneficiaries:read",
                        "beneficiaries:write",
                        "scholarships:read",
                        "scholarships:write",
                        "finance:read",
                        "finance:write",
                        "messages:read",
                        "messages:write",
                        "workflow:read",
                        "workflow:write",
                        "partners:read",
                        "partners:write",
                        "reports:read",
                        "reports:write",
                        "settings:read",
                        "settings:write",
                        "users:manage",
                        "aid_applications:read",
                        "aid_applications:write",
                      ] as PermissionValue[],
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };

                    set((state) => {
                      state.user = demoUser;
                      state.isAuthenticated = true;
                      state.isInitialized = true;
                      state.isLoading = false;
                    });
                    return;
                  }
                  
                  // Check if we have a valid session indicator in localStorage
                  // Only make API call if we have a session indicator
                  if (localData.userId && localData.isAuthenticated) {
                    // We have a session indicator, validate it with server
                    try {
                      // Fetch current user (this validates session on server)
                      const userResp = await fetch("/api/auth/user", {
                        method: "GET",
                        cache: "no-store",
                        credentials: "include",
                      });

                      if (userResp.ok) {
                        const userData = await userResp.json();
                        if (userData.success && userData.data) {
                          const user = userData.data;

                          // Update localStorage (minimal info for offline fallback)
                          // SECURITY: Don't store sensitive data like email, role, permissions
                          localStorage.setItem(
                            "auth-session",
                            JSON.stringify({
                              userId: user.id,
                              isAuthenticated: true,
                              lastVerified: Date.now(),
                            }),
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

                      // No valid session - clear localStorage
                      localStorage.removeItem("auth-session");
                      set((state) => {
                        state.isAuthenticated = false;
                        state.user = null;
                        state.isInitialized = true;
                        state.isLoading = false;
                      });
                      return;
                    } catch (_apiError) {
                      // API call failed - clear invalid session
                      localStorage.removeItem("auth-session");
                      set((state) => {
                        state.isAuthenticated = false;
                        state.user = null;
                        state.isInitialized = true;
                        state.isLoading = false;
                      });
                      return;
                    }
                  }
                } catch {
                  // Invalid localStorage, continue with normal flow
                }
              }

              // No session in localStorage - user is not authenticated
              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.isInitialized = true;
                state.isLoading = false;
              });
            } catch (_error) {
                // Network error - try localStorage fallback
                const storedFallback = localStorage.getItem("auth-session");
                if (storedFallback) {
                  try {
                    const localData = JSON.parse(storedFallback);
                    // SECURITY: Only check for basic session validity
                    // Full user data should be fetched from server when online
                    const hasValidData =
                      localData.userId && localData.isAuthenticated;
                    const isStale =
                      !localData.lastVerified ||
                      Date.now() - localData.lastVerified > 24 * 60 * 60 * 1000; // 24 hours

                    if (hasValidData && !isStale) {
                      // Note: We only set isAuthenticated flag here
                      // User data will be fetched when network is available
                      set((state) => {
                        state.isAuthenticated = true;
                        state.isInitialized = true;
                        state.isLoading = false;
                        // Don't set user data from localStorage to avoid stale data
                      });
                      return;
                    }
                  } catch {
                    // Invalid localStorage
                  }
                }

                // Clear everything on error
                localStorage.removeItem("auth-session");
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
          login: async (
            email: string,
            password: string,
            rememberMe = false,
            twoFactorCode?: string,
          ) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
              state.rememberMe = rememberMe;
            });

            try {
              // Get CSRF token first
              const csrfResponse = await fetch("/api/csrf");

              if (!csrfResponse.ok) {
                throw new Error(
                  "Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.",
                );
              }

              const csrfData = await csrfResponse.json();

              if (!csrfData.success) {
                throw new Error(
                  "Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.",
                );
              }

              // Call server-side login API (sets HttpOnly cookie)
              const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": csrfData.token,
                },
                body: JSON.stringify({ email, password, rememberMe, twoFactorCode }),
              });

              const result = await response.json();

              if (!result.success) {
                // Check if 2FA is required
                if (result.requiresTwoFactor) {
                  // Return special error to trigger 2FA prompt
                  const error = new Error(result.error || "2FA kodu gereklidir") as Error & { requiresTwoFactor?: boolean };
                  error.requiresTwoFactor = true;
                  throw error;
                }
                
                // Handle specific error cases
                if (response.status === 401) {
                  throw new Error(
                    "E-posta veya şifre hatalı. Lütfen kontrol edin.",
                  );
                } else if (response.status === 429) {
                  throw new Error(
                    "Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
                  );
                } else if (response.status === 400) {
                  throw new Error("E-posta ve şifre alanları zorunludur.");
                } else {
                  throw new Error(
                    result.error || "Giriş yapılamadı. Lütfen tekrar deneyin.",
                  );
                }
              }

              const user = result.data.user;

              // Create session object (without actual token - stored in HttpOnly cookie)
              const sessionObj: Session = {
                userId: user.id,
                accessToken: "stored-in-httponly-cookie", // Not stored client-side
                expire: result.data.session.expire,
              };

              // Save minimal session info to localStorage
              // SECURITY: Don't store sensitive data like email, role, permissions
              localStorage.setItem(
                "auth-session",
                JSON.stringify({
                  userId: user.id,
                  isAuthenticated: true,
                  lastVerified: Date.now(),
                }),
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
              let errorMessage = "Giriş yapılamadı. Lütfen tekrar deneyin.";

              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === "string") {
                errorMessage = error;
              }

              // Network error handling
              if (
                errorMessage.includes("Failed to fetch") ||
                errorMessage.includes("NetworkError")
              ) {
                errorMessage = "İnternet bağlantınızı kontrol edin.";
              }

              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              throw new Error(errorMessage);
            }
          },

          // Demo Login action (bypasses Appwrite)
          demoLogin: () => {
            const demoUser: User = {
              id: "demo-user-001",
              email: "demo@dernek.org",
              name: "Demo Kullanici",
              role: "admin",
              avatar: null,
              permissions: [
                "donations:read",
                "donations:write",
                "beneficiaries:read",
                "beneficiaries:write",
                "scholarships:read",
                "scholarships:write",
                "finance:read",
                "finance:write",
                "messages:read",
                "messages:write",
                "workflow:read",
                "workflow:write",
                "partners:read",
                "partners:write",
                "reports:read",
                "reports:write",
                "settings:read",
                "settings:write",
                "users:manage",
                "aid_applications:read",
                "aid_applications:write",
              ] as PermissionValue[],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const demoSession: Session = {
              userId: demoUser.id,
              accessToken: "demo-token",
              expire: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            // Set localStorage for client-side state
            localStorage.setItem(
              "auth-session",
              JSON.stringify({
                userId: demoUser.id,
                isAuthenticated: true,
                lastVerified: Date.now(),
                isDemo: true,
              }),
            );

            // Set cookie for middleware authentication
            // This is a demo session cookie that the middleware can verify
            const demoSessionCookie = JSON.stringify({
              sessionId: "demo-session-001",
              userId: demoUser.id,
              expire: demoSession.expire,
              isDemo: true,
            });
            document.cookie = `auth-session=${encodeURIComponent(demoSessionCookie)}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;

            set((state) => {
              state.user = demoUser;
              state.session = demoSession;
              state.isAuthenticated = true;
              state.isInitialized = true;
              state.isLoading = false;
              state.error = null;
            });
          },

          // Logout action
          logout: async (callback?: () => void) => {
            try {
              // Call server-side logout API (clears HttpOnly cookie)
              const token = getCsrfTokenFromCookie();
              await fetch("/api/auth/logout", {
                method: "POST",
                headers: token ? { "x-csrf-token": token } : undefined,
              });
            } catch (error) {
              logger.error("Logout error", { error });
            }

            // Clear localStorage
            localStorage.removeItem("auth-session");
            localStorage.removeItem("rememberMe");

            // Clear demo cookie if exists (client-side)
            if (typeof document !== "undefined") {
              document.cookie = "auth-session=; path=/; max-age=0; SameSite=Lax";
            }

            set((state) => {
              state.user = null;
              state.session = null;
              state.isAuthenticated = false;
              state.error = null;
              state.showLoginModal = false;
              state.rememberMe = false;
            });

            if (callback) {
              callback();
            } else {
              window.location.replace("/login");
            }
          },

          // Permission helpers
          hasPermission: (permission: PermissionValue | string) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            return (user.permissions || []).includes(
              permission as PermissionValue,
            );
          },

          hasRole: (role: string) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            if (!role) return false;
            return (user.role || "").toLowerCase() === role.toLowerCase();
          },

          hasAnyPermission: (permissions: Array<PermissionValue | string>) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            return permissions.some((permission) =>
              (user.permissions || []).includes(permission as PermissionValue),
            );
          },

          hasAllPermissions: (permissions: Array<PermissionValue | string>) => {
            const { user, isAuthenticated } = get();
            if (!user || !isAuthenticated) return false;
            return permissions.every((permission) =>
              (user.permissions || []).includes(permission as PermissionValue),
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
          name: "auth-store",
          storage: createJSONStorage(() => {
            // Safe localStorage wrapper for SSR
            if (typeof window === "undefined") {
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
        },
      ),
    ),
    { name: "AuthStore" },
  ),
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
