/**
 * Appwrite Mutation Hook
 * Uses React Query mutations for Appwrite backend
 */

import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOnlineStatus } from './useOnlineStatus';
import { queueOfflineMutation } from '@/lib/offline-sync';
import logger from '@/lib/logger';

interface UseAppwriteMutationOptions<TData = unknown, TVariables = unknown, TError = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey?: (string | number | boolean | null | undefined)[];
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  enableOfflineQueue?: boolean;
  collection?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
}

/**
 * Mutation hook for Appwrite backend with offline queue support
 */
export function useAppwriteMutation<TData = unknown, TVariables = unknown, TError = unknown>({
  mutationFn,
  queryKey,
  successMessage,
  errorMessage = 'İşlem başarısız',
  showSuccessToast = true,
  showErrorToast = true,
  enableOfflineQueue = true,
  collection,
  onSuccess,
  onError,
  ...options
}: UseAppwriteMutationOptions<TData, TVariables, TError>) {
  const queryClient = useQueryClient();
  const { isOffline } = useOnlineStatus();

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      // Check if offline and offline queue is enabled
      if (isOffline && enableOfflineQueue) {
        // Determine mutation type from HTTP method or context
        // Try to infer from queryKey or use 'create' as default
        const mutationType: 'create' | 'update' | 'delete' =
          (queryKey?.[0] as string)?.includes('delete') ||
          (queryKey?.[0] as string)?.includes('remove')
            ? 'delete'
            : (queryKey?.[0] as string)?.includes('update') ||
                (queryKey?.[0] as string)?.includes('edit')
              ? 'update'
              : 'create';

        // Extract collection name from queryKey or use explicit collection option
        const collectionName =
          collection ||
          (Array.isArray(queryKey) && typeof queryKey[0] === 'string' ? queryKey[0] : 'unknown');

        try {
          await queueOfflineMutation({
            type: mutationType,
            collection: collectionName,
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
    onSuccess: (data, variables, context) => {
      // Only invalidate queries and show toasts if mutation was actually executed (not queued)
      if (!isOffline || !enableOfflineQueue) {
        // Invalidate queries
        if (queryKey) {
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
        }

        // Show success toast
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        // Call callbacks
        onSuccess?.(data, variables);
        options.onSuccess?.(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Show error toast
      if (showErrorToast) {
        const message = error instanceof Error ? error.message : typeof error === 'string' ? error : errorMessage;
        toast.error(message);
      }

      // Call callbacks
      onError?.(error, variables);
      options.onError?.(error, variables, context);
    },
  });
}

