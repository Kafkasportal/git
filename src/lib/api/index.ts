/**
 * API Client Index
 *
 * Re-exports Appwrite API clients for backward compatibility.
 * Components can import from '@/lib/api' instead of '@/lib/api/api-client'
 *
 * NOTE: For client components ('use client'), import from '@/lib/api/client' instead
 * to avoid server-only module errors.
 */

import type {
  ConvexResponse,
  QueryParams,
  CreateDocumentData,
  UpdateDocumentData,
} from '@/types/database';

export type { ConvexResponse, QueryParams, CreateDocumentData, UpdateDocumentData };

// Re-export from dedicated modules
export { parametersApi } from './parameters';
export { aidApplicationsApi } from './aid-applications';

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