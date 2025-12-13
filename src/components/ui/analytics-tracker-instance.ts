'use client';

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
      // Dynamic import to avoid circular dependencies
      import('@/lib/logger').then((loggerModule) => {
        loggerModule.default.debug('Analytics event', {
          name: event.name,
          properties: event.properties,
          timestamp: event.timestamp,
        });
      }).catch(() => {
        // Silently fail if logger is not available
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
export const tracker = new AnalyticsTracker();

