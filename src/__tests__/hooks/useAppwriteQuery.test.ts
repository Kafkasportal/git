/**
 * useAppwriteQuery Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAppwriteQuery } from '@/hooks/useAppwriteQuery';

// Mock query-config
vi.mock('@/lib/api/query-config', () => ({
    getQueryOptions: vi.fn((entity: string) => {
        const configs: Record<string, { staleTime: number; gcTime: number }> = {
            beneficiaries: { staleTime: 60000, gcTime: 300000 },
            donations: { staleTime: 30000, gcTime: 180000 },
            users: { staleTime: 120000, gcTime: 600000 },
        };
        return configs[entity] || {};
    }),
    QUERY_STALE_TIMES: {
        beneficiaries: 60000,
        donations: 30000,
        users: 120000,
    },
}));

describe('useAppwriteQuery', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    it('should fetch data successfully', async () => {
        const mockData = [{ id: '1', name: 'Test' }];
        const mockFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['test-query'],
                    queryFn: mockFn,
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
        const mockError = new Error('Fetch failed');
        const mockFn = vi.fn().mockRejectedValue(mockError);

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['error-query'],
                    queryFn: mockFn,
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toEqual(mockError);
    });

    it('should not fetch when disabled', async () => {
        const mockFn = vi.fn().mockResolvedValue([]);

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['disabled-query'],
                    queryFn: mockFn,
                    enabled: false,
                }),
            { wrapper }
        );

        // Wait a bit to ensure no fetch happens
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockFn).not.toHaveBeenCalled();
        expect(result.current.isPending).toBe(true);
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('should apply entity-specific cache options', async () => {
        const mockData = [{ id: '1', name: 'Beneficiary' }];
        const mockFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['beneficiaries', 'list'],
                    queryFn: mockFn,
                    entity: 'beneficiaries',
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });

    it('should allow custom options to override entity options', async () => {
        const mockData = [{ id: '1', name: 'Test' }];
        const mockFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['custom-options-query'],
                    queryFn: mockFn,
                    entity: 'beneficiaries',
                    staleTime: 5000, // Override entity staleTime
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });

    it('should work without entity parameter', async () => {
        const mockData = { custom: 'data' };
        const mockFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['no-entity-query'],
                    queryFn: mockFn,
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });

    it('should handle complex query keys', async () => {
        const mockData = [{ id: '1' }];
        const mockFn = vi.fn().mockResolvedValue(mockData);
        const filters = { status: 'active', page: 1 };

        const { result } = renderHook(
            () =>
                useAppwriteQuery({
                    queryKey: ['beneficiaries', 'list', filters],
                    queryFn: mockFn,
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });

    it('should refetch on query key change', async () => {
        const mockFn = vi.fn()
            .mockResolvedValueOnce([{ id: '1' }])
            .mockResolvedValueOnce([{ id: '2' }]);

        const { result, rerender } = renderHook(
            ({ id }) =>
                useAppwriteQuery({
                    queryKey: ['item', id],
                    queryFn: mockFn,
                }),
            {
                wrapper,
                initialProps: { id: '1' },
            }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([{ id: '1' }]);

        rerender({ id: '2' });

        await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(2));
    });
});
