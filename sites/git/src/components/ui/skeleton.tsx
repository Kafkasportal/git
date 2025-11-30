/**
 * Unified Skeleton Component
 * Combines variants, presets, and performance optimizations
 */

'use client';

import * as React from 'react';
import { memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva('animate-shimmer rounded-md bg-muted/50 relative overflow-hidden', {
  variants: {
    variant: {
      default: 'rounded-md',
      circle: 'rounded-full',
      text: 'h-4 w-full',
      input: 'h-9 w-full rounded-md',
      card: 'h-32 w-full rounded-xl',
      rectangular: 'rounded-md',
      circular: 'rounded-full',
    },
    animation: {
      pulse: 'animate-pulse',
      wave: 'skeleton',
      shimmer: 'animate-shimmer',
      none: 'animate-none',
    },
  },
  defaultVariants: {
    variant: 'default',
    animation: 'shimmer',
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  lines?: number;
  height?: string;
  width?: string;
  rounded?: boolean;
  animate?: boolean;
}

function SkeletonBase({ className, variant, animation, lines = 1, ...props }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={cn(skeletonVariants({ variant, animation }), className)}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
        aria-live="polite"
        aria-busy="true"
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            skeletonVariants({ variant, animation }),
            i === lines - 1 && 'w-3/4',
            className
          )}
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            animationDelay: `${i * 0.1}s`,
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

export const Skeleton = memo(SkeletonBase);

// Preset skeleton layouts from skeleton-enhanced
export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn('h-4', i === lines - 1 && 'w-4/5')}
          animation="wave"
        />
      ))}
    </div>
  );
});

export const SkeletonCard = memo(function SkeletonCard({
  className,
  lines = 3,
  showImage = false,
  imageHeight = 'h-48',
}: {
  className?: string;
  lines?: number;
  showImage?: boolean;
  imageHeight?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      {showImage && <Skeleton className={cn(imageHeight, 'w-full')} />}
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={lines} />
    </div>
  );
});

export const TableSkeleton = memo(function TableSkeleton({
  rows = 8,
  columns = 4,
  rowHeight = 'h-12',
}: {
  rows?: number;
  columns?: number;
  rowHeight?: string;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div
        className={cn('flex items-center px-4 border-b border-slate-200 bg-slate-50/80', rowHeight)}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4 bg-slate-300"
            style={{ width: i === 0 ? '5rem' : '8rem' }}
            animation="none"
          />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn('flex items-center px-4', rowHeight)}
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4 bg-slate-200"
                style={{ width: colIndex === 0 ? '4rem' : '7rem' }}
                animation="none"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return <Skeleton variant="circular" className={sizeClasses[size]} />;
});

export const SkeletonButton = memo(function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-9 w-24 rounded-md', className)} />;
});

export const SkeletonForm = memo(function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-2 justify-end">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
});
