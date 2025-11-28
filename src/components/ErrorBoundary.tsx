/**
 * Global Error Boundary Component
 * Catches React errors and prevents app crashes
 * Provides graceful degradation with user-friendly error messages
 */

import { Component, ReactNode, ErrorInfo } from 'react';
import logger from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    logger.error('ErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Sentry integration is configured but not enabled in ErrorBoundary
    // Uncomment below to enable automatic error reporting:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <svg
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Bir Hata Oluştu
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Üzgünüz, beklenmeyen bir hata meydana geldi.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 border border-red-200 dark:border-red-900/30">
                <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => (window.location.href = '/genel')}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-md transition-colors"
              >
                Ana Sayfaya Dön
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Sorun devam ederse lütfen sistem yöneticinize başvurun.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
