"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  WidgetConfig,
  DashboardLayout,
  defaultWidgets,
  widgetToLayoutItem,
  layoutItemToWidget,
} from "@/types/dashboard";

export interface UseDashboardLayoutOptions {
  storageKey?: string;
  defaultLayout?: WidgetConfig[];
  onLayoutChange?: (layout: WidgetConfig[]) => void;
}

export function useDashboardLayout(options: UseDashboardLayoutOptions = {}) {
  const {
    storageKey = "dashboard-layout",
    defaultLayout = defaultWidgets,
    onLayoutChange,
  } = options;

  // Initialize widgets from localStorage or defaults
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    if (typeof window === "undefined") return defaultLayout;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WidgetConfig[];
        // Merge with defaults to handle new widgets
        const mergedWidgets = defaultLayout.map((defaultWidget) => {
          const storedWidget = parsed.find((w) => w.id === defaultWidget.id);
          if (storedWidget) {
            return {
              ...defaultWidget,
              visible: storedWidget.visible,
              position: storedWidget.position,
              size: { ...defaultWidget.size, ...storedWidget.size },
              settings: storedWidget.settings,
            };
          }
          return defaultWidget;
        });
        return mergedWidgets;
      } catch {
        return defaultLayout;
      }
    }
    return defaultLayout;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  // Initialize savedLayouts from localStorage to avoid setState in effect
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`${storageKey}-saved`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save to localStorage when widgets change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
      onLayoutChange?.(widgets);
    }
  }, [widgets, storageKey, onLayoutChange]);

  // Note: savedLayouts is now initialized from localStorage in useState

  // Visible widgets only (with validation)
  const visibleWidgets = useMemo(() => {
    return widgets.filter(
      (w) => w && w.id && w.visible && w.position && w.size,
    );
  }, [widgets]);

  // Convert to react-grid-layout format
  const layoutItems = useMemo(() => {
    return visibleWidgets.map(widgetToLayoutItem);
  }, [visibleWidgets]);

  // Update widget positions from layout change
  const handleLayoutChange = useCallback(
    (
      newLayout: Array<{
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>,
    ) => {
      setWidgets((prev) => {
        return prev.map((widget) => {
          const layoutItem = newLayout.find((item) => item.i === widget.id);
          if (layoutItem) {
            return layoutItemToWidget(layoutItem, widget);
          }
          return widget;
        });
      });
    },
    [],
  );

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w)),
    );
  }, []);

  // Set widget visibility
  const setWidgetVisible = useCallback((widgetId: string, visible: boolean) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, visible } : w)),
    );
  }, []);

  // Update widget settings
  const updateWidgetSettings = useCallback(
    (widgetId: string, settings: Record<string, unknown>) => {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === widgetId
            ? { ...w, settings: { ...w.settings, ...settings } }
            : w,
        ),
      );
    },
    [],
  );

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setWidgets(defaultLayout);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [defaultLayout, storageKey]);

  // Save current layout as preset
  const saveLayout = useCallback(
    (name: string) => {
      const newLayout: DashboardLayout = {
        id: `layout-${Date.now()}`,
        name,
        widgets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedLayouts = [...savedLayouts, newLayout];
      setSavedLayouts(updatedLayouts);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `${storageKey}-saved`,
          JSON.stringify(updatedLayouts),
        );
      }

      return newLayout;
    },
    [widgets, savedLayouts, storageKey],
  );

  // Load a saved layout
  const loadLayout = useCallback(
    (layoutId: string) => {
      const layout = savedLayouts.find((l) => l.id === layoutId);
      if (layout) {
        setWidgets(layout.widgets);
      }
    },
    [savedLayouts],
  );

  // Delete a saved layout
  const deleteLayout = useCallback(
    (layoutId: string) => {
      const updatedLayouts = savedLayouts.filter((l) => l.id !== layoutId);
      setSavedLayouts(updatedLayouts);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `${storageKey}-saved`,
          JSON.stringify(updatedLayouts),
        );
      }
    },
    [savedLayouts, storageKey],
  );

  // Get widget by id
  const getWidget = useCallback(
    (widgetId: string) => widgets.find((w) => w.id === widgetId),
    [widgets],
  );

  return {
    // State
    widgets,
    visibleWidgets,
    layoutItems,
    isEditMode,
    savedLayouts,

    // Actions
    setIsEditMode,
    handleLayoutChange,
    toggleWidget,
    setWidgetVisible,
    updateWidgetSettings,
    resetLayout,
    saveLayout,
    loadLayout,
    deleteLayout,

    // Helpers
    getWidget,
  };
}

export default useDashboardLayout;
