/**
 * Appwrite Query Hook
 * Uses React Query for Appwrite backend with centralized cache config
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  getQueryOptions,
  type QueryKeyEntity,
  QUERY_STALE_TIMES,
} from '@/lib/api/query-config';

interface UseAppwriteQueryOptions<TData = unknown, TError = unknown>
  extends Omit<UseQueryOptions<TData, TError>, 'queryFn' | 'queryKey'> {
  queryKey: readonly (string | number | boolean | null | undefined | Record<string, unknown>)[];
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  /**
   * Entity tipi - otomatik cache süreleri için
   * @example 'beneficiaries' | 'donations' | 'users'
   */
  entity?: QueryKeyEntity;
}

/**
 * Query hook for Appwrite backend
 *
 * @description
 * Entity parametresi verilirse, otomatik olarak uygun
 * staleTime ve gcTime değerleri uygulanır.
 *
 * @example
 * // Otomatik cache config ile
 * useAppwriteQuery({
 *   queryKey: queryKeys.beneficiaries.list(filters),
 *   queryFn: () => fetchBeneficiaries(filters),
 *   entity: 'beneficiaries',
 * });
 *
 * // Manuel cache config ile
 * useAppwriteQuery({
 *   queryKey: ['custom-query'],
 *   queryFn: () => fetchData(),
 *   staleTime: 60000,
 * });
 */
export function useAppwriteQuery<TData = unknown, TError = unknown>({
  queryKey,
  queryFn,
  enabled = true,
  entity,
  ...options
}: UseAppwriteQueryOptions<TData, TError>) {
  // Entity varsa otomatik cache config uygula
  const entityOptions = entity ? getQueryOptions(entity as keyof typeof QUERY_STALE_TIMES) : {};

  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    enabled,
    ...entityOptions,
    ...options, // Kullanıcı options'ları override edebilir
  });
}

export type { UseAppwriteQueryOptions };

