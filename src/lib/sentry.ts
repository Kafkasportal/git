/**
 * Sentry Error Tracking Configuration
 * Initialize Sentry for error monitoring and performance tracking
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error monitoring
 * Call this function early in your application initialization
 */
export function initializeSentry() {
  // Only initialize in production or if explicitly enabled
  const isDev = process.env.NODE_ENV === "development";
  const sentryEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";

  if (isDev && !sentryEnabled) {
    // Skip initialization silently in dev mode
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    // No DSN configured - skip silently
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    enabled: !isDev || sentryEnabled,

    // Enable Sentry Structured Logs
    _experiments: {
      enableLogs: true,
    },

    // Performance Monitoring
    integrations: [
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
      // Send console logs to Sentry
      Sentry.consoleLoggingIntegration({ 
        levels: ["warn", "error"] 
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
 * Sentry Logger - Structured Logs API
 * Use these for logging that gets sent to Sentry
 */
export const sentryLogger = {
  trace: (message: string, attrs?: Record<string, unknown>) => {
    if (Sentry.logger) {
      Sentry.logger.trace(message, attrs);
    }
  },
  debug: (message: string, attrs?: Record<string, unknown>) => {
    if (Sentry.logger) {
      Sentry.logger.debug(message, attrs);
    }
  },
  info: (message: string, attrs?: Record<string, unknown>) => {
    if (Sentry.logger) {
      Sentry.logger.info(message, attrs);
    }
  },
  warn: (message: string, attrs?: Record<string, unknown>) => {
    if (Sentry.logger) {
      Sentry.logger.warn(message, attrs);
    }
  },
  error: (message: string, attrs?: Record<string, unknown>) => {
    if (Sentry.logger) {
      Sentry.logger.error(message, attrs);
    }
  },
  fatal: (message: string, attrs?: Record<string, unknown>) => {
    if (Sentry.logger) {
      Sentry.logger.fatal(message, attrs);
    }
  },
};

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

/**
 * Tracing - Create a span for performance monitoring
 * Use for meaningful actions like button clicks, API calls, function calls
 */
export function startSpan<T>(
  options: {
    name: string;
    op: string;
    attributes?: Record<string, string | number | boolean>;
  },
  callback: (span: Sentry.Span) => T
): T {
  return Sentry.startSpan(
    {
      name: options.name,
      op: options.op,
    },
    (span) => {
      if (options.attributes && span) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }
      return callback(span);
    }
  );
}

/**
 * Async Tracing - Create a span for async operations
 * Use for API calls, database queries, etc.
 */
export async function startAsyncSpan<T>(
  options: {
    name: string;
    op: string;
    attributes?: Record<string, string | number | boolean>;
  },
  callback: (span: Sentry.Span) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: options.name,
      op: options.op,
    },
    async (span) => {
      if (options.attributes && span) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }
      return callback(span);
    }
  );
}

/**
 * Re-export Sentry for direct access when needed
 */
export { Sentry };

/**
 * Export logger directly from Sentry
 */
export const { logger } = Sentry;
