import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { lazyLoadComponent } from '@/lib/performance';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { NetworkStatusIndicator } from '@/components/pwa/NetworkStatusIndicator';

import { Inter, Outfit } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const fontVariables = {
  '--font-body': inter.style.fontFamily,
  '--font-heading': outfit.style.fontFamily,
  '--font-heading-alt': outfit.style.fontFamily,
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

export const metadata: Metadata = {
  title: 'Dernek Yönetim Sistemi',
  description: 'Modern dernek yönetim sistemi',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kafkasder',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <LazyGoogleAnalytics />
      </head>
      <body style={fontVariables as React.CSSProperties} className="font-sans">
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
