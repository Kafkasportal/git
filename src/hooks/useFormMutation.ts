/**
 * Custom hook to standardize form mutations across the application
 * Eliminates duplicate code in form components
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UseMutationOptions } from '@tanstack/react-query';
import logger from '@/lib/logger';
import { useOnlineStatus } from './useOnlineStatus';
import { queueOfflineMutation } from '@/lib/offline-sync';

interface UseFormMutationOptions<TData, TVariables> {
  /**
   * Query key for invalidation after success
   */
  queryKey: string | string[];
  /**
   * Success message to show
   */
  successMessage: string;
  /**
   * Error message prefix
   */
  errorMessage: string;
  /**
   * Mutation function
   */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /**
   * Collection name for offline sync routing (required for offline support)
   */
  collection: string;
  /**
   * Mutation type for offline sync (create/update/delete)
   */
  mutationType?: 'create' | 'update' | 'delete';
  /**
   * Enable offline queue (default: true)
   */
  enableOfflineQueue?: boolean;
  /**
   * Additional options
   */
  options?: UseMutationOptions<TData, unknown, TVariables>;
  /**
   * Callback after successful mutation
   */
  onSuccess?: () => void;
  /**
   * Show success toast (default: true)
   */
  showSuccessToast?: boolean;
  /**
   * Show error toast (default: true)
   */
  showErrorToast?: boolean;
}

/**
 * Custom hook for form mutations with standardized error handling and notifications
 * Supports offline queueing when network is unavailable
 */
export function useFormMutation<TData = unknown, TVariables = unknown>({
  queryKey,
  successMessage,
  errorMessage,
  mutationFn,
  collection,
  mutationType = 'create',
  enableOfflineQueue = true,
  options,
  onSuccess,
  showSuccessToast = true,
  showErrorToast = true,
}: UseFormMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { isOffline } = useOnlineStatus();

  const mutation = useMutation<TData, unknown, TVariables>({
    mutationFn: async (variables: TVariables) => {
      // Check if offline and offline queue is enabled
      if (isOffline && enableOfflineQueue) {
        try {
          await queueOfflineMutation({
            type: mutationType,
            collection,
            data: variables as Record<string, unknown>,
            retryCount: 0,
          });

          toast.info('İşlem offline kuyruğuna eklendi', {
            description: 'İnternet bağlantısı kurulduğunda otomatik olarak senkronize edilecek',
          });

          // Return a mock response to satisfy TypeScript
          return {} as TData;
        } catch (error) {
          logger.error('Failed to queue offline mutation', error as Error);
          throw error;
        }
      }

      // Execute mutation normally if online
      return mutationFn(variables);
    },
    ...options,
    onSuccess: (_data, _variables, _context) => {
      // Only invalidate queries and show toasts if mutation was actually executed (not queued)
      if (!isOffline || !enableOfflineQueue) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });

        // Show success toast
        if (showSuccessToast) {
          toast.success(successMessage);
        }

        // Call custom onSuccess callback
        onSuccess?.();

        // Call additional options' onSuccess
        // Note: Skipping options.onSuccess due to type complexity
      }
    },
    onError: (error: unknown) => {
      // Get error message
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Bilinmeyen hata';

      // Show error toast
      if (showErrorToast) {
        toast.error(`${errorMessage}: ${message}`);
      }

      // Log error for debugging
      logger.error('Form mutation failed', { error, errorMessage });
    },
  });

  return {
    ...mutation,
    isSubmitting: mutation.isPending,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
  };
}

/**
 * Hook for creating form state and validation helpers
 */
export function useFormHelpers() {
  /**
   * Standardized error message extraction
   */
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Bilinmeyen hata';
  };

  /**
   * Check if field has error
   */
  const hasError = (errors: Record<string, unknown>, field: string): boolean => {
    return Boolean(errors[field]);
  };

  /**
   * Get field error message
   */
  const getFieldError = (errors: Record<string, unknown>, field: string): string | undefined => {
    const error = errors[field] as { message?: string } | undefined;
    return error?.message;
  };

  return {
    getErrorMessage,
    hasError,
    getFieldError,
  };
}

export default useFormMutation;
