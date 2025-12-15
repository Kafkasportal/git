/** @type {import("tailwindcss").Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Corporate Color Palette
      colors: {
        // Primary Blues - Profesyonel
        'brand': {
          'primary': 'var(--primary)',
          'secondary': 'var(--secondary)',
        },
        // Government/Corporate Colors
        'corporate': {
          // Primary Blue
          'primary': {
            50: '#F0F5FF',
            100: '#E8F0FF',
            200: '#D6E4FF',
            300: '#BBCFFF',
            400: '#99B2FF',
            500: '#7A8AFF',
            600: '#0052CC',
            700: '#003A99',
            800: '#002966',
            900: '#001A4D',
          },
          // Dark Blue (Accent)
          'dark': {
            50: '#F5F7FA',
            100: '#EBF0F7',
            200: '#D6E0EC',
            300: '#C2CDE0',
            400: '#A8B8D0',
            500: '#7A8FA8',
            600: '#2B3E50',
            700: '#1F2A38',
            800: '#151B24',
            900: '#0B0E12',
          },
          // Teal Accent (Modern)
          'accent': {
            50: '#F0FFFE',
            100: '#E0FFFD',
            200: '#B3FFFB',
            300: '#80FFF9',
            400: '#4DFFF6',
            500: '#1AE5DB',
            600: '#17A2B8',
            700: '#127A89',
            800: '#0D525A',
            900: '#062A2E',
          },
          // Success Green
          'success': {
            50: '#E8F5E9',
            100: '#C8E6C9',
            200: '#A5D6A7',
            300: '#81C784',
            400: '#66BB6A',
            500: '#4CAF50',
            600: '#43A047',
            700: '#388E3C',
            800: '#2E7D32',
            900: '#1B5E20',
          },
          // Warning Amber
          'warning': {
            50: '#FFF3E0',
            100: '#FFE0B2',
            200: '#FFCC80',
            300: '#FFB74D',
            400: '#FFA726',
            500: '#FF9800',
            600: '#FB8C00',
            700: '#F57C00',
            800: '#E65100',
            900: '#BF360C',
          },
          // Error Red
          'error': {
            50: '#FFEBEE',
            100: '#FFCDD2',
            200: '#EF9A9A',
            300: '#E57373',
            400: '#EF5350',
            500: '#F44336',
            600: '#E53935',
            700: '#D32F2F',
            800: '#C62828',
            900: '#B71C1C',
          },
          // Info/Cyan
          'info': {
            50: '#E0F7FA',
            100: '#B2EBF2',
            200: '#80DEEA',
            300: '#4DD0E1',
            400: '#26C6DA',
            500: '#00BCD4',
            600: '#00ACC1',
            700: '#0097A7',
            800: '#00838F',
            900: '#006064',
          },
          // Neutral Grays
          'gray': {
            50: '#FAFBFC',
            100: '#F5F7FA',
            200: '#E8EBF0',
            300: '#DDD',
            400: '#C5CED6',
            500: '#A0ABB8',
            600: '#718096',
            700: '#4A5568',
            800: '#2D3748',
            900: '#1A202C',
          },
        },
      },
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
          'Poppins',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          'Poppins',
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
      borderRadius: {
        xs: '0.25rem',   // 4px
        sm: '0.375rem',  // 6px
        md: '0.5rem',    // 8px
        lg: '0.75rem',   // 12px
        xl: '1rem',      // 16px
        '2xl': '1.25rem',// 20px
        '3xl': '1.5rem', // 24px
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'focus': '0 0 0 3px rgba(0, 82, 204, 0.1)',
        'focus-error': '0 0 0 3px rgba(220, 53, 69, 0.1)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
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
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
      transitionTimingFunction: {
        'ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
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
      gaps: {
        'card': '1rem',
        'section': '2rem',
      },
    }
  },
  plugins: [],
};

export default config;
