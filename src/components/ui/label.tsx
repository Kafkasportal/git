'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean;
  tooltip?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  /** Optional label size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional emphasis */
  emphasis?: 'normal' | 'bold';
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  (
    {
      className,
      children,
      required,
      tooltip,
      tooltipSide = 'right',
      size = 'md',
      emphasis = 'normal',
      ...props
    },
    ref
  ) => {
    // Updated size classes for better readability (WCAG AA)
    const getSizeClass = (sizeValue: 'sm' | 'md' | 'lg'): string => {
      if (sizeValue === 'sm') return 'text-sm'; // Was text-xs, now text-sm
      if (sizeValue === 'lg') return 'text-base';
      return 'text-sm'; // Default - clear and readable
    };
    const sizeClass = getSizeClass(size);

    const emphasisClass = emphasis === 'bold' ? 'font-bold' : 'font-semibold';

    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        className={cn(
          'flex items-center gap-2 leading-normal select-none mb-1.5',
          sizeClass,
          emphasisClass,
          'text-foreground', // High contrast - uses foreground color
          'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span className="text-destructive ml-0.5 font-bold" aria-label="required">
              *
            </span>
          )}
        </span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger type="button" asChild>
              <Info
                className="h-4 w-4 text-muted-foreground cursor-help ml-1 flex-shrink-0 hover:text-foreground transition-colors"
                aria-label="more information"
              />
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>
              <p className="max-w-xs text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </LabelPrimitive.Root>
    );
  }
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
