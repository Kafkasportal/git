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

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
