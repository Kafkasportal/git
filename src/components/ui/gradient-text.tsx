/**
 * Gradient Text Component
 * Applies gradient backgrounds to text with proper contrast
 */

import { cn } from '@/lib/utils';

export interface GradientTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'custom';
  direction?: 'to-right' | 'to-bottom' | 'to-bottom-right';
  intensity?: 'light' | 'medium' | 'dark';
  className?: string;
  as?: React.ElementType;
  customGradient?: string;
}

const gradients = {
  primary: 'from-blue-600 via-indigo-500 to-indigo-600',
  success: 'from-emerald-500 via-green-500 to-primary-600',
  warning: 'from-amber-500 via-orange-500 to-red-500',
  error: 'from-red-500 via-pink-500 to-rose-600',
  info: 'from-cyan-500 via-blue-500 to-indigo-600',
  custom: 'from-transparent via-foreground to-transparent',
};

const directions = {
  'to-right': 'bg-gradient-to-r',
  'to-bottom': 'bg-gradient-to-b',
  'to-bottom-right': 'bg-gradient-to-br',
};

export function GradientText({
  children,
  variant = 'primary',
  direction = 'to-right',
  intensity = 'medium',
  className,
  as: Component = 'span',
  customGradient,
}: GradientTextProps) {
  const gradientClass = customGradient ?? gradients[variant];
  const directionClass = directions[direction];

  return (
    <Component
      className={cn(
        'inline-block',
        directionClass,
        gradientClass,
        'bg-clip-text text-transparent',
        intensity === 'light' && 'opacity-70',
        intensity === 'dark' && 'opacity-100',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Animated Gradient Text
 * Gradient that shifts over time
 */
export function AnimatedGradientText({
  children,
  className,
  as: Component = 'span',
}: Omit<GradientTextProps, 'variant' | 'direction' | 'customGradient'> & {
  as?: React.ElementType;
}) {
  return (
    <Component
      className={cn(
        'inline-block',
        'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-[length:200%_auto]',
        'bg-clip-text text-transparent',
        'animate-gradient-shift',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Inline Gradient - for small text portions
 */
export function InlineGradient({
  children,
  variant = 'primary',
  className,
}: Pick<GradientTextProps, 'children' | 'variant' | 'className'>) {
  return (
    <span
      className={cn(
        'font-semibold',
        gradients[variant],
        'bg-gradient-to-r bg-clip-text text-transparent',
        className
      )}
    >
      {children}
    </span>
  );
}
