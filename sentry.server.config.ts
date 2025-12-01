/**
 * Sentry Server-Side Configuration
 * This file configures Sentry for server-side operations
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

    // Server-side sampling
    tracesSampleRate: isDev ? 1.0 : 0.1,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,

    // Before sending error to Sentry
    beforeSend(event, hint) {
      if (event.exception) {
        const error = hint.originalException;
        if (
          error instanceof Error &&
          (error.message.includes("ECONNREFUSED") ||
            error.message.includes("ETIMEDOUT"))
        ) {
          event.level = "warning";
        }
      }
      return event;
    },

    attachStacktrace: true,
  });
}

export const { logger } = Sentry;
