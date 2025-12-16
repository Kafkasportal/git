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
    twoFactorCode?: string,
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

// Helper functions for auth operations
const DEMO_PERMISSIONS: PermissionValue[] = [
  "beneficiaries:access",
  "donations:access",
  "aid_applications:access",
  "scholarships:access",
  "messages:access",
  "finance:access",
  "reports:access",
  "settings:access",
  "workflow:access",
  "partners:access",
  "users:manage",
  "settings:manage",
  "audit:view",
];

/**
 * Create demo user object
 */
function createDemoUser(): User {
  return {
    id: "demo-user-001",
    email: "demo@dernek.org",
    name: "Demo Kullanici",
    role: "admin",
    avatar: null,
    permissions: DEMO_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Set authenticated state
 */
function setAuthenticatedState(
  set: (fn: (state: AuthState) => void) => void,
  user: User | null,
  isAuthenticated: boolean
): void {
  set((state) => {
    state.user = user;
    state.isAuthenticated = isAuthenticated;
    state.isInitialized = true;
    state.isLoading = false;
  });
}

/**
 * Set unauthenticated state
 */
function setUnauthenticatedState(
  set: (fn: (state: AuthState) => void) => void
): void {
  set((state) => {
    state.isAuthenticated = false;
    state.user = null;
    state.isInitialized = true;
    state.isLoading = false;
  });
}

/**
 * Validate session from server
 */
async function validateSessionFromServer(): Promise<User | null> {
  const userResp = await fetch("/api/auth/user", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  if (!userResp.ok) {
    return null;
  }

  const userData = await userResp.json();
  if (userData.success && userData.data) {
    const user = userData.data;
    
    // Update localStorage (minimal info for offline fallback)
    localStorage.setItem(
      "auth-session",
      JSON.stringify({
        userId: user.id,
        isAuthenticated: true,
        lastVerified: Date.now(),
      }),
    );
    
    return user;
  }

  return null;
}

/**
 * Check if localStorage session is stale
 */
function isSessionStale(localData: { lastVerified?: number }): boolean {
  if (!localData.lastVerified) {
    return true;
  }
  const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - localData.lastVerified > STALE_THRESHOLD;
}

/**
 * Get CSRF token from server
 */
async function getCsrfToken(): Promise<string> {
  const csrfResponse = await fetch("/api/csrf", {
    credentials: "include",
  });

  if (!csrfResponse.ok) {
    throw new Error("Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.");
  }

  const csrfData = await csrfResponse.json();

  if (!csrfData.success) {
    throw new Error("Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.");
  }

  return csrfData.token;
}

/**
 * Parse login response
 */
async function parseLoginResponse(response: Response): Promise<{ success: boolean; data?: any; error?: string; message?: string; requiresTwoFactor?: boolean }> {
  let result;
  try {
    result = await response.json();
  } catch {
    const text = await response.text().catch(() => 'Unable to read response');
    throw new Error(`Sunucu yanıtı geçersiz: ${text.substring(0, 100)}`);
  }

  // Handle rate limiting
  if (response.status === 429) {
    const errorMsg = result?.error || result?.message || "Çok fazla deneme yapıldı. Lütfen biraz bekleyin.";
    throw new Error(errorMsg);
  }

  // Validate response structure
  if (result === null || result === undefined || result.success === undefined) {
    throw new Error(
      result?.error || result?.message || "Sunucudan geçersiz yanıt alındı. Lütfen tekrar deneyin.",
    );
  }

  return result;
}

/**
 * Handle login error response
 */
function handleLoginError(result: { error?: string; message?: string; requiresTwoFactor?: boolean }, status: number): never {
  if (result.requiresTwoFactor) {
    const error = new Error(result.error || result.message || "2FA kodu gereklidir") as Error & { requiresTwoFactor?: boolean };
    error.requiresTwoFactor = true;
    throw error;
  }

  if (status === 401) {
    throw new Error(result.error || result.message || "E-posta veya şifre hatalı. Lütfen kontrol edin.");
  }
  if (status === 400) {
    throw new Error(result.error || result.message || "E-posta ve şifre alanları zorunludur.");
  }
  
  throw new Error(result.error || result.message || "Giriş yapılamadı. Lütfen tekrar deneyin.");
}

/**
 * Extract error message from error object
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Giriş yapılamadı. Lütfen tekrar deneyin.";
}

/**
 * Check if error is network related
 */
function isNetworkError(errorMessage: string): boolean {
  return (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError")
  );
}

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
              try {
                set((state) => {
                  state.isLoading = true;
                });

                const stored = localStorage.getItem("auth-session");
                if (!stored) {
                  setUnauthenticatedState(set);
                  return;
                }

                try {
                  const localData = JSON.parse(stored);
                  
                  // Handle demo session
                  if (localData.isDemo && localData.isAuthenticated) {
                    const demoUser = createDemoUser();
                    setAuthenticatedState(set, demoUser, true);
                    return;
                  }

                  // Validate real session with server
                  if (localData.userId && localData.isAuthenticated) {
                    try {
                      const user = await validateSessionFromServer();
                      if (user) {
                        setAuthenticatedState(set, user, true);
                        return;
                      }
                    } catch {
                      // API call failed - clear invalid session
                      localStorage.removeItem("auth-session");
                      setUnauthenticatedState(set);
                      return;
                    }
                  }
                } catch {
                  // Invalid localStorage, continue with normal flow
                }

                // No valid session
                setUnauthenticatedState(set);
              } catch (_error) {
                // Network error - try localStorage fallback
                const storedFallback = localStorage.getItem("auth-session");
                if (storedFallback) {
                  try {
                    const localData = JSON.parse(storedFallback);
                    const hasValidData = localData.userId && localData.isAuthenticated;
                    const stale = isSessionStale(localData);

                    if (hasValidData && !stale) {
                      // Only set isAuthenticated flag, user data will be fetched when online
                      set((state) => {
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

                // Clear everything on error
                localStorage.removeItem("auth-session");
                setUnauthenticatedState(set);
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
              // Get CSRF token
              const csrfToken = await getCsrfToken();

              // Call server-side login API
              const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({ email, password, rememberMe, twoFactorCode }),
              });

              const result = await parseLoginResponse(response);

              if (!result.success) {
                handleLoginError(result, response.status);
              }

              const user = result.data.user;
              const sessionObj: Session = {
                userId: user.id,
                accessToken: "stored-in-httponly-cookie",
                expire: result.data.session.expire,
              };

              // Save minimal session info to localStorage
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
              let errorMessage = extractErrorMessage(error);

              if (isNetworkError(errorMessage)) {
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
                setItem: () => { },
                removeItem: () => { },
              };
            }
            return localStorage;
          }),
          partialize: (state) => ({
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
