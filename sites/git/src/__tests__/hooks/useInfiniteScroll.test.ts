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
});
