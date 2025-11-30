'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

// ============================================
// Types
// ============================================

export interface VirtualListProps<T> {
  /** Data array to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Estimated size of each item in pixels */
  estimateSize?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Overscan count - items to render outside visible area */
  overscan?: number;
  /** Container className */
  className?: string;
  /** List className */
  listClassName?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Loading skeleton count */
  loadingCount?: number;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Get item key */
  getItemKey?: (index: number) => string | number;
  /** Horizontal mode */
  horizontal?: boolean;
  /** Container height (required for vertical lists) */
  height?: number | string;
  /** Container width (required for horizontal lists) */
  width?: number | string;
  /** Infinite scroll - load more handler */
  onLoadMore?: () => void;
  /** Has more data to load */
  hasMore?: boolean;
  /** Loading more indicator */
  loadingMore?: boolean;
}

// ============================================
// Virtual List Component
// ============================================

function VirtualListInner<T>(
  {
    items,
    renderItem,
    estimateSize = 50,
    gap = 0,
    overscan = 5,
    className,
    listClassName,
    isLoading = false,
    loadingCount = 10,
    emptyState,
    getItemKey,
    horizontal = false,
    height = 400,
    width,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const combinedRef = useCombinedRefs(ref, parentRef);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    horizontal,
    getItemKey: getItemKey ? (index: number) => getItemKey(index) : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll effect
  React.useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= items.length - 1) {
      onLoadMore();
    }
  }, [virtualItems, items.length, onLoadMore, hasMore, loadingMore]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn('overflow-auto', className)}
        style={{ height, width }}
      >
        <div className="space-y-2 p-2">
          {Array.from({ length: loadingCount }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full"
              style={{ height: estimateSize - gap }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-muted-foreground',
          className
        )}
        style={{ height, width }}
      >
        {emptyState || (
          <div className="text-center py-8">
            <p className="text-sm">Gösterilecek veri bulunamadı</p>
          </div>
        )}
      </div>
    );
  }

  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={combinedRef}
      className={cn('overflow-auto', className)}
      style={{
        height,
        width,
        contain: 'strict',
      }}
    >
      <div
        className={cn('relative', listClassName)}
        style={{
          [horizontal ? 'width' : 'height']: `${totalSize}px`,
          [horizontal ? 'height' : 'width']: '100%',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{
                [horizontal ? 'left' : 'top']: `${virtualItem.start}px`,
                [horizontal ? 'top' : 'left']: 0,
                [horizontal ? 'height' : 'width']: '100%',
                paddingBottom: gap,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

// Forward ref with generic support
export const VirtualList = React.forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

// ============================================
// Virtual Grid Component
// ============================================

export interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  estimateSize?: number;
  gap?: number;
  overscan?: number;
  className?: string;
  isLoading?: boolean;
  loadingCount?: number;
  emptyState?: React.ReactNode;
  height?: number | string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columns = 3,
  estimateSize = 200,
  gap = 16,
  overscan = 2,
  className,
  isLoading = false,
  loadingCount = 9,
  emptyState,
  height = 600,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: VirtualGridProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Calculate row count
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Infinite scroll
  React.useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;

    const lastRow = virtualRows[virtualRows.length - 1];
    if (!lastRow) return;

    if (lastRow.index >= rowCount - 1) {
      onLoadMore();
    }
  }, [virtualRows, rowCount, onLoadMore, hasMore, loadingMore]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('overflow-auto', className)} style={{ height }}>
        <div
          className="grid p-2"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap,
          }}
        >
          {Array.from({ length: loadingCount }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-lg"
              style={{ height: estimateSize }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-muted-foreground',
          className
        )}
        style={{ height }}
      >
        {emptyState || (
          <div className="text-center py-8">
            <p className="text-sm">Gösterilecek veri bulunamadı</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ height, contain: 'strict' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columns;
          const rowItems = items.slice(rowStartIndex, rowStartIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 w-full"
              style={{
                top: `${virtualRow.start}px`,
                height: `${virtualRow.size}px`,
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap,
                  paddingLeft: gap / 2,
                  paddingRight: gap / 2,
                }}
              >
                {rowItems.map((item, colIndex) => (
                  <div key={rowStartIndex + colIndex} className="h-full">
                    {renderItem(item, rowStartIndex + colIndex)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Virtual Table Component (for data tables)
// ============================================

export interface VirtualTableColumn<T> {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface VirtualTableProps<T> {
  items: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
  className?: string;
  isLoading?: boolean;
  loadingCount?: number;
  emptyState?: React.ReactNode;
  height?: number | string;
  onRowClick?: (item: T, index: number) => void;
  selectedIndex?: number;
  stickyHeader?: boolean;
}

export function VirtualTable<T>({
  items,
  columns,
  rowHeight = 48,
  headerHeight = 44,
  overscan = 10,
  className,
  isLoading = false,
  loadingCount = 20,
  emptyState,
  height = 500,
  onRowClick,
  selectedIndex,
  stickyHeader = true,
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border', className)} style={{ height }}>
        <div
          className="flex border-b bg-muted/50"
          style={{ height: headerHeight }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex items-center px-4 font-medium"
              style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
            >
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: loadingCount }).map((_, i) => (
            <div key={i} className="flex" style={{ height: rowHeight }}>
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center px-4"
                  style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                >
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('rounded-lg border', className)} style={{ height }}>
        <div
          className="flex border-b bg-muted/50"
          style={{ height: headerHeight }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex items-center px-4 font-medium text-sm"
              style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
            >
              {col.header}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          {emptyState || (
            <div className="text-center py-8">
              <p className="text-sm">Gösterilecek veri bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border', className)} style={{ height }}>
      {/* Header */}
      <div
        className={cn(
          'flex border-b bg-muted/50',
          stickyHeader && 'sticky top-0 z-10'
        )}
        style={{ height: headerHeight }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              'flex items-center px-4 font-medium text-sm',
              col.className
            )}
            style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtual rows */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: `calc(100% - ${headerHeight}px)`,
          contain: 'strict',
        }}
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualRows.map((virtualRow) => {
            const item = items[virtualRow.index];
            const isSelected = selectedIndex === virtualRow.index;

            return (
              <div
                key={virtualRow.key}
                className={cn(
                  'absolute left-0 top-0 w-full flex border-b transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  isSelected && 'bg-primary/10'
                )}
                style={{
                  top: `${virtualRow.start}px`,
                  height: `${virtualRow.size}px`,
                }}
                onClick={() => onRowClick?.(item, virtualRow.index)}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={cn('flex items-center px-4 text-sm', col.className)}
                    style={{
                      width: col.width || 'auto',
                      flex: col.width ? 'none' : 1,
                    }}
                  >
                    {col.render(item, virtualRow.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper: Combine Refs
// ============================================

function useCombinedRefs<T>(
  ...refs: (React.ForwardedRef<T> | React.RefObject<T | null>)[]
): React.RefCallback<T> {
  return React.useCallback(
    (element: T) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === 'function') {
          ref(element);
        } else {
          (ref as React.MutableRefObject<T | null>).current = element;
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}

// ============================================
// Hook: useVirtualScroll
// ============================================

export function useVirtualScroll<T>(options: {
  items: T[];
  estimateSize: number;
  overscan?: number;
  horizontal?: boolean;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: options.items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => options.estimateSize,
    overscan: options.overscan ?? 5,
    horizontal: options.horizontal,
  });

  return {
    parentRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    scrollToIndex: virtualizer.scrollToIndex,
    scrollToOffset: virtualizer.scrollToOffset,
  };
}
