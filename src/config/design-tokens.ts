/**
 * Design System Tokens
 * Central source of truth for all design decisions
 */

// ==================== COLORS ====================

export const colors = {
  // Primary (Brand - Kurumsal Mavi)
  primary: {
    '50': '#F5F9FF',
    '100': '#E6F0FF',
    '200': '#B8D8FF',
    '300': '#7CB3FF',
    '400': '#4A8FFF',
    '500': '#2875E8',
    '600': '#1A6DD0',
    '700': '#1358B8', // Main brand color
    '800': '#0F4A9A',
    '900': '#0B3D7D',
  },

  // Success (Green)
  success: {
    '50': '#F0FDF4',
    '100': '#DCFCE7',
    '200': '#BBF7D0',
    '300': '#86EFAC',
    '400': '#4ADE80',
    '500': '#34D399',
    '600': '#10B981',
    '700': '#059669',
    '800': '#047857',
    '900': '#065F46',
  },

  // Warning (Orange)
  warning: {
    '50': '#FFFBEB',
    '100': '#FEF3C7',
    '200': '#FDE68A',
    '300': '#FCD34D',
    '400': '#FBBF24',
    '500': '#F59E0B',
    '600': '#F59E0B',
    '700': '#D97706',
    '800': '#B45309',
    '900': '#92400E',
  },

  // Error (Red)
  error: {
    '50': '#FEF2F2',
    '100': '#FEE2E2',
    '200': '#FECACA',
    '300': '#FCA5A5',
    '400': '#F87171',
    '500': '#F87171',
    '600': '#EF4444',
    '700': '#DC2626',
    '800': '#B91C1C',
    '900': '#7F1D1D',
  },

  // Info (Purple)
  info: {
    '50': '#FAF5FF',
    '100': '#F3E8FF',
    '200': '#E9D5FF',
    '300': '#D8B4FE',
    '400': '#C084FC',
    '500': '#A855F7',
    '600': '#9333EA',
    '700': '#7E22CE',
    '800': '#6B21A8',
    '900': '#581C87',
  },

  // Neutral (Gray)
  gray: {
    '50': '#F9FAFB',
    '100': '#F3F4F6',
    '200': '#E5E7EB',
    '300': '#D1D5DB',
    '400': '#9CA3AF',
    '500': '#6B7280',
    '600': '#4B5563',
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827',
  },

  // Category specific colors
  categories: {
    donation: '#EC4899', // Pink - Donations
    aid: '#8B5CF6', // Purple - Aid
    scholarship: '#06B6D4', // Cyan - Scholarships
    meeting: '#F59E0B', // Amber - Meetings
    task: '#10B981', // Green - Tasks
    message: '#6366F1', // Indigo - Messages
  },

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
};

// ==================== TYPOGRAPHY ====================

export const typography = {
  // Font families
  fonts: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    heading: "'Poppins', system-ui, -apple-system, sans-serif",
    mono: "'Fira Code', monospace",
  },

  // Font sizes (desktop)
  sizes: {
    xs: { size: '11px', lineHeight: '16px' },
    sm: { size: '12px', lineHeight: '18px' },
    base: { size: '14px', lineHeight: '21px' },
    lg: { size: '16px', lineHeight: '24px' },
    xl: { size: '20px', lineHeight: '28px' },
    '2xl': { size: '24px', lineHeight: '32px' },
    '3xl': { size: '28px', lineHeight: '36px' },
    '4xl': { size: '36px', lineHeight: '44px' },
    '5xl': { size: '48px', lineHeight: '56px' },
  },

  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    loose: '+0.01em',
    looser: '+0.05em',
  },
};

// ==================== SPACING ====================

export const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
};

// ==================== SHADOWS ====================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.1)',
};

// ==================== TRANSITIONS ====================

export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// ==================== Z-INDEX ====================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal_backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ==================== BORDER RADIUS ====================

export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
};

// ==================== BREAKPOINTS ====================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ==================== COMPONENT TOKENS ====================

export const components = {
  button: {
    padding: {
      sm: '8px 16px',
      md: '12px 24px',
      lg: '16px 32px',
    },
    fontSize: {
      sm: '12px',
      md: '14px',
      lg: '16px',
    },
    borderRadius: '8px',
    transitionDuration: '150ms',
  },

  input: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: '0 12px',
    borderRadius: '8px',
    borderWidth: '1px',
    fontSize: '14px',
    transitionDuration: '150ms',
  },

  card: {
    padding: {
      sm: '12px',
      md: '16px',
      lg: '24px',
    },
    borderRadius: '12px',
    borderWidth: '1px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transitionDuration: '200ms',
  },

  badge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },

  modal: {
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
    maxWidth: {
      sm: '500px',
      md: '700px',
      lg: '1000px',
    },
  },

  table: {
    cellPadding: '16px',
    headerBorderRadius: '4px',
    rowHeight: '48px',
  },
};

// ==================== LAYOUT ====================

export const layout = {
  container: {
    maxWidth: '1280px',
    padding: {
      mobile: '16px',
      tablet: '24px',
      desktop: '32px',
    },
  },

  sidebar: {
    width: {
      desktop: '280px',
      tablet: '240px',
      mobile: '0px', // Hidden, uses drawer
    },
    gap: {
      desktop: '24px',
      tablet: '16px',
    },
  },

  grid: {
    columns: {
      desktop: 12,
      tablet: 8,
      mobile: 4,
    },
    gap: {
      desktop: '24px',
      tablet: '16px',
      mobile: '12px',
    },
  },

  whitespace: {
    section: {
      desktop: '48px',
      tablet: '32px',
      mobile: '24px',
    },
    component: '16px',
    inline: '8px',
  },
};

// ==================== COLOR SCHEMES ====================

export const colorSchemes = {
  light: {
    background: colors.white,
    surface: colors.gray['50'],
    text: colors.gray['900'],
    textSecondary: colors.gray['600'],
    textTertiary: colors.gray['500'],
    border: colors.gray['200'],
    disabled: colors.gray['300'],
  },

  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    border: '#334155',
    disabled: '#475569',
  },
};

// ==================== EXPORT DEFAULT ====================

export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
  transitions,
  zIndex,
  borderRadius,
  breakpoints,
  components,
  layout,
  colorSchemes,
};

export default designTokens;
