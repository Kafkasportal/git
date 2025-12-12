'use client';

import { ReactNode, useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LayoutGrid,
  Settings2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetConfig, DashboardLayout, widgetTypeLabels } from '@/types/dashboard';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
  widgets: WidgetConfig[];
  visibleWidgets: WidgetConfig[];
  layoutItems: Layout[];
  isEditMode: boolean;
  savedLayouts: DashboardLayout[];
  onLayoutChange: (layout: Layout[]) => void;
  onToggleWidget: (widgetId: string) => void;
  onResetLayout: () => void;
  onSaveLayout: (name: string) => void;
  onLoadLayout: (layoutId: string) => void;
  onDeleteLayout: (layoutId: string) => void;
  onEditModeChange: (editMode: boolean) => void;
  renderWidget: (widget: WidgetConfig) => ReactNode;
  cols?: number; // Kept for compatibility but we use responsive cols
  rowHeight?: number;
  containerPadding?: [number, number];
  margin?: [number, number];
  className?: string;
}

export function WidgetGrid({
  widgets,
  visibleWidgets,
  layoutItems,
  isEditMode,
  savedLayouts,
  onLayoutChange,
  onToggleWidget,
  onResetLayout,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onEditModeChange,
  renderWidget,
  cols = 12, // Default fallback
  rowHeight = 80,
  containerPadding = [0, 0],
  margin = [16, 16],
  className,
}: WidgetGridProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');

  const handleSaveLayout = useCallback(() => {
    if (layoutName.trim()) {
      onSaveLayout(layoutName.trim());
      setLayoutName('');
      setSaveDialogOpen(false);
    }
  }, [layoutName, onSaveLayout]);

  const hiddenWidgetsCount = widgets.filter((w) => !w.visible).length;

  // Create responsive layouts object - mapping the single layout to all breakpoints
  // This ensures the layout adapts but starts from the user's defined positions
  const layouts = useMemo(() => ({
    lg: layoutItems,
    md: layoutItems,
    sm: layoutItems,
    xs: layoutItems,
    xxs: layoutItems
  }), [layoutItems]);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          {isEditMode && (
            <Badge variant="secondary" className="gap-1 animate-pulse">
              <Settings2 className="h-3 w-3" />
              Düzenleme Modu
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {/* Widget Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Widgetlar</span>
                {hiddenWidgetsCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1">
                    {hiddenWidgetsCount}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Widget Görünürlüğü</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {widgets.map((widget) => (
                <DropdownMenuCheckboxItem
                  key={widget.id}
                  checked={widget.visible}
                  onCheckedChange={() => { onToggleWidget(widget.id); }}
                  className="gap-2"
                >
                  {widget.visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="flex-1">{widget.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {widgetTypeLabels[widget.type]}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Saved Layouts */}
          {savedLayouts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Şablonlar</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Kayıtlı Şablonlar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedLayouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm"
                  >
                    <button
                      onClick={() => { onLoadLayout(layout.id); }}
                      className="flex-1 text-left text-sm"
                    >
                      {layout.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { onDeleteLayout(layout.id); }}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Edit Mode Toggle */}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => { onEditModeChange(!isEditMode); }}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isEditMode ? 'Bitti' : 'Düzenle'}
            </span>
          </Button>

          {/* Actions when in edit mode */}
          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Kaydet</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onResetLayout}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Sıfırla</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Responsive Grid */}
      {visibleWidgets.length === 0 ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <div className="text-center text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Hiç widget görünür değil</p>
            <p className="text-sm mt-1">Widget eklemek için Widgetlar menüsünü kullanın</p>
          </div>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: cols, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={rowHeight}
          containerPadding={containerPadding}
          margin={margin}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={(layout) => { onLayoutChange(layout); }}
          draggableHandle=".drag-handle"
          useCSSTransforms={true}
          measureBeforeMount={false}
          compactType="vertical"
        >
          {visibleWidgets.map((widget) => (
            <div key={widget.id} className={cn(isEditMode && 'drag-handle touch-none')}>
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Düzeni Kaydet</DialogTitle>
            <DialogDescription>
              Mevcut dashboard düzenini kaydedin ve daha sonra tekrar kullanın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="layout-name">Şablon Adı</Label>
              <Input
                id="layout-name"
                placeholder="Örn: Ana Dashboard"
                value={layoutName}
                onChange={(e) => { setLayoutName(e.target.value); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaveDialogOpen(false); }}>
              İptal
            </Button>
            <Button onClick={handleSaveLayout} disabled={!layoutName.trim()}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WidgetGrid;
