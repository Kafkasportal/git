/**
 * useAppwriteMutation Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAppwriteMutation } from '@/hooks/useAppwriteMutation';

// Mock dependencies
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
    useOnlineStatus: vi.fn(() => ({ isOffline: false, isOnline: true })),
}));

vi.mock('@/lib/offline-sync', () => ({
    queueOfflineMutation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { queueOfflineMutation } from '@/lib/offline-sync';

describe('useAppwriteMutation', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
                mutations: {
                    retry: false,
                },
            },
        });
    });

    afterEach(() => {
        queryClient.clear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    it('should execute mutation successfully', async () => {
        const mockData = { id: '1', name: 'Created' };
        const mockFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    successMessage: 'Created successfully',
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(mockFn).toHaveBeenCalledWith({ name: 'Test' });
        expect(toast.success).toHaveBeenCalledWith('Created successfully');
    });

    it('should handle mutation errors', async () => {
        const mockError = new Error('Creation failed');
        const mockFn = vi.fn().mockRejectedValue(mockError);

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    errorMessage: 'Failed to create',
                }),
            { wrapper }
        );

        await act(async () => {
            try {
                await result.current.mutateAsync({ name: 'Test' });
            } catch {
                // Expected error
            }
        });

        // Wait for the error toast to be called
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Creation failed');
        });
    });

    it('should invalidate queries on success', async () => {
        const mockData = { id: '1' };
        const mockFn = vi.fn().mockResolvedValue(mockData);
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    queryKey: ['beneficiaries', 'list'],
                    showSuccessToast: false,
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['beneficiaries', 'list'],
        });
    });

    it('should not show toast when disabled', async () => {
        const mockFn = vi.fn().mockResolvedValue({ id: '1' });

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    showSuccessToast: false,
                    successMessage: 'Success',
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(toast.success).not.toHaveBeenCalled();
    });

    it('should call onSuccess callback', async () => {
        const mockData = { id: '1' };
        const mockFn = vi.fn().mockResolvedValue(mockData);
        const onSuccess = vi.fn();

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    onSuccess,
                    showSuccessToast: false,
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(onSuccess).toHaveBeenCalled();
    });

    it('should queue mutation when offline', async () => {
        vi.mocked(useOnlineStatus).mockReturnValue({ isOffline: true, isOnline: false });

        const mockFn = vi.fn().mockResolvedValue({ id: '1' });

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    queryKey: ['beneficiaries', 'create'],
                    collection: 'beneficiaries',
                    enableOfflineQueue: true,
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(queueOfflineMutation).toHaveBeenCalledWith({
            type: 'create',
            collection: 'beneficiaries',
            data: { name: 'Test' },
            retryCount: 0,
        });
        expect(toast.info).toHaveBeenCalledWith(
            'İşlem offline kuyruğuna eklendi',
            expect.any(Object)
        );
        expect(mockFn).not.toHaveBeenCalled();
    });

    it('should infer delete mutation type from queryKey', async () => {
        vi.mocked(useOnlineStatus).mockReturnValue({ isOffline: true, isOnline: false });

        const mockFn = vi.fn().mockResolvedValue({ id: '1' });

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    queryKey: ['delete-beneficiary'],
                    collection: 'beneficiaries',
                    enableOfflineQueue: true,
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ id: '123' });
        });

        expect(queueOfflineMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'delete',
            })
        );
    });

    it('should infer update mutation type from queryKey', async () => {
        vi.mocked(useOnlineStatus).mockReturnValue({ isOffline: true, isOnline: false });

        const mockFn = vi.fn().mockResolvedValue({ id: '1' });

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    queryKey: ['update-beneficiary'],
                    collection: 'beneficiaries',
                    enableOfflineQueue: true,
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ id: '123', name: 'Updated' });
        });

        expect(queueOfflineMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'update',
            })
        );
    });

    it('should not queue when offline queue is disabled', async () => {
        vi.mocked(useOnlineStatus).mockReturnValue({ isOffline: true, isOnline: false });

        const mockFn = vi.fn().mockResolvedValue({ id: '1' });

        const { result } = renderHook(
            () =>
                useAppwriteMutation({
                    mutationFn: mockFn,
                    enableOfflineQueue: false,
                }),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(queueOfflineMutation).not.toHaveBeenCalled();
        expect(mockFn).toHaveBeenCalled();
    });

});
