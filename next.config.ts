import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import os from 'os';
import webpack from 'webpack';
const isWindows = os.platform() === 'win32';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const baseConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Package import optimization - tree-shaking for better bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      'recharts',
      'framer-motion',
      'sonner',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'date-fns',
      'zustand',
    ],
    // CSS optimization - critical CSS extraction
    optimizeCss: true,
    // Use system TLS certificates for better security and performance
    turbopackUseSystemTlsCerts: true,
    // Server React optimization
    optimizeServerReact: true,
    // Partial prerendering for faster initial loads
    ppr: false, // Enable when stable
    // Advanced build optimizations
    cpus: Math.max(1, os.cpus().length - 1), // Use all but one CPU
    // Memory optimization
    serverActions: {
      bodySizeLimit: '15mb', // Increased to accommodate file uploads (default file limit is 10MB)
    },
  },

  // Exclude test-only packages and server-only packages from server components
  // These packages are only needed for testing or server-side, not for production client builds
  serverExternalPackages: [
    'jsdom',
    'vitest',
    '@vitest/coverage-v8',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    // WhatsApp Web.js is server-only (uses Puppeteer, requires Node.js environment)
    'whatsapp-web.js',
    'puppeteer',
    'puppeteer-core',
  ],

  // Image optimization - aggressive caching and modern formats
  images: {
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for optimized loading
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Long cache TTL for static images
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year for better caching
    // SVG security
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Image optimization quality
    // AVIF quality (0-100)
    // WebP quality (0-100)
    // JPEG quality (0-100) - default is 75
    // Next.js automatically chooses best format based on browser support
    // Enable remote images if needed (currently disabled for security)
    remotePatterns: [],
    // Unoptimized flag - only for development/debugging
    unoptimized: false,
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return [
      {
        source: '/(.*)',
        headers: [
          // Basic security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevents clickjacking attacks
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevents MIME type sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Enables XSS protection (legacy browsers)
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin', // Controls referrer information
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()', // Feature policy
          },

          // HSTS - Force HTTPS
          ...(!isDevelopment
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),

          // Cross-Origin policies
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },

          // Enhanced CSP for production
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              // Stricter script policy - only allow self and inline
              isDevelopment
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" // Dev: Allow eval for HMR
                : "script-src 'self' 'unsafe-inline'", // Prod: No eval
              "style-src 'self' 'unsafe-inline'",
              // Network access control
              isDevelopment
                ? "connect-src 'self' ws: wss: http: https:" // Dev: HMR support
                : "connect-src 'self' https:", // Prod: Only HTTPS
              // Additional security directives (production only)
              ...(!isDevelopment ? ['upgrade-insecure-requests', 'block-all-mixed-content'] : []),
            ].join('; '),
          },

          // Cache control for sensitive pages
          ...(isDevelopment
            ? []
            : [
                {
                  key: 'Cache-Control',
                  value: 'no-store, max-age=0, must-revalidate',
                },
              ]),
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // API-specific security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent caching of API responses
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Static assets caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for static assets
          },
        ],
      },
      // Image caching
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for optimized images
          },
        ],
      },
      // Font files caching
      {
        source: '/:path*\\.(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for fonts
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer
    if (process.env.ANALYZE) {
      // Bundle analyzer will be handled by the wrapper
    }

    // Exclude test-only dependencies and server-only packages from build (additional webpack externals)
    // jsdom is only needed for tests, not for production builds
    // whatsapp-web.js is server-only (uses Puppeteer, requires Node.js environment)
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          jsdom: 'commonjs jsdom',
          vitest: 'commonjs vitest',
          '@vitest/coverage-v8': 'commonjs @vitest/coverage-v8',
          '@testing-library/jest-dom': 'commonjs @testing-library/jest-dom',
          '@testing-library/react': 'commonjs @testing-library/react',
          '@testing-library/user-event': 'commonjs @testing-library/user-event',
          'whatsapp-web.js': 'commonjs whatsapp-web.js',
          puppeteer: 'commonjs puppeteer',
          'puppeteer-core': 'commonjs puppeteer-core',
        });
      }
    }

    // Ignore whatsapp-web.js in client-side builds
    // This prevents Next.js from trying to bundle whatsapp-web.js for the client
    // The serverExternalPackages config above should handle this, but adding extra protection
    if (!isServer) {
      // Use webpack IgnorePlugin to completely ignore whatsapp-web.js in client builds
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^whatsapp-web\.js$/,
        })
      );
    }

    // Production optimizations
    if (!dev && !isServer) {
      // Enable aggressive webpack optimizations
      config.optimization = {
        ...config.optimization,
        // Minimize bundle size
        minimize: true,
        // Module concatenation for better tree-shaking
        concatenateModules: true,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Framework chunks (React, Next.js)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 30,
            },
            // Lucide icons
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide-icons',
              chunks: 'all',
              priority: 25,
            },
            // TanStack Query & Table
            tanstack: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'tanstack',
              chunks: 'all',
              priority: 20,
            },
            // Framer Motion
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              chunks: 'all',
              priority: 15,
            },
            // Charts
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              chunks: 'all',
              priority: 15,
            },
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              minChunks: 2,
            },
            // Common chunks
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
        // Runtime chunk for better caching
        runtimeChunk: {
          name: 'runtime',
        },
      };

      // Production performance hints
      config.performance = {
        maxAssetSize: 250000, // 250KB
        maxEntrypointSize: 250000, // 250KB
        hints: 'warning',
      };
    }

    // Development optimizations
    if (dev) {
      // Faster builds in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    // SVG optimization
    config.module.rules.push({
      test: /\\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Console removal in production
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Output optimization
  // Avoid Windows copyfile EINVAL due to colon in filenames
  output: isWindows ? undefined : 'standalone', // Optimized production builds (disabled on Windows)
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Build performance hints
  onDemandEntries: {
    maxInactiveAge: 25_000, // 25 seconds
    pagesBufferLength: 2, // Keep 2 pages in memory
  },

  // React strict mode for better development experience
  reactStrictMode: true,

  // Production source maps (disabled for performance, enable if needed for debugging)
  // Note: Next.js 16 uses SWC minification and font optimization by default
  productionBrowserSourceMaps: false,

  // Static page generation optimization
  generateEtags: true,

  // Logging optimization
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development', // Only show full URLs in development
    },
  },
};

const nextConfig: NextConfig = bundleAnalyzer(baseConfig);

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
