import logger from './logger';
import React from 'react';
// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    this.metrics.set(`${label}-start`, performance.now());
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(`${label}-start`);
    if (!startTime) {
      logger.warn('No start time found for label', { label });
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(`${label}-duration`, duration);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Performance measurement', { label, durationMs: Number(duration.toFixed(2)) });
    }

    return duration;
  }

  getMetric(label: string): number | undefined {
    return this.metrics.get(`${label}-duration`);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: unknown) {
  if (process.env.NODE_ENV === 'development') {
    // Safely log metric with proper formatting
    if (metric && typeof metric === 'object' && 'name' in metric && 'value' in metric) {
      const m = metric as { name: string; value: number; id?: string; delta?: number };
      const formattedValue = Math.round(m.value * 100) / 100;
      const unit = m.name.toLowerCase() === 'cls' ? '' : 'ms';
      logger.debug('Web Vital', { name: m.name, value: formattedValue, unit, metric });
    } else {
      logger.debug('Web Vital', { metric });
    }
  }

  // Send to analytics service in production
  // analytics.track('web_vital', {
  //   name: metric.name,
  //   value: metric.value,
  //   id: metric.id,
  // });
}

// Lazy loading utilities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fallback?: React.ComponentType<any>
) {
  const Component = React.lazy(importFunc);

  // eslint-disable-next-line @typescript-eslint/no-explicit-unknown, react/display-name
  const LazyComponent = React.forwardRef((props: unknown, ref) => {
    const FallbackComponent = fallback || (() => React.createElement('div', null, 'Loading...'));

    return React.createElement(
      React.Suspense,
      {
        fallback: React.createElement(FallbackComponent),
      },
      React.createElement(Component, { ...props, ref })
    );
  });

  return LazyComponent;
}
