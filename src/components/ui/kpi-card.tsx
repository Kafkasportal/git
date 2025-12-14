'use client';

import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorTheme: 'green' | 'orange' | 'blue' | 'red' | 'gray' | 'purple' | 'pink';
  description?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

// Corporate Palette Mapping
// We map the requested themes to a professional, restrained color set
// focusing on Indigo (Primary), Slate (Neutral), Emerald (Success), and Rose (Danger).
const colorThemes = {
  // Success / Growth
  green: {
    bg: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  // Warning / Attention
  orange: {
    bg: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  // Primary / Corporate Blue
  blue: {
    bg: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    iconColor: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/30',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
  // Critical / Danger
  red: {
    bg: 'from-rose-500 to-rose-600',
    iconBg: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/30',
    text: 'text-rose-700 dark:text-rose-400',
  },
  // Neutral / Information
  gray: {
    bg: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-50 dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-400',
  },
  // Mapped to Corporate Blue/Indigo for consistency
  purple: {
    bg: 'from-indigo-500 to-violet-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    iconColor: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/30',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
  // Mapped to Slate for professional look instead of hot pink
  pink: {
    bg: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-50 dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-400',
  },
};

function KPICardComponent({
  title,
  value,
  icon: Icon,
  colorTheme,
  description,
  trend: _trend,
  onClick,
}: KPICardProps) {
  const theme = colorThemes[colorTheme] || colorThemes.gray;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-md',
        'border bg-card', // Use standard card background
        theme.border,
        onClick && 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700'
      )}
      onClick={onClick}
    >
      {/* Subtle Background gradient overlay on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-200',
          'bg-linear-to-br',
          theme.bg
        )}
      />

      <CardContent className="p-2 relative">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'p-1 rounded-md shrink-0 transition-colors',
              theme.iconBg
            )}
          >
            <Icon className={cn('h-3 w-3', theme.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium text-muted-foreground truncate" title={title}>
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-sm font-bold tracking-tight text-foreground" title={String(value)}>
                {value}
              </h3>
              {description && (
                <span className="text-[9px] text-muted-foreground truncate" title={description}>
                  {description}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoized version for performance optimization
export const KPICard = memo(KPICardComponent);
