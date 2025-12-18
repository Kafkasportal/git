'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Semantic color themes for stat cards
 * Use these consistently across all pages:
 * - neutral: Default/informational stats
 * - success: Positive metrics (completed, approved, growth)
 * - warning: Pending/attention needed metrics
 * - error: Negative metrics (overdue, rejected, issues)
 * - info: Informational metrics (views, counts)
 */
export type StatCardColorTheme = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export interface StatCardProps {
  /** Card title - keep short and descriptive */
  title: string;
  /** The main value to display */
  value: string | number;
  /** Icon to display in header */
  icon: LucideIcon;
  /** Semantic color theme for the card */
  colorTheme?: StatCardColorTheme;
  /** Optional description text below value */
  description?: string;
  /** Optional change indicator (e.g., "+12%") */
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// Color theme configurations with WCAG AA compliant contrasts
const colorThemeConfig: Record<StatCardColorTheme, {
  iconColor: string;
  iconBg: string;
  valueColor: string;
  changePositive: string;
  changeNegative: string;
}> = {
  neutral: {
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    valueColor: 'text-foreground',
    changePositive: 'text-success',
    changeNegative: 'text-error',
  },
  success: {
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    valueColor: 'text-foreground',
    changePositive: 'text-success',
    changeNegative: 'text-error',
  },
  warning: {
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    valueColor: 'text-foreground',
    changePositive: 'text-success',
    changeNegative: 'text-error',
  },
  error: {
    iconColor: 'text-error',
    iconBg: 'bg-error/10',
    valueColor: 'text-foreground',
    changePositive: 'text-success',
    changeNegative: 'text-error',
  },
  info: {
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
    valueColor: 'text-foreground',
    changePositive: 'text-success',
    changeNegative: 'text-error',
  },
};

/**
 * StatCard - Standardized statistics card component
 * 
 * Use this component instead of custom Card implementations for stats.
 * Ensures consistent styling, contrast, and semantic colors across all pages.
 * 
 * @example
 * <StatCard
 *   title="Toplam Kayıt"
 *   value={1234}
 *   icon={Users}
 *   colorTheme="neutral"
 *   description="Son 30 gün"
 * />
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  colorTheme = 'neutral',
  description,
  change,
  onClick,
  className,
}: StatCardProps) {
  const theme = colorThemeConfig[colorTheme];

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', theme.iconBg)}>
          <Icon className={cn('h-4 w-4', theme.iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className={cn('text-2xl font-bold', theme.valueColor)}>
            {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
          </div>
          {change && (
            <span
              className={cn(
                'text-xs font-medium',
                change.type === 'positive' && theme.changePositive,
                change.type === 'negative' && theme.changeNegative,
                change.type === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change.value}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * StatCardGrid - Grid container for stat cards
 * Ensures consistent spacing and responsive layout
 */
export function StatCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}



