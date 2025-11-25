/**
 * Centralized Animation Configuration
 * Professional, subtle animations for enhanced UX
 * Based on Material Design and Framer Motion best practices
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================
// TIMING FUNCTIONS (Easing)
// ============================================

export const easing = {
  // Standard curves
  standard: [0.4, 0.0, 0.2, 1],
  decelerate: [0.0, 0.0, 0.2, 1],
  accelerate: [0.4, 0.0, 1, 1],
  sharp: [0.4, 0.0, 0.6, 1],

  // Smooth curves
  smooth: [0.25, 0.46, 0.45, 0.94],
  gentle: [0.25, 0.1, 0.25, 1],
  bouncy: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
} as const;

// ============================================
// DURATION TOKENS
// ============================================

export const duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
  slowest: 0.75,
} as const;

// ============================================
// BASE TRANSITIONS
// ============================================

export const transitions: Record<string, Transition> = {
  default: {
    duration: duration.normal,
    ease: easing.standard,
  },
  fast: {
    duration: duration.fast,
    ease: easing.decelerate,
  },
  smooth: {
    duration: duration.normal,
    ease: easing.smooth,
  },
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
  gentle: {
    type: 'spring',
    stiffness: 300,
    damping: 40,
  },
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: duration.fast,
      ease: easing.accelerate,
    },
  },
};

export const pageTransition: Transition = {
  duration: duration.normal,
  ease: easing.standard,
};

// ============================================
// COMPONENT ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.fast,
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: transitions.fast,
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: transitions.fast,
  },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: transitions.fast,
  },
};

// ============================================
// MODAL & DIALOG ANIMATIONS
// ============================================

export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: {
      duration: duration.fast,
      ease: easing.accelerate,
    },
  },
};

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: duration.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast },
  },
};

// ============================================
// LIST & STAGGER ANIMATIONS
// ============================================

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

// ============================================
// CARD & INTERACTIVE ANIMATIONS
// ============================================

export const cardHover = {
  scale: 1.02,
  y: -2,
  transition: transitions.fast,
};

export const cardTap = {
  scale: 0.98,
  transition: transitions.fast,
};

export const buttonHover = {
  scale: 1.02,
  transition: transitions.fast,
};

export const buttonTap = {
  scale: 0.98,
  transition: transitions.fast,
};

// ============================================
// LOADING & SKELETON ANIMATIONS
// ============================================

export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const pulseVariants: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// ============================================
// NOTIFICATION & TOAST ANIMATIONS
// ============================================

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 300,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    },
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.9,
    transition: {
      duration: duration.fast,
      ease: easing.accelerate,
    },
  },
};

// ============================================
// MICRO-INTERACTIONS
// ============================================

export const hoverLift = {
  whileHover: {
    y: -2,
    transition: transitions.fast,
  },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
    transition: transitions.fast,
  },
};

export const tapScale = {
  whileTap: {
    scale: 0.98,
    transition: transitions.fast,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a stagger animation for list items
 */
export const createStagger = (staggerDelay: number = 0.05): Variants => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.02,
    },
  },
});

/**
 * Create a custom fade-in animation
 */
export const createFadeIn = (duration: number = 0.25, delay: number = 0): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration, delay },
  },
  exit: { opacity: 0 },
});
