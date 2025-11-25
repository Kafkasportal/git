'use client';

/**
 * Appwrite API Client
 *
 * Client-side wrapper that calls Next.js API routes which internally use Appwrite.
 * This provides a clean interface for components to use while keeping the actual
 * Appwrite implementation hidden behind API routes.
 *
 * @deprecated Use the new CRUD factory from './crud-factory' for better DRY principle
 */

import type {
  QueryParams,
  ConvexResponse,
  PartnerDocument,
  CreateDocumentData,
  UpdateDocumentData,
} from '@/types/database';
import { getCache } from '@/lib/api-cache';
import type {
  BeneficiaryDocument,
  UserDocument,
  DonationDocument,
  TaskDocument,
  MeetingDocument,
  MeetingDecisionDocument,
  MeetingActionItemDocument,
  WorkflowNotificationDocument,
  MessageDocument,
  AidApplicationDocument,
} from '@/types/database';
import type { PermissionValue } from '@/types/permissions';

// Import the new CRUD factory
import {
  beneficiaries,
  donations,
  tasks,
  users,
  meetings,
  messages,
  aidApplications,
  partners,
  scholarships,
  createApiClient,
} from './crud-factory';

// Re-export the factory-created clients
export {
  beneficiaries,
  donations,
  tasks,
  users,
  meetings,
  messages,
  aidApplications,
  partners,
  scholarships,
  createApiClient,
};

/**
 * Generic API client for making requests to Appwrite API routes
 * Internal use only - not exported to avoid HMR conflicts
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { cache?: boolean },
  cacheKey?: string
): Promise<ConvexResponse<T>> {
  const cache = getCache<ConvexResponse<T>>('api');

  // Try to get from cache first (for GET requests)
  if (!options?.method || options.method === 'GET') {
    const cachedData = cache?.get(cacheKey || endpoint);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        data: null,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    const result: ConvexResponse<T> = {
      data: data.data as T,
      error: null,
      total: data.total,
    };

    // Cache the successful response (for GET requests)
    if (!options?.method || options.method === 'GET') {
      cache?.set(cacheKey || endpoint, result);
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Appwrite-based API client that uses Next.js API routes
 */
export const apiClient = {
  // Beneficiaries
  beneficiaries: {
    getBeneficiaries: async (
      params?: QueryParams
    ): Promise<ConvexResponse<BeneficiaryDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters?.status) searchParams.set('status', String(params.filters.status));
      if (params?.filters?.city) searchParams.set('city', String(params.filters.city));

      const endpoint = `/api/beneficiaries?${searchParams.toString()}`;
      const cacheKey = `beneficiaries:${searchParams.toString()}`;

      return apiRequest<BeneficiaryDocument[]>(endpoint, undefined, cacheKey);
    },
    getBeneficiary: async (id: string): Promise<ConvexResponse<BeneficiaryDocument>> => {
      return apiRequest<BeneficiaryDocument>(`/api/beneficiaries/${id}`);
    },
    createBeneficiary: async (
      data: CreateDocumentData<BeneficiaryDocument>
    ): Promise<ConvexResponse<BeneficiaryDocument>> => {
      return apiRequest<BeneficiaryDocument>('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateBeneficiary: async (
      id: string,
      data: UpdateDocumentData<BeneficiaryDocument>
    ): Promise<ConvexResponse<BeneficiaryDocument>> => {
      return apiRequest<BeneficiaryDocument>(`/api/beneficiaries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteBeneficiary: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/beneficiaries/${id}`, {
        method: 'DELETE',
      });
    },
    getAidHistory: async (_beneficiaryId: string) => {
      // Stub implementation - returns empty array
      return [];
    },
  },

  // Donations
  donations: {
    getDonations: async (params?: QueryParams): Promise<ConvexResponse<DonationDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);

      const endpoint = `/api/donations?${searchParams.toString()}`;
      const cacheKey = `donations:${searchParams.toString()}`;

      return apiRequest<DonationDocument[]>(endpoint, undefined, cacheKey);
    },
    getDonation: async (id: string): Promise<ConvexResponse<DonationDocument>> => {
      return apiRequest<DonationDocument>(`/api/donations/${id}`);
    },
    createDonation: async (
      data: CreateDocumentData<DonationDocument>
    ): Promise<ConvexResponse<DonationDocument>> => {
      return apiRequest<DonationDocument>('/api/donations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateDonation: async (
      id: string,
      data: UpdateDocumentData<DonationDocument>
    ): Promise<ConvexResponse<DonationDocument>> => {
      return apiRequest<DonationDocument>(`/api/donations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteDonation: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/donations/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Tasks
  tasks: {
    getTasks: async (params?: QueryParams): Promise<ConvexResponse<TaskDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters?.status) searchParams.set('status', String(params.filters.status));
      if (params?.filters?.priority) searchParams.set('priority', String(params.filters.priority));
      if (params?.filters?.assigned_to)
        searchParams.set('assigned_to', String(params.filters.assigned_to));

      return apiRequest<TaskDocument[]>(`/api/tasks?${searchParams.toString()}`);
    },
    getTask: async (id: string): Promise<ConvexResponse<TaskDocument>> => {
      return apiRequest<TaskDocument>(`/api/tasks/${id}`);
    },
    createTask: async (
      data: CreateDocumentData<TaskDocument>
    ): Promise<ConvexResponse<TaskDocument>> => {
      return apiRequest<TaskDocument>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTask: async (
      id: string,
      data: UpdateDocumentData<TaskDocument>
    ): Promise<ConvexResponse<TaskDocument>> => {
      return apiRequest<TaskDocument>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    updateTaskStatus: async (
      id: string,
      status: TaskDocument['status']
    ): Promise<ConvexResponse<TaskDocument>> => {
      return apiRequest<TaskDocument>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    deleteTask: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Meetings
  meetings: {
    getMeetings: async (params?: QueryParams): Promise<ConvexResponse<MeetingDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters?.status) searchParams.set('status', String(params.filters.status));

      return apiRequest<MeetingDocument[]>(`/api/meetings?${searchParams.toString()}`);
    },
    getMeetingsByTab: async (
      _userId: string,
      tab: string
    ): Promise<ConvexResponse<MeetingDocument[]>> => {
      // Helper method for backward compatibility
      return apiClient.meetings.getMeetings({
        filters: { status: tab === 'all' ? undefined : tab },
      });
    },
    getMeeting: async (id: string): Promise<ConvexResponse<MeetingDocument>> => {
      return apiRequest<MeetingDocument>(`/api/meetings/${id}`);
    },
    createMeeting: async (
      data: CreateDocumentData<MeetingDocument>
    ): Promise<ConvexResponse<MeetingDocument>> => {
      return apiRequest<MeetingDocument>('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateMeeting: async (
      id: string,
      data: UpdateDocumentData<MeetingDocument>
    ): Promise<ConvexResponse<MeetingDocument>> => {
      return apiRequest<MeetingDocument>(`/api/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    updateMeetingStatus: async (
      id: string,
      status: string
    ): Promise<ConvexResponse<MeetingDocument>> => {
      return apiRequest<MeetingDocument>(`/api/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    deleteMeeting: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/meetings/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Meeting Decisions
  meetingDecisions: {
    getDecisions: async (
      params?: QueryParams
    ): Promise<ConvexResponse<MeetingDecisionDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.filters?.meeting_id) {
        searchParams.set('meeting_id', String(params.filters.meeting_id));
      }
      if (params?.filters?.owner) {
        searchParams.set('owner', String(params.filters.owner));
      }
      if (params?.filters?.status) {
        searchParams.set('status', String(params.filters.status));
      }

      return apiRequest<MeetingDecisionDocument[]>(
        `/api/meeting-decisions?${searchParams.toString()}`
      );
    },
    getDecision: async (id: string): Promise<ConvexResponse<MeetingDecisionDocument>> => {
      return apiRequest<MeetingDecisionDocument>(`/api/meeting-decisions/${id}`);
    },
    createDecision: async (
      data: CreateDocumentData<MeetingDecisionDocument>
    ): Promise<ConvexResponse<MeetingDecisionDocument>> => {
      return apiRequest<MeetingDecisionDocument>('/api/meeting-decisions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateDecision: async (
      id: string,
      data: UpdateDocumentData<MeetingDecisionDocument>
    ): Promise<ConvexResponse<MeetingDecisionDocument>> => {
      return apiRequest<MeetingDecisionDocument>(`/api/meeting-decisions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteDecision: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/meeting-decisions/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Meeting Action Items
  meetingActionItems: {
    getActionItems: async (
      params?: QueryParams
    ): Promise<ConvexResponse<MeetingActionItemDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.filters?.meeting_id) {
        searchParams.set('meeting_id', String(params.filters.meeting_id));
      }
      if (params?.filters?.assigned_to) {
        searchParams.set('assigned_to', String(params.filters.assigned_to));
      }
      if (params?.filters?.status) {
        searchParams.set('status', String(params.filters.status));
      }

      return apiRequest<MeetingActionItemDocument[]>(
        `/api/meeting-action-items?${searchParams.toString()}`
      );
    },
    getActionItem: async (id: string): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      return apiRequest<MeetingActionItemDocument>(`/api/meeting-action-items/${id}`);
    },
    createActionItem: async (
      data: CreateDocumentData<MeetingActionItemDocument>
    ): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      return apiRequest<MeetingActionItemDocument>('/api/meeting-action-items', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateActionItem: async (
      id: string,
      data: UpdateDocumentData<MeetingActionItemDocument>
    ): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      return apiRequest<MeetingActionItemDocument>(`/api/meeting-action-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    updateActionItemStatus: async (
      id: string,
      payload: { status: MeetingActionItemDocument['status']; changed_by: string; note?: string }
    ): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      return apiRequest<MeetingActionItemDocument>(`/api/meeting-action-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    deleteActionItem: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/meeting-action-items/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Workflow Notifications
  workflowNotifications: {
    getNotifications: async (
      params?: QueryParams
    ): Promise<ConvexResponse<WorkflowNotificationDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.filters?.recipient) {
        searchParams.set('recipient', String(params.filters.recipient));
      }
      if (params?.filters?.status) {
        searchParams.set('status', String(params.filters.status));
      }
      if (params?.filters?.category) {
        searchParams.set('category', String(params.filters.category));
      }

      return apiRequest<WorkflowNotificationDocument[]>(
        `/api/workflow-notifications?${searchParams.toString()}`
      );
    },
    getNotification: async (id: string): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      return apiRequest<WorkflowNotificationDocument>(`/api/workflow-notifications/${id}`);
    },
    createNotification: async (
      data: CreateDocumentData<WorkflowNotificationDocument>
    ): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      return apiRequest<WorkflowNotificationDocument>('/api/workflow-notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    markNotificationSent: async (
      id: string,
      sent_at?: string
    ): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      return apiRequest<WorkflowNotificationDocument>(`/api/workflow-notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'gonderildi', sent_at }),
      });
    },
    markNotificationRead: async (
      id: string,
      read_at?: string
    ): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      return apiRequest<WorkflowNotificationDocument>(`/api/workflow-notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'okundu', read_at }),
      });
    },
    deleteNotification: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/workflow-notifications/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Messages
  messages: {
    getMessages: async (params?: QueryParams): Promise<ConvexResponse<MessageDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        });
      }

      return apiRequest<MessageDocument[]>(`/api/messages?${searchParams.toString()}`);
    },
    getMessage: async (id: string): Promise<ConvexResponse<MessageDocument>> => {
      return apiRequest<MessageDocument>(`/api/messages/${id}`);
    },
    createMessage: async (
      data: CreateDocumentData<MessageDocument>
    ): Promise<ConvexResponse<MessageDocument>> => {
      return apiRequest<MessageDocument>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateMessage: async (
      id: string,
      data: UpdateDocumentData<MessageDocument>
    ): Promise<ConvexResponse<MessageDocument>> => {
      return apiRequest<MessageDocument>(`/api/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    sendMessage: async (id: string): Promise<ConvexResponse<MessageDocument>> => {
      return apiRequest<MessageDocument>(`/api/messages/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'send' }),
      });
    },
    deleteMessage: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/messages/${id}`, {
        method: 'DELETE',
      });
    },
    markAsRead: async (id: string, _userId: string): Promise<ConvexResponse<MessageDocument>> => {
      return apiRequest<MessageDocument>(`/api/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_read: true }),
      });
    },
  },

  // Users
  users: {
    getUsers: async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      filters?: {
        role?: string;
        isActive?: boolean;
      };
    }): Promise<ConvexResponse<UserDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters?.role) searchParams.set('role', params.filters.role);
      if (params?.filters?.isActive !== undefined) {
        searchParams.set('isActive', String(params.filters.isActive));
      }

      const query = searchParams.toString();
      return apiRequest<UserDocument[]>(`/api/users${query ? `?${query}` : ''}`);
    },
    getUser: async (id: string): Promise<ConvexResponse<UserDocument>> => {
      return apiRequest<UserDocument>(`/api/users/${id}`);
    },
    createUser: async (data: {
      name: string;
      email: string;
      role: string;
      permissions: PermissionValue[];
      password?: string;
      isActive: boolean;
      phone?: string;
    }): Promise<ConvexResponse<UserDocument>> => {
      return apiRequest<UserDocument>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateUser: async (
      id: string,
      data: Record<string, unknown>
    ): Promise<ConvexResponse<UserDocument>> => {
      return apiRequest<UserDocument>(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteUser: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/users/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Partners
  partners: {
    getPartners: async (params?: QueryParams): Promise<ConvexResponse<PartnerDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters?.type) searchParams.set('type', String(params.filters.type));
      if (params?.filters?.status) searchParams.set('status', String(params.filters.status));
      if (params?.filters?.partnership_type)
        searchParams.set('partnership_type', String(params.filters.partnership_type));

      return apiRequest<PartnerDocument[]>(`/api/partners?${searchParams.toString()}`);
    },
    getPartner: async (id: string): Promise<ConvexResponse<PartnerDocument>> => {
      return apiRequest<PartnerDocument>(`/api/partners/${id}`);
    },
    createPartner: async (
      data: CreateDocumentData<PartnerDocument>
    ): Promise<ConvexResponse<PartnerDocument>> => {
      return apiRequest<PartnerDocument>('/api/partners', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updatePartner: async (
      id: string,
      data: UpdateDocumentData<PartnerDocument>
    ): Promise<ConvexResponse<PartnerDocument>> => {
      return apiRequest<PartnerDocument>(`/api/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deletePartner: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/partners/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Aid Applications
  aidApplications: {
    getAidApplications: async (
      params?: QueryParams & {
        filters?: {
          stage?: string;
          status?: string;
          beneficiary_id?: string;
        };
      }
    ): Promise<ConvexResponse<AidApplicationDocument[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.filters?.stage) searchParams.set('stage', params.filters.stage);
      if (params?.filters?.status) searchParams.set('status', params.filters.status);
      if (params?.filters?.beneficiary_id)
        searchParams.set('beneficiary_id', params.filters.beneficiary_id);

      const endpoint = `/api/aid-applications?${searchParams.toString()}`;
      const cacheKey = `aid-applications:${searchParams.toString()}`;

      return apiRequest<AidApplicationDocument[]>(endpoint, undefined, cacheKey);
    },
    getAidApplication: async (
      id: string
    ): Promise<ConvexResponse<AidApplicationDocument | null>> => {
      return apiRequest<AidApplicationDocument | null>(`/api/aid-applications/${id}`);
    },
    createAidApplication: async (
      data: CreateDocumentData<AidApplicationDocument>
    ): Promise<ConvexResponse<AidApplicationDocument>> => {
      return apiRequest<AidApplicationDocument>('/api/aid-applications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateAidApplication: async (
      id: string,
      data: UpdateDocumentData<AidApplicationDocument>
    ): Promise<ConvexResponse<AidApplicationDocument>> => {
      return apiRequest<AidApplicationDocument>(`/api/aid-applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    updateStage: async (
      id: string,
      stage: AidApplicationDocument['stage']
    ): Promise<ConvexResponse<AidApplicationDocument>> => {
      return apiRequest<AidApplicationDocument>(`/api/aid-applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      });
    },
    deleteAidApplication: async (id: string): Promise<ConvexResponse<null>> => {
      return apiRequest<null>(`/api/aid-applications/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

// Cache Management Utilities
export const cacheUtils = {
  /**
   * Invalidate cache for a specific data type
   */
  invalidateCache: (dataType: string) => {
    const cache = getCache<unknown>(dataType);
    cache.clear();
  },

  /**
   * Invalidate cache for multiple data types
   */
  invalidateCaches: (dataTypes: string[]) => {
    dataTypes.forEach((type) => {
      const cache = getCache<unknown>(type);
      cache.clear();
    });
  },

  /**
   * Get cache statistics
   */
  getCacheStats: (dataType: string) => {
    const cache = getCache<unknown>(dataType);
    return cache.getStats();
  },

  /**
   * Get cache size
   */
  getCacheSize: (dataType: string) => {
    const cache = getCache<unknown>(dataType);
    return cache.size();
  },

  /**
   * Clear all caches
   */
  clearAllCaches: () => {
    ['beneficiaries', 'donations', 'tasks', 'meetings', 'default'].forEach((type) => {
      const cache = getCache<unknown>(type);
      cache.clear();
    });
  },
};

// Backward compatibility export
export const legacyApiClient = apiClient;
