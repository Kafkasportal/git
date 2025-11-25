'use client';

import { useEffect } from 'react';
import { trackWebVitals } from '@/lib/performance/web-vitals';

/**
 * Client-side Web Vitals tracker component
 * Tracks Core Web Vitals and sends them to analytics
 */
export function WebVitalsTracker() {
  useEffect(() => {
    // Track web vitals when component mounts
    trackWebVitals();
  }, []);

  return null; // This component doesn't render anything
}
