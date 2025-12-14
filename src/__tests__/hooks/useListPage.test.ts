/**
 * useListPage Hook Tests
 * Tests for the generic list page hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: vi.fn(),
        push: vi.fn(),
    }),
    usePathname: () => '/test',
    useSearchParams: () => new URLSearchParams(),
}));

import { useListPage } from '@/hooks/useListPage';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
};

describe('useListPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            expect(result.current.data).toEqual([]);
            expect(result.current.isLoading).toBe(true);
            expect(result.current.search).toBe('');
            expect(result.current.selectedCount).toBe(0);
        });

        it('should load data from endpoint', async () => {
            const mockData = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
            ];

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: mockData, total: 2 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toHaveLength(2);
            expect(result.current.total).toBe(2);
        });
    });

    describe('Pagination', () => {
        it('should have pagination state', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 100 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                    defaultPageSize: 10,
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.pagination.page).toBe(1);
            expect(result.current.pagination.pageSize).toBe(10);
            expect(result.current.pagination.totalPages).toBe(10);
        });

        it('should change page', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 100 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.setPage(2);
            });

            expect(result.current.pagination.page).toBe(2);
        });

        it('should change page size and reset to page 1', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 100 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.setPage(3);
            });

            act(() => {
                result.current.setPageSize(50);
            });

            expect(result.current.pagination.pageSize).toBe(50);
            expect(result.current.pagination.page).toBe(1);
        });
    });

    describe('Search', () => {
        it('should update search value', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                    searchDebounceMs: 0, // Disable debounce for testing
                }),
                { wrapper: createWrapper() }
            );

            act(() => {
                result.current.setSearch('test query');
            });

            expect(result.current.search).toBe('test query');
        });

        it('should reset to page 1 on search', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 100 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.setPage(3);
            });

            act(() => {
                result.current.setSearch('new search');
            });

            expect(result.current.pagination.page).toBe(1);
        });
    });

    describe('Filters', () => {
        it('should have filter functions', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            expect(typeof result.current.setFilter).toBe('function');
            expect(typeof result.current.resetFilters).toBe('function');
            expect(typeof result.current.handleFiltersChange).toBe('function');
        });

        it('should set a filter', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            act(() => {
                result.current.setFilter('status', 'active');
            });

            expect(result.current.filters['status']).toBe('active');
            expect(result.current.activeFilterCount).toBe(1);
        });
    });

    describe('Selection', () => {
        it('should toggle selection', async () => {
            const mockData = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
            ];

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: mockData, total: 2 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.toggleSelection('1');
            });

            expect(result.current.selectedCount).toBe(1);
            expect(result.current.isSelected('1')).toBe(true);
        });

        it('should select all items', async () => {
            const mockData = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
                { id: '3', name: 'Item 3' },
            ];

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: mockData, total: 3 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.data).toHaveLength(3);
            });

            act(() => {
                result.current.selectAll();
            });

            expect(result.current.selectedCount).toBe(3);
        });

        it('should clear selection', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [{ id: '1' }], total: 1 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.toggleSelection('1');
            });

            expect(result.current.selectedCount).toBe(1);

            act(() => {
                result.current.clearSelection();
            });

            expect(result.current.selectedCount).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle fetch errors', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: false,
                status: 500,
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).not.toBeNull();
        });
    });

    describe('Custom Fetch Function', () => {
        it('should use custom fetch function', async () => {
            const customFetchFn = vi.fn().mockResolvedValue({
                data: [{ id: 'custom-1', name: 'Custom Item' }],
                total: 1,
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                    fetchFn: customFetchFn,
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(customFetchFn).toHaveBeenCalled();
            expect(result.current.data[0].name).toBe('Custom Item');
        });
    });

    describe('Data Transform', () => {
        it('should transform data with transformData function', async () => {
            const mockData = [
                { id: '1', name: 'item 1' },
                { id: '2', name: 'item 2' },
            ];

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: mockData, total: 2 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                    transformData: (data) =>
                        (data as typeof mockData).map(item => ({
                            ...item,
                            name: item.name.toUpperCase(),
                        })),
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data[0].name).toBe('ITEM 1');
        });
    });

    describe('Filter Query Params', () => {
        it('should include array filters in query params', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            act(() => {
                result.current.setFilter('tags', ['tag1', 'tag2']);
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('tags=tag1%2Ctag2'),
                );
            });
        });

        it('should include date range filters in query params', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            const fromDate = new Date('2024-01-01');
            const toDate = new Date('2024-12-31');

            act(() => {
                result.current.setFilter('dateRange', { from: fromDate, to: toDate });
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('dateRange_from'),
                );
            });
        });

        it('should skip null and undefined filter values', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                    filterOptions: {
                        initialFilters: { status: 'active', empty: undefined },
                    },
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(fetchCall).toContain('status=active');
            expect(fetchCall).not.toContain('empty=');
        });
    });

    describe('Response Format Handling', () => {
        it('should handle array response format', async () => {
            const mockData = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
            ];

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toHaveLength(2);
            expect(result.current.total).toBe(2);
        });

        it('should throw error for unexpected response format', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ unexpected: 'format' }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toContain('Beklenmeyen API yanıt formatı');
        });
    });

    describe('Actions', () => {
        it('should refetch data', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const initialCallCount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

            act(() => {
                result.current.refetch();
            });

            await waitFor(() => {
                expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
            });
        });

        it('should invalidate query', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            const { result } = renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should not throw
            act(() => {
                result.current.invalidate();
            });
        });
    });

    describe('Disabled Query', () => {
        it('should not fetch when disabled', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0 }),
            });

            renderHook(
                () => useListPage({
                    queryKey: 'test-items',
                    endpoint: '/api/test',
                    enabled: false,
                }),
                { wrapper: createWrapper() }
            );

            // Wait a bit to ensure no fetch is made
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).not.toHaveBeenCalled();
        });
    });
});
