/**
 * Error Tracking Utility
 * Captures errors with context and sends them to the error tracking system
 */

import logger from './logger';
import * as Sentry from '@sentry/nextjs';

export type ErrorCategory =
  | 'runtime'
  | 'ui_ux'
  | 'design_bug'
  | 'system'
  | 'data'
  | 'security'
  | 'performance'
  | 'integration';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ErrorContext {
  user_id?: string;
  session_id?: string;
  url?: string;
  component?: string;
  function_name?: string;
  user_action?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
  additional_data?: Record<string, unknown>;
}

export interface CaptureErrorOptions {
  title: string;
  description?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  error?: Error | unknown;
  context?: ErrorContext;
  tags?: string[];
  autoReport?: boolean; // Auto send to backend, default true
}

/**
 * Generate a fingerprint for error deduplication
 */
export function generateErrorFingerprint(
  error: Error | unknown,
  component?: string,
  functionName?: string
): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('') : '';

  const fingerprint = `${component || 'unknown'}-${functionName || 'unknown'}-${errorMessage}-${stack}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Collect device and browser information
 */
export function collectDeviceInfo(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};

  const ua = navigator.userAgent;
  const { language, languages, platform, hardwareConcurrency } = navigator;
  const { width, height, colorDepth } = screen;

  // Detect browser
  let browser = 'Unknown';
  if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';
  else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browser = 'Internet Explorer';

  // Detect OS
  let os = 'Unknown';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'MacOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1) os = 'iOS';

  // Detect device type
  let deviceType = 'desktop';
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet/i.test(ua)) deviceType = 'tablet';

  return {
    browser,
    os,
    platform,
    deviceType,
    language,
    languages,
    screenWidth: width,
    screenHeight: height,
    colorDepth,
    cpuCores: hardwareConcurrency,
    userAgent: ua,
  };
}

/**
 * Collect performance metrics
 */
export function collectPerformanceMetrics(): Record<string, unknown> {
  if (typeof window === 'undefined' || !window.performance) return {};

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const memory = (performance as { memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number } })
    .memory;

  return {
    loadTime: navigation?.loadEventEnd - navigation?.fetchStart,
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
    timeToInteractive: navigation?.domInteractive - navigation?.fetchStart,
    memoryUsed: memory?.usedJSHeapSize,
    memoryLimit: memory?.jsHeapSizeLimit,
  };
}

/**
 * Get current page context
 */
export function getPageContext(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};

  return {
    url: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    referrer: document.referrer,
    title: document.title,
  };
}

/**
 * Capture and track an error
 */
export async function captureError(options: CaptureErrorOptions): Promise<void> {
  const {
    title,
    description,
    category,
    severity,
    error,
    context = {},
    tags = [],
    autoReport = true,
  } = options;

  // Generate error code
  const errorCode = `ERR_${category.toUpperCase()}_${Date.now().toString(36)}`;

  // Extract stack trace
  let stackTrace: string | undefined;
  if (error instanceof Error) {
    stackTrace = error.stack;
  }

  // Collect comprehensive context
  const deviceInfo = collectDeviceInfo();
  const performanceMetrics = collectPerformanceMetrics();
  const pageContext = getPageContext();

  // Generate fingerprint for deduplication
  const fingerprint = generateErrorFingerprint(
    error || new Error(title),
    context.component,
    context.function_name
  );

  // Prepare error data
  const errorData = {
    error_code: errorCode,
    title,
    description: description || (error instanceof Error ? error.message : String(error)),
    category,
    severity,
    stack_trace: stackTrace,
    error_context: {
      ...context.additional_data,
      performance: performanceMetrics,
      page: pageContext,
    },
    user_id: context.user_id,
    session_id: context.session_id || sessionStorage.getItem('session_id'),
    device_info: deviceInfo,
    url: context.url || window.location?.href,
    component: context.component,
    function_name: context.function_name,
    tags,
    fingerprint,
    metadata: {
      user_action: context.user_action,
      request_id: context.request_id,
      ip_address: context.ip_address,
      user_agent: context.user_agent || navigator.userAgent,
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    // Error captured and logged
  }

  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    try {
      Sentry.captureException(error || new Error(title), {
        tags: {
          category,
          severity,
          error_code: errorCode,
          component: context.component || 'unknown',
        },
        extra: {
          ...errorData,
        },
        fingerprint: [fingerprint],
      });
    } catch (sentryError) {
      logger.error('Failed to send error to Sentry', sentryError);
    }
  }

  // Log using logger
  logger.error(title, error, {
    errorCode,
    category,
    severity,
    component: context.component,
  });

  // Send to backend API
  if (autoReport) {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });

      if (!response.ok) {
        throw new Error(`Failed to report error: ${response.statusText}`);
      }
    } catch (reportError) {
      // Fallback: store in localStorage for retry
      try {
        const pendingErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
        pendingErrors.push({
          ...errorData,
          captured_at: new Date().toISOString(),
        });
        // Keep only last 10 errors
        localStorage.setItem('pending_errors', JSON.stringify(pendingErrors.slice(-10)));
      } catch (storageError) {
        logger.error('Failed to store error for retry', storageError);
      }

      logger.error('Failed to report error to backend', reportError);
    }
  }
}

/**
 * Report a user-submitted error
 */
export async function reportUserError(
  title: string,
  description: string,
  userId?: string
): Promise<void> {
  await captureError({
    title,
    description,
    category: 'ui_ux',
    severity: 'medium',
    context: {
      user_id: userId,
      user_action: 'user_reported',
    },
    tags: ['user-reported'],
  });
}

/**
 * Retry sending pending errors
 */
export async function retryPendingErrors(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const pendingErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
    if (pendingErrors.length === 0) return;

    logger.info('Retrying pending error reports', { count: pendingErrors.length });

    const successfulReports: number[] = [];

    for (let i = 0; i < pendingErrors.length; i++) {
      try {
        const response = await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pendingErrors[i]),
        });

        if (response.ok) {
          successfulReports.push(i);
        }
      } catch (error) {
        // Keep for next retry
        logger.error('Failed to retry error report', error);
      }
    }

    // Remove successfully reported errors
    if (successfulReports.length > 0) {
      const remainingErrors = pendingErrors.filter(
        (_: unknown, index: number) => !successfulReports.includes(index)
      );
      localStorage.setItem('pending_errors', JSON.stringify(remainingErrors));
      logger.info('Successfully retried error reports', { count: successfulReports.length });
    }
  } catch (error) {
    logger.error('Failed to retry pending errors', error);
  }
}

/**
 * Initialize error tracker
 */
export function initErrorTracker(): void {
  if (typeof window === 'undefined') return;

  // Retry pending errors on app load
  retryPendingErrors();

  // Retry pending errors periodically
  setInterval(retryPendingErrors, 5 * 60 * 1000); // Every 5 minutes
}
