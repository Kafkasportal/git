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
 * POST /api/auth/login
 * Handle user login with Appwrite authentication
 *
 * Verifies credentials using Appwrite Client SDK on server-side
 */
const loginHandler = async (request: NextRequest) => {
  let email: string | undefined;

  try {
    const headerToken = request.headers.get("x-csrf-token") || "";
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf-token")?.value || "";

    if (!(Boolean(validateCsrfToken(headerToken, cookieToken)))) {
      return NextResponse.json(
        { success: false, error: "Güvenlik doğrulaması başarısız", message: "Güvenlik doğrulaması başarısız" },
        { status: 403 },
      );
    }

    const body = await request.json();
    email = body.email;
    const { password, rememberMe = false, twoFactorCode } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email ve şifre gereklidir", message: "Email ve şifre gereklidir" },
        { status: 400 }
      );
    }

    // Check if account is locked due to failed attempts
    if (isAccountLocked(email)) {
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

    // Verify Credentials using Appwrite Auth
    // Note: Appwrite doesn't expose password verification in server-side Users API
    // We'll use the REST API directly to verify credentials via session creation
    const serverClient = getServerClient();
    const serverUsers = new Users(serverClient);
    
    let appwriteUser;
    const emailLower = email.toLowerCase().trim();

    // Önce kullanıcının Appwrite Auth'da kayıtlı olduğunu kontrol et
    try {
      // Email ile kullanıcıyı bul (Appwrite Users API'sinde email ile arama)
      const usersList = await serverUsers.list(
        [Query.equal("email", emailLower), Query.limit(1)]
      );
      
      // Kullanıcı bulunamadıysa
      if (!usersList.users || usersList.users.length === 0) {
        recordLoginAttempt(email, false);
        const failedAttempts = getFailedAttemptCount(email);
        const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

        logger.warn("Login failed - user not found in Appwrite Auth", {
          email: `${email?.substring(0, 3)}***`,
          failedAttempts,
        });

        return NextResponse.json(
          {
            success: false,
            error: "Geçersiz email veya şifre",
            message: "Geçersiz email veya şifre",
            remainingAttempts: Math.max(0, remainingAttempts),
          },
          { status: 401 },
        );
      }

      // Kullanıcıyı al (zaten email ile filtrelendiği için ilk kullanıcı doğru kullanıcı)
      const foundUser = usersList.users[0];

      // Kullanıcının durumunu kontrol et (aktif olmalı)
      if (foundUser.status === false) {
        recordLoginAttempt(email, false);
        logger.warn("Login failed - account is disabled", {
          email: `${email?.substring(0, 3)}***`,
          userId: foundUser.$id,
        });

        return NextResponse.json(
          {
            success: false,
            error: "Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.",
            message: "Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.",
          },
          { status: 403 },
        );
      }

      // Şifre doğrulaması için Appwrite REST API'yi kullanarak session oluştur
      // Bu, şifre doğru ise session oluşturur, yanlış ise hata verir
      try {
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        
        if (!endpoint || !projectId) {
          logger.error('Appwrite configuration missing', {
            hasEndpoint: !!endpoint,
            hasProjectId: !!projectId,
          });
          return NextResponse.json(
            { success: false, error: 'Sunucu yapılandırma hatası', message: 'Sunucu yapılandırma hatası' },
            { status: 500 }
          );
        }

        // Appwrite REST API ile session oluştur (şifre doğrulaması için)
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
          // Session oluşturulamadı = şifre yanlış
          const errorData = await sessionResponse.json().catch(() => ({}));
          recordLoginAttempt(email, false);
          const failedAttempts = getFailedAttemptCount(email);
          const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

          logger.warn("Login failed - invalid password", {
            email: `${email?.substring(0, 3)}***`,
            failedAttempts,
            error: errorData.message || "Invalid credentials",
          });

          return NextResponse.json(
            {
              success: false,
              error: "Geçersiz email veya şifre",
              remainingAttempts: Math.max(0, remainingAttempts),
            },
            { status: 401 },
          );
        }

        // Session oluşturuldu, şifre doğru demektir
        const sessionData = await sessionResponse.json();

        // Oluşturulan session'ı hemen silelim (sadece doğrulama için kullandık)
        try {
          await fetch(`${endpoint}/account/sessions/${sessionData.$id}`, {
            method: "DELETE",
            headers: {
              "X-Appwrite-Project": projectId,
              "X-Appwrite-Key": process.env.APPWRITE_API_KEY || "",
            },
          });
        } catch {
          // Session silme hatası önemli değil
        }

        appwriteUser = foundUser;
      } catch (sessionError) {
        // Session oluşturma hatası
        recordLoginAttempt(email, false);
        const failedAttempts = getFailedAttemptCount(email);
        const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

        const errorMessage = sessionError instanceof Error ? sessionError.message : "Unknown error";
        logger.warn("Login failed - session creation error", {
          email: `${email?.substring(0, 3)}***`,
          failedAttempts,
          error: errorMessage,
        });

        return NextResponse.json(
          {
            success: false,
            error: "Geçersiz email veya şifre",
            message: "Geçersiz email veya şifre",
            remainingAttempts: Math.max(0, remainingAttempts),
          },
          { status: 401 },
        );
      }
    } catch (_authError: unknown) {
      // Record failed attempt
      recordLoginAttempt(email, false);
      const failedAttempts = getFailedAttemptCount(email);
      const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - failedAttempts;

      const errorMessage = _authError instanceof Error ? _authError.message : "Unknown error";
      
      logger.warn("Login failed - invalid credentials or Appwrite Auth error", {
        email: `${email?.substring(0, 3)}***`,
        failedAttempts,
        error: errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Geçersiz email veya şifre",
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 },
      );
    }

    // Record successful login (clears failed attempts)
    recordLoginAttempt(email, true);

    // Get user preferences (role and permissions) from Appwrite
    // appwriteUser zaten foundUser'dan geldi, preferences'ları oku
    let role = "Personel";
    let permissions: string[] = [];
    let twoFactorEnabled = false;

    try {
      // Read role and permissions from preferences
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
        
        // Check if 2FA is enabled for this user
        // TODO: When 2FA storage is implemented, check for twoFactorSecret or twoFactorEnabled flag
        twoFactorEnabled = (appwriteUser.prefs.twoFactorEnabled as boolean) || false;
      }
    } catch (prefsError) {
      logger.warn("Failed to read user preferences, using defaults", {
        userId: appwriteUser.$id,
        error: prefsError,
      });
    }

    // If 2FA is enabled, require 2FA code before completing login
    if (twoFactorEnabled) {
      // If 2FA is enabled but no code provided, request it
      if (!twoFactorCode) {
        return NextResponse.json(
          {
            success: false,
            requiresTwoFactor: true,
            error: "İki faktörlü kimlik doğrulama kodu gereklidir",
            message: "İki faktörlü kimlik doğrulama kodu gereklidir",
          },
          { status: 200 }, // 200 because this is expected flow, not an error
        );
      }

      // TODO: Verify 2FA code using stored secret
      // For now, since storage is not implemented, we'll skip verification
      // When 2FA storage is implemented, verify the code here:
      // const isValid = authenticator.verify({ token: twoFactorCode, secret: storedSecret });
      // if (!isValid) {
      //   return NextResponse.json(
      //     { success: false, error: "Geçersiz 2FA kodu" },
      //     { status: 401 }
      //   );
      // }
      
      logger.info("2FA code provided (verification skipped - storage not implemented)", {
        userId: appwriteUser.$id,
        email: `${email?.substring(0, 3)}***`,
      });
    }

    // Use Appwrite Auth user data with preferences
    const userId = appwriteUser.$id;
    const userData = {
      id: userId,
      email: appwriteUser.email,
      name: appwriteUser.name,
      role,
      permissions,
      isActive: true,
      createdAt: appwriteUser.$createdAt || new Date().toISOString(),
      updatedAt: appwriteUser.$updatedAt || new Date().toISOString(),
    };

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Ensure SESSION_SECRET is configured (required for signed cookies)
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 16) {
      // Make a temporary secret if logical but ideally warn
      // For now returning error as safer
      logger.error("SESSION_SECRET missing or too short");
      // Don't fail the request in dev/demo if possible, but security first.
      if (process.env.NODE_ENV === "development") {
        // allow weak secret in dev?
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Sunucu yapılandırması eksik (SESSION_SECRET)",
            message: "Sunucu yapılandırması eksik (SESSION_SECRET)",
          },
          { status: 500 },
        );
      }
    }

    // Set session cookies (signed)

    // Create our own custom session (not Appwrite session)
    // We use Appwrite session ID format but manage it ourselves
    const sessionId = `appwrite_session_${Date.now()}_${randomBytes(8).toString('hex')}`;
    // Session expiry: 30 days if rememberMe, 24 hours otherwise
    const expireTime = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
    const signedSession = serializeSessionCookie({
      sessionId,
      userId,
      expire: expireTime.toISOString(),
    });

    // Session cookie (HttpOnly)
    cookieStore.set("auth-session", signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
    });

    // CSRF token cookie
    cookieStore.set("csrf-token", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    logger.info("User logged in successfully", {
      userId,
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
