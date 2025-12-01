/**
 * Sentry Client-Side Instrumentation
 * This file initializes Sentry for the browser/client-side
 */

import * as Sentry from "@sentry/react";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDev = process.env.NODE_ENV === "development";
const sentryEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";

if (dsn && (!isDev || sentryEnabled)) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Enable Sentry Structured Logs
    _experiments: {
      enableLogs: true,
    },

    // Integrations
    integrations: [
      // Session Replay
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      // User Feedback Widget (Turkish)
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
      // Console Logging Integration
      Sentry.consoleLoggingIntegration({
        levels: ["warn", "error"],
      }),
    ],

    // Sampling rates
    tracesSampleRate: isDev ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,

    // Ignore certain errors
    ignoreErrors: [
      "top.GLOBALS",
      "originalCreateNotification",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      "chrome-extension://",
      "moz-extension://",
      "NetworkError",
      "Non-Error promise rejection captured",
    ],

    // Before sending error to Sentry
    beforeSend(event, hint) {
      if (event.exception) {
        const error = hint.originalException;
        if (
          error instanceof Error &&
          (error.message.includes("Network") || error.message.includes("CORS"))
        ) {
          event.level = "warning";
        }
      }
      return event;
    },

    attachStacktrace: true,
  });
}

// Export logger for use in components
export const { logger } = Sentry;
