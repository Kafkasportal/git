import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      state,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          buttonVariants({
            variant,
            size,
            state: isLoading ? 'loading' : isDisabled ? 'disabled' : state,
            className,
          })
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
export { buttonVariants };
