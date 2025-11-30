'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base Skeleton Component with animations
 */
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'shimmer' | 'pulse' | 'wave';
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = 'pulse', style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded bg-muted',
        variant === 'pulse' && 'animate-pulse',
        variant === 'shimmer' && 'skeleton-shimmer',
        variant === 'wave' && 'skeleton-wave',
        className
      )}
      style={style}
    />
  );
}

/**
 * Text Skeleton
 */
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function TextSkeleton({
  lines = 3,
  className,
  lastLineWidth = '60%',
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Avatar Skeleton
 */
interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  return (
    <Skeleton className={cn('rounded-full', avatarSizes[size], className)} />
  );
}

/**
 * Button Skeleton
 */
interface ButtonSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const buttonSizes = {
  sm: 'h-8 w-20',
  md: 'h-10 w-24',
  lg: 'h-12 w-32',
};

export function ButtonSkeleton({ size = 'md', className }: ButtonSkeletonProps) {
  return (
    <Skeleton className={cn('rounded-md', buttonSizes[size], className)} />
  );
}

/**
 * Input Skeleton
 */
interface InputSkeletonProps {
  showLabel?: boolean;
  className?: string;
}

export function InputSkeleton({ showLabel = true, className }: InputSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && <Skeleton className="h-4 w-20" />}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/**
 * Badge Skeleton
 */
export function BadgeSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-5 w-16 rounded-full', className)} />;
}

/**
 * Image Skeleton
 */
interface ImageSkeletonProps {
  aspectRatio?: 'square' | 'video' | 'wide';
  className?: string;
}

const aspectRatios = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[21/9]',
};

export function ImageSkeleton({ aspectRatio = 'video', className }: ImageSkeletonProps) {
  return (
    <Skeleton className={cn('w-full rounded-lg', aspectRatios[aspectRatio], className)} />
  );
}

/**
 * Card Header Skeleton
 */
export function CardHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <AvatarSkeleton size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/**
 * Navigation Item Skeleton
 */
export function NavItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-2', className)}>
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/**
 * Sidebar Skeleton
 */
export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-64 p-4 space-y-6', className)}>
      <CardHeaderSkeleton />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <NavItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard Widget Skeleton
 */
interface WidgetSkeletonProps {
  type?: 'stats' | 'chart' | 'list' | 'table';
  className?: string;
}

export function WidgetSkeleton({ type = 'stats', className }: WidgetSkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Content based on type */}
      {type === 'stats' && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      )}

      {type === 'chart' && (
        <div className="h-48 flex items-end gap-2">
          {/* Using deterministic heights based on index for consistent renders */}
          {[65, 80, 45, 70, 55, 90, 60].map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}

      {type === 'list' && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <AvatarSkeleton size="sm" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'table' && (
        <div className="space-y-2">
          <div className="flex gap-4 pb-2 border-b">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-20" />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add shimmer and wave animations via CSS (add to globals.css or here)
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      hsl(var(--muted)) 0%,
      hsl(var(--muted-foreground) / 0.1) 50%,
      hsl(var(--muted)) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes wave {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  .skeleton-wave {
    animation: wave 1.5s ease-in-out infinite;
  }
`;

export { shimmerStyles };

export default {
  Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  InputSkeleton,
  BadgeSkeleton,
  ImageSkeleton,
  CardHeaderSkeleton,
  NavItemSkeleton,
  SidebarSkeleton,
  WidgetSkeleton,
};

