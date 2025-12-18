import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-offset-0 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        // Primary - Main brand action button (Teal)
        primary:
          'bg-primary text-primary-foreground bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl focus-visible:ring-primary-100 dark:focus-visible:ring-primary-900',

        // Secondary - Alternative action (Outline)
        secondary:
          'bg-secondary text-secondary-foreground bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-primary-300 shadow-sm focus-visible:ring-primary-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50 dark:hover:bg-gray-700',

        // Success - Positive actions (Green)
        success:
          'bg-success-600 text-white shadow-lg hover:bg-success-700 hover:shadow-xl focus-visible:ring-success-100 disabled:bg-success-500/50 dark:focus-visible:ring-success-900',

        // Destructive - Delete/Remove (Red)
        destructive:
          'bg-destructive text-white bg-error-600 shadow-lg hover:bg-error-700 hover:shadow-xl focus-visible:ring-error-100 disabled:bg-error-500/50 dark:focus-visible:ring-error-900',

        // Warning - Caution actions (Amber)
        warning:
          'bg-warning-600 text-white shadow-lg hover:bg-warning-700 hover:shadow-xl focus-visible:ring-warning-100 disabled:bg-warning-500/50 dark:focus-visible:ring-warning-900',

        // Info - Informational actions (Blue)
        info:
          'bg-info-600 text-white shadow-lg hover:bg-info-700 hover:shadow-xl focus-visible:ring-info-100 dark:focus-visible:ring-info-900',

        // Ghost - Subtle/tertiary action
        ghost:
          'bg-transparent text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus-visible:ring-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/20',

        // Link - Text link style
        link:
          'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-100 dark:text-primary-400',

        // Outline - Bordered style
        outline:
          'border bg-background border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm focus-visible:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50',

        // Loading state (disabled appearance)
        loading:
          'bg-gray-300 text-gray-600 cursor-not-allowed shadow-none hover:shadow-none',

        // Elevated - More prominent with shadow
        elevated:
          'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-xl hover:shadow-2xl hover:from-primary-700 hover:to-primary-800 focus-visible:ring-primary-100 transform hover:-translate-y-0.5 transition-all',
      },

      size: {
        // Small - Compact buttons
        sm:
          'h-8 px-3 text-xs gap-1.5 has-[>svg]:px-2 rounded-md',

        // Medium - Default size (most common)
        md:
          'h-11 px-4 py-2 text-sm gap-2 has-[>svg]:px-3 rounded-lg',

        // Default - Alias for md
        default:
          'h-11 px-4 py-2 text-sm gap-2 has-[>svg]:px-3 rounded-lg',

        // Large - Prominent buttons
        lg:
          'h-10 px-8 text-base gap-2 has-[>svg]:px-4 rounded-lg',

        // Extra Large - Full width or hero buttons
        xl:
          'h-14 px-8 py-3 text-base gap-3 has-[>svg]:px-6 rounded-lg',

        // Icon only - Square buttons
        icon:
          'size-9 rounded-lg has-[>svg]:size-5',

        'icon-sm':
          'size-8 rounded-md has-[>svg]:size-4',

        'icon-md':
          'size-10 rounded-lg has-[>svg]:size-5',

        'icon-lg':
          'size-11 rounded-lg has-[>svg]:size-6',

        // Block - Full width
        block:
          'w-full h-11 px-4 py-2 text-sm rounded-lg',
      },

      // States for special conditions
      state: {
        default: '',
        loading: 'cursor-wait opacity-70',
        disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
        active: 'scale-[0.98]',
      },
    },

    compoundVariants: [
      // Primary + Size combinations
      { variant: 'primary', size: 'sm', class: 'h-8 px-3' },
      { variant: 'primary', size: 'lg', class: 'h-10 px-8' },

      // Secondary + Size combinations
      { variant: 'secondary', size: 'sm', class: 'h-8 px-3' },
      { variant: 'secondary', size: 'lg', class: 'h-10 px-8' },

      // Icon variants - no text padding
      { size: 'icon', class: '[&_svg]:size-5' },
      { size: 'icon-sm', class: '[&_svg]:size-4' },
      { size: 'icon-lg', class: '[&_svg]:size-6' },
    ],

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      state: 'default',
    },
  }
);
