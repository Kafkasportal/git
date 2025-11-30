'use client';

import { useState, useCallback } from 'react';
import { Settings2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface ColumnDef {
  key: string;
  label: string;
  visible?: boolean;
}

interface ColumnVisibilityToggleProps {
  columns: ColumnDef[];
  onVisibilityChange: (visibleColumns: Record<string, boolean>) => void;
  className?: string;
}

export function ColumnVisibilityToggle({
  columns,
  onVisibilityChange,
  className,
}: ColumnVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.key] = col.visible !== false;
        return acc;
      },
      {} as Record<string, boolean>
    );
  });

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = columns.length;

  const handleToggleColumn = useCallback(
    (key: string) => {
      setVisibility((prev) => {
        const newVisibility = { ...prev, [key]: !prev[key] };
        onVisibilityChange(newVisibility);
        return newVisibility;
      });
    },
    [onVisibilityChange]
  );

  const handleToggleAll = useCallback(() => {
    const allVisible = visibleCount === totalCount;
    const newVisibility = columns.reduce(
      (acc, col) => {
        acc[col.key] = !allVisible;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setVisibility(newVisibility);
    onVisibilityChange(newVisibility);
  }, [columns, visibleCount, totalCount, onVisibilityChange]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 h-9', className)}
          aria-label="Toggle column visibility"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">
            Sütunlar ({visibleCount}/{totalCount})
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">Sütun Görünürlüğü</h3>
            <button
              onClick={handleToggleAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {visibleCount === totalCount ? 'Tümünü gizle' : 'Tümünü göster'}
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {columns.map((column) => (
              <div
                key={column.key}
                className="flex items-center gap-2 py-2 px-0.5 hover:bg-slate-50/50 rounded transition-colors"
              >
                <Checkbox
                  id={`col-${column.key}`}
                  checked={visibility[column.key] ?? true}
                  onCheckedChange={() => handleToggleColumn(column.key)}
                  className="cursor-pointer"
                />
                <label
                  htmlFor={`col-${column.key}`}
                  className="flex-1 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {(visibility[column.key] ?? true) ? (
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-slate-400 opacity-50" />
                    )}
                    {column.label}
                  </div>
                </label>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            En az bir sütun görünür olmalıdır
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
