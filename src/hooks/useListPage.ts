'use client';

/**
 * useListPage - Generic hook for list pages
 * Combines data fetching, filtering, bulk operations, and pagination
 * into a single reusable hook to reduce code duplication across list pages.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFilters, type FilterValue, type UseFiltersOptions } from './useFilters';
import { useBulkOperations, type UseBulkOperationsOptions, type BulkOperationResult } from './useBulkOperations';
import { useDebounce } from './useDebounce';

export interface ListPagePagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface UseListPageOptions<T> {
    /** Query key for React Query */
    queryKey: string;

    /** API endpoint for data fetching */
    endpoint: string;

    /** Filter options */
    filterOptions?: Omit<UseFiltersOptions, 'onFiltersChange'>;

    /** Bulk operations options */
    bulkOptions?: Omit<UseBulkOperationsOptions, 'endpoint'>;

    /** Enable search with debounce */
    enableSearch?: boolean;

    /** Search debounce delay in ms */
    searchDebounceMs?: number;

    /** Default page size */
    defaultPageSize?: number;

    /** ID field for items (default: 'id') */
    idField?: keyof T;

    /** Transform function for fetched data */
    transformData?: (data: unknown) => T[];

    /** Custom fetch function */
    fetchFn?: (params: {
        filters: FilterValue;
        search: string;
        page: number;
        pageSize: number;
    }) => Promise<{ data: T[]; total: number }>;

    /** Stale time for query (ms) */
    staleTime?: number;

    /** Enable/disable query */
    enabled?: boolean;
}

export interface UseListPageReturn<T> {
    // Data
    data: T[];
    total: number;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;

    // Pagination
    pagination: ListPagePagination;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;

    // Search
    search: string;
    debouncedSearch: string;
    setSearch: (search: string) => void;

    // Filters
    filters: FilterValue;
    activeFilterCount: number;
    setFilter: (key: string, value: FilterValue[string]) => void;
    resetFilters: () => void;
    handleFiltersChange: (newFilters: Record<string, unknown>) => void;

    // Bulk Operations
    selectedIds: Set<string>;
    selectedCount: number;
    isSelected: (id: string) => boolean;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    bulkDelete: () => Promise<BulkOperationResult>;
    bulkUpdate: (updates: Record<string, unknown>) => Promise<BulkOperationResult>;
    bulkOperationLoading: boolean;

    // Actions
    refetch: () => void;
    invalidate: () => void;
}

export function useListPage<T extends Record<string, unknown>>(
    options: UseListPageOptions<T>
): UseListPageReturn<T> {
    const {
        queryKey,
        endpoint,
        filterOptions = {},
        bulkOptions = {},
        enableSearch: _enableSearch = true,
        searchDebounceMs = 300,
        defaultPageSize = 20,
        idField = 'id' as keyof T,
        transformData,
        fetchFn,
        staleTime = 30000,
        enabled = true,
    } = options;

    const queryClient = useQueryClient();

    // State
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // Debounced search
    const debouncedSearch = useDebounce(search, searchDebounceMs);

    // Filters
    const filterHook = useFilters({
        ...filterOptions,
        onFiltersChange: () => {
            // Reset to first page when filters change
            setPage(1);
        },
    });

    // Default fetch function
    const defaultFetchFn = useCallback(async (params: {
        filters: FilterValue;
        search: string;
        page: number;
        pageSize: number;
    }): Promise<{ data: T[]; total: number }> => {
        const searchParams = new URLSearchParams();

        // Add pagination
        searchParams.set('page', params.page.toString());
        searchParams.set('limit', params.pageSize.toString());

        // Add search
        if (params.search) {
            searchParams.set('search', params.search);
        }

        // Add filters
        Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                if (Array.isArray(value)) {
                    searchParams.set(key, value.join(','));
                } else if (typeof value === 'object' && 'from' in value) {
                    if (value.from) searchParams.set(`${key}_from`, value.from.toISOString());
                    if (value.to) searchParams.set(`${key}_to`, value.to.toISOString());
                } else {
                    searchParams.set(key, String(value));
                }
            }
        });

        const response = await fetch(`${endpoint}?${searchParams.toString()}`);

        if (!response.ok) {
            throw new Error(`Veri yüklenirken hata oluştu: ${response.status}`);
        }

        const result = await response.json();

        // Handle different response formats
        if (result.data && typeof result.total === 'number') {
            return {
                data: transformData ? transformData(result.data) : result.data,
                total: result.total
            };
        }

        if (Array.isArray(result)) {
            const transformed = transformData ? transformData(result) : result;
            return { data: transformed as T[], total: transformed.length };
        }

        throw new Error('Beklenmeyen API yanıt formatı');
    }, [endpoint, transformData]);

    // Query
    const query = useQuery({
        queryKey: [queryKey, filterHook.filters, debouncedSearch, page, pageSize],
        queryFn: () => (fetchFn || defaultFetchFn)({
            filters: filterHook.filters,
            search: debouncedSearch,
            page,
            pageSize,
        }),
        staleTime,
        enabled,
    });

    // Derived data
    const data = query.data?.data ?? [];
    const total = query.data?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // All IDs for select all
    const allIds = useMemo(() => {
        return data.map((item) => String(item[idField]));
    }, [data, idField]);

    // Bulk operations
    const bulkOps = useBulkOperations({
        endpoint,
        ...bulkOptions,
        onSuccess: (result) => {
            // Invalidate query on success
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            bulkOptions.onSuccess?.(result);
        },
    });

    // Pagination object
    const pagination: ListPagePagination = useMemo(() => ({
        page,
        pageSize,
        total,
        totalPages,
    }), [page, pageSize, total, totalPages]);

    // Actions
    const refetch = useCallback(() => {
        query.refetch();
    }, [query]);

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
    }, [queryClient, queryKey]);

    const selectAllItems = useCallback(() => {
        bulkOps.selectAll(allIds);
    }, [bulkOps, allIds]);

    const handleSetSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1); // Reset to first page on search
    }, []);

    return {
        // Data
        data,
        total,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,

        // Pagination
        pagination,
        setPage,
        setPageSize: (size: number) => {
            setPageSize(size);
            setPage(1);
        },

        // Search
        search,
        debouncedSearch,
        setSearch: handleSetSearch,

        // Filters (from useFilters)
        filters: filterHook.filters,
        activeFilterCount: filterHook.activeFilterCount,
        setFilter: filterHook.setFilter,
        resetFilters: filterHook.resetFilters,
        handleFiltersChange: filterHook.handleFiltersChange,

        // Bulk Operations (from useBulkOperations)
        selectedIds: bulkOps.selectedIds,
        selectedCount: bulkOps.selectedCount,
        isSelected: bulkOps.isSelected,
        toggleSelection: bulkOps.toggleSelection,
        selectAll: selectAllItems,
        clearSelection: bulkOps.clearSelection,
        bulkDelete: bulkOps.bulkDelete,
        bulkUpdate: bulkOps.bulkUpdate,
        bulkOperationLoading: bulkOps.isLoading,

        // Actions
        refetch,
        invalidate,
    };
}

export default useListPage;
