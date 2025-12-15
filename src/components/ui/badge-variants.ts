import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-all duration-200 overflow-hidden cursor-default',
  {
    variants: {
      variant: {
        // Default - Primary blue badge
        default:
          'bg-corporate-primary-100 text-corporate-primary-700 border-corporate-primary-200 hover:bg-corporate-primary-200',

        // Primary - Main brand
        primary:
          'bg-corporate-primary-600 text-white border-corporate-primary-700 hover:bg-corporate-primary-700 focus-visible:ring-corporate-primary-300',

        // Secondary - Gray background
        secondary:
          'bg-corporate-gray-100 text-corporate-gray-900 border-corporate-gray-200 hover:bg-corporate-gray-200',

        // Success - Green badge
        success:
          'bg-corporate-success-100 text-corporate-success-700 border-corporate-success-200 hover:bg-corporate-success-200',

        // Warning - Amber badge
        warning:
          'bg-corporate-warning-100 text-corporate-warning-700 border-corporate-warning-200 hover:bg-corporate-warning-200',

        // Error/Destructive - Red badge
        error:
          'bg-corporate-error-100 text-corporate-error-700 border-corporate-error-200 hover:bg-corporate-error-200 focus-visible:ring-corporate-error-300',

        destructive:
          'bg-corporate-error-100 text-corporate-error-700 border-corporate-error-200 hover:bg-corporate-error-200 focus-visible:ring-corporate-error-300',

        // Info - Cyan badge
        info:
          'bg-corporate-info-100 text-corporate-info-700 border-corporate-info-200 hover:bg-corporate-info-200',

        // Outline - Bordered style
        outline:
          'bg-transparent text-corporate-gray-900 border-corporate-gray-300 hover:bg-corporate-gray-50 dark:text-corporate-gray-100 dark:border-corporate-gray-600',

        // Ghost - Minimal style
        ghost:
          'bg-transparent text-corporate-gray-700 border-transparent hover:bg-corporate-gray-100 dark:text-corporate-gray-300 dark:hover:bg-corporate-gray-800',

        // Solid - Full color
        solid:
          'bg-corporate-primary-600 text-white border-corporate-primary-700 hover:bg-corporate-primary-700 shadow-sm',

        // Muted - Subtle gray
        muted:
          'bg-corporate-gray-200 text-corporate-gray-700 border-corporate-gray-300 hover:bg-corporate-gray-300',
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
        active: 'bg-corporate-success-100 text-corporate-success-700 border-corporate-success-200',
        inactive: 'bg-corporate-gray-100 text-corporate-gray-700 border-corporate-gray-200',
        pending: 'bg-corporate-warning-100 text-corporate-warning-700 border-corporate-warning-200',
        error: 'bg-corporate-error-100 text-corporate-error-700 border-corporate-error-200',
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
