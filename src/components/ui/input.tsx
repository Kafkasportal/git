import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'w-full min-w-0 rounded-lg border bg-white text-corporate-gray-900 placeholder:text-corporate-gray-400 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:bg-corporate-gray-100 disabled:text-corporate-gray-400 disabled:border-corporate-gray-300 selection:bg-corporate-primary-200 selection:text-corporate-gray-900 outline-none',
  {
    variants: {
      variant: {
        // Default - Normal input field
        default:
          'h-12 px-4 py-3 border-corporate-gray-300 focus:border-corporate-primary-500 focus:ring-4 focus:ring-corporate-primary-100 shadow-sm hover:border-corporate-gray-400',

        // Error - Input with validation error
        error:
          'h-12 px-4 py-3 border-corporate-error-500 focus:border-corporate-error-500 focus:ring-4 focus:ring-corporate-error-100 shadow-sm bg-corporate-error-50/30',

        // Success - Input with validation success
        success:
          'h-12 px-4 py-3 border-corporate-success-500 focus:border-corporate-success-500 focus:ring-4 focus:ring-corporate-success-100 shadow-sm bg-corporate-success-50/30',

        // Warning - Input with warning state
        warning:
          'h-12 px-4 py-3 border-corporate-warning-500 focus:border-corporate-warning-500 focus:ring-4 focus:ring-corporate-warning-100 shadow-sm bg-corporate-warning-50/30',

        // Info - Input with info state
        info:
          'h-12 px-4 py-3 border-corporate-info-500 focus:border-corporate-info-500 focus:ring-4 focus:ring-corporate-info-100 shadow-sm bg-corporate-info-50/30',

        // Outline - Bordered style without background
        outline:
          'h-12 px-4 py-3 border-corporate-gray-300 focus:border-corporate-primary-500 focus:ring-4 focus:ring-corporate-primary-100 shadow-none bg-transparent hover:bg-corporate-gray-50',

        // Ghost - Minimal style
        ghost:
          'h-12 px-4 py-3 border-transparent focus:border-corporate-primary-500 focus:ring-4 focus:ring-corporate-primary-100 bg-corporate-gray-50 hover:bg-corporate-gray-100 shadow-none rounded-lg',

        // Elegant - Refined input with subtle effects
        elegant:
          'h-14 px-5 py-4 border-corporate-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm hover:border-corporate-gray-300 rounded-xl bg-white transition-all duration-200 focus:shadow-md',

        // Glass - Glass morphism input
        glass:
          'h-12 px-4 py-3 border-white/30 focus:border-white/50 focus:ring-4 focus:ring-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-white/50 rounded-xl',

        // Underline - Bottom border only
        underline:
          'h-12 px-0 py-3 border-0 border-b-2 border-corporate-gray-300 focus:border-primary focus:ring-0 rounded-none bg-transparent hover:border-corporate-gray-400 transition-colors',
      },

      inputSize: {
        sm: 'h-10 px-3 py-2 text-sm rounded-md',
        md: 'h-12 px-4 py-3 text-base rounded-lg',
        lg: 'h-14 px-5 py-3 text-base rounded-lg',
        xl: 'h-16 px-6 py-4 text-lg rounded-lg',
      },
    },

    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Show error state */
  isError?: boolean;
  /** Show success state */
  isSuccess?: boolean;
  /** Show warning state */
  isWarning?: boolean;
  /** Show loading state */
  isLoading?: boolean;
  /** Icon component to show inside input */
  icon?: React.ReactNode;
  /** Position of icon */
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      isError,
      isSuccess,
      isWarning,
      isLoading,
      icon,
      iconPosition = 'left',
      disabled,
      ...props
    },
    ref
  ) => {
    // Determine variant based on state
    let effectiveVariant = variant;
    if (isError) effectiveVariant = 'error';
    else if (isSuccess) effectiveVariant = 'success';
    else if (isWarning) effectiveVariant = 'warning';
    else if (props['aria-invalid']) effectiveVariant = 'error';

    // If there's an icon, wrap input in container
    if (icon) {
      return (
        <div className="relative flex items-center">
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-corporate-gray-500 pointer-events-none',
              iconPosition === 'left' ? 'left-3' : 'right-3'
            )}
          >
            {isLoading ? (
              <div className="animate-spin">
                {/* Loader icon would go here */}
              </div>
            ) : (
              icon
            )}
          </div>
          <input
            type={type}
            ref={ref}
            data-slot="input"
            data-state={effectiveVariant}
            disabled={disabled || isLoading}
            className={cn(
              inputVariants({ variant: effectiveVariant, inputSize }),
              iconPosition === 'left' ? 'pl-10' : 'pr-10',
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        data-state={effectiveVariant}
        disabled={disabled || isLoading}
        className={cn(
          inputVariants({ variant: effectiveVariant, inputSize }),
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
export { inputVariants };
