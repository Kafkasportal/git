'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /** The icon to display */
  icon: LucideIcon;
  /** Accessible label - REQUIRED for accessibility */
  label: string;
  /** Show label text next to icon */
  showLabel?: boolean;
  /** Tooltip position */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * IconButton - Button with icon and proper accessibility
 * 
 * Always use this component for icon-only buttons.
 * Ensures proper ARIA labels and tooltips for accessibility.
 * 
 * @example
 * // Icon only with tooltip
 * <IconButton icon={Plus} label="Yeni Ekle" onClick={handleAdd} />
 * 
 * @example
 * // Icon with visible label
 * <IconButton icon={Plus} label="Yeni Ekle" showLabel onClick={handleAdd} />
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      label,
      showLabel = false,
      tooltipSide = 'bottom',
      size = 'icon',
      variant = 'outline',
      className,
      ...props
    },
    ref
  ) => {
    // If showing label, use regular button with icon + text
    if (showLabel) {
      return (
        <Button
          ref={ref}
          variant={variant}
          size="default"
          className={cn('gap-2', className)}
          aria-label={label}
          {...props}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Button>
      );
    }

    // Icon-only button with tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            className={className}
            aria-label={label}
            {...props}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * ActionButtonGroup - Container for action buttons in page headers
 * Ensures consistent spacing and alignment
 */
export function ActionButtonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}



