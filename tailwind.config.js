/** @type {import("tailwindcss").Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // ========================================
      // SEMANTIC COLOR SYSTEM - CSS Variables
      // ========================================
      colors: {
        // Background & Foreground
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        
        // Card
        'card': {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        
        // Popover
        'popover': {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        
        // Primary - Indigo/Blue Scale
        'primary': {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        
        // Secondary
        'secondary': {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        
        // Muted
        'muted': {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        
        // Accent
        'accent': {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        
        // Destructive
        'destructive': {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        
        // ========================================
        // STATUS COLORS
        // ========================================
        
        // Success - Green
        'success': {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          50: 'var(--success-50)',
          100: 'var(--success-100)',
          500: 'var(--success-500)',
          600: 'var(--success-600)',
          700: 'var(--success-700)',
        },
        
        // Warning - Amber
        'warning': {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          50: 'var(--warning-50)',
          100: 'var(--warning-100)',
          500: 'var(--warning-500)',
          600: 'var(--warning-600)',
          700: 'var(--warning-700)',
        },
        
        // Error - Red
        'error': {
          DEFAULT: 'var(--error)',
          foreground: 'var(--error-foreground)',
          50: 'var(--error-50)',
          100: 'var(--error-100)',
          500: 'var(--error-500)',
          600: 'var(--error-600)',
          700: 'var(--error-700)',
        },
        
        // Info - Blue
        'info': {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
          50: 'var(--info-50)',
          100: 'var(--info-100)',
          500: 'var(--info-500)',
          600: 'var(--info-600)',
          700: 'var(--info-700)',
        },

        // Gray - Neutral Scale (using Tailwind's gray)
        'gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },

        // Override Tailwind's default teal to use indigo instead
        'teal': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },

        // ========================================
        // INTERACTIVE COLORS
        // ========================================
        'border': 'var(--border)',
        'input': 'var(--input)',
        'ring': 'var(--ring)',
        
        // ========================================
        // CHART COLORS
        // ========================================
        'chart': {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
        
        // ========================================
        // SIDEBAR COLORS
        // ========================================
        'sidebar': {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      
      // ========================================
      // TYPOGRAPHY
      // ========================================
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        heading: [
          'Outfit',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          'Outfit',
          'Inter',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.005em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        'display': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'display-xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      
      // ========================================
      // SPACING
      // ========================================
      spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
        '3xl': '4rem',   // 64px
        '4xl': '6rem',   // 96px
      },
      
      // ========================================
      // BORDER RADIUS
      // ========================================
      borderRadius: {
        xs: '0.25rem',   // 4px
        sm: '0.375rem',  // 6px
        md: '0.5rem',    // 8px
        lg: 'var(--radius)',
        xl: '1rem',      // 16px
        '2xl': '1.25rem',// 20px
        '3xl': '1.5rem', // 24px
      },
      
      // ========================================
      // BOX SHADOWS
      // ========================================
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
        'focus': '0 0 0 3px rgba(13, 148, 136, 0.2)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
      
      // ========================================
      // ANIMATIONS
      // ========================================
      animation: {
        'pulse-smooth': 'pulse-smooth 2s cubic-bezier(0.83, 0, 0.17, 1) infinite',
        'spin-smooth': 'spin-smooth 1s linear infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'fade-out': 'fade-out 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-left': 'slide-left 0.3s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-smooth': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(0.98)' },
        },
        'spin-smooth': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      
      // ========================================
      // TRANSITIONS
      // ========================================
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
      transitionTimingFunction: {
        'ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      // ========================================
      // MISC
      // ========================================
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      opacity: {
        5: '0.05',
        10: '0.1',
        15: '0.15',
      },
      minHeight: {
        'card': '200px',
        'widget': '150px',
      },
      maxWidth: {
        'prose': '65ch',
        'container': '1400px',
      },
    }
  },
  plugins: [],
};

export default config;
