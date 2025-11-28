/**
 * Core Web Vitals Tracking
 * Measures LCP, FID, CLS, and other performance metrics
 * Sends data to analytics or logs
 */

import { onLCP, onCLS, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import logger from '@/lib/logger';

/**
 * Send metric to analytics (custom implementation)
 */
function sendToAnalytics(metric: Metric): void {
  const rating = getRating(metric.name, metric.value);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const metricData = {
      name: metric.name,
      value: Math.round(metric.value * 100) / 100, // Round to 2 decimal places
      id: metric.id,
      delta: Math.round(metric.delta * 100) / 100,
      rating,
    };
    if (process.env.NODE_ENV === 'development') {
      logger.info(
        `📊 Web Vital: ${metricData.name} = ${metricData.value}ms (${metricData.rating})`,
        metricData
      );
    }
  }

  // Send to Google Analytics 4 (if configured)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const gtag = (window as any).gtag;
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      custom_map: {
        metric_rating: rating,
        metric_delta: metric.delta,
      },
    });
  }

  // Send to Sentry (if configured)
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    const Sentry = (window as any).Sentry;
    Sentry.metrics?.distribution(`web_vital.${metric.name.toLowerCase()}`, metric.value, {
      tags: {
        rating,
        id: metric.id,
      },
    });
  }

  // Send to custom analytics endpoint (if configured)
  const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (analyticsEndpoint && typeof window !== 'undefined') {
    fetch(analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        rating,
        timestamp: Date.now(),
      }),
      keepalive: true, // Send even if page is unloading
    }).catch((error) => {
      // Silently fail - analytics should not block the app
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Failed to send analytics', { error });
      }
    });
  }
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value >= threshold.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Track Core Web Vitals
 * Call this function in your root layout or _app file
 */
export function trackWebVitals() {
  // Largest Contentful Paint (LCP) - should be < 2.5s
  onLCP((metric) => {
    sendToAnalytics(metric);
  });

  // First Input Delay (FID) - deprecated, using INP instead

  // Cumulative Layout Shift (CLS) - should be < 0.1
  onCLS((metric) => {
    sendToAnalytics(metric);
  });

  // First Contentful Paint (FCP) - should be < 1.8s
  onFCP((metric) => {
    sendToAnalytics(metric);
  });

  // Time to First Byte (TTFB) - should be < 800ms
  onTTFB((metric) => {
    sendToAnalytics(metric);
  });

  // Interaction to Next Paint (INP) - should be < 200ms
  onINP((metric) => {
    sendToAnalytics(metric);
  });
}

/**
 * Get performance marks for custom measurements
 */
export function getPerformanceMarks(): PerformanceEntry[] {
  if (typeof window === 'undefined') return [];

  return performance.getEntriesByType('mark');
}

/**
 * Measure custom performance metric
 */
export function measurePerformance(name: string, startMark: string, endMark: string): number {
  if (typeof window === 'undefined') return 0;

  const measure = performance.measure(name, startMark, endMark);
  return measure.duration;
}

/**
 * Create performance mark
 */
export function createPerformanceMark(name: string) {
  if (typeof window === 'undefined') return;

  performance.mark(name);
}
