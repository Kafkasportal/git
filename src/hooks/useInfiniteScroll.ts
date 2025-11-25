'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  limit?: number;
  queryKey: (string | number | Record<string, unknown>)[];
  queryFn: (pageParam: number) => Promise<{ data: unknown[]; total: number }>;
  initialPageParam?: number;
}

/**
 * Hook for infinite scroll with TanStack Query
 *
 * @example
 * ```tsx
 * const { data, hasMore, isLoading, isFetchingNextPage, ref } = useInfiniteScroll({
 *   limit: 20,
 *   queryKey: ['beneficiaries', search],
 *   queryFn: (page) => api.beneficiaries.getBeneficiaries({ page, limit: 20, search }),
 * });
 *
 * return (
 *   <>
 *     {data.map(item => <Item key={item._id} item={item} />)}
 *     <div ref={ref} className="py-4 text-center">
 *       {isFetchingNextPage ? <Spinner /> : hasMore ? 'Yükle...' : 'Tüm kayıtlar yüklendi'}
 *     </div>
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll({
  limit = 20,
  queryKey,
  queryFn,
  initialPageParam = 1,
}: UseInfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) =>
        queryFn(pageParam).then((response) => ({
          items: response.data,
          total: response.total,
          nextPage: pageParam + 1,
        })),
      initialPageParam,
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const totalFetched = (lastPageParam as number) * limit;
        return totalFetched < lastPage.total ? (lastPageParam as number) + 1 : undefined;
      },
    });

  // Intersection Observer for auto-load
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetching) {
        void fetchNextPage();
      }
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetching]);

  const flatData = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return {
    data: flatData,
    total,
    hasMore: hasNextPage,
    isLoading,
    isFetchingNextPage,
    ref: observerTarget,
    fetchNextPage,
  };
}

/**
 * Simpler hook for manual pagination
 */
export function usePaginatedQuery(
  queryKey: (string | number | Record<string, unknown>)[],
  queryFn: (page: number) => Promise<{ data: unknown[]; total: number }>,
  limit = 20
) {
  const { data, isLoading, error, refetch } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      queryFn(pageParam).then((response) => ({
        items: response.data,
        total: response.total,
        nextPage: pageParam + 1,
      })),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const totalFetched = (lastPageParam as number) * limit;
      return totalFetched < lastPage.total ? (lastPageParam as number) + 1 : undefined;
    },
  });

  const total = data?.pages[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const items = data?.pages[0]?.items ?? [];

  return {
    items,
    total,
    totalPages,
    isLoading,
    error,
    refetch,
  };
}
