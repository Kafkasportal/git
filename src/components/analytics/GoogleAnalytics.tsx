import Script from 'next/script';
import logger from '@/lib/logger';

/**
 * Google Analytics 4 component
 * Adds Google Analytics tracking to the application
 *
 * To use:
 * 1. Set NEXT_PUBLIC_GA_MEASUREMENT_ID in your environment variables
 * 2. Add <GoogleAnalytics /> to your root layout
 */
export function GoogleAnalytics() {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaMeasurementId) {
    return null;
  }

  // Validate measurement ID format to prevent injection
  // GA4 format: G-XXXXXXXXXX or UA-XXXXXXXX-X
  const isValidFormat = /^(G|UA|AW|DC)-[A-Z0-9-]+$/i.test(gaMeasurementId);

  if (!isValidFormat) {
    logger.error('Invalid Google Analytics Measurement ID format', { gaMeasurementId });
    return null;
  }

  // Sanitize measurement ID to prevent XSS
  // Already validated above, but double-check for safety
  const sanitizedId = gaMeasurementId.replace(/[^A-Z0-9-]/gi, '');

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${sanitizedId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        // SECURITY: dangerouslySetInnerHTML is safe here because:
        // 1. sanitizedId is validated against /^(G|UA|AW|DC)-[A-Z0-9-]+$/i regex
        // 2. All non-alphanumeric characters (except hyphen) are stripped
        // 3. Single quotes are escaped to prevent JS injection
        // 4. This is a static Google Analytics initialization script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${sanitizedId.replace(/'/g, "\\'")}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
