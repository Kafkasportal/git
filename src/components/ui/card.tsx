import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const cardVariants = cva(
  'bg-card text-card-foreground flex flex-col rounded-lg border border-border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'shadow-card hover:shadow-card-hover',
        interactive:
          'shadow-card hover:shadow-card-hover hover:border-primary/20 cursor-pointer hover:-translate-y-0.5',
        elevated: 'shadow-card-premium hover:shadow-card-hover border-border',
        outline: 'bg-transparent border border-border/60 hover:border-border',
        ghost: 'border-0 shadow-none bg-transparent',
      },
      size: {
        default: 'gap-6 py-6',
        sm: 'gap-4 py-4',
        lg: 'gap-8 py-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CardProps extends React.ComponentProps<'div'>, VariantProps<typeof cardVariants> {
  animated?: boolean;
}

function Card({ className, variant, size, animated, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        cardVariants({ variant, size }),
        animated && 'hover:scale-[1.02] transition-transform duration-200',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('font-heading font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('font-body text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

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
