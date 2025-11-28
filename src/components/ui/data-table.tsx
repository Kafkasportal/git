'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  emptyDescription?: string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  refetch?: () => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = 'Kayıt bulunamadı',
  emptyDescription = 'Henüz kayıt eklenmemiş',
  pagination,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Ara...',
  className,
  striped = true,
  hoverable = true,
  rowClassName,
  onRowClick,
  refetch,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const effectiveSearchValue = searchValue ?? internalSearch;
  const handleSearchChange = onSearchChange ?? setInternalSearch;

  // Filter data if internal search is used
  const filteredData =
    searchable && !onSearchChange
      ? data.filter((item) =>
          Object.values(item).some((value) =>
            String(value).toLowerCase().includes(effectiveSearchValue.toLowerCase())
          )
        )
      : data;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search & Info Bar */}
      {(searchable || pagination) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {searchable && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={effectiveSearchValue}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {pagination && (
            <Badge variant="secondary" className="font-semibold">
              {pagination.total} Kayıt
            </Badge>
          )}
        </div>
      )}

      {/* Table Card */}
      <Card variant="elevated">
        <CardContent className="p-0">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4 p-6">
              {/* Skeleton Table Header */}
              <div className="flex gap-4 pb-4 border-b border-border">
                {columns.slice(0, 4).map((_, index) => (
                  <Skeleton key={`header-${index}`} className="h-4 flex-1" />
                ))}
              </div>

              {/* Skeleton Table Rows */}
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex gap-4 py-3 border-b border-border/50">
                  {columns.slice(0, 4).map((_, colIndex) => (
                    <Skeleton
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={cn('h-4', colIndex === 0 ? 'w-12' : 'flex-1')}
                    />
                  ))}
                </div>
              ))}

              {/* Loading indicator */}
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Veriler yükleniyor...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Search className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-foreground">Veri Yükleme Hatası</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  {error.message || 'Veriler yüklenirken bir hata oluştu'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sayfayı Yenile
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (refetch) {
                      refetch();
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-3 rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{emptyMessage}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {effectiveSearchValue ? 'Arama kriterlerinize uygun kayıt yok' : emptyDescription}
                </p>
              </div>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && filteredData.length > 0 && (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {/* Mobile scroll indicator */}
              <div className="md:hidden text-xs text-muted-foreground text-center py-2 border-b border-border/50">
                Yatay kaydırma için sola/sağa kaydırın →
              </div>
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          'p-4 text-left text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider',
                          column.className
                        )}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((item, index) => (
                      <motion.tr
                        key={String(item.id || item._id || index)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                        onClick={() => onRowClick?.(item, index)}
                        className={cn(
                          'border-b border-border/50 transition-all duration-200 group',
                          striped && index % 2 === 0 && 'bg-muted/30',
                          hoverable && 'hover:bg-accent/40 hover:shadow-sm cursor-pointer',
                          onRowClick &&
                            'cursor-pointer focus-within:ring-2 focus-within:ring-primary/50',
                          rowClassName?.(item, index)
                        )}
                        tabIndex={onRowClick ? 0 : undefined}
                        role={onRowClick ? 'button' : undefined}
                        onKeyDown={(e) => {
                          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onRowClick(item, index);
                          }
                        }}
                        aria-label={
                          onRowClick ? `Satır ${index + 1} - Detayları görüntüle` : undefined
                        }
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn('p-4 text-sm text-foreground relative', column.className)}
                          >
                            {column.render
                              ? column.render(item, index)
                              : String(item[column.key] ?? '-')}

                            {/* Clickable row indicator */}
                            {onRowClick && column.key === columns[columns.length - 1].key && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 rounded-full bg-primary/60" />
                              </div>
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && !isLoading && !error && filteredData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Sayfa {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                pagination.onPageChange(1);
              }}
              disabled={pagination.page === 1}
              aria-label="İlk sayfa"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                pagination.onPageChange(pagination.page - 1);
              }}
              disabled={pagination.page === 1}
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-3">
              <Input
                type="number"
                min={1}
                max={pagination.totalPages}
                value={pagination.page}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= pagination.totalPages) {
                    pagination.onPageChange(page);
                  }
                }}
                className="w-16 text-center h-8"
              />
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                pagination.onPageChange(pagination.page + 1);
              }}
              disabled={pagination.page === pagination.totalPages}
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                pagination.onPageChange(pagination.totalPages);
              }}
              disabled={pagination.page === pagination.totalPages}
              aria-label="Son sayfa"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
