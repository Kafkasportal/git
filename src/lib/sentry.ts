/**
 * Sentry Error Tracking Configuration
 * Initialize Sentry for error monitoring and performance tracking
 */

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initialize Sentry for error monitoring
 * Call this function early in your application initialization
 */
export function initializeSentry() {
  // Only initialize in production or if explicitly enabled
  const isDev = process.env.NODE_ENV === "development";
  const sentryEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";

  if (isDev && !sentryEnabled) {
    console.log("Sentry disabled in development mode");
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn("NEXT_PUBLIC_SENTRY_DSN not configured");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    enabled: !isDev || sentryEnabled,

    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: [
          "localhost",
          /^\//,
          // Add your server URLs here
          process.env.NEXT_PUBLIC_API_URL || "",
        ],
      }),
      Sentry.replayIntegration({
        // Capture 10% of replay sessions
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.feedbackIntegration({
        colorScheme: "system",
        triggerLabel: "Hata Bildir",
        submitButtonLabel: "Gönder",
        cancelButtonLabel: "İptal",
        formTitle: "Hata Bildirin",
        messageLabel: "Neler oldu?",
        messagePlaceholder: "Karşılaştığınız sorunu açıklayın...",
        nameLabel: "Adınız",
        emailLabel: "E-postanız",
        showBranding: false,
      }),
    ],

    // Sampling rates
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      "originalCreateNotification",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      // Ignore random plugins/extensions
      "chrome-extension://",
      "moz-extension://",
      // Ignore errors from different origins
      "NetworkError",
      "Non-Error promise rejection captured",
    ],

    // Allow certain URLs
    allowUrls: [/.*/, process.env.NEXT_PUBLIC_APP_URL || ""],

    // Before sending error to Sentry
    beforeSend(event, hint) {
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;
        if (
          error instanceof Error &&
          (error.message.includes("Network") ||
            error.message.includes("CORS"))
        ) {
          // Still send but mark as network error
          event.level = "warning";
        }
      }
      return event;
    },

    // Capture unhandled promise rejections
    attachStacktrace: true,
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, userEmail?: string, userName?: string) {
  Sentry.setUser({
    id: userId,
    email: userEmail,
    username: userName,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = "user-action",
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}
