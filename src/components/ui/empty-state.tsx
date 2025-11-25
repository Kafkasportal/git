'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'illustration';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const containerVariants = {
    default: 'py-12',
    minimal: 'py-8',
    illustration: 'py-16',
  };

  const iconSizeVariants = {
    default: 'h-8 w-8',
    minimal: 'h-6 w-6',
    illustration: 'h-16 w-16',
  };

  const titleSizeVariants = {
    default: 'text-lg',
    minimal: 'text-base',
    illustration: 'text-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        containerVariants[variant],
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex items-center justify-center mb-4',
            variant === 'default' && 'rounded-full bg-muted/50 p-4',
            variant === 'minimal' && '',
            variant === 'illustration' && 'rounded-full bg-muted/30 p-6'
          )}
        >
          <Icon className={cn('text-muted-foreground', iconSizeVariants[variant])} />
        </div>
      )}

      <h3
        className={cn(
          'font-heading font-semibold text-foreground mb-2',
          titleSizeVariants[variant]
        )}
      >
        {title}
      </h3>

      {description && (
        <p className="font-body text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
