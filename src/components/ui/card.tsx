import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const cardVariants = cva(
  'flex flex-col rounded-lg border transition-all duration-200',
  {
    variants: {
      variant: {
        // Default - Standard white card with subtle shadow
        default:
          'bg-white border-corporate-gray-200 text-corporate-gray-900 shadow-card hover:shadow-card-hover',

        // Interactive - Card that responds to user interaction
        interactive:
          'bg-white border-corporate-gray-200 text-corporate-gray-900 shadow-card hover:shadow-card-hover hover:border-corporate-primary-300 cursor-pointer transition-transform hover:-translate-y-1',

        // Elevated - More prominent card with stronger shadow
        elevated:
          'bg-white border-corporate-gray-100 text-corporate-gray-900 shadow-xl hover:shadow-2xl',

        // Highlighted - Important card with accent color
        highlighted:
          'bg-corporate-primary-50 border-corporate-primary-200 text-corporate-gray-900 shadow-card hover:shadow-card-hover',

        // Success - Positive/confirmation card
        success:
          'bg-corporate-success-50 border-corporate-success-200 text-corporate-gray-900 shadow-card',

        // Warning - Warning/caution card
        warning:
          'bg-corporate-warning-50 border-corporate-warning-200 text-corporate-gray-900 shadow-card',

        // Error - Error/danger card
        error:
          'bg-corporate-error-50 border-corporate-error-200 text-corporate-gray-900 shadow-card',

        // Info - Informational card
        info:
          'bg-corporate-info-50 border-corporate-info-200 text-corporate-gray-900 shadow-card',

        // Outline - Borderless with outline only
        outline:
          'bg-transparent border-corporate-gray-300 text-corporate-gray-900 hover:border-corporate-gray-400 shadow-none',

        // Ghost - Transparent background
        ghost:
          'bg-transparent border-transparent text-corporate-gray-900 shadow-none',

        // Muted - Neutral gray card
        muted:
          'bg-corporate-gray-50 border-corporate-gray-200 text-corporate-gray-700 shadow-sm',

        // Dark - Dark background (for light mode contrast)
        dark:
          'bg-corporate-gray-900 border-corporate-gray-800 text-white shadow-xl',

        // Glass - Glass morphism effect
        glass:
          'bg-white/70 backdrop-blur-xl border-white/20 shadow-lg hover:bg-white/80 hover:shadow-xl',

        // Gradient Border - Subtle gradient border effect
        'gradient-border':
          'bg-white border-0 shadow-lg relative before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-br before:from-primary/30 before:via-transparent before:to-primary/10 before:-z-10',

        // Accent - Card with top accent line
        accent:
          'bg-white border-corporate-gray-200 shadow-card relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-primary before:to-primary/60',

        // Glow - Subtle glow effect on hover
        glow:
          'bg-white border-corporate-gray-200 shadow-card hover:shadow-[0_0_30px_rgba(13,148,136,0.15)] transition-shadow duration-300',
      },

      size: {
        // Compact - Tight spacing
        sm:
          'gap-3 p-4',

        // Default - Standard spacing
        md:
          'gap-4 p-6',

        // Default alias
        default:
          'gap-4 p-6',

        // Comfortable - Relaxed spacing
        lg:
          'gap-6 p-8',

        // Spacious - Extra padding
        xl:
          'gap-8 p-10',
      },

      // Responsive to container
      responsive: {
        true: '@container',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'md',
      responsive: false,
    },
  }
);

export interface CardProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof cardVariants> {
  animated?: boolean;
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      responsive,
      animated = false,
      hoverable = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        data-variant={variant}
        className={cn(
          cardVariants({ variant, size, responsive }),
          animated && 'hover:scale-[1.02] transition-transform duration-300',
          hoverable && 'hover:shadow-card-hover cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Header section of card with automatic border
 * Typically contains title and description
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 border-b border-corporate-gray-200 px-6 py-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className
      )}
      {...props}
    />
  );
}

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Title text in header
 * Typically h3 or h4 size
 */
function CardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-lg font-bold text-corporate-gray-900 leading-none',
        className
      )}
      {...props}
    />
  );
}

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Subtitle/description text
 * Muted color for secondary information
 */
function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        'text-sm text-corporate-gray-600 leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

CardDescription.displayName = 'CardDescription';

/**
 * CardAction - Action area in header
 * Typically contains buttons or icons on the right
 */
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end flex items-center gap-2',
        className
      )}
      {...props}
    />
  );
}

CardAction.displayName = 'CardAction';

/**
 * CardContent - Main content area
 * Contains the primary card content
 */
function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6 py-4', className)}
      {...props}
    />
  );
}

CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer section
 * Typically contains buttons or additional information
 */
function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-t border-corporate-gray-200 px-6 py-4',
        className
      )}
      {...props}
    />
  );
}

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
