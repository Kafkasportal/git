import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-all duration-200 overflow-hidden cursor-default',
  {
    variants: {
      variant: {
        // Default - Primary badge
        default:
          'bg-primary-100 text-primary-700 border-primary-200 hover:bg-primary-200',

        // Primary - Main brand
        primary:
          'bg-primary-600 text-white border-primary-700 hover:bg-primary-700 focus-visible:ring-primary-300',

        // Secondary - Gray background
        secondary:
          'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200',

        // Success - Green badge
        success:
          'bg-success-100 text-success-700 border-success-100 hover:bg-success-100',

        // Warning - Amber badge
        warning:
          'bg-warning-100 text-warning-700 border-warning-100 hover:bg-warning-100',

        // Destructive - Red badge
        destructive:
          'bg-error-100 text-error-700 border-error-100 hover:bg-error-100 focus-visible:ring-error-300',

        // Info - Blue badge
        info:
          'bg-info-100 text-info-700 border-info-100 hover:bg-info-100',

        // Outline - Bordered style
        outline:
          'bg-transparent text-gray-900 border-gray-300 hover:bg-gray-50 dark:text-gray-100 dark:border-gray-600',

        // Ghost - Minimal style
        ghost:
          'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',

        // Solid - Full color
        solid:
          'bg-primary-600 text-white border-primary-700 hover:bg-primary-700 shadow-sm',

        // Muted - Subtle gray
        muted:
          'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300',
      },

      size: {
        // Small - Compact badge
        sm: 'px-2 py-0.5 text-xs gap-0.5',

        // Default - Standard size
        default: 'px-2.5 py-1 text-xs gap-1',
        md: 'px-2.5 py-1 text-xs gap-1',

        // Large - Bigger badge
        lg: 'px-3 py-1.5 text-sm gap-1.5',
      },

      // Status badges
      status: {
        active: 'bg-success-100 text-success-700 border-success-100',
        inactive: 'bg-gray-100 text-gray-700 border-gray-200',
        pending: 'bg-warning-100 text-warning-700 border-warning-100',
        error: 'bg-error-100 text-error-700 border-error-100',
      },
    },

    compoundVariants: [
      // Size combinations
      { size: 'sm', variant: 'primary', class: 'text-xs' },
      { size: 'lg', variant: 'primary', class: 'text-sm' },
    ],

    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);
