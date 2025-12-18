'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export type KPIColorTheme = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface KPICardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly colorTheme: KPIColorTheme;
  readonly description?: string;
  readonly trend?: {
    readonly value: string;
    readonly direction: 'up' | 'down';
  };
  readonly onClick?: () => void;
}

const colorThemes: Record<KPIColorTheme, {
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
  hoverBorder: string;
  glow: string;
  text: string;
}> = {
  primary: {
    gradient: 'from-primary to-primary-700',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    border: 'border-primary/20',
    hoverBorder: 'hover:border-primary/40',
    glow: 'group-hover:shadow-primary/10',
    text: 'text-primary',
  },
  success: {
    gradient: 'from-success to-success-700',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    border: 'border-success/20',
    hoverBorder: 'hover:border-success/40',
    glow: 'group-hover:shadow-success/10',
    text: 'text-success',
  },
  warning: {
    gradient: 'from-warning to-warning-700',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    border: 'border-warning/20',
    hoverBorder: 'hover:border-warning/40',
    glow: 'group-hover:shadow-warning/10',
    text: 'text-warning',
  },
  error: {
    gradient: 'from-error to-error-700',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    border: 'border-error/20',
    hoverBorder: 'hover:border-error/40',
    glow: 'group-hover:shadow-error/10',
    text: 'text-error',
  },
  info: {
    gradient: 'from-info to-info-700',
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
    border: 'border-info/20',
    hoverBorder: 'hover:border-info/40',
    glow: 'group-hover:shadow-info/10',
    text: 'text-info',
  },
  neutral: {
    gradient: 'from-muted-foreground to-foreground/70',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    border: 'border-border',
    hoverBorder: 'hover:border-border/80',
    glow: 'group-hover:shadow-foreground/5',
    text: 'text-muted-foreground',
  },
};

function KPICardComponent({
  title,
  value,
  icon: Icon,
  colorTheme,
  description,
  trend,
  onClick,
}: KPICardProps) {
  const theme = colorThemes[colorTheme] || colorThemes.neutral;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden',
          'bg-card/80 backdrop-blur-sm',
          'border transition-all duration-300',
          theme.border,
          theme.hoverBorder,
          'hover:shadow-lg',
          theme.glow,
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        {/* Subtle shimmer effect on hover */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100',
            'bg-gradient-to-r from-transparent via-white/5 to-transparent',
            '-translate-x-full group-hover:translate-x-full',
            'transition-all duration-700 ease-out'
          )}
        />

        {/* Top accent gradient line */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-[2px]',
            'bg-gradient-to-r',
            theme.gradient,
            'opacity-60 group-hover:opacity-100',
            'transition-opacity duration-300'
          )}
        />

        <CardContent className="p-3 relative">
          <div className="flex items-start gap-3">
            {/* Icon with gradient background */}
            <div
              className={cn(
                'relative p-2.5 rounded-xl shrink-0',
                'transition-all duration-300',
                theme.iconBg,
                'group-hover:scale-110'
              )}
            >
              {/* Glow effect behind icon */}
              <div
                className={cn(
                  'absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-50',
                  'bg-gradient-to-br',
                  theme.gradient,
                  'transition-opacity duration-300'
                )}
              />
              <Icon
                className={cn(
                  'relative h-4 w-4',
                  theme.iconColor,
                  'transition-transform duration-300',
                  'group-hover:scale-105'
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <p
                className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wide"
                title={title}
              >
                {title}
              </p>

              <div className="flex items-baseline gap-2">
                <h3
                  className={cn(
                    'text-2xl font-bold tracking-tight',
                    'text-foreground', // High contrast value
                    'transition-colors duration-200'
                  )}
                  title={String(value)}
                >
                  {value}
                </h3>

                {/* Trend indicator */}
                {trend && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                      trend.direction === 'up'
                        ? 'bg-success/15 text-success-700 dark:text-success'
                        : 'bg-error/15 text-error-700 dark:text-error'
                    )}
                  >
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trend.value}
                  </motion.div>
                )}
              </div>

              {description && (
                <p
                  className="text-xs text-muted-foreground/80 truncate"
                  title={description}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const KPICard = memo(KPICardComponent);
