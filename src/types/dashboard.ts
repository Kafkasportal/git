/**
 * Dashboard Types
 */

export type WidgetType =
  | "stats"
  | "chart"
  | "table"
  | "activity"
  | "calendar"
  | "quick-actions"
  | "notifications"
  | "currency"
  | "custom";

export interface WidgetSize {
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  position: WidgetPosition;
  size: WidgetSize;
  settings?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

// Default widget configurations - Empty as per request
export const defaultWidgets: WidgetConfig[] = [];

// Widget type labels
export const widgetTypeLabels: Record<WidgetType, string> = {
  stats: "İstatistikler",
  chart: "Grafik",
  table: "Tablo",
  activity: "Aktivite",
  calendar: "Takvim",
  "quick-actions": "Hızlı İşlemler",
  notifications: "Bildirimler",
  currency: "Döviz",
  custom: "Özel",
};

// Convert widget config to react-grid-layout format
export function widgetToLayoutItem(widget: WidgetConfig) {
  // Safe fallbacks for corrupted data
  const position = widget.position || { x: 0, y: 0 };
  const size = widget.size || { w: 4, h: 3, minW: 2, minH: 2 };

  return {
    i: widget.id,
    x: position.x ?? 0,
    y: position.y ?? 0,
    w: size.w ?? 4,
    h: size.h ?? 3,
    minW: size.minW,
    minH: size.minH,
    maxW: size.maxW,
    maxH: size.maxH,
  };
}

// Convert react-grid-layout item to widget position/size
export function layoutItemToWidget(
  item: { i: string; x: number; y: number; w: number; h: number },
  existingWidget: WidgetConfig,
): WidgetConfig {
  return {
    ...existingWidget,
    position: { x: item.x, y: item.y },
    size: { ...existingWidget.size, w: item.w, h: item.h },
  };
}
