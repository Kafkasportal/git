'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { Moon, Sun } from 'lucide-react';
import logger from '@/lib/logger';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  defaultTheme?: Theme;
  className?: string;
}

export function ThemeSwitcher({ defaultTheme = 'system', className }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Detect system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Initialize theme
  // Apply theme to document
  const applyTheme = useCallback(
    (newTheme: Theme) => {
      // Safely access document element
      if (typeof document === 'undefined') return;

      const html = document.documentElement;
      if (!html) return;

      let effectiveTheme = newTheme;

      // Validate theme value to prevent XSS
      if (!['light', 'dark', 'system'].includes(newTheme)) {
        logger.warn('Invalid theme value', { theme: newTheme });
        return;
      }

      if (newTheme === 'system') {
        effectiveTheme = getSystemTheme();
      }

      if (effectiveTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      // Save preference
      localStorage.setItem('theme', newTheme);
    },
    [getSystemTheme]
  );

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Load saved theme
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      startTransition(() => setTheme(saved));
      applyTheme(saved);
    } else {
      const system = getSystemTheme();
      applyTheme(system);
    }
  }, [mounted, getSystemTheme, applyTheme]);

  // Handle theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  }, [theme, applyTheme]);

  // Watch for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center p-2 rounded-lg',
        'transition-all duration-200',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'text-slate-600 dark:text-slate-400',
        'active:scale-95',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`${isDark ? 'Light' : 'Dark'} mode`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

/**
 * CSS for dark mode support
 * Add this to your globals.css or tailwind config:
 *
 * @media (prefers-color-scheme: dark) {
 *   :root {
 *     color-scheme: dark;
 *   }
 * }
 *
 * html.dark {
 *   color-scheme: dark;
 * }
 *
 * html.light {
 *   color-scheme: light;
 * }
 */
