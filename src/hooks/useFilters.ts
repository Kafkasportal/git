'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface FilterValue {
  [key: string]: string | string[] | { from?: Date; to?: Date } | undefined;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValue;
}

export interface UseFiltersOptions {
  /** Initial filter values */
  initialFilters?: FilterValue;
  /** Whether to sync filters with URL params */
  syncWithUrl?: boolean;
  /** Storage key for presets */
  presetsKey?: string;
  /** Callback when filters change */
  onFiltersChange?: (filters: FilterValue) => void;
}

export function useFilters(options: UseFiltersOptions = {}) {
  const {
    initialFilters = {},
    syncWithUrl = false,
    presetsKey,
    onFiltersChange,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL or initial values
  const [filters, setFilters] = useState<FilterValue>(() => {
    if (syncWithUrl && typeof window !== 'undefined') {
      const urlFilters: FilterValue = {};
      searchParams.forEach((value, key) => {
        // Handle array values (comma-separated)
        if (value.includes(',')) {
          urlFilters[key] = value.split(',');
        } else {
          urlFilters[key] = value;
        }
      });
      return Object.keys(urlFilters).length > 0 ? urlFilters : initialFilters;
    }
    return initialFilters;
  });

  // Presets state
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    if (presetsKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`filter-presets-${presetsKey}`);
      if (stored != null) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter((key) => {
      const value = filters[key];
      if (value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const dateRange = value as { from?: Date; to?: Date };
        if (!dateRange.from && !dateRange.to) return false;
      }
      return true;
    }).length;
  }, [filters]);

  // Sync with URL
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        }
      } else if (typeof value === 'object' && (value.from || value.to)) {
        if (value.from) params.set(`${key}_from`, value.from.toISOString());
        if (value.to) params.set(`${key}_to`, value.to.toISOString());
      } else if (typeof value === 'string') {
        params.set(key, value);
      }
    });

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, syncWithUrl, pathname, router]);

  // Set a single filter
  const setFilter = useCallback((key: string, value: FilterValue[string]) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  // Set multiple filters at once
  const setMultipleFilters = useCallback((newFilters: FilterValue) => {
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters };
      // Remove undefined/empty values
      Object.keys(merged).forEach((key) => {
        const value = merged[key];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          delete merged[key];
        }
      });
      onFiltersChange?.(merged);
      return merged;
    });
  }, [onFiltersChange]);

  // Remove a filter
  const removeFilter = useCallback((key: string, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value !== undefined && Array.isArray(newFilters[key])) {
        const arr = newFilters[key] as string[];
        const filtered = arr.filter((v) => v !== value);
        if (filtered.length === 0) {
          delete newFilters[key];
        } else {
          newFilters[key] = filtered;
        }
      } else {
        delete newFilters[key];
      }
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    onFiltersChange?.(initialFilters);
  }, [initialFilters, onFiltersChange]);

  // Toggle a value in an array filter
  const toggleArrayFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const current = prev[key];
      const arr = Array.isArray(current) ? current : [];
      const newArr = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      
      const newFilters = { ...prev };
      if (newArr.length === 0) {
        delete newFilters[key];
      } else {
        newFilters[key] = newArr;
      }
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  // Save current filters as preset
  const savePreset = useCallback((name: string) => {
    if (!presetsKey) return;
    
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters: { ...filters },
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`filter-presets-${presetsKey}`, JSON.stringify(updatedPresets));
    }
    
    return newPreset;
  }, [filters, presets, presetsKey]);

  // Apply a preset
  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    onFiltersChange?.(preset.filters);
  }, [onFiltersChange]);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    if (!presetsKey) return;
    
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`filter-presets-${presetsKey}`, JSON.stringify(updatedPresets));
    }
  }, [presets, presetsKey]);

  // Check if a specific filter has a value
  const hasFilter = useCallback((key: string) => {
    const value = filters[key];
    if (value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }, [filters]);

  // Get filter value
  const getFilter = useCallback(<T = FilterValue[string]>(key: string): T | undefined => {
    return filters[key] as T;
  }, [filters]);

  return {
    // State
    filters,
    activeFilterCount,
    presets,
    
    // Actions
    setFilter,
    setFilters, // Direct setState for bulk updates
    setMultipleFilters,
    removeFilter,
    resetFilters,
    toggleArrayFilter,
    
    // FilterPanel compatible handler
    handleFiltersChange: (newFilters: Record<string, unknown>) => {
      setFilters(newFilters as FilterValue);
    },
    
    // Presets
    savePreset,
    applyPreset,
    deletePreset,
    
    // Helpers
    hasFilter,
    getFilter,
  };
}

export default useFilters;

