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
    const sizeClass =
      size === 'sm'
        ? 'text-xs'
        : size === 'lg'
          ? 'text-base'
          : 'text-sm';

    const emphasisClass = emphasis === 'bold' ? 'font-bold' : 'font-semibold';

    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        className={cn(
          'flex items-center gap-2 leading-none select-none',
          sizeClass,
          emphasisClass,
          'text-corporate-gray-900 dark:text-corporate-gray-100',
          'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span className="text-corporate-error-600 ml-0.5 font-bold" aria-label="required">
              *
            </span>
          )}
        </span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger type="button" asChild>
              <Info
                className="h-4 w-4 text-corporate-gray-500 cursor-help ml-1 flex-shrink-0"
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
