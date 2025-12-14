import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { lazyLoadComponent } from '@/lib/performance';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { NetworkStatusIndicator } from '@/components/pwa/NetworkStatusIndicator';
import { metadata, viewport } from './metadata';

export { metadata, viewport };

// Use system fonts as fallback when Google Fonts is unavailable
// This prevents build failures in restricted network environments
const fontVariables = {
  '--font-body': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--font-heading': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--font-heading-alt': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

// Lazy load analytics components for better initial page load
const LazyGoogleAnalytics = lazyLoadComponent(
  () =>
    import('@/components/analytics/GoogleAnalytics').then((mod) => ({
      default: mod.GoogleAnalytics,
    })),
  () => <div>Loading analytics...</div>
);

const LazyWebVitalsTracker = lazyLoadComponent(
  () =>
    import('@/components/analytics/WebVitalsTracker').then((mod) => ({
      default: mod.WebVitalsTracker,
    })),
  () => <div>Loading performance tracker...</div>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <LazyGoogleAnalytics />
      </head>
      <body style={fontVariables as React.CSSProperties} className="font-sans" suppressHydrationWarning>
        {/* FOUC Prevention - Dark Mode Flash Fix - Using Next.js Script for security */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          // SECURITY: dangerouslySetInnerHTML is safe here because:
          // 1. The script content is entirely static (no user input)
          // 2. localStorage.getItem returns string|null, safely handled
          // 3. Only adds/removes 'dark' class to documentElement
          // 4. Required for SSR to prevent FOUC (Flash of Unstyled Content)
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Providers>
          <ServiceWorkerRegister />
          <LazyWebVitalsTracker />
          {children}
        </Providers>
        <NetworkStatusIndicator />
      </body>
    </html>
  );
}
