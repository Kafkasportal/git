/**
 * useInfiniteScroll Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useInfiniteScroll,
  usePaginatedQuery,
} from "@/hooks/useInfiniteScroll";
import React from "react";

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("useInfiniteScroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with empty data and loading state", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["test"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("should fetch and return data", async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    const mockQueryFn = vi.fn().mockResolvedValue({ data: mockData, total: 2 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["test-data"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.total).toBe(2);
    expect(mockQueryFn).toHaveBeenCalledWith(1); // First page
  });

  it("should indicate hasMore when total exceeds fetched items", async () => {
    const mockData = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const mockQueryFn = vi
      .fn()
      .mockResolvedValue({ data: mockData, total: 100 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["test-more"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
  });

  it("should indicate no more data when all items fetched", async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    const mockQueryFn = vi.fn().mockResolvedValue({ data: mockData, total: 2 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["test-no-more"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
  });
});

describe("usePaginatedQuery", () => {
  it("should return paginated data with total pages", async () => {
    const mockData = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const mockQueryFn = vi
      .fn()
      .mockResolvedValue({ data: mockData, total: 50 });

    const { result } = renderHook(
      () => usePaginatedQuery(["paginated-test"], mockQueryFn, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual(mockData);
    expect(result.current.total).toBe(50);
    expect(result.current.totalPages).toBe(5);
  });

  it("should handle empty data", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(
      () => usePaginatedQuery(["paginated-empty"], mockQueryFn, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it("should handle errors", async () => {
    const mockQueryFn = vi.fn().mockRejectedValue(new Error("Fetch error"));

    const { result } = renderHook(
      () => usePaginatedQuery(["paginated-error"], mockQueryFn, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it("should provide refetch function", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(
      () => usePaginatedQuery(["paginated-refetch"], mockQueryFn, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("useInfiniteScroll - ref", () => {
  it("should provide a ref for the observer target", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["ref-test"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull(); // Not attached to DOM in test
  });

  it("should provide fetchNextPage function", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["fetch-next-test"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.fetchNextPage).toBe("function");
  });
});

describe("useInfiniteScroll - IntersectionObserver", () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: IntersectionObserverCallback | null = null;
  let OriginalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    observerCallback = null;

    // Save original
    OriginalIntersectionObserver = global.IntersectionObserver;

    // Mock IntersectionObserver as a class
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: ReadonlyArray<number> = [];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe(target: Element): void {
        (mockObserve as any)(target);
      }

      disconnect(): void {
        (mockDisconnect as any)();
      }

      unobserve = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
    }

    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    global.IntersectionObserver = OriginalIntersectionObserver;
    vi.restoreAllMocks();
  });

  it("should trigger fetchNextPage when element is intersecting and hasNextPage", async () => {
    const mockData = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const mockQueryFn = vi.fn().mockResolvedValue({ data: mockData, total: 100 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["intersection-test"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify hasMore is true
    expect(result.current.hasMore).toBe(true);

    // Simulate intersection
    if (observerCallback) {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }

    // fetchNextPage should be called
    await waitFor(() => {
      expect(mockQueryFn).toHaveBeenCalledTimes(2); // Initial + next page
    });
  });

  it("should not trigger fetchNextPage when element is not intersecting", async () => {
    const mockData = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const mockQueryFn = vi.fn().mockResolvedValue({ data: mockData, total: 100 });

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["no-intersection-test"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate non-intersection
    if (observerCallback) {
      observerCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }

    // Wait a bit and verify fetchNextPage was not called again
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockQueryFn).toHaveBeenCalledTimes(1); // Only initial call
  });

  it("should disconnect observer on unmount", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });

    const { unmount } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ["unmount-test"],
          queryFn: mockQueryFn,
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockQueryFn).toHaveBeenCalled();
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
