import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { metadata, viewport } from './metadata';

export { metadata, viewport };

// Use system fonts to avoid Google Fonts API access issues during build
// This provides consistent, high-quality typography without external dependencies
const fontVariables = {
  '--font-heading': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--font-body': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--font-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      style={fontVariables as React.CSSProperties}
    >
      <head />
      <body className="font-sans antialiased" suppressHydrationWarning>
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
