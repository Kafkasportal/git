import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-offset-0 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        // Default - Alias for primary
        default:
          'bg-gradient-to-r from-corporate-primary-600 to-corporate-primary-700 text-white shadow-lg hover:from-corporate-primary-700 hover:to-corporate-primary-800 hover:shadow-xl focus-visible:ring-corporate-primary-100 dark:focus-visible:ring-corporate-primary-900',

        // Primary - Main brand action button (Corporate Blue)
        primary:
          'bg-gradient-to-r from-corporate-primary-600 to-corporate-primary-700 text-white shadow-lg hover:from-corporate-primary-700 hover:to-corporate-primary-800 hover:shadow-xl focus-visible:ring-corporate-primary-100 dark:focus-visible:ring-corporate-primary-900',

        // Secondary - Alternative action (Outline)
        secondary:
          'bg-white border-2 border-corporate-gray-300 text-corporate-gray-900 hover:bg-corporate-gray-50 hover:border-corporate-primary-300 shadow-sm focus-visible:ring-corporate-primary-100 dark:bg-corporate-gray-800 dark:border-corporate-gray-600 dark:text-corporate-gray-50 dark:hover:bg-corporate-gray-700',

        // Success - Positive actions (Green)
        success:
          'bg-corporate-success-600 text-white shadow-lg hover:bg-corporate-success-700 hover:shadow-xl focus-visible:ring-corporate-success-100 disabled:bg-corporate-success-400 dark:focus-visible:ring-corporate-success-900',

        // Danger/Destructive - Delete/Remove (Red)
        danger:
          'bg-corporate-error-600 text-white shadow-lg hover:bg-corporate-error-700 hover:shadow-xl focus-visible:ring-corporate-error-100 disabled:bg-corporate-error-400 dark:focus-visible:ring-corporate-error-900',

        // Destructive - Alias for danger
        destructive:
          'bg-corporate-error-600 text-white shadow-lg hover:bg-corporate-error-700 hover:shadow-xl focus-visible:ring-corporate-error-100 disabled:bg-corporate-error-400 dark:focus-visible:ring-corporate-error-900',

        // Warning - Caution actions (Amber)
        warning:
          'bg-corporate-warning-600 text-white shadow-lg hover:bg-corporate-warning-700 hover:shadow-xl focus-visible:ring-corporate-warning-100 disabled:bg-corporate-warning-400 dark:focus-visible:ring-corporate-warning-900',

        // Ghost - Subtle/tertiary action
        ghost:
          'bg-transparent text-corporate-primary-600 hover:bg-corporate-primary-50 hover:text-corporate-primary-700 focus-visible:ring-corporate-primary-100 dark:text-corporate-primary-400 dark:hover:bg-corporate-primary-900/20',

        // Link - Text link style
        link:
          'text-corporate-primary-600 underline-offset-4 hover:underline focus-visible:ring-corporate-primary-100 dark:text-corporate-primary-400',

        // Outline - Bordered style
        outline:
          'border border-corporate-gray-300 bg-white text-corporate-gray-900 hover:bg-corporate-gray-50 hover:border-corporate-gray-400 shadow-sm focus-visible:ring-corporate-primary-100 dark:border-corporate-gray-600 dark:bg-corporate-gray-800 dark:text-corporate-gray-50',

        // Info - Informational actions (Cyan)
        info:
          'bg-corporate-info-600 text-white shadow-lg hover:bg-corporate-info-700 hover:shadow-xl focus-visible:ring-corporate-info-100 dark:focus-visible:ring-corporate-info-900',

        // Loading state (disabled appearance)
        loading:
          'bg-corporate-gray-300 text-corporate-gray-600 cursor-not-allowed shadow-none hover:shadow-none',

        // Elevated - More prominent with shadow
        elevated:
          'bg-gradient-to-r from-corporate-primary-600 to-corporate-primary-700 text-white shadow-xl hover:shadow-2xl hover:from-corporate-primary-700 hover:to-corporate-primary-800 focus-visible:ring-corporate-primary-100 transform hover:-translate-y-0.5 transition-all',

        // Glow - Teal glow effect on hover
        glow:
          'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg hover:shadow-[0_0_30px_rgba(13,148,136,0.4)] focus-visible:ring-primary/30 transition-all duration-300',

        // Soft - Soft background with text color
        soft:
          'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 shadow-none',

        // Glass - Glass morphism button
        glass:
          'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 shadow-lg focus-visible:ring-white/20',
      },

      size: {
        // Small - Compact buttons
        sm:
          'h-9 px-3 py-2 text-xs gap-1.5 has-[>svg]:px-2 rounded-md',

        // Medium - Default size (most common)
        md:
          'h-11 px-4 py-2 text-sm gap-2 has-[>svg]:px-3 rounded-lg',

        // Default - Alias for md
        default:
          'h-11 px-4 py-2 text-sm gap-2 has-[>svg]:px-3 rounded-lg',

        // Large - Prominent buttons
        lg:
          'h-13 px-6 py-3 text-base gap-2 has-[>svg]:px-4 rounded-lg',

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
      { variant: 'primary', size: 'sm', class: 'h-9 px-3' },
      { variant: 'primary', size: 'lg', class: 'h-13 px-6' },

      // Secondary + Size combinations
      { variant: 'secondary', size: 'sm', class: 'h-9 px-3' },
      { variant: 'secondary', size: 'lg', class: 'h-13 px-6' },

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
