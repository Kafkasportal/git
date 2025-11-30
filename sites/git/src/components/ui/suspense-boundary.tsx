'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { Suspense } from 'react';
import { LoadingOverlay } from './loading-overlay';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import logger from '@/lib/logger';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingVariant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ripple';
  loadingText?: string;
  fullscreen?: boolean;
  onSuspend?: () => void;
  onResume?: () => void;
}

const FallbackWrapper: React.FC<{
  fallback?: ReactNode;
  loadingVariant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ripple';
  loadingText?: string;
  fullscreen?: boolean;
  onSuspend?: () => void;
  onResume?: () => void;
}> = ({ fallback, loadingVariant, loadingText, fullscreen, onSuspend, onResume }) => {
  const suspendStartRef = useRef<number | null>(null);
  const focusedElementRef = useRef<Element | null>(null);
  // Store callbacks in refs to avoid dependency issues
  const onSuspendRef = useRef(onSuspend);
  const onResumeRef = useRef(onResume);

  // Update refs when callbacks change
  useEffect(() => {
    onSuspendRef.current = onSuspend;
    onResumeRef.current = onResume;
  }, [onSuspend, onResume]);

  useEffect(() => {
    // On suspend: save focus and start timing
    suspendStartRef.current = performance.now();
    focusedElementRef.current = document.activeElement;
    onSuspendRef.current?.();

    if (process.env.NODE_ENV === 'development') {
      logger.debug('SuspenseBoundary suspended');
    }

    return () => {
      // On resume: restore focus and log duration
      const duration = suspendStartRef.current ? performance.now() - suspendStartRef.current : 0;
      if (focusedElementRef.current && focusedElementRef.current instanceof HTMLElement) {
        // Use requestAnimationFrame to restore focus after render
        requestAnimationFrame(() => {
          (focusedElementRef.current as HTMLElement).focus();
        });
      }
      onResumeRef.current?.();

      if (process.env.NODE_ENV === 'development') {
        logger.debug('SuspenseBoundary resumed', { durationMs: duration.toFixed(2) });
        if (duration > 5000) {
          logger.warn('SuspenseBoundary suspension exceeded 5s', { durationMs: duration });
        }
      }
    };
  }, []); // Empty dependency array - only run once when component mounts

  if (fallback) {
    return <>{fallback}</>;
  }

  return <LoadingOverlay variant={loadingVariant} text={loadingText} fullscreen={fullscreen} />;
};

export const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({
  children,
  fallback,
  loadingVariant = 'spinner',
  loadingText,
  fullscreen = false,
  onSuspend,
  onResume,
}) => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <FallbackWrapper
            fallback={fallback}
            loadingVariant={loadingVariant}
            loadingText={loadingText}
            fullscreen={fullscreen}
            onSuspend={onSuspend}
            onResume={onResume}
          />
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Convenience wrappers
export const SuspenseWithSpinner: React.FC<Omit<SuspenseBoundaryProps, 'loadingVariant'>> = (
  props
) => <SuspenseBoundary loadingVariant="spinner" {...props} />;

export const SuspenseWithDots: React.FC<Omit<SuspenseBoundaryProps, 'loadingVariant'>> = (
  props
) => <SuspenseBoundary loadingVariant="dots" {...props} />;

export const SuspenseFullscreen: React.FC<Omit<SuspenseBoundaryProps, 'fullscreen'>> = (props) => (
  <SuspenseBoundary fullscreen={true} {...props} />
);
