/* istanbul ignore file */
/**
 * Client-safe API exports
 *
 * This file exports only client-safe APIs that don't use server-only modules.
 * Use this file for imports in 'use client' components.
 *
 * For server-side code (API routes, server components), use '@/lib/api' directly.
 */

// Marker export so this barrel file is counted in coverage.
export const __clientApiExports = true;

// Parameters API (client-safe - uses appwrite client)
export { parametersApi } from './parameters';

// Monitoring API (client-safe - uses fetch)
export { monitoringApi } from './monitoring';

// Analytics API (client-safe - uses fetch)
export { analyticsApi } from './analytics';

// Scholarship APIs (client-safe - uses appwrite client)
export {
  scholarshipsApi,
  scholarshipApplicationsApi,
  scholarshipPaymentsApi,
} from './scholarships';

// Aid Applications API (client-safe - uses crud-factory)
export { aidApplicationsApi } from './aid-applications';

// Query configuration (client-safe)
export {
  queryKeys,
  getQueryOptions,
  getInvalidationKeys,
  QUERY_STALE_TIMES,
  QUERY_GC_TIMES,
  defaultQueryOptions,
} from './query-config';
export type { QueryKeys, QueryKeyEntity } from './query-config';

// Response types (client-safe - only types)
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

// Database types
export type { ConvexResponse, QueryParams, CreateDocumentData, UpdateDocumentData } from '@/types/database';
