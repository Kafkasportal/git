'use client';

import { forwardRef, type ReactNode, type ElementType } from 'react';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp, formatNumber } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * MetricCard Variants
 */
export type MetricCardVariant =
  | 'default'
  | 'gradient'
  | 'outlined'
  | 'glass'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/**
 * MetricCard Size
 */
export type MetricCardSize = 'sm' | 'md' | 'lg';

/**
 * Trend Direction
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Trend Information
 */
export interface TrendInfo {
  /** Trend value (percentage or number) */
  value: number;
  /** Trend direction */
  direction: TrendDirection;
  /** Trend label */
  label?: string;
  /** Show as percentage */
  isPercentage?: boolean;
}

/**
 * Sub Metric (additional metrics)
 */
export interface SubMetric {
  /** Label */
  label: string;
  /** Value */
  value: string | number;
  /** Icon */
  icon?: LucideIcon | ElementType;
}

/**
 * MetricCard Props
 */
export interface MetricCardProps {
  /** Card title */
  title: string;
  /** Main value */
  value: number;
  /** Value prefix (e.g., "₺", "$") */
  prefix?: string;
  /** Value suffix (e.g., "TL", "USD") */
  suffix?: string;
  /** Decimal places */
  decimals?: number;
  /** Description text */
  description?: string;
  /** Icon */
  icon?: LucideIcon | ElementType;
  /** Variant */
  variant?: MetricCardVariant;
  /** Size */
  size?: MetricCardSize;
  /** Trend information */
  trend?: TrendInfo;
  /** Sub metrics */
  subMetrics?: SubMetric[];
  /** Loading state */
  loading?: boolean;
  /** Enable count-up animation */
  animated?: boolean;
  /** Animation duration (ms) */
  animationDuration?: number;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
  /** Additional content */
  children?: ReactNode;
}

/**
 * Variant Styles
 */
const variantStyles: Record<
  MetricCardVariant,
  {
    container: string;
    title: string;
    value: string;
    icon: string;
  }
> = {
  default: {
    container: 'bg-white border border-slate-200 hover:border-slate-300',
    title: 'text-slate-600',
    value: 'text-slate-900',
    icon: 'text-slate-600 bg-slate-100',
  },
  gradient: {
    container: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 hover:shadow-xl',
    title: 'text-blue-50',
    value: 'text-white',
    icon: 'text-white bg-white/20',
  },
  outlined: {
    container: 'bg-transparent border-2 border-slate-300 hover:border-slate-400',
    title: 'text-slate-600',
    value: 'text-slate-900',
    icon: 'text-slate-600 bg-slate-100',
  },
  glass: {
    container: 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20',
    title: 'text-slate-700',
    value: 'text-slate-900',
    icon: 'text-slate-600 bg-white/50',
  },
  success: {
    container: 'bg-green-50 border border-green-200 hover:border-green-300',
    title: 'text-green-700',
    value: 'text-green-900',
    icon: 'text-green-600 bg-green-100',
  },
  warning: {
    container: 'bg-amber-50 border border-amber-200 hover:border-amber-300',
    title: 'text-amber-700',
    value: 'text-amber-900',
    icon: 'text-amber-600 bg-amber-100',
  },
  error: {
    container: 'bg-red-50 border border-red-200 hover:border-red-300',
    title: 'text-red-700',
    value: 'text-red-900',
    icon: 'text-red-600 bg-red-100',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200 hover:border-blue-300',
    title: 'text-blue-700',
    value: 'text-blue-900',
    icon: 'text-blue-600 bg-blue-100',
  },
};

/**
 * Size Styles
 */
const sizeStyles: Record<MetricCardSize, { padding: string; value: string; title: string }> = {
  sm: {
    padding: 'p-4',
    value: 'text-2xl',
    title: 'text-xs',
  },
  md: {
    padding: 'p-6',
    value: 'text-3xl',
    title: 'text-sm',
  },
  lg: {
    padding: 'p-8',
    value: 'text-4xl',
    title: 'text-base',
  },
};

/**
 * Trend Icon Component
 */
function TrendIcon({ direction }: { direction: TrendDirection }) {
  const iconProps = { className: 'h-4 w-4', 'aria-hidden': true };

  switch (direction) {
    case 'up':
      return <TrendingUp {...iconProps} className={cn(iconProps.className, 'text-green-600')} />;
    case 'down':
      return <TrendingDown {...iconProps} className={cn(iconProps.className, 'text-red-600')} />;
    case 'neutral':
      return <Minus {...iconProps} className={cn(iconProps.className, 'text-slate-600')} />;
  }
}

/**
 * MetricCard Component
 *
 * Advanced metric card with animated counter, trends, and sub-metrics
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Toplam Bağış"
 *   value={150000}
 *   prefix="₺"
 *   variant="gradient"
 *   animated
 *   trend={{ value: 12.5, direction: 'up', label: 'Bu ay' }}
 *   icon={DollarSign}
 * />
 * ```
 */
export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      prefix,
      suffix,
      decimals = 0,
      description,
      icon: Icon,
      variant = 'default',
      size = 'md',
      trend,
      subMetrics,
      loading = false,
      animated = true,
      animationDuration = 2000,
      onClick,
      className,
      children,
    },
    ref
  ) => {
    const styles = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    // Animated counter
    const { count } = useCountUp({
      end: value,
      duration: animationDuration,
      decimals,
      enabled: animated && !loading,
    });

    // Format the value
    const formattedValue = animated
      ? count
      : formatNumber(value, { decimals, notation: 'standard' });

    if (loading) {
      return <MetricCardSkeleton size={size} />;
    }

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'rounded-xl transition-all duration-300',
          styles.container,
          sizeStyle.padding,
          onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
          className
        )}
        role="region"
        aria-label={`${title}: ${prefix || ''}${formattedValue}${suffix || ''}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className={cn('font-medium mb-1', sizeStyle.title, styles.title)}>{title}</p>
            {description && <p className={cn('text-xs opacity-75', styles.title)}>{description}</p>}
          </div>

          {Icon && (
            <div className={cn('p-3 rounded-lg', styles.icon)}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-baseline gap-2">
            {prefix && <span className={cn('text-lg font-semibold', styles.value)}>{prefix}</span>}
            <span className={cn('font-bold tracking-tight', sizeStyle.value, styles.value)}>
              {formattedValue}
            </span>
            {suffix && <span className={cn('text-sm', styles.value, 'opacity-75')}>{suffix}</span>}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2">
              <TrendIcon direction={trend.direction} />
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.direction === 'up' && 'text-green-600',
                  trend.direction === 'down' && 'text-red-600',
                  trend.direction === 'neutral' && 'text-slate-600'
                )}
              >
                {trend.direction === 'up' && '+'}
                {trend.direction === 'down' && '-'}
                {Math.abs(trend.value)}
                {trend.isPercentage !== false && '%'}
              </span>
              {trend.label && (
                <span className={cn('text-xs opacity-75', styles.title)}>{trend.label}</span>
              )}
            </div>
          )}

          {/* Sub Metrics */}
          {subMetrics && subMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-current/10">
              {subMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  {metric.icon && (
                    <metric.icon className={cn('h-3 w-3', styles.icon)} aria-hidden="true" />
                  )}
                  <div className="flex-1">
                    <p className={cn('text-xs opacity-75', styles.title)}>{metric.label}</p>
                    <p className={cn('text-sm font-semibold', styles.value)}>{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Children */}
          {children}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';

/**
 * MetricCard Skeleton (Loading State)
 */
export function MetricCardSkeleton({ size = 'md' }: { size?: MetricCardSize }) {
  const sizeStyle = sizeStyles[size];

  return (
    <div className={cn('rounded-xl bg-slate-50 border border-slate-200', sizeStyle.padding)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>

      <div className="space-y-3">
        <Skeleton className={cn('w-32', size === 'sm' ? 'h-8' : size === 'md' ? 'h-10' : 'h-12')} />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/**
 * MetricCardsGrid - Container for multiple metric cards
 */
interface MetricCardsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricCardsGrid({
  children,
  columns = 4,
  gap = 'md',
  className,
}: MetricCardsGridProps) {
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
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={cn('grid', colStyles[columns], gapStyles[gap], className)}>{children}</div>
  );
}

/**
 * ComparisonMetricCard - Shows comparison with previous period
 */
interface ComparisonMetricCardProps extends Omit<MetricCardProps, 'trend'> {
  /** Previous period value */
  previousValue: number;
  /** Comparison label */
  comparisonLabel?: string;
}

export const ComparisonMetricCard = forwardRef<HTMLDivElement, ComparisonMetricCardProps>(
  ({ value, previousValue, comparisonLabel = 'Önceki dönem', ...props }, ref) => {
    const difference = value - previousValue;
    const percentChange = previousValue !== 0 ? Math.abs((difference / previousValue) * 100) : 0;
    const direction: TrendDirection = difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral';

    return (
      <MetricCard
        ref={ref}
        value={value}
        trend={{
          value: percentChange,
          direction,
          label: comparisonLabel,
          isPercentage: true,
        }}
        {...props}
      />
    );
  }
);

ComparisonMetricCard.displayName = 'ComparisonMetricCard';
