// This file configures the Sentry on the server side.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV || 'development',

  // Production-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    // Enable release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
    // Server-side performance monitoring
    beforeSend(event, _hint) {
      // Filter out development errors in production
      return event;
    },
  }),
});
