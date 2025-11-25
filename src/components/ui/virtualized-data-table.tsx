// Performance-enhanced DataTable with Virtual Scrolling
'use client';

import React, { useState, useMemo, useRef, memo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface VirtualizedDataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: Error;
  emptyMessage?: string;
  emptyDescription?: string;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  refetch?: () => void;
  // Virtual scrolling props
  rowHeight?: number;
  containerHeight?: number;
}

function VirtualizedDataTable<T>({
  data,
  columns,
  isLoading = false,
  error,
  emptyMessage = 'Veri bulunamadı',
  emptyDescription = 'Henüz veri eklenmemiş',
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Ara...',
  pagination,
  onRowClick,
  refetch,
  rowHeight = 60,
  containerHeight = 600,
}: VirtualizedDataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(containerHeight);

  // Calculate responsive height based on viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - 300; // Reserve space for header, padding, etc.
      const responsiveHeight = Math.max(400, Math.min(containerHeight, availableHeight));
      setCalculatedHeight(responsiveHeight);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [containerHeight]);

  // Memoized virtual scrolling calculations
  const virtualItems = useMemo(() => {
    const visibleItemCount = Math.ceil(calculatedHeight / rowHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
    const endIndex = Math.min(data.length - 1, startIndex + visibleItemCount + 10);

    return {
      startIndex,
      endIndex,
      visibleItems: data.slice(startIndex, endIndex + 1),
    };
  }, [data, scrollTop, rowHeight, calculatedHeight]);

  // Memoized scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // Memoized row renderer
  const RowRenderer = memo(function RowRenderer({
    item,
    index,
    style,
  }: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
        className={cn(
          'px-4 py-3 border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-150 flex-nowrap text-sm',
          onRowClick && 'cursor-pointer'
        )}
        onClick={() => onRowClick?.(item)}
        role="row"
        aria-rowindex={index + 2}
        data-row
      >
        {columns.map((column) => {
          const hasFixed = Boolean(
            column.className &&
              (column.className.includes('flex-none') ||
                column.className.includes('w-[') ||
                column.className.includes('basis-') ||
                column.className.includes('grow-0') ||
                column.className.includes('shrink-0'))
          );

          // Allow column-level overflow control. If the column explicitly sets
          // any overflow utility, do NOT force overflow-hidden here.
          const columnHasOverflowUtility = Boolean(
            column.className && column.className.includes('overflow-')
          );

          const baseCell = hasFixed ? 'px-3 py-1' : 'flex-1 px-3 py-1';
          const defaultOverflow = columnHasOverflowUtility ? '' : 'overflow-hidden';

          return (
            <div
              key={column.key}
              className={cn(baseCell, defaultOverflow, 'text-sm', column.className)}
              role="cell"
              aria-colindex={columns.findIndex((col) => col.key === column.key) + 1}
            >
              {column.render ? column.render(item) : String((item as any)[column.key] ?? '-')}
            </div>
          );
        })}
      </div>
    );
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        {/* Loading skeleton with optimized rendering */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-lg font-medium">Veri yüklenirken hata oluştu</p>
          <p className="text-sm text-slate-500 mt-2">{error.message}</p>
        </div>
        {refetch && (
          <Button onClick={refetch} variant="outline">
            Tekrar Dene
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4-4 4-4-4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">{emptyMessage}</h3>
        <p className="text-sm text-slate-500 mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              data-testid="search-input"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Virtualized Table - Full width, no horizontal scroll */}
      <div className="w-full">
        <div
          ref={containerRef}
          className="border border-slate-200 rounded-lg overflow-y-auto overflow-x-visible bg-white w-full shadow-sm"
          style={{
            height: calculatedHeight,
            minHeight: 400,
          }}
          onScroll={handleScroll}
          role="table"
          aria-rowcount={data.length + 1}
          aria-colcount={columns.length}
          data-testid="virtualizedTable"
        >
          {/* Header */}
          <div
            className="flex items-center flex-nowrap px-4 py-3 border-b border-slate-200 bg-slate-50/80 font-semibold text-sm text-slate-700 sticky top-0 z-10"
            style={{
              height: rowHeight,
              minHeight: rowHeight,
              willChange: 'transform',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
            }}
            role="row"
          >
            {columns.map((column, columnIndex) => {
              const hasFixed = Boolean(
                column.className &&
                  (column.className.includes('flex-none') ||
                    column.className.includes('w-[') ||
                    column.className.includes('basis-') ||
                    column.className.includes('grow-0') ||
                    column.className.includes('shrink-0'))
              );
              return (
                <div
                  key={column.key}
                  className={cn(
                    hasFixed ? 'px-3 py-1 overflow-hidden' : 'flex-1 px-3 py-1 overflow-hidden',
                    'text-sm',
                    column.className
                  )}
                  role="columnheader"
                  aria-colindex={columnIndex + 1}
                >
                  {column.label}
                </div>
              );
            })}
          </div>

          {/* Virtual Scrolling Container */}
          <div style={{ height: data.length * rowHeight, position: 'relative' }}>
            {/* Visible rows */}
            <div
              style={{
                transform: `translateY(${virtualItems.startIndex * rowHeight}px)`,
                willChange: 'transform',
              }}
            >
              {virtualItems.visibleItems.map((item, index) => (
                <RowRenderer
                  key={virtualItems.startIndex + index}
                  item={item}
                  index={virtualItems.startIndex + index}
                  style={{ height: rowHeight }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4">
          <div className="text-sm text-slate-600">
            Toplam {pagination.total} kayıt, sayfa {pagination.page} / {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                pagination.onPageChange(pagination.page - 1);
              }}
              disabled={pagination.page <= 1}
            >
              Önceki
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      pagination.onPageChange(page);
                    }}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                pagination.onPageChange(pagination.page + 1);
              }}
              disabled={pagination.page >= pagination.totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { VirtualizedDataTable };
