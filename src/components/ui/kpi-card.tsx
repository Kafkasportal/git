'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface KPICardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly colorTheme: 'green' | 'orange' | 'blue' | 'red' | 'gray' | 'purple' | 'pink' | 'teal';
  readonly description?: string;
  readonly trend?: {
    readonly value: string;
    readonly direction: 'up' | 'down';
  };
  readonly onClick?: () => void;
}

const colorThemes = {
  teal: {
    gradient: 'from-teal-500 to-teal-600',
    iconBg: 'bg-gradient-to-br from-teal-500/20 to-teal-600/10',
    iconColor: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/50 dark:border-teal-800/30',
    hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
    glow: 'group-hover:shadow-teal-500/10',
    text: 'text-teal-700 dark:text-teal-400',
  },
  green: {
    gradient: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/50 dark:border-emerald-800/30',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    glow: 'group-hover:shadow-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  orange: {
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/50 dark:border-amber-800/30',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    glow: 'group-hover:shadow-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-500',
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/50 dark:border-blue-800/30',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    glow: 'group-hover:shadow-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
  },
  red: {
    gradient: 'from-rose-500 to-red-500',
    iconBg: 'bg-gradient-to-br from-rose-500/20 to-red-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/50 dark:border-rose-800/30',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    glow: 'group-hover:shadow-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
  },
  gray: {
    gradient: 'from-slate-500 to-slate-600',
    iconBg: 'bg-gradient-to-br from-slate-500/20 to-slate-600/10',
    iconColor: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200/50 dark:border-slate-700/50',
    hoverBorder: 'hover:border-slate-300 dark:hover:border-slate-600',
    glow: 'group-hover:shadow-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
  },
  purple: {
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-gradient-to-br from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/50 dark:border-violet-800/30',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    glow: 'group-hover:shadow-violet-500/10',
    text: 'text-violet-700 dark:text-violet-400',
  },
  pink: {
    gradient: 'from-pink-500 to-rose-500',
    iconBg: 'bg-gradient-to-br from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200/50 dark:border-pink-800/30',
    hoverBorder: 'hover:border-pink-300 dark:hover:border-pink-700',
    glow: 'group-hover:shadow-pink-500/10',
    text: 'text-pink-700 dark:text-pink-400',
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
  const theme = colorThemes[colorTheme] || colorThemes.gray;

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
                className="text-[10px] font-medium text-muted-foreground truncate uppercase tracking-wide"
                title={title}
              >
                {title}
              </p>

              <div className="flex items-baseline gap-2">
                <h3
                  className={cn(
                    'text-xl font-bold tracking-tight',
                    'text-foreground',
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
                      'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                      trend.direction === 'up'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {trend.value}
                  </motion.div>
                )}
              </div>

              {description && (
                <p
                  className="text-[10px] text-muted-foreground truncate"
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
