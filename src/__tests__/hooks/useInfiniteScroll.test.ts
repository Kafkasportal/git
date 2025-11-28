import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfiniteScroll, usePaginatedQuery } from '@/hooks/useInfiniteScroll';

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(),
}));

import { useInfiniteQuery } from '@tanstack/react-query';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';

describe('useInfiniteScroll Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct options', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isLoading: false,
    } as unknown as UseInfiniteQueryResult);

    renderHook(() =>
      useInfiniteScroll({
        queryKey: ['test'],
        queryFn: vi.fn(),
      })
    );

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['test'],
        initialPageParam: 1,
        getNextPageParam: expect.any(Function),
      })
    );
  });

  it('should handle custom limit and initial page param', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isLoading: false,
    } as unknown as UseInfiniteQueryResult);

    renderHook(() =>
      useInfiniteScroll({
        limit: 50,
        initialPageParam: 5,
        queryKey: ['test'],
        queryFn: vi.fn(),
      })
    );

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['test'],
        initialPageParam: 5,
      })
    );
  });

  it('should return flat data from pages', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { items: ['item1', 'item2'], total: 10 },
          { items: ['item3', 'item4'], total: 10 },
        ],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isLoading: false,
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() =>
      useInfiniteScroll({
        queryKey: ['test'],
        queryFn: vi.fn(),
      })
    );

    expect(result.current.data).toEqual(['item1', 'item2', 'item3', 'item4']);
    expect(result.current.total).toBe(10);
  });

  it('should handle empty data', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isLoading: false,
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() =>
      useInfiniteScroll({
        queryKey: ['test'],
        queryFn: vi.fn(),
      })
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should provide ref for intersection observer', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isLoading: false,
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() =>
      useInfiniteScroll({
        queryKey: ['test'],
        queryFn: vi.fn(),
      })
    );

    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBe(null); // Will be set after mount
  });

  it('should pass through all state properties', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetching: true,
      isFetchingNextPage: true,
      isLoading: true,
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() =>
      useInfiniteScroll({
        queryKey: ['test'],
        queryFn: vi.fn(),
      })
    );

    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetchingNextPage).toBe(true);
    expect(result.current.fetchNextPage).toBeDefined();
  });
});

describe('usePaginatedQuery Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct query configuration', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], total: 0 }] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseInfiniteQueryResult);

    const queryFn = vi.fn();

    renderHook(() => usePaginatedQuery(['test'], queryFn, 25));

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['test'],
        queryFn: expect.any(Function),
        initialPageParam: 1,
        getNextPageParam: expect.any(Function),
      })
    );
  });

  it('should return flattened items and pagination data', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ items: ['item1', 'item2'], total: 50, nextPage: 2 }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() => usePaginatedQuery(['test'], vi.fn(), 20));

    expect(result.current.items).toEqual(['item1', 'item2']);
    expect(result.current.total).toBe(50);
    expect(result.current.totalPages).toBe(3); // 50/20 = 2.5 => 3
  });

  it('should handle loading state', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], total: 0 }] },
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() => usePaginatedQuery(['test'], vi.fn()));

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], total: 0 }] },
      isLoading: false,
      error: new Error('Query failed'),
      refetch: vi.fn(),
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() => usePaginatedQuery(['test'], vi.fn()));

    expect(result.current.error).toEqual(new Error('Query failed'));
  });

  it('should provide refetch function', () => {
    const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
    const mockRefetch = vi.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], total: 0 }] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as UseInfiniteQueryResult);

    const { result } = renderHook(() => usePaginatedQuery(['test'], vi.fn()));

    expect(result.current.refetch).toBeDefined();
    expect(result.current.refetch).toBe(mockRefetch);
  });
});
