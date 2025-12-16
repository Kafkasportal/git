/**
 * Error Tracking Utility
 * Captures errors with context and sends them to the error tracking system
 */

import logger from './logger';
import { fetchWithCsrf } from '@/lib/csrf';

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
 * Extract error description from options
 */
function extractErrorDescription(
  description: string | undefined,
  error: unknown,
  title: string
): string {
  if (description?.trim()) {
    return description.trim();
  }
  if (error instanceof Error && error.message?.trim()) {
    return error.message.trim();
  }
  if (title?.trim()) {
    return String(title).trim();
  }
  return 'No description provided';
}

/**
 * Extract stack trace from error
 */
function extractStackTrace(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Get session ID from context or storage
 */
function getSessionId(context: CaptureErrorOptions['context']): string | undefined {
  if (context?.session_id) {
    return context.session_id;
  }
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem('session_id') || undefined;
  }
  return undefined;
}

/**
 * Get URL from context or window
 */
function getErrorUrl(context: CaptureErrorOptions['context']): string | undefined {
  if (context?.url) {
    return context.url;
  }
      if (globalThis.window !== undefined) {
        return globalThis.window.location?.href;
      }
  return undefined;
}

/**
 * Get user agent from context or navigator
 */
function getUserAgent(context: CaptureErrorOptions['context']): string | undefined {
  if (context?.user_agent) {
    return context.user_agent;
  }
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return undefined;
}

/**
 * Build error data object
 */
function buildErrorData(
  options: CaptureErrorOptions,
  errorCode: string,
  stackTrace: string | undefined,
  fingerprint: string
): Record<string, unknown> {
  const {
    title,
    category,
    severity,
    context = {},
    tags = [],
  } = options;

  const errorDescription = extractErrorDescription(
    options.description,
    options.error,
    title
  );

  const deviceInfo = collectDeviceInfo();
  const performanceMetrics = collectPerformanceMetrics();
  const pageContext = getPageContext();

  return {
    error_code: errorCode,
    title: title || 'Untitled Error',
    description: errorDescription,
    category,
    severity,
    stack_trace: stackTrace,
    error_context: {
      ...context.additional_data,
      performance: performanceMetrics,
      page: pageContext,
    },
    user_id: context.user_id,
    session_id: getSessionId(context),
    device_info: deviceInfo,
    url: getErrorUrl(context),
    component: context.component,
    function_name: context.function_name,
    tags: Array.isArray(tags) ? tags : [],
    fingerprint,
    metadata: {
      user_action: context.user_action,
      request_id: context.request_id,
      ip_address: context.ip_address,
      user_agent: getUserAgent(context),
    },
  };
}

/**
 * Check if running in browser environment
 */
function isBrowserEnvironment(): boolean {
  return globalThis.window !== undefined && typeof fetch !== 'undefined';
}

/**
 * Store error in localStorage for retry
 */
function storeErrorForRetry(errorData: Record<string, unknown>): void {
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
}

/**
 * Extract error details from response
 */
async function extractResponseError(response: Response): Promise<string> {
  let errorDetails = response.statusText;
  try {
    const errorBody = await response.json();
    if (errorBody.details) {
      errorDetails = JSON.stringify(errorBody.details);
    } else if (errorBody.error) {
      errorDetails = errorBody.error;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return errorDetails;
}

/**
 * Send error to backend API
 */
async function sendErrorToBackend(errorData: Record<string, unknown>): Promise<void> {
  if (!isBrowserEnvironment()) {
    logger.warn('Cannot report error - not in browser environment');
    return;
  }

  try {
    const response = await fetchWithCsrf('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      const errorDetails = await extractResponseError(response);
      throw new Error(`Failed to report error: ${errorDetails}`);
    }
  } catch (reportError) {
    storeErrorForRetry(errorData);
    logger.error('Failed to report error to backend', reportError);
  }
}

/**
 * Capture and track an error
 */
export async function captureError(options: CaptureErrorOptions): Promise<void> {
  const { title, category, severity, error, context = {}, autoReport = true } = options;

  // Generate error code
  const errorCode = `ERR_${category.toUpperCase()}_${Date.now().toString(36)}`;

  // Extract stack trace and generate fingerprint
  const stackTrace = extractStackTrace(error);
  const fingerprint = generateErrorFingerprint(
    error || new Error(title),
    context.component,
    context.function_name
  );

  // Build error data
  const errorData = buildErrorData(options, errorCode, stackTrace, fingerprint);

  // Log using logger
  logger.error(title, error, {
    errorCode,
    category,
    severity,
    component: context.component,
  });

  // Send to backend API
  if (autoReport) {
    await sendErrorToBackend(errorData);
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
        const response = await fetchWithCsrf('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
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
