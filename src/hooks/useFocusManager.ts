'use client';

import { useCallback, useRef, useEffect } from 'react';

interface FocusManagerOptions {
  /** Container ref that contains focusable elements */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Enable/disable focus management */
  enabled?: boolean;
  /** Trap focus within container */
  trapFocus?: boolean;
  /** Auto focus first element on mount */
  autoFocus?: boolean;
  /** Restore focus on unmount */
  restoreFocus?: boolean;
  /** Loop focus at boundaries */
  loop?: boolean;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled]):not([tabindex="-1"])',
  'a[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Hook for managing focus within a container
 * Useful for modals, dropdowns, and keyboard navigation
 */
export function useFocusManager({
  containerRef,
  enabled = true,
  trapFocus = false,
  autoFocus = false,
  restoreFocus = true,
  loop = true,
}: FocusManagerOptions) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, [containerRef]);

  // Focus first element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus last element
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Focus next element
  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    
    if (currentIndex === -1) {
      focusFirst();
    } else if (currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    } else if (loop) {
      focusFirst();
    }
  }, [getFocusableElements, focusFirst, loop]);

  // Focus previous element
  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    
    if (currentIndex === -1) {
      focusLast();
    } else if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
    } else if (loop) {
      focusLast();
    }
  }, [getFocusableElements, focusLast, loop]);

  // Focus by index
  const focusByIndex = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (index >= 0 && index < elements.length) {
      elements[index].focus();
    }
  }, [getFocusableElements]);

  // Handle focus trap
  useEffect(() => {
    if (!enabled || !trapFocus || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, trapFocus, containerRef, getFocusableElements]);

  // Auto focus on mount
  useEffect(() => {
    if (!enabled || !autoFocus) return;

    // Save previously focused element
    if (restoreFocus) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
    }

    // Focus first element after a small delay
    const timer = setTimeout(() => {
      focusFirst();
    }, 0);

    return () => clearTimeout(timer);
  }, [enabled, autoFocus, restoreFocus, focusFirst]);

  // Restore focus on unmount
  useEffect(() => {
    if (!restoreFocus) return;

    return () => {
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [restoreFocus]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusByIndex,
    getFocusableElements,
  };
}

/**
 * Hook for arrow key navigation in lists
 */
export function useArrowNavigation({
  containerRef,
  enabled = true,
  orientation = 'vertical',
  loop = true,
  onSelect,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  orientation?: 'vertical' | 'horizontal' | 'both';
  loop?: boolean;
  onSelect?: (element: HTMLElement) => void;
}) {
  const { focusNext, focusPrevious, focusFirst, focusLast } = useFocusManager({
    containerRef,
    enabled,
    loop,
  });

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const verticalKeys = ['ArrowUp', 'ArrowDown'];
      const horizontalKeys = ['ArrowLeft', 'ArrowRight'];
      
      let allowedKeys: string[] = [];
      if (orientation === 'vertical') allowedKeys = verticalKeys;
      else if (orientation === 'horizontal') allowedKeys = horizontalKeys;
      else allowedKeys = [...verticalKeys, ...horizontalKeys];

      if (!allowedKeys.includes(event.key)) return;

      // Check if focus is within container
      if (!containerRef.current?.contains(document.activeElement)) return;

      event.preventDefault();

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          focusPrevious();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          focusNext();
          break;
        case 'Home':
          focusFirst();
          break;
        case 'End':
          focusLast();
          break;
      }
    };

    const handleSelect = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (containerRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          onSelect?.(document.activeElement as HTMLElement);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (onSelect) {
      document.addEventListener('keydown', handleSelect);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (onSelect) {
        document.removeEventListener('keydown', handleSelect);
      }
    };
  }, [enabled, containerRef, orientation, focusNext, focusPrevious, focusFirst, focusLast, onSelect]);
}

// SkipLink component is exported from @/components/ui/skip-link
