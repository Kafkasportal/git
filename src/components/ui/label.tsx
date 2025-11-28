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
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, children, required, tooltip, tooltipSide = 'right', ...props }, ref) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        className={cn(
          'flex items-center gap-2 text-sm font-body font-medium leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger type="button" asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </LabelPrimitive.Root>
    );
  }
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
