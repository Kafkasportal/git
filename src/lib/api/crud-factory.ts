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
import { fetchWithCsrf } from '@/lib/csrf';

// Cache TTL configuration per entity type - Optimized for better performance
const CACHE_TTL = {
  beneficiaries: 15 * 60 * 1000, // 15 minutes (increased from 5)
  donations: 10 * 60 * 1000, // 10 minutes (increased from 3)
  tasks: 2 * 60 * 1000, // 2 minutes
  todos: 2 * 60 * 1000, // 2 minutes
  users: 20 * 60 * 1000, // 20 minutes (increased from 4)
  meetings: 10 * 60 * 1000, // 10 minutes (increased from 3)
  messages: 1 * 60 * 1000, // 1 minute (real-time)
  default: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Helper function to make API requests with caching and CSRF protection
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

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use fetchWithCsrf for mutations (POST, PUT, DELETE)
  const method = options?.method || 'GET';
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  let response: Response;
  if (isMutation) {
    // fetchWithCsrf handles CSRF token automatically
    response = await fetchWithCsrf(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options?.headers as Record<string, string>),
      },
    });
  } else {
    response = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options?.headers as Record<string, string>),
      },
    });
  }

  // Parse response body first to get detailed error message
  let data: ConvexResponse<T>;
  try {
    data = await response.json();
  } catch {
    // If JSON parsing fails, throw generic error
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    throw new Error('Invalid JSON response from API');
  }

  if (!response.ok) {
    // Extract error message from response body if available
    const errorMessage = data?.error || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

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
 * Typed exports for better TypeScript support
 */
import type {
  BeneficiaryDocument,
  DonationDocument,
  TaskDocument,
  TodoDocument,
  UserDocument,
  MeetingDocument,
  MessageDocument,
  AidApplicationDocument,
  PartnerDocument,
  ScholarshipDocument,
} from '@/types/database';

export const beneficiaries = createCrudOperations<BeneficiaryDocument>('beneficiaries', 'beneficiaries');
export const donations = createCrudOperations<DonationDocument>('donations', 'donations');
export const tasks = createCrudOperations<TaskDocument>('tasks', 'tasks');
export const todos = createCrudOperations<TodoDocument>('todos', 'todos');
export const users = createCrudOperations<UserDocument>('users', 'users');
export const meetings = createCrudOperations<MeetingDocument>('meetings', 'meetings');
export const messages = createCrudOperations<MessageDocument>('messages', 'messages');
export const aidApplications = createCrudOperations<AidApplicationDocument>('aid-applications', 'default');
export const partners = createCrudOperations<PartnerDocument>('partners', 'default');
export const scholarships = createCrudOperations<ScholarshipDocument>('scholarships', 'default');

/**
 * Export factory function for custom entities
 */
export { createCrudOperations as createApiClient };
