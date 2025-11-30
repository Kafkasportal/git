import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-error ring-error/20',
        success: 'border-success ring-success/20 focus-visible:ring-success/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TextareaProps
  extends React.ComponentProps<'textarea'>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    // Use aria-invalid for automatic error state if variant not specified
    const effectiveVariant = variant || (props['aria-invalid'] ? 'error' : 'default');

    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        data-state={effectiveVariant !== 'default' ? effectiveVariant : undefined}
        className={cn(
          textareaVariants({ variant: effectiveVariant }),
          // Keep aria-invalid styling for backward compatibility
          !variant &&
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
