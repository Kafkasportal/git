import Script from 'next/script';
import { Poppins, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { metadata, viewport } from './metadata';

export { metadata, viewport };

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning data-scroll-behavior="smooth" className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
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
