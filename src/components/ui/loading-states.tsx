'use client';

import { cn } from '@/lib/utils';

/**
 * Table Skeleton Loader
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

// Deterministic width generator based on index for consistent renders
const getWidth = (index: number, min: number, range: number) => {
  const patterns = [0.2, 0.5, 0.8, 0.3, 0.7, 0.4, 0.6, 0.9, 0.1, 0.55];
  return min + patterns[index % patterns.length] * range;
};

export function TableSkeleton({ rows = 5, columns = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${getWidth(i, 60, 40)}px` }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 p-4 border-b last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 bg-muted/50 rounded animate-pulse"
              style={{
                width: `${getWidth(rowIndex * columns + colIndex, 40, 80)}px`,
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton Loader
 */
interface CardSkeletonProps {
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showImage = false,
  showAvatar = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)}>
      {showImage && (
        <div className="h-40 bg-muted rounded-lg animate-pulse" />
      )}

      <div className="flex items-center gap-3">
        {showAvatar && (
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-muted/50 rounded animate-pulse"
            style={{
              width: `${getWidth(i, 70, 30)}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Chart Skeleton Loader
 */
interface ChartSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
}

export function ChartSkeleton({ type = 'bar', className }: ChartSkeletonProps) {
  if (type === 'pie') {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="relative">
          <div className="h-48 w-48 rounded-full bg-muted animate-pulse" />
          <div className="absolute inset-8 rounded-full bg-background" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted rounded-t animate-pulse"
            style={{
              height: `${getWidth(i, 40, 60)}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-8 bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/**
 * Stats Skeleton Loader
 */
interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn('grid gap-4 grid-cols-2 md:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border bg-card p-6 space-y-3"
        >
          <div className="h-4 bg-muted/50 rounded animate-pulse w-20" />
          <div className="h-8 bg-muted rounded animate-pulse w-24" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * List Skeleton Loader
 */
interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showAction?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  showAvatar = true,
  showAction = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border"
        >
          {showAvatar && (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <div
              className="h-4 bg-muted rounded animate-pulse"
              style={{ width: `${getWidth(i, 40, 40)}%` }}
            />
            <div
              className="h-3 bg-muted/50 rounded animate-pulse"
              style={{ width: `${getWidth(i + 5, 20, 30)}%` }}
            />
          </div>
          {showAction && (
            <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton Loader
 */
interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-24" />
          <div className="h-10 bg-muted/50 rounded animate-pulse w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-muted rounded animate-pulse w-24" />
        <div className="h-10 bg-primary/20 rounded animate-pulse w-24" />
      </div>
    </div>
  );
}

/**
 * Profile Skeleton Loader
 */
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-muted rounded animate-pulse w-48" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-32" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-muted/30 rounded animate-pulse w-16" />
            <div className="h-5 bg-muted/50 rounded animate-pulse w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Page Skeleton Loader (Full page)
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded animate-pulse w-48" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-64" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-primary/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats */}
      <StatsSkeleton />

      {/* Table */}
      <div className="rounded-lg border">
        <TableSkeleton />
      </div>
    </div>
  );
}

export default {
  TableSkeleton,
  CardSkeleton,
  ChartSkeleton,
  StatsSkeleton,
  ListSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  PageSkeleton,
};

