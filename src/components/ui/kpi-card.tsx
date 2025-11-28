'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorTheme: 'green' | 'orange' | 'blue' | 'red' | 'gray' | 'purple';
  description?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

const colorThemes = {
  green: {
    bg: 'from-green-500 to-green-600',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
    text: 'text-green-600',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
    text: 'text-orange-600',
  },
  blue: {
    bg: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    text: 'text-blue-600',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
    text: 'text-red-600',
  },
  gray: {
    bg: 'from-gray-500 to-gray-600',
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
    text: 'text-gray-600',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
    text: 'text-purple-600',
  },
};

export function KPICard({
  title,
  value,
  icon: Icon,
  colorTheme,
  description,
  trend,
  onClick,
}: KPICardProps) {
  const theme = colorThemes[colorTheme];

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-lg',
        theme.border,
        onClick && 'cursor-pointer hover:scale-105'
      )}
      onClick={onClick}
    >
      {/* Background gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200',
          'bg-gradient-to-br',
          theme.bg
        )}
      />

      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight mb-2">{value}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.value}
                </span>
                <span className="text-xs text-muted-foreground">son 30 gün</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'p-3 rounded-xl transition-transform group-hover:scale-110',
              theme.iconBg
            )}
          >
            <Icon className={cn('h-6 w-6', theme.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
