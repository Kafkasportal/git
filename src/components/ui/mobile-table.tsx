'use client';

import { ReactNode, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export interface MobileColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  priority?: 'high' | 'medium' | 'low';
  width?: string;
}

export interface MobileTableAction<T = Record<string, unknown>> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive';
}

interface MobileTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: MobileColumn<T>[];
  keyField: keyof T;
  actions?: MobileTableAction<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc'; // Currently used for display only, actual sorting handled by onSort
  onSort?: (key: string) => void;
  className?: string;
}

export function MobileTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  actions,
  onRowClick,
  isLoading,
  emptyMessage = 'Veri bulunamadı',
  emptyAction,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  sortBy,
  sortOrder: _sortOrder,
  onSort,
  className,
}: MobileTableProps<T>) {
  const { isMobile, isTablet } = useDeviceDetection();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter columns by priority for mobile view
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      return columns.filter((col) => col.priority === 'high');
    }
    if (isTablet) {
      return columns.filter((col) => col.priority !== 'low');
    }
    return columns;
  }, [columns, isMobile, isTablet]);

  const hiddenColumns = useMemo(() => {
    if (isMobile) {
      return columns.filter((col) => col.priority !== 'high');
    }
    if (isTablet) {
      return columns.filter((col) => col.priority === 'low');
    }
    return [];
  }, [columns, isMobile, isTablet]);

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map((row) => String(row[keyField])));
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange?.(newSelected);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted/50 rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {data.map((row) => {
          const id = String(row[keyField]);
          const isExpanded = expandedRows.has(id);
          const isSelected = selectedIds.has(id);

          return (
            <Card
              key={id}
              className={cn(
                'overflow-hidden transition-all',
                isSelected && 'ring-2 ring-primary',
                onRowClick && 'cursor-pointer hover:shadow-md'
              )}
            >
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start gap-3">
                  {selectable && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(id, !!checked)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((col, i) => (
                      <div
                        key={String(col.key)}
                        className={cn(
                          i === 0 ? 'font-medium text-base' : 'text-sm text-muted-foreground mt-1'
                        )}
                      >
                        {col.render
                          ? col.render(row[col.key as keyof T], row)
                          : String(row[col.key as keyof T] ?? '-')}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {hiddenColumns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpand(id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {actions && actions.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, i) => (
                            <DropdownMenuItem
                              key={i}
                              onClick={() => action.onClick(row)}
                              className={cn(
                                'gap-2',
                                action.variant === 'destructive' && 'text-destructive'
                              )}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hiddenColumns.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {hiddenColumns.map((col) => (
                      <div key={String(col.key)} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{col.label}</span>
                        <span className="font-medium">
                          {col.render
                            ? col.render(row[col.key as keyof T], row)
                            : String(row[col.key as keyof T] ?? '-')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Tablet/Desktop Table View
  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={selectedIds.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium',
                    col.sortable && 'cursor-pointer hover:bg-muted/80',
                    col.width
                  )}
                  onClick={() => col.sortable && onSort?.(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown
                        className={cn(
                          'h-4 w-4',
                          sortBy === col.key ? 'text-primary' : 'text-muted-foreground/50'
                        )}
                      />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="w-12 px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const id = String(row[keyField]);
              const isSelected = selectedIds.has(id);

              return (
                <tr
                  key={id}
                  className={cn(
                    'border-b transition-colors',
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                    isSelected && 'bg-primary/5',
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(id, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 text-sm"
                    >
                      {col.render
                        ? col.render(row[col.key as keyof T], row)
                        : String(row[col.key as keyof T] ?? '-')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, i) => (
                            <DropdownMenuItem
                              key={i}
                              onClick={() => action.onClick(row)}
                              className={cn(
                                'gap-2',
                                action.variant === 'destructive' && 'text-destructive'
                              )}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MobileTable;

