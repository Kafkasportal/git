'use client';

/**
 * Settings Context
 * Provides global access to system settings throughout the application
 * Handles theme, branding, and configuration management
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import logger from '@/lib/logger';

// Setting value types
export type SettingValue = string | number | boolean | object | null;

// Settings grouped by category
export interface CategorySettings {
  [key: string]: SettingValue;
}

export interface AllSettings {
  [category: string]: CategorySettings;
}

// Theme configuration
export interface ThemeColors {
  primary: string;
  primaryHover?: string;
  primaryActive?: string;
  secondary?: string;
  secondaryHover?: string;
  accent?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  background?: string;
  backgroundSecondary?: string;
  backgroundTertiary?: string;
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  border?: string;
  borderHover?: string;
  sidebarBg?: string;
  sidebarText?: string;
  sidebarActive?: string;
}

export interface ThemeTypography {
  fontFamily?: string;
  baseSize?: number;
  headingScale?: number;
  lineHeight?: number;
  fontWeightRegular?: number;
  fontWeightMedium?: number;
  fontWeightBold?: number;
}

export interface ThemeLayout {
  sidebarWidth?: number;
  containerMaxWidth?: number;
  borderRadius?: number;
  spacingScale?: 'tight' | 'normal' | 'relaxed';
  cardElevation?: 'flat' | 'subtle' | 'medium' | 'high';
}

export interface ThemePreset {
  _id?: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography?: ThemeTypography;
  layout?: ThemeLayout;
  isDefault?: boolean;
  isCustom?: boolean;
}

// Settings Context interface
export interface SettingsContextValue {
  // All settings
  settings: AllSettings;
  isLoading: boolean;

  // Get setting by category and key
  getSetting: (category: string, key: string, defaultValue?: SettingValue) => SettingValue;

  // Theme
  currentTheme: ThemePreset | null;
  themePresets: ThemePreset[];
  setTheme: (themeName: string) => Promise<void>;

  // Theme mode (light/dark/auto)
  themeMode: 'light' | 'dark' | 'auto';
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  resolvedThemeMode: 'light' | 'dark'; // actual computed mode

  // Refresh settings
  refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset | null>(null);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'auto'>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode');
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        return saved;
      }
    }
    return 'light';
  });
  const [resolvedThemeMode, setResolvedThemeMode] = useState<'light' | 'dark'>('light');

  // Fetch all settings from Appwrite API
  const { data: allSettingsData } = useQuery({
    queryKey: ['settings', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/settings/all');
      const json = await response.json();
      return json.data || {};
    },
  });

  const { data: themePresetsData } = useQuery({
    queryKey: ['theme-presets'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/theme-presets');
        const json = await response.json();
        return json.data || [];
      } catch (error) {
        logger.error('Failed to fetch theme presets', error);
        toast.error('Tema ayarları yüklenemedi');
        return [];
      }
    },
  });

  const { data: defaultThemeData } = useQuery({
    queryKey: ['theme-presets', 'default'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/theme-presets/default');
        const json = await response.json();
        return json.data || null;
      } catch (error) {
        logger.error('Failed to fetch default theme', error);
        toast.error('Varsayılan tema yüklenemedi');
        return null;
      }
    },
  });

  const allSettings = allSettingsData;
  const themePresets = themePresetsData ?? [];
  const defaultTheme = defaultThemeData;

  const isLoading = allSettings === undefined || themePresets === undefined;

  // Settings derived from API query
  const settings = (allSettings ?? {}) as AllSettings;

  // Set initial theme when defaultTheme loads
  useEffect(() => {
    if (defaultTheme && !currentTheme) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setCurrentTheme(defaultTheme as ThemePreset);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [defaultTheme, currentTheme]);

  // Resolve auto theme mode
  useEffect(() => {
    if (themeMode === 'auto') {
      // Listen to system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        setResolvedThemeMode(e.matches ? 'dark' : 'light');
      };

      handleChange(mediaQuery);
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setResolvedThemeMode(themeMode);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [themeMode]);

  // Apply theme to document
  useEffect(() => {
    if (!currentTheme) return;

    const root = document.documentElement;

    // Apply colors
    if (currentTheme.colors) {
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        if (value) {
          const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVar, value);
        }
      });
    }

    // Apply typography
    if (currentTheme.typography) {
      const typo = currentTheme.typography;
      if (typo.fontFamily) root.style.setProperty('--font-family', typo.fontFamily);
      if (typo.baseSize) root.style.setProperty('--font-base-size', `${typo.baseSize}px`);
      if (typo.headingScale)
        root.style.setProperty('--font-heading-scale', typo.headingScale.toString());
      if (typo.lineHeight) root.style.setProperty('--line-height', typo.lineHeight.toString());
    }

    // Apply layout
    if (currentTheme.layout) {
      const layout = currentTheme.layout;
      if (layout.sidebarWidth)
        root.style.setProperty('--sidebar-width', `${layout.sidebarWidth}px`);
      if (layout.containerMaxWidth)
        root.style.setProperty('--container-max-width', `${layout.containerMaxWidth}px`);
      if (layout.borderRadius)
        root.style.setProperty('--border-radius', `${layout.borderRadius}px`);
    }

    // Apply theme mode class
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedThemeMode);
  }, [currentTheme, resolvedThemeMode]);

  // Get setting helper
  const getSetting = useCallback(
    (category: string, key: string, defaultValue: SettingValue = null): SettingValue => {
      return settings[category]?.[key] ?? defaultValue;
    },
    [settings]
  );

  // Set theme
  const setTheme = useCallback(
    async (themeName: string) => {
      const theme = themePresets.find((t) => t.name === themeName);
      if (theme) {
        // Theme data from API is already in the correct format
        setCurrentTheme(theme);
        localStorage.setItem('selected-theme', themeName);
      }
    },
    [themePresets]
  );

  // Set theme mode
  const setThemeMode = useCallback((mode: 'light' | 'dark' | 'auto') => {
    setThemeModeState(mode);
    localStorage.setItem('theme-mode', mode);
  }, []);

  // Refresh settings
  const refreshSettings = useCallback(() => {
    // React Query automatically refetches on data changes
    // This function is kept for API compatibility but is a no-op
  }, []);

  const value: SettingsContextValue = {
    settings,
    isLoading,
    getSetting,
    currentTheme,
    themePresets: themePresets as ThemePreset[],
    setTheme,
    themeMode,
    setThemeMode,
    resolvedThemeMode,
    refreshSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// Hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Convenience hooks
export function useSetting(category: string, key: string, defaultValue?: SettingValue) {
  const { getSetting } = useSettings();
  return getSetting(category, key, defaultValue);
}

export function useTheme() {
  const { currentTheme, themePresets, setTheme, themeMode, setThemeMode, resolvedThemeMode } =
    useSettings();
  return { currentTheme, themePresets, setTheme, themeMode, setThemeMode, resolvedThemeMode };
}
