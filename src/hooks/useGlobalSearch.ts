'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface GlobalSearchResult {
  id: string;
  type: 'beneficiary' | 'donation' | 'task' | 'meeting' | 'user' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  metadata?: Record<string, unknown>;
}

export interface UseGlobalSearchOptions {
  debounceMs?: number;
  limit?: number;
}

export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const { debounceMs = 300, limit = 10 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, debounceMs);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const searchResults = data.results || [];
      setResults(searchResults);
      return searchResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    search,
    clearSearch,
  };
}

export default useGlobalSearch;

