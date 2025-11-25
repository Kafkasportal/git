'use client';

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type StatCardVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'blue'
  | 'red'
  | 'green'
  | 'purple';

type StatCardIcon = LucideIcon | ElementType | ReactElement | ReactNode | string | number | null;

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  icon?: StatCardIcon;
  variant?: StatCardVariant;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<
  StatCardVariant,
  {
    bg: string;
    border: string;
    text: string;
    icon: string;
  }
> = {
  default: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-900',
    icon: 'text-slate-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    icon: 'text-green-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    icon: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: 'text-blue-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: 'text-blue-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: 'text-red-600',
  },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    icon: 'text-emerald-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    icon: 'text-purple-600',
  },
};

/**
 * Stat Card Component
 * Displays key metrics with optional trend and icon
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      title,
      value,
      unit,
      description,
      trend,
      icon,
      variant = 'default',
      loading = false,
      onClick,
      className,
    },
    ref
  ) => {
    const styles = variantStyles[variant] ?? variantStyles.default;

    const renderIcon = () => {
      if (!icon) {
        return null;
      }

      if (typeof icon === 'string' || typeof icon === 'number') {
        return <span className={cn('h-6 w-6', styles.icon)}>{icon}</span>;
      }

      // If it's already a valid React element, clone it with className
      if (isValidElement(icon)) {
        return cloneElement(icon as ReactElement<{ className?: string }>, {
          className: cn('h-6 w-6', styles.icon, (icon.props as { className?: string }).className),
        });
      }

      // If it's a function (component constructor), render it
      if (typeof icon === 'function') {
        const IconComponent = icon as ElementType;
        return <IconComponent className={cn('h-6 w-6', styles.icon)} />;
      }

      // If it's an object that's not a React element (e.g., forward ref, memo, etc.)
      // treat it as a component and render it
      if (typeof icon === 'object' && icon !== null) {
        const IconComponent = icon as ElementType;
        return <IconComponent className={cn('h-6 w-6', styles.icon)} />;
      }

      // Unsupported type; avoid rendering raw objects
      return null;
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'p-6 rounded-lg border transition-all duration-200',
          styles.bg,
          styles.border,
          onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
          className
        )}
        role="region"
        aria-label={`${title}: ${value} ${unit || ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>

            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <p className={cn('text-3xl font-bold', styles.text)}>
                    {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
                  </p>
                  {unit && <span className="text-sm text-slate-600">{unit}</span>}
                </div>

                {description && <p className="text-sm text-slate-600 mt-2">{description}</p>}
              </>
            )}

            {trend && (
              <div className="mt-3 flex items-center gap-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '+' : '-'}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-slate-500">{trend.label}</span>
              </div>
            )}
          </div>

          {icon && (
            <div className={cn('p-3 rounded-lg', styles.bg, 'border', styles.border)}>
              {renderIcon()}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

/**
 * Skeleton version for loading states
 */
export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-3" />
          <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-12 w-12 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Container for multiple stat cards
 */
interface StatCardsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatCardsGrid({
  children,
  columns = 4,
  gap = 'md',
  className,
}: StatCardsGridProps) {
  const gapStyles = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid', colStyles[columns], gapStyles[gap], className)}>{children}</div>
  );
}

/**
 * Comparison stat card (shows before/after)
 */
interface ComparisonStatCardProps extends Omit<StatCardProps, 'trend'> {
  previousValue: string | number;
  label?: string;
}

export const ComparisonStatCard = forwardRef<HTMLDivElement, ComparisonStatCardProps>(
  (
    { title, value, unit, previousValue, label, icon, variant, loading, onClick, className },
    ref
  ) => {
    const isPositive = Number(value) >= Number(previousValue);
    const difference = Math.abs(Number(value) - Number(previousValue));
    const percentChange =
      previousValue !== 0 ? ((difference / Number(previousValue)) * 100).toFixed(1) : '0';

    return (
      <StatCard
        ref={ref}
        title={title}
        value={value}
        unit={unit}
        icon={icon}
        variant={variant}
        loading={loading}
        onClick={onClick}
        className={className}
        trend={{
          value: parseFloat(percentChange),
          label: label || 'Son döneme göre',
          isPositive,
        }}
        description={label ? `Önceki: ${previousValue} ${unit || ''}` : undefined}
      />
    );
  }
);

ComparisonStatCard.displayName = 'ComparisonStatCard';
