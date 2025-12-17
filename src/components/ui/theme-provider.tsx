'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback, startTransition } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
  systemTheme: 'dark' | 'light';
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
  systemTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme
  const getSystemTheme = useCallback((): 'dark' | 'light' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Apply theme to document
  const applyTheme = useCallback(
    (newTheme: Theme) => {
      if (typeof document === 'undefined') return;

      const root = document.documentElement;
      const resolvedTheme = newTheme === 'system' ? getSystemTheme() : newTheme;

      // Disable transitions during theme change if requested
      if (disableTransitionOnChange) {
        root.classList.add('[&_*]:!transition-none');
        window.setTimeout(() => {
          root.classList.remove('[&_*]:!transition-none');
        }, 0);
      }

      // Apply theme attribute
      if (attribute === 'class') {
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
      } else {
        root.setAttribute(attribute, resolvedTheme);
      }

      // Update color-scheme for native elements
      root.style.colorScheme = resolvedTheme;
    },
    [attribute, disableTransitionOnChange, getSystemTheme]
  );

  // Initialize - Development mode: Don't read from localStorage
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
      setSystemTheme(getSystemTheme());

      // DEV MODE: Skip localStorage, always use defaultTheme for fresh CSS testing
      // To enable localStorage again, uncomment the block below:
      /*
      const savedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        applyTheme(defaultTheme);
      }
      */

      // Always apply default theme for consistent development experience
      applyTheme(defaultTheme);
    });
  }, [storageKey, defaultTheme, applyTheme, getSystemTheme]);

  // Watch system theme changes
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, enableSystem, applyTheme]);

  // Set theme function - DEV MODE: Don't save to localStorage
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      // DEV MODE: Skip localStorage save for fresh CSS testing
      // localStorage.setItem(storageKey, newTheme);
      applyTheme(newTheme);
    },
    [storageKey, applyTheme]
  );

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeProviderContext.Provider
        {...props}
        value={{
          theme: defaultTheme,
          setTheme: () => null,
          resolvedTheme: 'light',
          systemTheme: 'light',
        }}
      >
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={{
        theme,
        setTheme,
        resolvedTheme,
        systemTheme,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
