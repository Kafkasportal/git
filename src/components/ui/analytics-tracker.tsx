'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import logger from '@/lib/logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionStartTime = Date.now();
  private lastInteractionTime = Date.now();

  trackEvent(name: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        sessionDuration: Date.now() - this.sessionStartTime,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.lastInteractionTime = Date.now();

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Analytics event', {
        name: event.name,
        properties: event.properties,
        timestamp: event.timestamp,
      });
    }
  }

  trackPageView(pathname: string, metadata?: Record<string, unknown>) {
    this.trackEvent('page_view', {
      pathname,
      ...metadata,
    });
  }

  trackUserInteraction(type: string, target?: string) {
    this.trackEvent('user_interaction', {
      type,
      target,
    });
  }

  trackPerformanceMetric(metric: string, value: number, unit?: string) {
    this.trackEvent('performance_metric', {
      metric,
      value,
      unit: unit || 'ms',
    });
  }

  getSessionDuration() {
    return Date.now() - this.sessionStartTime;
  }

  getInactivityDuration() {
    return Date.now() - this.lastInteractionTime;
  }

  flushEvents() {
    const eventsToSend = [...this.events];
    this.events = [];
    return eventsToSend;
  }
}

// Global tracker instance
const tracker = new AnalyticsTracker();

export { tracker };

interface AnalyticsTrackerProps {
  enabled?: boolean;
  trackCoreWebVitals?: boolean;
  trackUserInteractions?: boolean;
}

export function AnalyticsTrackerComponent({
  enabled = true,
  trackCoreWebVitals = true,
  trackUserInteractions = true,
}: AnalyticsTrackerProps) {
  const pathname = usePathname();

  // Track page views
  useEffect(() => {
    if (!enabled) return;

    tracker.trackPageView(pathname, {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }, [pathname, enabled]);

  // Track user interactions
  useEffect(() => {
    if (!enabled || !trackUserInteractions) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Sanitize className and tagName to prevent XSS
      const className = target.className ? String(target.className).replace(/[<>\"'&]/g, '') : '';
      const tagName = target.tagName ? String(target.tagName).toLowerCase() : '';
      tracker.trackUserInteraction('click', className || tagName);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only track meaningful keys (not modifiers)
      if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
        tracker.trackUserInteraction('keydown', event.key);
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, trackUserInteractions]);

  // Track Core Web Vitals
  useEffect(() => {
    if (!enabled || !trackCoreWebVitals || typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          tracker.trackPerformanceMetric('LCP', entry.startTime);
        } else if (entry.entryType === 'first-input') {
          const timing = entry as unknown as { processingDuration?: number };
          tracker.trackPerformanceMetric('FID', timing.processingDuration || 0);
        } else if (entry.entryType === 'layout-shift') {
          const shiftEntry = entry as unknown as { value?: number };
          tracker.trackPerformanceMetric('CLS', shiftEntry.value || 0);
        }
      }
    });

    try {
      observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      });
    } catch (e) {
      // Browser doesn't support these entry types
      logger.debug('PerformanceObserver not supported for some metrics', { error: e });
    }

    return () => {
      observer.disconnect();
    };
  }, [enabled, trackCoreWebVitals]);

  // Track visibility changes (user left/returned)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tracker.trackEvent('session_pause', {
          sessionDuration: tracker.getSessionDuration(),
        });
      } else {
        tracker.trackEvent('session_resume', {
          inactivityDuration: tracker.getInactivityDuration(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Clean up and send events on unload
  useEffect(() => {
    if (!enabled) return;

    const handleUnload = () => {
      tracker.trackEvent('session_end', {
        totalSessionDuration: tracker.getSessionDuration(),
      });

      // Try to send events
      const events = tracker.flushEvents();
      if (events.length > 0 && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', JSON.stringify(events));
      }
    };

    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, [enabled]);

  return null; // This component doesn't render anything
}

export function useAnalytics() {
  const trackEvent = useCallback((name: string, properties?: Record<string, unknown>) => {
    tracker.trackEvent(name, properties);
  }, []);

  const trackInteraction = useCallback((type: string, target?: string) => {
    tracker.trackUserInteraction(type, target);
  }, []);

  return {
    trackEvent,
    trackInteraction,
    tracker,
  };
}
