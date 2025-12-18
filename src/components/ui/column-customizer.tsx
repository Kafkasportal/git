'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Columns3,
  GripVertical,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  required?: boolean;
  defaultVisible?: boolean;
}

interface ColumnCustomizerProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onReset?: () => void;
  maxVisibleColumns?: number;
}

/**
 * Column customizer component for data tables
 * Allows users to show/hide and reorder columns
 */
export function ColumnCustomizer({
  columns,
  onColumnsChange,
  onReset,
  maxVisibleColumns,
}: ColumnCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const visibleCount = columns.filter((c) => c.visible).length;
  const canAddMore = !maxVisibleColumns || visibleCount < maxVisibleColumns;

  const handleToggleColumn = useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      // Don't allow hiding required columns
      if (column.required && column.visible) return;

      // Check max visible columns
      if (!column.visible && !canAddMore) return;

      const updatedColumns = columns.map((c) =>
        c.id === columnId ? { ...c, visible: !c.visible } : c
      );
      onColumnsChange(updatedColumns);
    },
    [columns, onColumnsChange, canAddMore]
  );

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetId) return;

    const draggedIndex = columns.findIndex((c) => c.id === draggedColumn);
    const targetIndex = columns.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);

    // Update order property
    const reorderedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index,
    }));

    onColumnsChange(reorderedColumns);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const handleShowAll = () => {
    const updatedColumns = columns.map((c) => ({
      ...c,
      visible: true,
    }));
    onColumnsChange(updatedColumns);
  };

  // Hide optional columns - available for future use in extended UI
  // Uncomment when needed:
  // const handleHideOptional = () => {
  //   const updatedColumns = columns.map((c) => ({
  //     ...c,
  //     visible: c.required || c.defaultVisible !== false,
  //   }));
  //   onColumnsChange(updatedColumns);
  // };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Columns3 className="h-4 w-4" />
          Sütunlar
          <span className="hidden inline text-muted-foreground">
            ({visibleCount}/{columns.length})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="text-sm font-medium">Sütun Görünürlüğü</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              className="h-7 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Tümü
            </Button>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Sıfırla
              </Button>
            )}
          </div>
        </div>

        {/* Column List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {columns
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <div
                key={column.id}
                draggable={!column.required}
                onDragStart={() => handleDragStart(column.id)}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md transition-colors',
                  draggedColumn === column.id && 'bg-primary/10',
                  !column.required && 'cursor-grab active:cursor-grabbing',
                  'hover:bg-muted/50'
                )}
              >
                {!column.required && (
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                {column.required && <div className="w-4" />}
                
                <Checkbox
                  id={`col-${column.id}`}
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                  disabled={column.required && column.visible}
                />
                
                <Label
                  htmlFor={`col-${column.id}`}
                  className={cn(
                    'flex-1 text-sm cursor-pointer',
                    !column.visible && 'text-muted-foreground'
                  )}
                >
                  {column.label}
                  {column.required && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (zorunlu)
                    </span>
                  )}
                </Label>

                {column.visible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
        {maxVisibleColumns && (
          <div className="p-3 border-t text-xs text-muted-foreground">
            Maksimum {maxVisibleColumns} sütun gösterilebilir
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Simple column visibility dropdown (alternative to full customizer)
 */
interface SimpleColumnToggleProps {
  columns: Array<{ id: string; label: string; visible: boolean }>;
  onToggle: (columnId: string) => void;
}

export function SimpleColumnToggle({ columns, onToggle }: SimpleColumnToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Columns3 className="h-4 w-4" />
          <span className="hidden inline">Sütunlar</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Görünür Sütunlar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.visible}
            onCheckedChange={() => onToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

