/**
 * Global Error Handler
 * Captures unhandled errors and promise rejections
 */

import { captureError } from './error-tracker';
import logger from '@/lib/logger';

/**
 * Initialize global error handlers
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    const { error, message, filename, lineno, colno } = event;

    // Suppress known harmless errors
    // WebSocket CLOSING/CLOSED state errors are normal during cleanup
    if (message?.includes('WebSocket is already in CLOSING or CLOSED state')) {
      // This is a harmless error that occurs during WebSocket cleanup
      return;
    }

    captureError({
      title: `Unhandled Error: ${message}`,
      description: error?.stack || message,
      category: 'runtime',
      severity: 'high',
      error: error || new Error(message),
      context: {
        function_name: 'window.onerror',
        url: filename,
        additional_data: {
          line: lineno,
          column: colno,
        },
      },
      tags: ['unhandled', 'window-error'],
    }).catch((err) => {
      logger.error('Failed to capture unhandled error', { error: err });
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const { reason, promise } = event;

    // Suppress known harmless errors
    const errorMessage = reason?.message || String(reason);
    if (errorMessage?.includes('WebSocket is already in CLOSING or CLOSED state')) {
      // This is a harmless error that occurs during WebSocket cleanup
      event.preventDefault();
      return;
    }

    captureError({
      title: `Unhandled Promise Rejection`,
      description: reason?.message || String(reason),
      category: 'runtime',
      severity: 'high',
      error: reason instanceof Error ? reason : new Error(String(reason)),
      context: {
        function_name: 'unhandledrejection',
        additional_data: {
          promise: String(promise),
        },
      },
      tags: ['unhandled', 'promise-rejection'],
    }).catch((err) => {
      logger.error('Failed to capture unhandled rejection', { error: err });
    });

    // Prevent default browser error logging
    event.preventDefault();
  });

  // Global error handlers initialized
}
