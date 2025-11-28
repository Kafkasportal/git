/**
 * Keyboard Navigation Hook
 * Provides keyboard shortcuts and navigation patterns for improved accessibility
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onCtrlEnter?: () => void;
  onCtrlS?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 * @param options - Configuration object with keyboard event handlers
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onCtrlEnter,
    onCtrlS,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Prevent default for special shortcuts
      const isTextInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable;

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
          // Don't trigger on text areas unless Ctrl is pressed
          if (event.ctrlKey || event.metaKey) {
            if (onCtrlEnter) {
              event.preventDefault();
              onCtrlEnter();
            }
          } else if (!isTextInput || (event.target as HTMLElement).tagName !== 'TEXTAREA') {
            if (onEnter) {
              event.preventDefault();
              onEnter();
            }
          }
          break;

        case 'ArrowUp':
          if (!isTextInput && onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;

        case 'ArrowDown':
          if (!isTextInput && onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;

        case 'ArrowLeft':
          if (!isTextInput && onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;

        case 'ArrowRight':
          if (!isTextInput && onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;

        case 's':
        case 'S':
          if ((event.ctrlKey || event.metaKey) && onCtrlS) {
            event.preventDefault();
            onCtrlS();
          }
          break;
      }
    },
    [
      enabled,
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onCtrlEnter,
      onCtrlS,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for managing focus trap (useful for modals and dialogs)
 * @param containerRef - Reference to the container element
 * @param enabled - Whether the focus trap is active
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, enabled]);
}
