/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance helpers and testing utilities
 */

// ============================================
// Types
// ============================================

export interface A11yCheckResult {
  passed: boolean;
  issues: A11yIssue[];
  warnings: A11yIssue[];
}

export interface A11yIssue {
  type: A11yIssueType;
  element: string;
  message: string;
  wcagCriteria?: string;
  severity: 'error' | 'warning' | 'info';
}

type A11yIssueType =
  | 'missing-alt'
  | 'missing-label'
  | 'low-contrast'
  | 'missing-focus'
  | 'missing-role'
  | 'invalid-aria'
  | 'missing-heading'
  | 'missing-landmark'
  | 'keyboard-trap'
  | 'touch-target';

// ============================================
// ARIA Utilities
// ============================================

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * ARIA live region announcer
 */
let announcer: HTMLDivElement | null = null;

export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }

  // Clear and set to force announcement
  announcer.textContent = '';
  announcer.setAttribute('aria-live', priority);
  
  // Use requestAnimationFrame to ensure the clear happened
  requestAnimationFrame(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  });
}

/**
 * ARIA attributes for common patterns
 */
export const ariaPatterns = {
  dialog: (isOpen: boolean, labelId: string, descId?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
    'aria-describedby': descId,
    'aria-hidden': !isOpen,
  }),

  menu: (isExpanded: boolean) => ({
    role: 'menu',
    'aria-expanded': isExpanded,
  }),

  menuItem: (selected: boolean = false) => ({
    role: 'menuitem',
    'aria-selected': selected,
    tabIndex: selected ? 0 : -1,
  }),

  tab: (selected: boolean, panelId: string) => ({
    role: 'tab',
    'aria-selected': selected,
    'aria-controls': panelId,
    tabIndex: selected ? 0 : -1,
  }),

  tabPanel: (tabId: string, hidden: boolean) => ({
    role: 'tabpanel',
    'aria-labelledby': tabId,
    hidden,
    tabIndex: 0,
  }),

  accordion: (expanded: boolean, panelId: string) => ({
    'aria-expanded': expanded,
    'aria-controls': panelId,
  }),

  combobox: (isOpen: boolean, listboxId: string, activeId?: string) => ({
    role: 'combobox',
    'aria-expanded': isOpen,
    'aria-haspopup': 'listbox' as const,
    'aria-controls': listboxId,
    'aria-activedescendant': activeId,
  }),

  listbox: () => ({
    role: 'listbox',
  }),

  option: (selected: boolean, disabled: boolean = false) => ({
    role: 'option',
    'aria-selected': selected,
    'aria-disabled': disabled,
  }),

  progressBar: (value: number, min: number = 0, max: number = 100) => ({
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuetext': `${Math.round((value / max) * 100)}%`,
  }),

  alert: () => ({
    role: 'alert',
    'aria-live': 'assertive' as const,
    'aria-atomic': true,
  }),

  status: () => ({
    role: 'status',
    'aria-live': 'polite' as const,
    'aria-atomic': true,
  }),

  button: (pressed?: boolean, expanded?: boolean) => ({
    role: 'button',
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
  }),

  switch: (checked: boolean) => ({
    role: 'switch',
    'aria-checked': checked,
  }),
};

// ============================================
// Focus Management
// ============================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter((el) => {
      // Check if element is visible
      const style = globalThis.window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('hidden')
      );
    });
}

/**
 * Trap focus within a container
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
}

/**
 * Restore focus to previous element
 */
export function createFocusRestore(): () => void {
  const previouslyFocused = document.activeElement as HTMLElement;
  return () => {
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}

// ============================================
// Keyboard Navigation
// ============================================

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Calculate next index when moving backward in a list
 */
function calculateBackwardIndex(
  currentIndex: number,
  itemsLength: number,
  loop: boolean
): number {
  const newIndex = currentIndex - 1;
  if (newIndex < 0) {
    return loop ? itemsLength - 1 : 0;
  }
  return newIndex;
}

/**
 * Calculate next index when moving forward in a list
 */
function calculateForwardIndex(
  currentIndex: number,
  itemsLength: number,
  loop: boolean
): number {
  const newIndex = currentIndex + 1;
  if (newIndex >= itemsLength) {
    return loop ? 0 : itemsLength - 1;
  }
  return newIndex;
}

/**
 * Handle vertical arrow key navigation
 */
function handleVerticalNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  loop: boolean
): number | null {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    return calculateBackwardIndex(currentIndex, items.length, loop);
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    return calculateForwardIndex(currentIndex, items.length, loop);
  }
  return null;
}

/**
 * Handle horizontal arrow key navigation
 */
function handleHorizontalNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  loop: boolean
): number | null {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    return calculateBackwardIndex(currentIndex, items.length, loop);
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    return calculateForwardIndex(currentIndex, items.length, loop);
  }
  return null;
}

/**
 * Handle special key navigation (Home/End)
 */
function handleSpecialKeys(
  e: KeyboardEvent,
  itemsLength: number
): number | null {
  if (e.key === 'Home') {
    e.preventDefault();
    return 0;
  }
  if (e.key === 'End') {
    e.preventDefault();
    return itemsLength - 1;
  }
  return null;
}

/**
 * Focus item at index if valid and different from current
 */
function focusItemIfValid(
  items: HTMLElement[],
  newIndex: number | null,
  currentIndex: number
): void {
  if (newIndex !== null && newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }
}

/**
 * Try navigation in a specific direction
 */
function tryNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  loop: boolean,
  navigationFn: (e: KeyboardEvent, items: HTMLElement[], currentIndex: number, loop: boolean) => number | null
): number | null {
  const newIndex = navigationFn(e, items, currentIndex, loop);
  if (newIndex !== null) {
    focusItemIfValid(items, newIndex, currentIndex);
    return newIndex;
  }
  return null;
}

/**
 * Handle arrow key navigation in a list
 */
export function handleArrowNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
): number {
  const { orientation = 'vertical', loop = true } = options;

  // Try special keys first
  const specialKeyIndex = handleSpecialKeys(e, items.length);
  if (specialKeyIndex !== null) {
    focusItemIfValid(items, specialKeyIndex, currentIndex);
    return specialKeyIndex;
  }

  // Try vertical navigation
  const isVertical = orientation === 'vertical' || orientation === 'both';
  if (isVertical) {
    const verticalIndex = tryNavigation(e, items, currentIndex, loop, handleVerticalNavigation);
    if (verticalIndex !== null) {
      return verticalIndex;
    }
  }

  // Try horizontal navigation
  const isHorizontal = orientation === 'horizontal' || orientation === 'both';
  if (isHorizontal) {
    const horizontalIndex = tryNavigation(e, items, currentIndex, loop, handleHorizontalNavigation);
    if (horizontalIndex !== null) {
      return horizontalIndex;
    }
  }

  return currentIndex;
}

// ============================================
// Color Contrast
// ============================================

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex
  const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const hexMatch = hexRegex.exec(color);
  if (hexMatch) {
    return {
      r: Number.parseInt(hexMatch[1], 16),
      g: Number.parseInt(hexMatch[2], 16),
      b: Number.parseInt(hexMatch[3], 16),
    };
  }

  // Handle rgb/rgba
  const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)/;
  const rgbMatch = rgbRegex.exec(color);
  if (rgbMatch) {
    return {
      r: Number.parseInt(rgbMatch[1], 10),
      g: Number.parseInt(rgbMatch[2], 10),
      b: Number.parseInt(rgbMatch[3], 10),
    };
  }

  return null;
}

/**
 * Calculate relative luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  if (!c1 || !c2) return 0;

  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements
 */
export function meetsContrastRequirement(
  ratio: number,
  size: 'normal' | 'large' = 'normal',
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const requirements = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 },
  };

  return ratio >= requirements[level][size];
}

// ============================================
// Touch Target Validation
// ============================================

/**
 * Check if element meets minimum touch target size (44x44px for WCAG 2.5.5)
 */
export function meetsMinimumTouchTarget(
  element: HTMLElement,
  minSize: number = 44
): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= minSize && rect.height >= minSize;
}

// ============================================
// Screen Reader Only Styles
// ============================================

export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
};

// ============================================
// Reduced Motion
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (globalThis.window === undefined) return false;
  return globalThis.window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get motion-safe duration (0 if reduced motion preferred)
 */
export function getMotionSafeDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

// ============================================
// High Contrast Mode
// ============================================

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (globalThis.window === undefined) return false;
  return (
    globalThis.window.matchMedia('(prefers-contrast: more)').matches ||
    globalThis.window.matchMedia('(forced-colors: active)').matches
  );
}

// ============================================
// A11y Audit (Development Only)
// ============================================

export function runA11yAudit(container: HTMLElement = document.body): A11yCheckResult {
  const issues: A11yIssue[] = [];
  const warnings: A11yIssue[] = [];

  // Check images for alt text
  container.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'missing-alt',
        element: img.outerHTML.slice(0, 100),
        message: 'Image missing alt attribute',
        wcagCriteria: '1.1.1',
        severity: 'error',
      });
    }
  });

  // Check buttons and links for accessible names
  container.querySelectorAll('button, a[href]').forEach((el) => {
    const hasText = el.textContent?.trim();
    const hasAriaLabel = el.hasAttribute('aria-label');
    const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');
    const hasTitle = el.hasAttribute('title');

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
      issues.push({
        type: 'missing-label',
        element: el.outerHTML.slice(0, 100),
        message: `${el.tagName.toLowerCase()} missing accessible name`,
        wcagCriteria: '4.1.2',
        severity: 'error',
      });
    }
  });

  // Check form inputs for labels
  container.querySelectorAll('input, select, textarea').forEach((input) => {
    const id = input.getAttribute('id');
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label');
    const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
    const isHidden = input.getAttribute('type') === 'hidden';

    if (!isHidden && !hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        type: 'missing-label',
        element: input.outerHTML.slice(0, 100),
        message: 'Form input missing associated label',
        wcagCriteria: '1.3.1',
        severity: 'error',
      });
    }
  });

  // Check for heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  headings.forEach((heading) => {
    const level = Number.parseInt(heading.tagName[1], 10);
    if (level > previousLevel + 1 && previousLevel > 0) {
      warnings.push({
        type: 'missing-heading',
        element: heading.outerHTML.slice(0, 100),
        message: `Skipped heading level: h${previousLevel} to h${level}`,
        wcagCriteria: '1.3.1',
        severity: 'warning',
      });
    }
    previousLevel = level;
  });

  // Check for landmark regions
  const hasMain = container.querySelector('main, [role="main"]');
  const hasNav = container.querySelector('nav, [role="navigation"]');

  if (!hasMain) {
    warnings.push({
      type: 'missing-landmark',
      element: 'document',
      message: 'Missing main landmark region',
      wcagCriteria: '1.3.1',
      severity: 'warning',
    });
  }

  if (!hasNav) {
    warnings.push({
      type: 'missing-landmark',
      element: 'document',
      message: 'Missing navigation landmark region',
      wcagCriteria: '1.3.1',
      severity: 'warning',
    });
  }

  // Check interactive elements for focus visibility
  container.querySelectorAll('button, a[href], input, select, textarea, [tabindex]').forEach((el) => {
    const style = globalThis.window.getComputedStyle(el);
    if (style.outlineStyle === 'none' && style.boxShadow === 'none') {
      warnings.push({
        type: 'missing-focus',
        element: el.outerHTML.slice(0, 100),
        message: 'Interactive element may lack visible focus indicator',
        wcagCriteria: '2.4.7',
        severity: 'warning',
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}
