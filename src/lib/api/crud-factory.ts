/**
 * Generic CRUD API Factory
 * DRY principle için tekrarlanan CRUD operasyonlarını tek factory ile yönetir
 */

import type {
  QueryParams,
  ConvexResponse,
  CreateDocumentData,
  UpdateDocumentData,
} from '@/types/database';
import { getCache } from '@/lib/api-cache';

// Cache TTL configuration per entity type
const CACHE_TTL = {
  beneficiaries: 5 * 60 * 1000, // 5 minutes
  donations: 3 * 60 * 1000, // 3 minutes
  tasks: 2 * 60 * 1000, // 2 minutes
  todos: 2 * 60 * 1000, // 2 minutes
  users: 4 * 60 * 1000, // 4 minutes
  meetings: 3 * 60 * 1000, // 3 minutes
  messages: 1 * 60 * 1000, // 1 minute (real-time)
  default: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Helper function to make API requests with caching
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  cacheKey?: string,
  cacheType?: keyof typeof CACHE_TTL
): Promise<ConvexResponse<T>> {
  const cache = cacheType ? getCache<ConvexResponse<T>>(cacheType) : null;
  const ttl = cacheType ? CACHE_TTL[cacheType] : CACHE_TTL.default;

  // Try cache first for GET requests
  if (!options?.method || options.method === 'GET') {
    if (cache && cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(endpoint, { ...defaultOptions, ...options });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data: ConvexResponse<T> = await response.json();

  // Cache successful GET responses
  if ((!options?.method || options.method === 'GET') && cache && cacheKey) {
    cache.set(cacheKey, data, ttl);
  }

  return data;
}

/**
 * Generic CRUD operations interface
 */
export interface CrudOperations<T> {
  getAll: (params?: QueryParams) => Promise<ConvexResponse<T[]>>;
  getById: (id: string) => Promise<ConvexResponse<T>>;
  create: (data: CreateDocumentData<T>) => Promise<ConvexResponse<T>>;
  update: (id: string, data: UpdateDocumentData<T>) => Promise<ConvexResponse<T>>;
  delete: (id: string) => Promise<ConvexResponse<null>>;
}

/**
 * Create CRUD operations for an entity
 */
export function createCrudOperations<T>(
  entityName: string,
  cacheType?: keyof typeof CACHE_TTL
): CrudOperations<T> {
  const baseEndpoint = `/api/${entityName}`;
  const cacheCategory = cacheType || 'default';

  return {
    async getAll(params?: QueryParams): Promise<ConvexResponse<T[]>> {
      const searchParams = new URLSearchParams();

      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);

      // Add all filters
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        });
      }

      const queryString = searchParams.toString();
      const endpoint = queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
      const cacheKey = `${entityName}:${queryString}`;

      return apiRequest<T[]>(endpoint, undefined, cacheKey, cacheCategory);
    },

    async getById(id: string): Promise<ConvexResponse<T>> {
      const endpoint = `${baseEndpoint}/${id}`;
      const cacheKey = `${entityName}:${id}`;

      return apiRequest<T>(endpoint, undefined, cacheKey, cacheCategory);
    },

    async create(data: CreateDocumentData<T>): Promise<ConvexResponse<T>> {
      return apiRequest<T>(baseEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: UpdateDocumentData<T>): Promise<ConvexResponse<T>> {
      return apiRequest<T>(`${baseEndpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<ConvexResponse<null>> {
      return apiRequest<null>(`${baseEndpoint}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}

/**
 * Pre-configured CRUD operations for common entities
 */
export const beneficiaries = createCrudOperations('beneficiaries', 'beneficiaries');
export const donations = createCrudOperations('donations', 'donations');
export const tasks = createCrudOperations('tasks', 'tasks');
export const todos = createCrudOperations('todos', 'todos');
export const users = createCrudOperations('users', 'users');
export const meetings = createCrudOperations('meetings', 'meetings');
export const messages = createCrudOperations('messages', 'messages');
export const aidApplications = createCrudOperations('aid-applications', 'default');
export const partners = createCrudOperations('partners', 'default');
export const scholarships = createCrudOperations('scholarships', 'default');

/**
 * Export factory function for custom entities
 */
export { createCrudOperations as createApiClient };
