import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  border?: boolean;
  shadow?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { blur = 'md', opacity = 0.8, border = true, shadow = true, children, className, ...props },
    ref
  ) => {
    const getBlurClass = () => {
      switch (blur) {
        case 'sm':
          return 'backdrop-blur-sm';
        case 'md':
          return 'backdrop-blur-md';
        case 'lg':
          return 'backdrop-blur-lg';
        case 'xl':
          return 'backdrop-blur-xl';
        default:
          return 'backdrop-blur-md';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-xl overflow-hidden',
          'backdrop-saturate-150 gpu-accelerated contain-paint',
          getBlurClass(),
          border && 'border border-white/20 dark:border-white/10',
          shadow && 'shadow-glass',
          'before:absolute before:inset-0 before:rounded-xl',
          'before:bg-gradient-to-br before:from-white/10 before:to-transparent',
          'before:pointer-events-none',
          className
        )}
        style={{
          backgroundColor: `color-mix(in oklch, var(--color-background) ${opacity * 100}%, transparent)`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
