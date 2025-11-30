'use client';

/**
 * Appwrite API Client - Compatibility Wrapper
 *
 * This file provides backward compatibility for the old API client interface.
 * It wraps the new CRUD factory to maintain existing code compatibility.
 *
 * @deprecated Use the new CRUD factory from './crud-factory' directly for better DRY principle
 * This file will be removed in a future version.
 */

import type {
  QueryParams,
  ConvexResponse,
  CreateDocumentData,
  UpdateDocumentData,
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
  PartnerDocument,
} from '@/types/database';
import type { PermissionValue } from '@/types/permissions';
import { fetchWithCsrf } from '@/lib/csrf-client';

// Import the new CRUD factory
import {
  beneficiaries as beneficiariesCrud,
  donations as donationsCrud,
  tasks as tasksCrud,
  users as usersCrud,
  meetings as meetingsCrud,
  messages as messagesCrud,
  aidApplications as aidApplicationsCrud,
  partners as partnersCrud,
} from './crud-factory';

/**
 * Appwrite-based API client that uses Next.js API routes
 * Wraps the new CRUD factory for backward compatibility
 */
export const apiClient = {
  // Beneficiaries - wrapped from CRUD factory
  beneficiaries: {
    getBeneficiaries: async (
      params?: QueryParams
    ): Promise<ConvexResponse<BeneficiaryDocument[]>> => {
      return beneficiariesCrud.getAll(params);
    },
    getBeneficiary: async (id: string): Promise<ConvexResponse<BeneficiaryDocument>> => {
      return beneficiariesCrud.getById(id);
    },
    createBeneficiary: async (
      data: CreateDocumentData<BeneficiaryDocument>
    ): Promise<ConvexResponse<BeneficiaryDocument>> => {
      return beneficiariesCrud.create(data);
    },
    updateBeneficiary: async (
      id: string,
      data: UpdateDocumentData<BeneficiaryDocument>
    ): Promise<ConvexResponse<BeneficiaryDocument>> => {
      return beneficiariesCrud.update(id, data);
    },
    deleteBeneficiary: async (id: string): Promise<ConvexResponse<null>> => {
      return beneficiariesCrud.delete(id);
    },
    getAidHistory: async (_beneficiaryId: string) => {
      // Stub implementation - returns empty array
      return [];
    },
  },

  // Donations - wrapped from CRUD factory
  donations: {
    getDonations: async (params?: QueryParams): Promise<ConvexResponse<DonationDocument[]>> => {
      return donationsCrud.getAll(params);
    },
    getDonation: async (id: string): Promise<ConvexResponse<DonationDocument>> => {
      return donationsCrud.getById(id);
    },
    createDonation: async (
      data: CreateDocumentData<DonationDocument>
    ): Promise<ConvexResponse<DonationDocument>> => {
      return donationsCrud.create(data);
    },
    updateDonation: async (
      id: string,
      data: UpdateDocumentData<DonationDocument>
    ): Promise<ConvexResponse<DonationDocument>> => {
      return donationsCrud.update(id, data);
    },
    deleteDonation: async (id: string): Promise<ConvexResponse<null>> => {
      return donationsCrud.delete(id);
    },
  },

  // Tasks - wrapped from CRUD factory
  tasks: {
    getTasks: async (params?: QueryParams): Promise<ConvexResponse<TaskDocument[]>> => {
      return tasksCrud.getAll(params);
    },
    getTask: async (id: string): Promise<ConvexResponse<TaskDocument>> => {
      return tasksCrud.getById(id);
    },
    createTask: async (
      data: CreateDocumentData<TaskDocument>
    ): Promise<ConvexResponse<TaskDocument>> => {
      return tasksCrud.create(data);
    },
    updateTask: async (
      id: string,
      data: UpdateDocumentData<TaskDocument>
    ): Promise<ConvexResponse<TaskDocument>> => {
      return tasksCrud.update(id, data);
    },
    updateTaskStatus: async (
      id: string,
      status: TaskDocument['status']
    ): Promise<ConvexResponse<TaskDocument>> => {
      return tasksCrud.update(id, { status } as UpdateDocumentData<TaskDocument>);
    },
    deleteTask: async (id: string): Promise<ConvexResponse<null>> => {
      return tasksCrud.delete(id);
    },
  },

  // Meetings - wrapped from CRUD factory
  meetings: {
    getMeetings: async (params?: QueryParams): Promise<ConvexResponse<MeetingDocument[]>> => {
      return meetingsCrud.getAll(params);
    },
    getMeetingsByTab: async (
      _userId: string,
      tab: string
    ): Promise<ConvexResponse<MeetingDocument[]>> => {
      // Helper method for backward compatibility
      return meetingsCrud.getAll({
        filters: { status: tab === 'all' ? undefined : tab },
      });
    },
    getMeeting: async (id: string): Promise<ConvexResponse<MeetingDocument>> => {
      return meetingsCrud.getById(id);
    },
    createMeeting: async (
      data: CreateDocumentData<MeetingDocument>
    ): Promise<ConvexResponse<MeetingDocument>> => {
      return meetingsCrud.create(data);
    },
    updateMeeting: async (
      id: string,
      data: UpdateDocumentData<MeetingDocument>
    ): Promise<ConvexResponse<MeetingDocument>> => {
      return meetingsCrud.update(id, data);
    },
    updateMeetingStatus: async (
      id: string,
      status: string
    ): Promise<ConvexResponse<MeetingDocument>> => {
      return meetingsCrud.update(id, { status } as UpdateDocumentData<MeetingDocument>);
    },
    deleteMeeting: async (id: string): Promise<ConvexResponse<null>> => {
      return meetingsCrud.delete(id);
    },
  },

  // Meeting Decisions - minimal wrapper (not in CRUD factory yet)
  meetingDecisions: {
    getDecisions: async (
      meetingIdOrParams?: string | { meeting_id?: string; limit?: number }
    ): Promise<ConvexResponse<MeetingDecisionDocument[]>> => {
      let url = '/api/meeting-decisions';
      if (typeof meetingIdOrParams === 'string') {
        url += `?meeting_id=${meetingIdOrParams}`;
      } else if (meetingIdOrParams) {
        const params = new URLSearchParams();
        if (meetingIdOrParams.meeting_id) params.set('meeting_id', meetingIdOrParams.meeting_id);
        if (meetingIdOrParams.limit) params.set('limit', meetingIdOrParams.limit.toString());
        if (params.toString()) url += `?${params.toString()}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return data;
    },
    createDecision: async (
      data: CreateDocumentData<MeetingDecisionDocument>
    ): Promise<ConvexResponse<MeetingDecisionDocument>> => {
      const response = await fetchWithCsrf('/api/meeting-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    },
    updateDecision: async (
      id: string,
      data: UpdateDocumentData<MeetingDecisionDocument>
    ): Promise<ConvexResponse<MeetingDecisionDocument>> => {
      const response = await fetchWithCsrf(`/api/meeting-decisions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    },
    deleteDecision: async (id: string): Promise<ConvexResponse<null>> => {
      const response = await fetchWithCsrf(`/api/meeting-decisions/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      return result;
    },
  },

  // Meeting Action Items - minimal wrapper
  meetingActionItems: {
    getActionItems: async (
      meetingIdOrParams?: string | { meeting_id?: string; limit?: number; filters?: { assigned_to?: string } }
    ): Promise<ConvexResponse<MeetingActionItemDocument[]>> => {
      let url = '/api/meeting-action-items';
      if (typeof meetingIdOrParams === 'string') {
        url += `?meeting_id=${meetingIdOrParams}`;
      } else if (meetingIdOrParams) {
        const params = new URLSearchParams();
        if (meetingIdOrParams.meeting_id) params.set('meeting_id', meetingIdOrParams.meeting_id);
        if (meetingIdOrParams.limit) params.set('limit', meetingIdOrParams.limit.toString());
        if (meetingIdOrParams.filters?.assigned_to) params.set('assigned_to', meetingIdOrParams.filters.assigned_to);
        if (params.toString()) url += `?${params.toString()}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return data;
    },
    createActionItem: async (
      data: CreateDocumentData<MeetingActionItemDocument>
    ): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      const response = await fetchWithCsrf('/api/meeting-action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    },
    updateActionItem: async (
      id: string,
      data: UpdateDocumentData<MeetingActionItemDocument>
    ): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      const response = await fetchWithCsrf(`/api/meeting-action-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    },
    updateActionItemStatus: async (
      id: string,
      payload: { status: MeetingActionItemDocument['status']; changed_by: string; note?: string }
    ): Promise<ConvexResponse<MeetingActionItemDocument>> => {
      const response = await fetchWithCsrf(`/api/meeting-action-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      return result;
    },
    deleteActionItem: async (id: string): Promise<ConvexResponse<null>> => {
      const response = await fetchWithCsrf(`/api/meeting-action-items/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      return result;
    },
  },

  // Workflow Notifications - minimal wrapper
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

      const response = await fetch(`/api/workflow-notifications?${searchParams.toString()}`);
      const data = await response.json();
      return data;
    },
    getNotification: async (id: string): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      const response = await fetch(`/api/workflow-notifications/${id}`);
      const data = await response.json();
      return data;
    },
    createNotification: async (
      data: CreateDocumentData<WorkflowNotificationDocument>
    ): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      const response = await fetchWithCsrf('/api/workflow-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    },
    markNotificationSent: async (
      id: string,
      sent_at?: string
    ): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      const response = await fetchWithCsrf(`/api/workflow-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'gonderildi', sent_at }),
      });
      const result = await response.json();
      return result;
    },
    markNotificationRead: async (
      id: string,
      read_at?: string
    ): Promise<ConvexResponse<WorkflowNotificationDocument>> => {
      const response = await fetchWithCsrf(`/api/workflow-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'okundu', read_at }),
      });
      const result = await response.json();
      return result;
    },
    deleteNotification: async (id: string): Promise<ConvexResponse<null>> => {
      const response = await fetchWithCsrf(`/api/workflow-notifications/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      return result;
    },
  },

  // Messages - wrapped from CRUD factory
  messages: {
    getMessages: async (params?: QueryParams): Promise<ConvexResponse<MessageDocument[]>> => {
      return messagesCrud.getAll(params);
    },
    getMessage: async (id: string): Promise<ConvexResponse<MessageDocument>> => {
      return messagesCrud.getById(id);
    },
    createMessage: async (
      data: CreateDocumentData<MessageDocument>
    ): Promise<ConvexResponse<MessageDocument>> => {
      return messagesCrud.create(data);
    },
    updateMessage: async (
      id: string,
      data: UpdateDocumentData<MessageDocument>
    ): Promise<ConvexResponse<MessageDocument>> => {
      return messagesCrud.update(id, data);
    },
    sendMessage: async (id: string): Promise<ConvexResponse<MessageDocument>> => {
      const response = await fetchWithCsrf(`/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });
      const result = await response.json();
      return result;
    },
    deleteMessage: async (id: string): Promise<ConvexResponse<null>> => {
      return messagesCrud.delete(id);
    },
    markAsRead: async (id: string, _userId: string): Promise<ConvexResponse<MessageDocument>> => {
      return messagesCrud.update(id, { is_read: true } as UpdateDocumentData<MessageDocument>);
    },
  },

  // Users - wrapped from CRUD factory
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
      return usersCrud.getAll(params);
    },
    getUser: async (id: string): Promise<ConvexResponse<UserDocument>> => {
      return usersCrud.getById(id);
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
      return usersCrud.create(data as CreateDocumentData<UserDocument>);
    },
    updateUser: async (
      id: string,
      data: Record<string, unknown>
    ): Promise<ConvexResponse<UserDocument>> => {
      return usersCrud.update(id, data as UpdateDocumentData<UserDocument>);
    },
    deleteUser: async (id: string): Promise<ConvexResponse<null>> => {
      return usersCrud.delete(id);
    },
  },

  // Partners - wrapped from CRUD factory
  partners: {
    getPartners: async (params?: QueryParams): Promise<ConvexResponse<PartnerDocument[]>> => {
      return partnersCrud.getAll(params);
    },
    getPartner: async (id: string): Promise<ConvexResponse<PartnerDocument>> => {
      return partnersCrud.getById(id);
    },
    createPartner: async (
      data: CreateDocumentData<PartnerDocument>
    ): Promise<ConvexResponse<PartnerDocument>> => {
      return partnersCrud.create(data);
    },
    updatePartner: async (
      id: string,
      data: UpdateDocumentData<PartnerDocument>
    ): Promise<ConvexResponse<PartnerDocument>> => {
      return partnersCrud.update(id, data);
    },
    deletePartner: async (id: string): Promise<ConvexResponse<null>> => {
      return partnersCrud.delete(id);
    },
  },

  // Aid Applications - wrapped from CRUD factory
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
      return aidApplicationsCrud.getAll(params);
    },
    getAidApplication: async (
      id: string
    ): Promise<ConvexResponse<AidApplicationDocument | null>> => {
      return aidApplicationsCrud.getById(id);
    },
    createAidApplication: async (
      data: CreateDocumentData<AidApplicationDocument>
    ): Promise<ConvexResponse<AidApplicationDocument>> => {
      return aidApplicationsCrud.create(data);
    },
    updateAidApplication: async (
      id: string,
      data: UpdateDocumentData<AidApplicationDocument>
    ): Promise<ConvexResponse<AidApplicationDocument>> => {
      return aidApplicationsCrud.update(id, data);
    },
    updateStage: async (
      id: string,
      stage: AidApplicationDocument['stage']
    ): Promise<ConvexResponse<AidApplicationDocument>> => {
      return aidApplicationsCrud.update(id, { stage } as UpdateDocumentData<AidApplicationDocument>);
    },
    deleteAidApplication: async (id: string): Promise<ConvexResponse<null>> => {
      return aidApplicationsCrud.delete(id);
    },
  },

  // Monitoring - direct API calls
  monitoring: {
    getEnhancedKPIs: async (): Promise<ConvexResponse<any>> => {
      const response = await fetch('/api/monitoring/kpis');
      const data = await response.json();
      return data;
    },
    getDashboardStats: async (): Promise<ConvexResponse<any>> => {
      const response = await fetch('/api/monitoring/stats');
      const data = await response.json();
      return data;
    },
    getCurrencyRates: async (): Promise<ConvexResponse<any>> => {
      const response = await fetch('/api/monitoring/currency');
      const data = await response.json();
      return data;
    },
  },

  // Analytics - direct API calls
  analytics: {
    trackEvent: async (data: {
      event: string;
      properties?: Record<string, unknown>;
      userId?: string;
      sessionId?: string;
    }): Promise<ConvexResponse<any>> => {
      const response = await fetchWithCsrf('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    },
    getStats: async (params?: { limit?: number }): Promise<ConvexResponse<any>> => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      const response = await fetch(`/api/analytics?${searchParams.toString()}`);
      const data = await response.json();
      return data;
    },
  },
};

// Export individual entity clients for convenience (re-export from crud-factory)
export { 
  beneficiaries,
  donations,
  tasks,
  meetings,
  messages,
  aidApplications,
  partners,
  scholarships,
  createApiClient 
} from './crud-factory';

// Backward compatibility export
export const legacyApiClient = apiClient;
