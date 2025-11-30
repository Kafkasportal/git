'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  required?: boolean;
  defaultVisible?: boolean;
  width?: number;
}

export interface UseColumnPreferencesOptions {
  /** Unique key for storing preferences */
  storageKey: string;
  /** Default column configuration */
  defaultColumns: ColumnConfig[];
  /** Max visible columns (optional) */
  maxVisibleColumns?: number;
}

export function useColumnPreferences(options: UseColumnPreferencesOptions) {
  const { storageKey, defaultColumns, maxVisibleColumns } = options;

  // Initialize columns from localStorage or defaults
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window === 'undefined') return defaultColumns;

    const stored = localStorage.getItem(`column-prefs-${storageKey}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ColumnConfig[];
        // Merge with defaults to handle new columns
        const mergedColumns = defaultColumns.map((defaultCol) => {
          const storedCol = parsed.find((c) => c.id === defaultCol.id);
          if (storedCol) {
            return {
              ...defaultCol,
              visible: storedCol.visible,
              order: storedCol.order,
              width: storedCol.width,
            };
          }
          return defaultCol;
        });
        return mergedColumns.sort((a, b) => a.order - b.order);
      } catch {
        return defaultColumns;
      }
    }
    return defaultColumns;
  });

  // Save to localStorage when columns change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `column-prefs-${storageKey}`,
        JSON.stringify(columns)
      );
    }
  }, [columns, storageKey]);

  // Visible columns only
  const visibleColumns = useMemo(() => {
    return columns
      .filter((c) => c.visible)
      .sort((a, b) => a.order - b.order);
  }, [columns]);

  // Toggle column visibility
  const toggleColumn = useCallback(
    (columnId: string) => {
      setColumns((prev) => {
        const column = prev.find((c) => c.id === columnId);
        if (!column) return prev;

        // Don't hide required columns
        if (column.required && column.visible) return prev;

        // Check max visible
        const currentVisible = prev.filter((c) => c.visible).length;
        if (!column.visible && maxVisibleColumns && currentVisible >= maxVisibleColumns) {
          return prev;
        }

        return prev.map((c) =>
          c.id === columnId ? { ...c, visible: !c.visible } : c
        );
      });
    },
    [maxVisibleColumns]
  );

  // Set column visibility
  const setColumnVisible = useCallback(
    (columnId: string, visible: boolean) => {
      setColumns((prev) => {
        const column = prev.find((c) => c.id === columnId);
        if (!column) return prev;

        // Don't hide required columns
        if (column.required && !visible) return prev;

        return prev.map((c) =>
          c.id === columnId ? { ...c, visible } : c
        );
      });
    },
    []
  );

  // Reorder columns
  const reorderColumns = useCallback((newOrder: string[]) => {
    setColumns((prev) => {
      return prev.map((col) => ({
        ...col,
        order: newOrder.indexOf(col.id),
      })).sort((a, b) => a.order - b.order);
    });
  }, []);

  // Move column
  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumns((prev) => {
      const newColumns = [...prev];
      const [removed] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, removed);
      return newColumns.map((col, index) => ({
        ...col,
        order: index,
      }));
    });
  }, []);

  // Set column width
  const setColumnWidth = useCallback((columnId: string, width: number) => {
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId ? { ...c, width } : c
      )
    );
  }, []);

  // Show all columns
  const showAllColumns = useCallback(() => {
    setColumns((prev) =>
      prev.map((c) => ({ ...c, visible: true }))
    );
  }, []);

  // Hide all optional columns
  const hideOptionalColumns = useCallback(() => {
    setColumns((prev) =>
      prev.map((c) => ({
        ...c,
        visible: c.required || c.defaultVisible !== false,
      }))
    );
  }, []);

  // Reset to defaults
  const resetColumns = useCallback(() => {
    setColumns(defaultColumns);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`column-prefs-${storageKey}`);
    }
  }, [defaultColumns, storageKey]);

  // Update columns (for full control)
  const updateColumns = useCallback((newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
  }, []);

  // Get column by id
  const getColumn = useCallback(
    (columnId: string) => columns.find((c) => c.id === columnId),
    [columns]
  );

  // Check if column is visible
  const isColumnVisible = useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      return column?.visible ?? false;
    },
    [columns]
  );

  return {
    // State
    columns,
    visibleColumns,
    visibleColumnCount: visibleColumns.length,
    totalColumnCount: columns.length,
    
    // Actions
    toggleColumn,
    setColumnVisible,
    reorderColumns,
    moveColumn,
    setColumnWidth,
    showAllColumns,
    hideOptionalColumns,
    resetColumns,
    updateColumns,
    
    // Helpers
    getColumn,
    isColumnVisible,
  };
}

export default useColumnPreferences;

