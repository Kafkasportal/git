/**
 * API Response Types
 * Comprehensive type definitions for API responses
 * Includes pagination, error handling, and metadata
 */

// ========================================
// BASE RESPONSE TYPES
// ========================================

/**
 * Base success response structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Base error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: ErrorDetails;
  meta?: ResponseMeta;
}

/**
 * Union type for any API response
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ========================================
// ERROR TYPES
// ========================================

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CSRF_ERROR'
  | 'SESSION_EXPIRED';

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  validationErrors?: ValidationError[];
  stack?: string; // Only in development
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
  expected?: string;
}

// ========================================
// METADATA TYPES
// ========================================

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  duration?: number; // ms
  version?: string;
  serverTime?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface CursorPaginationMeta {
  cursor: string | null;
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface SortMeta {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterMeta {
  applied: Record<string, unknown>;
  available: string[];
}

// ========================================
// LIST RESPONSE TYPES
// ========================================

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: PaginationMeta;
  sort?: SortMeta;
  filters?: FilterMeta;
}

/**
 * Cursor-based paginated response
 */
export interface CursorPaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: CursorPaginationMeta;
}

/**
 * Simple list response without pagination
 */
export interface ListResponse<T> extends ApiSuccessResponse<T[]> {
  count: number;
}

// ========================================
// MUTATION RESPONSE TYPES
// ========================================

/**
 * Create operation response
 */
export interface CreateResponse<T> extends ApiSuccessResponse<T> {
  created: true;
}

/**
 * Update operation response
 */
export interface UpdateResponse<T> extends ApiSuccessResponse<T> {
  updated: true;
  previousValue?: Partial<T>;
}

/**
 * Delete operation response
 */
export interface DeleteResponse {
  success: true;
  deleted: true;
  id: string;
  message?: string;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T> {
  success: true;
  results: BulkOperationResult<T>[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export interface BulkOperationResult<T> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

// ========================================
// SPECIFIC ENTITY RESPONSE TYPES
// ========================================

// Beneficiary
export interface BeneficiaryListResponse extends PaginatedResponse<Beneficiary> {
  stats?: {
    totalActive: number;
    totalInactive: number;
    totalAidAmount: number;
  };
}

export interface Beneficiary {
  $id: string;
  name: string;
  tc_no: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  district?: string;
  status: 'TASLAK' | 'AKTIF' | 'PASIF' | 'SILINDI';
  totalAidAmount?: number;
  family_size?: number;
  priority?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  $createdAt?: string;
  $updatedAt?: string;
}

// Donation
export interface DonationListResponse extends PaginatedResponse<Donation> {
  stats?: {
    totalAmount: number;
    donationCount: number;
    averageAmount: number;
    byCurrency: Record<string, number>;
    byType: Record<string, number>;
  };
}

export interface Donation {
  $id: string;
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  donation_type: string;
  payment_method: string;
  donation_purpose: string;
  receipt_number: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

// Task
export interface TaskListResponse extends PaginatedResponse<Task> {
  stats?: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

export interface Task {
  $id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  created_by: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  category?: string;
  tags?: string[];
  is_read: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

// Meeting
export interface MeetingListResponse extends PaginatedResponse<Meeting> {
  stats?: {
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  };
}

export interface Meeting {
  $id: string;
  title: string;
  description?: string;
  meeting_date: string;
  location?: string;
  organizer: string;
  participants: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  meeting_type: 'general' | 'committee' | 'board' | 'other';
  agenda?: string;
  notes?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

// User
export interface UserListResponse extends PaginatedResponse<UserInfo> {
  stats?: {
    totalActive: number;
    totalInactive: number;
    byRole: Record<string, number>;
  };
}

export interface UserInfo {
  $id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  phone?: string;
  avatar?: string;
  labels?: string[];
  lastLoginAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

// ========================================
// DASHBOARD RESPONSE TYPES
// ========================================

export type DashboardStatsResponse = ApiSuccessResponse<DashboardStats>;

export interface DashboardStats {
  beneficiaries: {
    total: number;
    active: number;
    new: number;
    change: number;
  };
  donations: {
    total: number;
    amount: number;
    change: number;
  };
  tasks: {
    pending: number;
    overdue: number;
    completedToday: number;
  };
  meetings: {
    upcoming: number;
    today: number;
  };
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'beneficiary' | 'donation' | 'task' | 'meeting' | 'user';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ========================================
// ANALYTICS RESPONSE TYPES
// ========================================

export type AnalyticsResponse = ApiSuccessResponse<AnalyticsData>;

export interface AnalyticsData {
  period: {
    start: string;
    end: string;
    granularity: 'day' | 'week' | 'month' | 'year';
  };
  metrics: AnalyticsMetric[];
  charts: ChartData[];
  comparisons?: ComparisonData[];
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color?: string;
    }[];
  };
}

export interface ComparisonData {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

// ========================================
// FILE/UPLOAD RESPONSE TYPES
// ========================================

export type FileUploadResponse = ApiSuccessResponse<UploadedFile>;

export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BulkUploadResponse {
  success: true;
  files: UploadedFile[];
  failed: {
    name: string;
    error: string;
  }[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

// ========================================
// EXPORT RESPONSE TYPES
// ========================================

export type ExportResponse = ApiSuccessResponse<ExportResult>;

export interface ExportResult {
  id: string;
  filename: string;
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  size: number;
  url: string;
  expiresAt: string;
  recordCount: number;
}

// ========================================
// SEARCH RESPONSE TYPES
// ========================================

export interface SearchResponse<T> extends ApiSuccessResponse<SearchResult<T>[]> {
  query: string;
  took: number; // ms
  totalHits: number;
  facets?: Record<string, FacetResult[]>;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface FacetResult {
  value: string;
  count: number;
}

// ========================================
// REALTIME RESPONSE TYPES
// ========================================

export interface RealtimeEvent<T> {
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: T;
  timestamp: string;
  userId?: string;
}

export interface SubscriptionResponse {
  success: true;
  subscriptionId: string;
  channels: string[];
}

// ========================================
// HEALTH CHECK RESPONSE
// ========================================

export type HealthCheckResponse = ApiSuccessResponse<HealthStatus>;

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency?: number;
    message?: string;
  }[];
}

// ========================================
// TYPE GUARDS
// ========================================

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return response.success === false;
}

export function isPaginatedResponse<T>(
  response: ApiResponse<T[]>
): response is PaginatedResponse<T> {
  return isApiSuccess(response) && 'pagination' in response;
}

// ========================================
// RESPONSE BUILDERS
// ========================================

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Partial<ResponseMeta>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  options?: {
    sort?: SortMeta;
    filters?: FilterMeta;
    message?: string;
  }
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    sort: options?.sort,
    filters: options?.filters,
    message: options?.message,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

// ========================================
// PAGINATION HELPERS
// ========================================

export function calculatePagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    startIndex,
    endIndex,
  };
}

export function getDefaultPaginationParams(
  query: URLSearchParams
): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(query.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.get('pageSize') || '25', 10)));
  
  return { page, pageSize };
}

// ========================================
// ERROR CODE TO HTTP STATUS MAPPING
// ========================================

export const errorCodeToStatus: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  AUTHENTICATION_ERROR: 401,
  SESSION_EXPIRED: 401,
  CSRF_ERROR: 403,
  AUTHORIZATION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  NETWORK_ERROR: 502,
  TIMEOUT: 504,
};
