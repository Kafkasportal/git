/**
 * API Client Index
 *
 * Re-exports Appwrite API clients for backward compatibility.
 * Components can import from '@/lib/api' instead of '@/lib/api/api-client'
 */

import { appwriteParameters } from '@/lib/appwrite/api';
import { aidApplications } from './crud-factory';
import type {
  AidApplicationDocument,
  CreateDocumentData,
  UpdateDocumentData,
  ConvexResponse,
  QueryParams,
} from '@/types/database';

export type { ConvexResponse, QueryParams, CreateDocumentData, UpdateDocumentData };

// Parameters API - Migrated to Appwrite
export const parametersApi = {
  getAllParameters: async () => {
    try {
      const response = await appwriteParameters.list();
      const flattened = ((response.documents || []) as Array<{ category?: string; key?: string; value?: unknown; [key: string]: unknown }>).map((doc) => ({
        category: doc.category || '',
        key: doc.key || '',
        value: doc.value,
      }));

      return {
        success: true,
        data: flattened,
        total: flattened.length,
        error: null,
      };
    } catch (error) {
      return { success: false, data: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  getParametersByCategory: async (category?: string) => {
    if (!category) {
      return { success: false, data: [], error: 'Kategori gereklidir' };
    }

    try {
      const response = await appwriteParameters.list();
      const items = ((response.documents || []) as Array<{ category?: string; key?: string; value?: unknown; [key: string]: unknown }>)
        .filter((doc) => doc.category === category)
        .map((doc) => ({
          category: doc.category || category,
          key: doc.key || '',
          value: doc.value,
        }));

      return { success: true, data: items, error: null };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  createParameter: async (data?: {
    category?: string;
    key?: string;
    value?: unknown;
    updatedBy?: string;
  }) => {
    if (!data?.category || !data?.key) {
      return { success: false, error: 'Kategori ve anahtar gereklidir' };
    }

    try {
      await appwriteParameters.create({
        category: data.category,
        key: data.key,
        value: data.value,
        updated_by: data.updatedBy,
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  updateParameter: async (
    id: string | undefined,
    data?: { category?: string; key?: string; value?: unknown; updatedBy?: string }
  ) => {
    if (!id || !data?.category || !data?.key) {
      return { success: false, error: 'ID, kategori ve anahtar gereklidir' };
    }

    try {
      await appwriteParameters.update(id, {
        category: data.category,
        key: data.key,
        value: data.value,
        updated_by: data.updatedBy,
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  deleteParameter: async (data?: { category?: string; key?: string; updatedBy?: string }) => {
    if (!data?.category || !data?.key) {
      return { success: false, error: 'Kategori ve anahtar gereklidir' };
    }

    try {
      // Find parameter by category and key, then delete
      const response = await appwriteParameters.list();
      const param = ((response.documents || []) as Array<{ category?: string; key?: string; _id?: string; $id?: string; [key: string]: unknown }>).find(
        (doc) =>
          doc.category === data.category && doc.key === data.key
      );
      
      if (param && (param._id || param.$id)) {
        await appwriteParameters.remove((param._id || param.$id) as string);
      }
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Re-export aidApplications API
export const aidApplicationsApi = {
  getAidApplication: (id: string) => aidApplications.getById(id),
  updateStage: (id: string, stage: AidApplicationDocument['stage']) =>
    aidApplications.update(id, { stage }),
  getAidApplications: (params?: Record<string, unknown>) =>
    aidApplications.getAll(params as QueryParams),
  createAidApplication: (data: CreateDocumentData<AidApplicationDocument>) =>
    aidApplications.create(data),
};

// Export scholarship APIs
export {
  scholarshipsApi,
  scholarshipApplicationsApi,
  scholarshipPaymentsApi,
} from './scholarships';

export { monitoringApi } from './monitoring';
export { analyticsApi } from './analytics';

// Export query configuration
export {
  queryKeys,
  getQueryOptions,
  getInvalidationKeys,
  QUERY_STALE_TIMES,
  QUERY_GC_TIMES,
  defaultQueryOptions,
} from './query-config';
export type { QueryKeys, QueryKeyEntity } from './query-config';

// Export middleware
export {
  buildApiRoute,
  withAuth,
  withModuleAccess,
  withErrorHandler,
  withLogging,
  withRateLimit,
  withValidation,
  withCors,
  withMethodCheck,
  withOfflineSync,
  compose,
} from './middleware';
export type { MiddlewareOptions, RateLimitOptions, ValidatorOptions, RouteHandler, RouteContext } from './middleware';

// Export advanced middleware
export {
  withCache,
  withSecurityHeaders,
  withTiming,
  withCompression,
  withRequestId,
  withETag,
  withRetry,
  withBodyLimit,
  withIpFilter,
  withIdempotency,
  withAdvancedMiddleware,
  clearCache,
} from './advanced-middleware';
export type {
  CacheOptions,
  SecurityHeadersOptions,
  TimingOptions,
  CompressionOptions,
  RetryOptions,
  BodyLimitOptions,
  IpFilterOptions,
  IdempotencyOptions,
  AdvancedMiddlewareOptions,
} from './advanced-middleware';

// Export response types
export {
  isApiSuccess,
  isApiError,
  isPaginatedResponse,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePagination,
  getDefaultPaginationParams,
  errorCodeToStatus,
} from './response-types';
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ErrorDetails,
  ErrorCode,
  ValidationError,
  ResponseMeta,
  PaginationMeta,
  CursorPaginationMeta,
  SortMeta,
  FilterMeta,
  PaginatedResponse,
  CursorPaginatedResponse,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkOperationResponse,
  BulkOperationResult,
  BeneficiaryListResponse,
  Beneficiary,
  DonationListResponse,
  Donation,
  TaskListResponse,
  Task,
  MeetingListResponse,
  Meeting,
  UserListResponse,
  UserInfo,
  DashboardStatsResponse,
  DashboardStats,
  ActivityItem,
  AnalyticsResponse,
  AnalyticsData,
  AnalyticsMetric,
  ChartData,
  ComparisonData,
  FileUploadResponse,
  UploadedFile,
  BulkUploadResponse,
  ExportResponse,
  ExportResult,
  SearchResponse,
  SearchResult,
  FacetResult,
  RealtimeEvent,
  SubscriptionResponse,
  HealthCheckResponse,
  HealthStatus,
} from './response-types';