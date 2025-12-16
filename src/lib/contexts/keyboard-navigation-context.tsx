'use client';

import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
  global?: boolean;
}

interface KeyboardNavigationContextType {
  shortcuts: Map<string, Shortcut>;
  registerShortcut: (id: string, shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | null>(null);

interface KeyboardNavigationProviderProps {
  readonly children: ReactNode;
  readonly enabled?: boolean;
}

export function KeyboardNavigationProvider({
  children,
  enabled: initialEnabled = true
}: KeyboardNavigationProviderProps) {
  const router = useRouter();
  const [shortcuts, setShortcuts] = useState<Map<string, Shortcut>>(new Map());
  const [isEnabled, setEnabled] = useState(initialEnabled);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Default global shortcuts - memoized
  const defaultShortcuts = useMemo((): [string, Shortcut][] => [
    ['global-help', {
      key: '?',
      description: 'Klavye kısayollarını göster',
      action: () => setIsHelpOpen(true),
      category: 'Genel',
      global: true,
    }],
    ['global-home', {
      key: 'h',
      alt: true,
      description: 'Ana sayfaya git',
      action: () => router.push('/genel'),
      category: 'Navigasyon',
      global: true,
    }],
    ['global-search', {
      key: 'k',
      ctrl: true,
      description: 'Global arama',
      action: () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
        globalThis.window.dispatchEvent(event);
      },
      category: 'Genel',
      global: true,
    }],
    ['global-escape', {
      key: 'Escape',
      description: 'Kapat / İptal',
      action: () => setIsHelpOpen(false),
      category: 'Genel',
      global: true,
    }],
  ], [router]);

  // Register default global shortcuts
  useEffect(() => {
    startTransition(() => {
      setShortcuts(new Map(defaultShortcuts));
    });
  }, [defaultShortcuts]);

  const registerShortcut = useCallback((id: string, shortcut: Shortcut) => {
    setShortcuts(prev => {
      const next = new Map(prev);
      next.set(id, shortcut);
      return next;
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  // Global keyboard event handler
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Check each shortcut
      for (const [, shortcut] of shortcuts) {
        // Skip non-global shortcuts when in editable
        if (isEditable && !shortcut.global && shortcut.key !== 'Escape') {
          continue;
        }

        // Safety check for event.key and shortcut.key - ensure they are strings
        if (!event.key || typeof event.key !== 'string' || !shortcut.key || typeof shortcut.key !== 'string') {
          continue;
        }

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);
    return () => globalThis.window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, shortcuts]);

  const contextValue = useMemo(
    () => ({
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      isEnabled,
      setEnabled,
      showHelp,
      hideHelp,
      isHelpOpen,
    }),
    [shortcuts, registerShortcut, unregisterShortcut, isEnabled, setEnabled, showHelp, hideHelp, isHelpOpen]
  );

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardNavigationProvider');
  }
  return context;
}

/**
 * Hook for registering page-specific shortcuts
 */
export function useRegisterShortcut(
  id: string,
  shortcut: Omit<Shortcut, 'action'> & { action: () => void },
  deps: React.DependencyList = []
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut(id, shortcut);
    return () => unregisterShortcut(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, registerShortcut, unregisterShortcut, ...deps]);
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(shortcut: Shortcut): string {
  const keys: string[] = [];

  if (shortcut.ctrl) keys.push('Ctrl');
  if (shortcut.alt) keys.push('Alt');
  if (shortcut.shift) keys.push('Shift');

  const keyDisplay = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key;
  keys.push(keyDisplay);

  return keys.join(' + ');
}
