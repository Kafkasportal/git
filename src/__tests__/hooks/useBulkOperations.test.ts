/**
 * useBulkOperations Hook Tests
 * Tests for bulk selection, delete, update, and export operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import { useBulkOperations, type BulkOperationResult } from '@/hooks/useBulkOperations';
import { toast } from 'sonner';

describe('useBulkOperations', () => {
    const mockOptions = {
        endpoint: '/api/test',
        resourceName: 'kayıt',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Selection', () => {
        it('should initialize with empty selection', () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            expect(result.current.selectedCount).toBe(0);
            expect(result.current.selectedIds.size).toBe(0);
        });

        it('should toggle selection for an item', () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.toggleSelection('item-1');
            });

            expect(result.current.selectedCount).toBe(1);
            expect(result.current.isSelected('item-1')).toBe(true);

            // Toggle off
            act(() => {
                result.current.toggleSelection('item-1');
            });

            expect(result.current.selectedCount).toBe(0);
            expect(result.current.isSelected('item-1')).toBe(false);
        });

        it('should select multiple items', () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.toggleSelection('item-1');
                result.current.toggleSelection('item-2');
                result.current.toggleSelection('item-3');
            });

            expect(result.current.selectedCount).toBe(3);
            expect(result.current.isSelected('item-1')).toBe(true);
            expect(result.current.isSelected('item-2')).toBe(true);
            expect(result.current.isSelected('item-3')).toBe(true);
        });

        it('should select all items at once', () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2', 'item-3', 'item-4']);
            });

            expect(result.current.selectedCount).toBe(4);
        });

        it('should clear all selections', () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2', 'item-3']);
            });

            expect(result.current.selectedCount).toBe(3);

            act(() => {
                result.current.clearSelection();
            });

            expect(result.current.selectedCount).toBe(0);
        });
    });

    describe('Bulk Delete', () => {
        it('should show error when no items selected', async () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            await act(async () => {
                await result.current.bulkDelete();
            });

            expect(toast.error).toHaveBeenCalledWith('Silmek için öğe seçin');
        });

        it('should call delete endpoint with selected ids', async () => {
            const mockResult: BulkOperationResult = { success: 2, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            await act(async () => {
                await result.current.bulkDelete();
            });

            expect(globalThis.fetch).toHaveBeenCalledWith('/api/test/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('item-1'),
            });
        });

        it('should show success toast on successful delete', async () => {
            const mockResult: BulkOperationResult = { success: 3, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2', 'item-3']);
            });

            await act(async () => {
                await result.current.bulkDelete();
            });

            expect(toast.success).toHaveBeenCalledWith('3 kayıt silindi');
        });

        it('should clear selection after successful delete', async () => {
            const mockResult: BulkOperationResult = { success: 2, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            await act(async () => {
                await result.current.bulkDelete();
            });

            expect(result.current.selectedCount).toBe(0);
        });

        it('should handle delete errors', async () => {
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: false,
            });

            const onError = vi.fn();
            const { result } = renderHook(() => useBulkOperations({ ...mockOptions, onError }));

            act(() => {
                result.current.selectAll(['item-1']);
            });

            await act(async () => {
                await result.current.bulkDelete();
            });

            expect(toast.error).toHaveBeenCalledWith('Toplu silme işlemi başarısız');
            expect(onError).toHaveBeenCalled();
        });

        it('should call onSuccess callback', async () => {
            const mockResult: BulkOperationResult = { success: 1, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const onSuccess = vi.fn();
            const { result } = renderHook(() => useBulkOperations({ ...mockOptions, onSuccess }));

            act(() => {
                result.current.selectAll(['item-1']);
            });

            await act(async () => {
                await result.current.bulkDelete();
            });

            expect(onSuccess).toHaveBeenCalledWith(mockResult);
        });
    });

    describe('Bulk Update', () => {
        it('should show error when no items selected', async () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            await act(async () => {
                await result.current.bulkUpdate({ status: 'active' });
            });

            expect(toast.error).toHaveBeenCalledWith('Güncellemek için öğe seçin');
        });

        it('should call update endpoint with updates', async () => {
            const mockResult: BulkOperationResult = { success: 2, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            await act(async () => {
                await result.current.bulkUpdate({ status: 'completed' });
            });

            expect(globalThis.fetch).toHaveBeenCalledWith('/api/test/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('completed'),
            });
        });

        it('should show success toast on successful update', async () => {
            const mockResult: BulkOperationResult = { success: 2, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            await act(async () => {
                await result.current.bulkUpdate({ status: 'active' });
            });

            expect(toast.success).toHaveBeenCalledWith('2 kayıt güncellendi');
        });

        it('should show error toast for partial failures', async () => {
            const mockResult: BulkOperationResult = {
                success: 1,
                failed: 1,
                errors: [{ id: 'item-2', error: 'Not found' }]
            };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            await act(async () => {
                await result.current.bulkUpdate({ status: 'active' });
            });

            expect(toast.success).toHaveBeenCalledWith('1 kayıt güncellendi');
            expect(toast.error).toHaveBeenCalledWith('1 kayıt güncellenemedi');
        });
    });

    describe('Bulk Status Change', () => {
        it('should call bulkUpdate with status', async () => {
            const mockResult: BulkOperationResult = { success: 1, failed: 0, errors: [] };
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1']);
            });

            await act(async () => {
                await result.current.bulkStatusChange('completed');
            });

            expect(globalThis.fetch).toHaveBeenCalledWith('/api/test/bulk', expect.objectContaining({
                method: 'PATCH',
            }));
        });
    });

    describe('Bulk Export', () => {
        it('should show error when no items selected', async () => {
            const { result } = renderHook(() => useBulkOperations(mockOptions));

            await act(async () => {
                await result.current.bulkExport('csv');
            });

            expect(toast.error).toHaveBeenCalledWith('Dışa aktarmak için öğe seçin');
        });

        it('should call export endpoint', async () => {
            const mockBlob = new Blob(['test'], { type: 'text/csv' });
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            let blob: Blob | null = null;
            await act(async () => {
                blob = await result.current.bulkExport('csv');
            });

            expect(globalThis.fetch).toHaveBeenCalledWith('/api/test/bulk-export', expect.objectContaining({
                method: 'POST',
            }));
            expect(blob).not.toBeNull();
        });

        it('should show success toast on export', async () => {
            const mockBlob = new Blob(['test'], { type: 'text/csv' });
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
            });

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1', 'item-2']);
            });

            await act(async () => {
                await result.current.bulkExport('excel');
            });

            expect(toast.success).toHaveBeenCalledWith('2 kayıt dışa aktarıldı');
        });
    });

    describe('Loading State', () => {
        it('should set isLoading during operations', async () => {
            let resolvePromise: () => void;
            const fetchPromise = new Promise<void>((resolve) => {
                resolvePromise = resolve;
            });

            (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
                fetchPromise.then(() => ({
                    ok: true,
                    json: () => Promise.resolve({ success: 1, failed: 0, errors: [] }),
                }))
            );

            const { result } = renderHook(() => useBulkOperations(mockOptions));

            act(() => {
                result.current.selectAll(['item-1']);
            });

            // Start delete
            let deletePromise: Promise<BulkOperationResult>;
            act(() => {
                deletePromise = result.current.bulkDelete();
            });

            expect(result.current.isLoading).toBe(true);

            // Complete fetch
            await act(async () => {
                resolvePromise!();
                await deletePromise;
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });
});
