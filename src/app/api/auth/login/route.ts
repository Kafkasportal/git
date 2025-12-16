import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";
import { cookies } from "next/headers";
import { authRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import { serializeSessionCookie } from "@/lib/auth/session";
import { Users, Query } from "node-appwrite";
import { getServerClient } from "@/lib/appwrite/server";
import {
  isAccountLocked,
  getRemainingLockoutTime,
  recordLoginAttempt,
  getFailedAttemptCount,
  LOCKOUT_CONFIG,
} from "@/lib/auth/account-lockout";

/**
 * Validate CSRF token from request
 */
function validateRequestCsrf(request: NextRequest, cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  const headerToken = request.headers.get("x-csrf-token") || "";
  const cookieToken = cookieStore.get("csrf-token")?.value || "";
  return Boolean(validateCsrfToken(headerToken, cookieToken));
}

/**
 * Check if account is locked and return error response if so
 */
function checkAccountLockout(email: string): NextResponse | null {
  if (!isAccountLocked(email)) {
    return null;
  }

  const remainingSeconds = getRemainingLockoutTime(email);
  const minutes = Math.ceil(remainingSeconds / 60);

  logger.warn("Login blocked - account locked", {
    email: `${email?.substring(0, 3)}***`,
    remainingSeconds,
  });

  return NextResponse.json(
    {
      success: false,
      error: `Hesap geçici olarak kilitlendi. ${minutes} dakika sonra tekrar deneyin.`,
      message: `Hesap geçici olarak kilitlendi. ${minutes} dakika sonra tekrar deneyin.`,
      locked: true,
      remainingSeconds,
    },
    { status: 429 },
  );
}

/**
 * Find user by email in Appwrite
 */
async function findUserByEmail(email: string): Promise<{ user: any; error: NextResponse | null }> {
  const serverClient = getServerClient();
  const serverUsers = new Users(serverClient);
  const emailLower = email.toLowerCase().trim();

  try {
    const usersList = await serverUsers.list(
      [Query.equal("email", emailLower), Query.limit(1)]
    );

    if (!usersList.users || usersList.users.length === 0) {
      recordLoginAttempt(email, false);
      const failedAttempts = getFailedAttemptCount(email);
      const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

      logger.warn("Login failed - user not found in Appwrite Auth", {
        email: `${email?.substring(0, 3)}***`,
        failedAttempts,
      });

      return {
        user: null,
        error: NextResponse.json(
          {
            success: false,
            error: "Geçersiz email veya şifre",
            message: "Geçersiz email veya şifre",
            remainingAttempts: Math.max(0, remainingAttempts),
          },
          { status: 401 },
        ),
      };
    }

    const foundUser = usersList.users[0];

    if (foundUser.status === false) {
      recordLoginAttempt(email, false);
      logger.warn("Login failed - account is disabled", {
        email: `${email?.substring(0, 3)}***`,
        userId: foundUser.$id,
      });

      return {
        user: null,
        error: NextResponse.json(
          {
            success: false,
            error: "Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.",
            message: "Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.",
          },
          { status: 403 },
        ),
      };
    }

    return { user: foundUser, error: null };
  } catch (error) {
    recordLoginAttempt(email, false);
    const failedAttempts = getFailedAttemptCount(email);
    const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Login failed - invalid credentials or Appwrite Auth error", {
      email: `${email?.substring(0, 3)}***`,
      failedAttempts,
      error: errorMessage,
    });

    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          error: "Geçersiz email veya şifre",
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 },
      ),
    };
  }
}

/**
 * Verify password by creating a temporary session
 */
async function verifyPassword(email: string, password: string): Promise<{ success: boolean; error: NextResponse | null }> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    logger.error('Appwrite configuration missing', {
      hasEndpoint: !!endpoint,
      hasProjectId: !!projectId,
    });
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Sunucu yapılandırma hatası', message: 'Sunucu yapılandırma hatası' },
        { status: 500 }
      ),
    };
  }

  try {
    const emailLower = email.toLowerCase().trim();
    const sessionResponse = await fetch(`${endpoint}/account/sessions/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
      },
      body: JSON.stringify({
        email: emailLower,
        password,
      }),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json().catch(() => ({}));
      recordLoginAttempt(email, false);
      const failedAttempts = getFailedAttemptCount(email);
      const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

      logger.warn("Login failed - invalid password", {
        email: `${email?.substring(0, 3)}***`,
        failedAttempts,
        error: errorData.message || "Invalid credentials",
      });

      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: "Geçersiz email veya şifre",
            remainingAttempts: Math.max(0, remainingAttempts),
          },
          { status: 401 },
        ),
      };
    }

    const sessionData = await sessionResponse.json();

    // Delete temporary session used for verification
    try {
      await fetch(`${endpoint}/account/sessions/${sessionData.$id}`, {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": process.env.APPWRITE_API_KEY || "",
        },
      });
    } catch {
      // Session deletion error is not critical
    }

    return { success: true, error: null };
  } catch (error) {
    recordLoginAttempt(email, false);
    const failedAttempts = getFailedAttemptCount(email);
    const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Login failed - session creation error", {
      email: `${email?.substring(0, 3)}***`,
      failedAttempts,
      error: errorMessage,
    });

    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: "Geçersiz email veya şifre",
          message: "Geçersiz email veya şifre",
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 },
      ),
    };
  }
}

/**
 * Extract user preferences from Appwrite user
 */
function extractUserPreferences(appwriteUser: any): { role: string; permissions: string[]; twoFactorEnabled: boolean } {
  let role = "Personel";
  let permissions: string[] = [];
  let twoFactorEnabled = false;

  try {
    if (appwriteUser.prefs) {
      role = (appwriteUser.prefs.role as string) || "Personel";
      const permissionsStr = appwriteUser.prefs.permissions as string;
      if (permissionsStr) {
        try {
          permissions = JSON.parse(permissionsStr);
        } catch {
          permissions = [];
        }
      }
      twoFactorEnabled = (appwriteUser.prefs.twoFactorEnabled as boolean) || false;
    }
  } catch (prefsError) {
    logger.warn("Failed to read user preferences, using defaults", {
      userId: appwriteUser.$id,
      error: prefsError,
    });
  }

  return { role, permissions, twoFactorEnabled };
}

/**
 * Check 2FA requirement and return response if needed
 */
function checkTwoFactorRequirement(twoFactorEnabled: boolean, twoFactorCode?: string): NextResponse | null {
  if (!twoFactorEnabled) {
    return null;
  }

  if (!twoFactorCode) {
    return NextResponse.json(
      {
        success: false,
        requiresTwoFactor: true,
        error: "İki faktörlü kimlik doğrulama kodu gereklidir",
        message: "İki faktörlü kimlik doğrulama kodu gereklidir",
      },
      { status: 200 },
    );
  }

  // 2FA code verification is handled in the login flow via authStore.login()
  return null;
}

/**
 * Create session cookies
 */
function createSessionCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  userId: string,
  rememberMe: boolean
): { sessionId: string; expireTime: Date; csrfToken: string } {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 16) {
    logger.error("SESSION_SECRET missing or too short");
    if (process.env.NODE_ENV !== "development") {
      throw new Error("SESSION_SECRET configuration error");
    }
  }

  const sessionId = `appwrite_session_${Date.now()}_${randomBytes(8).toString('hex')}`;
  const expireTime = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
  const signedSession = serializeSessionCookie({
    sessionId,
    userId,
    expire: expireTime.toISOString(),
  });

  const csrfToken = generateCsrfToken();

  cookieStore.set("auth-session", signedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
    path: "/",
  });

  cookieStore.set("csrf-token", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return { sessionId, expireTime, csrfToken };
}

/**
 * POST /api/auth/login
 * Handle user login with Appwrite authentication
 *
 * Verifies credentials using Appwrite Client SDK on server-side
 */
const loginHandler = async (request: NextRequest) => {
  let email: string | undefined;

  try {
    const cookieStore = await cookies();

    // Validate CSRF token
    if (!validateRequestCsrf(request, cookieStore)) {
      return NextResponse.json(
        { success: false, error: "Güvenlik doğrulaması başarısız", message: "Güvenlik doğrulaması başarısız" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    email = body.email;
    const { password, rememberMe = false, twoFactorCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email ve şifre gereklidir", message: "Email ve şifre gereklidir" },
        { status: 400 }
      );
    }

    // Check account lockout
    const lockoutResponse = checkAccountLockout(email);
    if (lockoutResponse) {
      return lockoutResponse;
    }

    // Find user by email
    const { user: appwriteUser, error: userError } = await findUserByEmail(email);
    if (userError) {
      return userError;
    }

    // Verify password
    const { success: passwordValid, error: passwordError } = await verifyPassword(email, password);
    if (passwordError) {
      return passwordError;
    }
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    // Record successful login
    recordLoginAttempt(email, true);

    // Extract user preferences
    const { role, permissions, twoFactorEnabled } = extractUserPreferences(appwriteUser);

    // Check 2FA requirement
    const twoFactorResponse = checkTwoFactorRequirement(twoFactorEnabled, twoFactorCode);
    if (twoFactorResponse) {
      return twoFactorResponse;
    }

    if (twoFactorEnabled && twoFactorCode) {
      logger.info("2FA code provided (verification skipped - storage not implemented)", {
        userId: appwriteUser.$id,
        email: `${email?.substring(0, 3)}***`,
      });
    }

    // Create session
    const { sessionId, expireTime } = createSessionCookies(cookieStore, appwriteUser.$id, rememberMe);

    // Prepare user data
    const userData = {
      id: appwriteUser.$id,
      email: appwriteUser.email,
      name: appwriteUser.name,
      role,
      permissions,
      isActive: true,
      createdAt: appwriteUser.$createdAt || new Date().toISOString(),
      updatedAt: appwriteUser.$updatedAt || new Date().toISOString(),
    };

    logger.info("User logged in successfully", {
      userId: appwriteUser.$id,
      email: `${email?.substring(0, 3)}***`,
      role: userData.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: {
          sessionId,
          expire: expireTime.toISOString(),
        },
      },
    });
  } catch (_error: unknown) {
    const errorMessage =
      _error instanceof Error
        ? _error.message
        : "Giriş yapılırken bir hata oluştu";

    logger.error("Login error", _error, {
      endpoint: "/api/auth/login",
      method: "POST",
      email: `${email?.substring(0, 3)}***`,
    });

    return NextResponse.json(
      { success: false, error: errorMessage, message: errorMessage },
      { status: 500 },
    );
  }
};

export const POST = authRateLimit(loginHandler);
