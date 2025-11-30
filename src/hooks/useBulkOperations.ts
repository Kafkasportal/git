'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface UseBulkOperationsOptions {
  /** API endpoint base path */
  endpoint: string;
  /** Callback after successful operation */
  onSuccess?: (result: BulkOperationResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Resource name for messages (e.g., "kayıt", "bağış") */
  resourceName?: string;
}

export function useBulkOperations(options: UseBulkOperationsOptions) {
  const { endpoint, onSuccess, onError, resourceName = 'kayıt' } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select all
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if selected
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  // Bulk delete
  const bulkDelete = useCallback(async (): Promise<BulkOperationResult> => {
    if (selectedIds.size === 0) {
      toast.error('Silmek için öğe seçin');
      return { success: 0, failed: 0, errors: [] };
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const response = await fetch(`${endpoint}/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error('Toplu silme işlemi başarısız');
      }

      const result: BulkOperationResult = await response.json();
      
      setProgress(100);
      clearSelection();
      
      if (result.success > 0) {
        toast.success(`${result.success} ${resourceName} silindi`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} ${resourceName} silinemedi`);
      }

      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Bilinmeyen hata');
      toast.error(err.message);
      onError?.(err);
      return { success: 0, failed: selectedIds.size, errors: [] };
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [selectedIds, endpoint, resourceName, clearSelection, onSuccess, onError]);

  // Bulk update
  const bulkUpdate = useCallback(async (updates: Record<string, unknown>): Promise<BulkOperationResult> => {
    if (selectedIds.size === 0) {
      toast.error('Güncellemek için öğe seçin');
      return { success: 0, failed: 0, errors: [] };
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const response = await fetch(`${endpoint}/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Toplu güncelleme işlemi başarısız');
      }

      const result: BulkOperationResult = await response.json();
      
      setProgress(100);
      clearSelection();
      
      if (result.success > 0) {
        toast.success(`${result.success} ${resourceName} güncellendi`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} ${resourceName} güncellenemedi`);
      }

      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Bilinmeyen hata');
      toast.error(err.message);
      onError?.(err);
      return { success: 0, failed: selectedIds.size, errors: [] };
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [selectedIds, endpoint, resourceName, clearSelection, onSuccess, onError]);

  // Bulk status change
  const bulkStatusChange = useCallback(async (status: string): Promise<BulkOperationResult> => {
    return bulkUpdate({ status });
  }, [bulkUpdate]);

  // Bulk export (selected items only)
  const bulkExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob | null> => {
    if (selectedIds.size === 0) {
      toast.error('Dışa aktarmak için öğe seçin');
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${endpoint}/bulk-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Dışa aktarma işlemi başarısız');
      }

      const blob = await response.blob();
      toast.success(`${selectedIds.size} ${resourceName} dışa aktarıldı`);
      
      return blob;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Bilinmeyen hata');
      toast.error(err.message);
      onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, endpoint, resourceName, onError]);

  return {
    // State
    selectedIds,
    selectedCount: selectedIds.size,
    isLoading,
    progress,
    
    // Selection
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    
    // Operations
    bulkDelete,
    bulkUpdate,
    bulkStatusChange,
    bulkExport,
  };
}

export default useBulkOperations;

