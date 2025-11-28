/**
 * Appwrite Query Hook
 * Uses React Query for Appwrite backend
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UseAppwriteQueryOptions<TData = unknown, TError = unknown> extends Omit<UseQueryOptions<TData, TError>, 'queryFn' | 'queryKey'> {
  queryKey: (string | number | boolean | null | undefined)[];
  queryFn: () => Promise<TData>;
  enabled?: boolean;
}

/**
 * Query hook for Appwrite backend
 */
export function useAppwriteQuery<TData = unknown, TError = unknown>({
  queryKey,
  queryFn,
  enabled = true,
  ...options
}: UseAppwriteQueryOptions<TData, TError>) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    enabled,
    ...options,
  });
}

