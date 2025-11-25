// This file configures the Sentry on the browser side.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.2,
  enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  environment: process.env.NODE_ENV || 'development',

  // Production-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    // Enable release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
    // Set sample rates for production
    beforeSend(event, _hint) {
      // Only send errors in production
      return event;
    },
  }),
});
