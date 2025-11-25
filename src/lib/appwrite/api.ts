/**
 * Appwrite API Helper
 * Provides a unified interface for calling Appwrite from API routes
 */

import { ID, Query } from 'appwrite';
import { serverClient, getServerStorage } from './server';
import { appwriteConfig, type CollectionName } from './config';
import type {
  BeneficiaryCreateInput,
  BeneficiaryUpdateInput,
  DonationCreateInput,
  DonationUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
  TodoCreateInput,
  TodoUpdateInput,
  MeetingCreateInput,
  MeetingUpdateInput,
  MeetingDecisionCreateInput,
  MeetingDecisionUpdateInput,
  MeetingActionItemCreateInput,
  MeetingActionItemUpdateInput,
  MessageCreateInput,
  MessageUpdateInput,
  UserCreateInput,
  UserUpdateInput,
  AidApplicationCreateInput,
  AidApplicationUpdateInput,
  FinanceRecordCreateInput,
  FinanceRecordUpdateInput,
  PartnerCreateInput,
  PartnerUpdateInput,
  WorkflowNotificationCreateInput,
} from '@/lib/api/types';
import logger from '@/lib/logger';
import { Databases } from 'node-appwrite';

export interface AppwriteQueryParams {
  limit?: number;
  skip?: number;
  page?: number;
  search?: string;
  status?: string;
  city?: string;
  [key: string]: unknown;
}

/**
 * Convert Next.js query params to Appwrite queries
 */
export function normalizeQueryParams(searchParams: URLSearchParams): AppwriteQueryParams {
  const params: AppwriteQueryParams = {};

  const limitParam = searchParams.get('limit');
  const skipParam = searchParams.get('skip');
  const pageParam = searchParams.get('page');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const city = searchParams.get('city');

  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      params.limit = Math.min(parsedLimit, 100);
    }
  }

  if (skipParam) {
    const parsedSkip = parseInt(skipParam, 10);
    if (!Number.isNaN(parsedSkip) && parsedSkip >= 0) {
      params.skip = parsedSkip;
    }
  }

  if (pageParam && params.skip === undefined) {
    const parsedPage = parseInt(pageParam, 10);
    if (!Number.isNaN(parsedPage) && parsedPage > 0) {
      const limit = params.limit ?? 20;
      params.skip = (parsedPage - 1) * limit;
    }
  }

  if (search) params.search = search;
  if (status) params.status = status;
  if (city) params.city = city;

  return params;
}

/**
 * Build Appwrite queries from params
 */
function buildQueries(params?: AppwriteQueryParams): string[] {
  const queries: string[] = [];

  if (!params) return queries;

  if (params.limit) {
    queries.push(Query.limit(params.limit));
  }

  if (params.skip) {
    queries.push(Query.offset(params.skip));
  }

  if (params.search) {
    queries.push(Query.search('name', params.search));
  }

  if (params.status) {
    queries.push(Query.equal('status', params.status));
  }

  if (params.city) {
    queries.push(Query.equal('city', params.city));
  }

  return queries;
}

/**
 * Get databases instance
 */
function getDatabases() {
  if (!serverClient) {
    throw new Error('Appwrite server client not initialized');
  }
  return new Databases(serverClient);
}

/**
 * Generic list operation
 */
async function listDocuments<T>(
  collectionName: CollectionName,
  params?: AppwriteQueryParams
): Promise<{ documents: T[]; total: number }> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];
  const queries = buildQueries(params);

  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collectionId,
      queries
    );

    return {
      documents: response.documents as T[],
      total: response.total,
    };
  } catch (error) {
    logger.error(`Failed to list ${collectionName}`, { error });
    throw error;
  }
}

/**
 * Generic get operation
 */
async function getDocument<T>(collectionName: CollectionName, id: string): Promise<T | null> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    const document = await databases.getDocument(appwriteConfig.databaseId, collectionId, id);
    return document as T;
  } catch (error) {
    logger.error(`Failed to get ${collectionName}`, { error, id });
    return null;
  }
}

/**
 * Generic create operation
 */
async function createDocument<T>(
  collectionName: CollectionName,
  data: Record<string, unknown>
): Promise<T> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    const document = await databases.createDocument(
      appwriteConfig.databaseId,
      collectionId,
      ID.unique(),
      data
    );
    return document as T;
  } catch (error) {
    logger.error(`Failed to create ${collectionName}`, { error });
    throw error;
  }
}

/**
 * Generic update operation
 */
async function updateDocument<T>(
  collectionName: CollectionName,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    const document = await databases.updateDocument(
      appwriteConfig.databaseId,
      collectionId,
      id,
      data
    );
    return document as T;
  } catch (error) {
    logger.error(`Failed to update ${collectionName}`, { error, id });
    throw error;
  }
}

/**
 * Generic delete operation
 */
async function deleteDocument(collectionName: CollectionName, id: string): Promise<void> {
  const databases = getDatabases();
  const collectionId = appwriteConfig.collections[collectionName];

  try {
    await databases.deleteDocument(appwriteConfig.databaseId, collectionId, id);
  } catch (error) {
    logger.error(`Failed to delete ${collectionName}`, { error, id });
    throw error;
  }
}

/**
 * Beneficiaries API
 */
type AuthContext = {
  auth?: {
    userId: string;
    role: string;
  };
};

export const appwriteBeneficiaries = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('beneficiaries', params);
  },
  get: async (id: string) => {
    return await getDocument('beneficiaries', id);
  },
  getByTcNo: async (tc_no: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.beneficiaries;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('tc_no', tc_no),
        Query.limit(1),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      logger.error('Failed to get beneficiary by TC no', { error, tc_no });
      return null;
    }
  },
  create: async (data: BeneficiaryCreateInput, context: AuthContext = {}) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
      ...(context.auth ? { created_by: context.auth.userId } : {}),
    };
    return await createDocument('beneficiaries', createData);
  },
  update: async (id: string, data: BeneficiaryUpdateInput, context: AuthContext = {}) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
      ...(context.auth ? { updated_by: context.auth.userId } : {}),
    };
    return await updateDocument('beneficiaries', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('beneficiaries', id);
  },
};

/**
 * Donations API
 */
export const appwriteDonations = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('donations', params);
  },
  get: async (id: string) => {
    return await getDocument('donations', id);
  },
  getByReceiptNumber: async (receipt_number: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.donations;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('receipt_number', receipt_number),
        Query.limit(1),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      logger.error('Failed to get donation by receipt number', { error, receipt_number });
      return null;
    }
  },
  create: async (data: DonationCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('donations', createData);
  },
  update: async (id: string, data: DonationUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('donations', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('donations', id);
  },
};

/**
 * Tasks API
 */
export const appwriteTasks = {
  list: async (params?: AppwriteQueryParams & { assigned_to?: string; created_by?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.tasks;
    const queries = buildQueries(params);

    if (params?.assigned_to) {
      queries.push(Query.equal('assigned_to', params.assigned_to));
    }
    if (params?.created_by) {
      queries.push(Query.equal('created_by', params.created_by));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list tasks', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('tasks', id);
  },
  create: async (data: TaskCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('tasks', createData);
  },
  update: async (id: string, data: TaskUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('tasks', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('tasks', id);
  },
};

/**
 * Todos API
 */
export const appwriteTodos = {
  list: async (params?: AppwriteQueryParams & { created_by?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.todos;
    const queries = buildQueries(params);

    if (params?.created_by) {
      queries.push(Query.equal('created_by', params.created_by));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list todos', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('todos', id);
  },
  create: async (data: TodoCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('todos', createData);
  },
  update: async (id: string, data: TodoUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('todos', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('todos', id);
  },
};

/**
 * Meetings API
 */
export const appwriteMeetings = {
  list: async (params?: AppwriteQueryParams & { organizer?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.meetings;
    const queries = buildQueries(params);

    if (params?.organizer) {
      queries.push(Query.equal('organizer', params.organizer));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list meetings', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('meetings', id);
  },
  create: async (data: MeetingCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('meetings', createData);
  },
  update: async (id: string, data: MeetingUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('meetings', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('meetings', id);
  },
};

/**
 * Meeting Decisions API
 */
export const appwriteMeetingDecisions = {
  list: async (params?: {
    meeting_id?: string;
    owner?: string;
    status?: 'acik' | 'devam' | 'kapatildi';
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.meetingDecisions;
    const queries: string[] = [];

    if (params?.meeting_id) {
      queries.push(Query.equal('meeting_id', params.meeting_id));
    }
    if (params?.owner) {
      queries.push(Query.equal('owner', params.owner));
    }
    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list meeting decisions', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('meetingDecisions', id);
  },
  create: async (data: MeetingDecisionCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument('meetingDecisions', createData);
  },
  update: async (id: string, data: MeetingDecisionUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('meetingDecisions', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('meetingDecisions', id);
  },
};

/**
 * Meeting Action Items API
 */
export const appwriteMeetingActionItems = {
  list: async (params?: {
    meeting_id?: string;
    assigned_to?: string;
    status?: 'beklemede' | 'devam' | 'hazir' | 'iptal';
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.meetingActionItems;
    const queries: string[] = [];

    if (params?.meeting_id) {
      queries.push(Query.equal('meeting_id', params.meeting_id));
    }
    if (params?.assigned_to) {
      queries.push(Query.equal('assigned_to', params.assigned_to));
    }
    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list meeting action items', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('meetingActionItems', id);
  },
  create: async (data: MeetingActionItemCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument('meetingActionItems', createData);
  },
  update: async (id: string, data: MeetingActionItemUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('meetingActionItems', id, updateData);
  },
  updateStatus: async (
    id: string,
    payload: {
      status: 'beklemede' | 'devam' | 'hazir' | 'iptal';
      changed_by: string;
      note?: string;
    }
  ) => {
    const updateData: Record<string, unknown> = {
      status: payload.status,
      changed_by: payload.changed_by,
      ...(payload.note ? { note: payload.note } : {}),
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('meetingActionItems', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('meetingActionItems', id);
  },
};

/**
 * Workflow Notifications API
 */
export const appwriteWorkflowNotifications = {
  list: async (params?: {
    recipient?: string;
    status?: 'beklemede' | 'gonderildi' | 'okundu';
    category?: 'meeting' | 'gorev' | 'rapor' | 'hatirlatma';
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.workflowNotifications;
    const queries: string[] = [];

    if (params?.recipient) {
      queries.push(Query.equal('recipient', params.recipient));
    }
    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }
    if (params?.category) {
      queries.push(Query.equal('category', params.category));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list workflow notifications', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('workflowNotifications', id);
  },
  create: async (data: WorkflowNotificationCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument('workflowNotifications', createData);
  },
  markAsSent: async (id: string, sent_at?: string) => {
    const updateData: Record<string, unknown> = {
      status: 'gonderildi',
      sent_at: sent_at || new Date().toISOString(),
    };
    return await updateDocument('workflowNotifications', id, updateData);
  },
  markAsRead: async (id: string, read_at?: string) => {
    const updateData: Record<string, unknown> = {
      status: 'okundu',
      read_at: read_at || new Date().toISOString(),
    };
    return await updateDocument('workflowNotifications', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('workflowNotifications', id);
  },
};

/**
 * Messages API
 */
export const appwriteMessages = {
  list: async (params?: AppwriteQueryParams & { sender?: string; recipient?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.messages;
    const queries = buildQueries(params);

    if (params?.sender) {
      queries.push(Query.equal('sender', params.sender));
    }
    if (params?.recipient) {
      queries.push(Query.equal('recipients', params.recipient));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list messages', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('messages', id);
  },
  create: async (data: MessageCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      sent_at: new Date().toISOString(),
    };
    return await createDocument('messages', createData);
  },
  update: async (id: string, data: MessageUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('messages', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('messages', id);
  },
};

/**
 * Users API
 */
export const appwriteUsers = {
  list: async (params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
    cursor?: string;
  }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.users;
    const queries: string[] = [];

    if (params?.limit) {
      queries.push(Query.limit(params.limit));
    }
    if (params?.role) {
      queries.push(Query.equal('role', params.role));
    }
    if (params?.isActive !== undefined) {
      queries.push(Query.equal('isActive', params.isActive));
    }
    if (params?.search) {
      queries.push(Query.search('name', params.search));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list users', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('users', id);
  },
  getByEmail: async (email: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.users;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('email', email),
        Query.limit(1),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      logger.error('Failed to get user by email', { error, email });
      return null;
    }
  },
  create: async (data: UserCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('users', createData);
  },
  update: async (id: string, data: UserUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('users', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('users', id);
  },
};

/**
 * Aid Applications API
 */
export const appwriteAidApplications = {
  list: async (params?: AppwriteQueryParams & { stage?: string; beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.aidApplications;
    const queries = buildQueries(params);

    if (params?.stage) {
      queries.push(Query.equal('stage', params.stage));
    }
    if (params?.beneficiary_id) {
      queries.push(Query.equal('beneficiary_id', params.beneficiary_id));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list aid applications', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('aidApplications', id);
  },
  create: async (data: AidApplicationCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('aidApplications', createData);
  },
  update: async (id: string, data: AidApplicationUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('aidApplications', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('aidApplications', id);
  },
};

/**
 * Finance Records API
 */
export const appwriteFinanceRecords = {
  list: async (
    params?: AppwriteQueryParams & {
      record_type?: 'income' | 'expense';
      created_by?: string;
    }
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.financeRecords;
    const queries = buildQueries(params);

    if (params?.record_type) {
      queries.push(Query.equal('record_type', params.record_type));
    }
    if (params?.created_by) {
      queries.push(Query.equal('created_by', params.created_by));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list finance records', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('financeRecords', id);
  },
  create: async (data: FinanceRecordCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('financeRecords', createData);
  },
  update: async (id: string, data: FinanceRecordUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('financeRecords', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('financeRecords', id);
  },
};

/**
 * Partners API
 */
export const appwritePartners = {
  list: async (
    params?: AppwriteQueryParams & {
      type?: 'organization' | 'individual' | 'sponsor';
      status?: 'active' | 'inactive' | 'pending';
      partnership_type?: 'donor' | 'supplier' | 'volunteer' | 'sponsor' | 'service_provider';
    }
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.partners;
    const queries = buildQueries(params);

    if (params?.type) {
      queries.push(Query.equal('type', params.type));
    }
    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }
    if (params?.partnership_type) {
      queries.push(Query.equal('partnership_type', params.partnership_type));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list partners', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('partners', id);
  },
  create: async (data: PartnerCreateInput) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('partners', createData);
  },
  update: async (id: string, data: PartnerUpdateInput) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('partners', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('partners', id);
  },
};

/**
 * System Settings API
 */
export const appwriteSystemSettings = {
  getAll: async () => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, []);
      // Group by category
      const grouped: Record<string, Record<string, unknown>> = {};
      response.documents.forEach((doc: Record<string, unknown>) => {
        const category = doc.category as string;
        const key = doc.key as string;
        if (!grouped[category]) {
          grouped[category] = {};
        }
        grouped[category][key] = doc.value;
      });
      return grouped;
    } catch (error) {
      logger.error('Failed to get all system settings', { error });
      throw error;
    }
  },
  getByCategory: async (category: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('category', category),
      ]);
      const settings: Record<string, unknown> = {};
      response.documents.forEach((doc: Record<string, unknown>) => {
        settings[doc.key as string] = doc.value;
      });
      return settings;
    } catch (error) {
      logger.error('Failed to get system settings by category', { error, category });
      throw error;
    }
  },
  get: async (category: string, key: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('category', category),
        Query.equal('key', key),
        Query.limit(1),
      ]);
      return response.documents[0]?.value || null;
    } catch (error) {
      logger.error('Failed to get system setting', { error, category, key });
      return null;
    }
  },
  getSetting: async (category: string, key: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('category', category),
        Query.equal('key', key),
        Query.limit(1),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      logger.error('Failed to get system setting', { error, category, key });
      return null;
    }
  },
  updateSettings: async (
    category: string,
    settings: Record<string, unknown>,
    updatedBy?: string
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    const updatedAt = new Date().toISOString();

    try {
      // Process each setting
      for (const [key, value] of Object.entries(settings)) {
        // Check if setting exists
        const existing = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          Query.equal('category', category),
          Query.equal('key', key),
          Query.limit(1),
        ]);

        const settingData: Record<string, unknown> = {
          category,
          key,
          value,
          updated_at: updatedAt,
          ...(updatedBy ? { updated_by: updatedBy } : {}),
        };

        if (existing.documents.length > 0) {
          // Update existing
          await databases.updateDocument(
            appwriteConfig.databaseId,
            collectionId,
            existing.documents[0].$id,
            settingData
          );
        } else {
          // Create new
          await databases.createDocument(
            appwriteConfig.databaseId,
            collectionId,
            ID.unique(),
            settingData
          );
        }
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to update system settings', { error, category });
      throw error;
    }
  },
  updateSetting: async (category: string, key: string, value: unknown, updatedBy?: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    const updatedAt = new Date().toISOString();

    try {
      // Check if setting exists
      const existing = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('category', category),
        Query.equal('key', key),
        Query.limit(1),
      ]);

      const settingData: Record<string, unknown> = {
        category,
        key,
        value,
        updated_at: updatedAt,
        ...(updatedBy ? { updated_by: updatedBy } : {}),
      };

      if (existing.documents.length > 0) {
        // Update existing
        await databases.updateDocument(
          appwriteConfig.databaseId,
          collectionId,
          existing.documents[0].$id,
          settingData
        );
      } else {
        // Create new
        await databases.createDocument(
          appwriteConfig.databaseId,
          collectionId,
          ID.unique(),
          settingData
        );
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to update system setting', { error, category, key });
      throw error;
    }
  },
  resetSettings: async (category?: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.systemSettings;
    try {
      const queries: string[] = [];
      if (category) {
        queries.push(Query.equal('category', category));
      }
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      // Delete all matching settings
      await Promise.all(
        response.documents.map((doc) =>
          databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
        )
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset system settings', { error, category });
      throw error;
    }
  },
};

/**
 * Theme Presets API
 */
export const appwriteThemePresets = {
  list: async () => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.themePresets;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, []);
      return response.documents;
    } catch (error) {
      logger.error('Failed to list theme presets', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('themePresets', id);
  },
  getDefault: async () => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.themePresets;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('is_default', true),
        Query.limit(1),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      logger.error('Failed to get default theme preset', { error });
      return null;
    }
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      created_at: new Date().toISOString(),
    };
    return await createDocument('themePresets', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('themePresets', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('themePresets', id);
  },
};

/**
 * Files/Documents API
 */
export const appwriteFiles = {
  list: async (params?: { beneficiaryId?: string; bucket?: string; documentType?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.files;
    const queries: string[] = [];

    if (params?.beneficiaryId) {
      queries.push(Query.equal('beneficiary_id', params.beneficiaryId));
    }
    if (params?.bucket) {
      queries.push(Query.equal('bucket', params.bucket));
    }
    if (params?.documentType) {
      queries.push(Query.equal('document_type', params.documentType));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list files', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('files', id);
  },
  getByStorageId: async (storageId: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.files;
    try {
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, [
        Query.equal('storageId', storageId),
        Query.limit(1),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      logger.error('Failed to get file by storage ID', { error, storageId });
      return null;
    }
  },
  create: async (data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    bucket: string;
    storageId: string;
    beneficiaryId?: string;
    documentType?: string;
    uploadedBy?: string;
  }) => {
    const createData: Record<string, unknown> = {
      ...data,
      uploadedAt: new Date().toISOString(),
    };
    return await createDocument('files', createData);
  },
  remove: async (id: string) => {
    return await deleteDocument('files', id);
  },
};

/**
 * Storage API (Appwrite Storage)
 */
export const appwriteStorage = {
  uploadFile: async (
    bucketId: string,
    fileId: string,
    file: File | Buffer | ArrayBuffer,
    permissions?: string[]
  ) => {
    const storage = getServerStorage();
    if (!storage) {
      throw new Error('Appwrite storage is not configured');
    }

    try {
      // Dynamically import InputFile to avoid middleware issues
      const nodeAppwrite = await import('node-appwrite');
      const InputFile = (nodeAppwrite as any).InputFile || nodeAppwrite.default?.InputFile;

      if (!InputFile) {
        throw new Error('InputFile not found in node-appwrite. Please check the import.');
      }

      const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
      // Handle Buffer properly for node-appwrite
      const buffer =
        fileBuffer instanceof Buffer ? fileBuffer : Buffer.from(fileBuffer as ArrayBuffer);
      const inputFile = InputFile.fromBuffer(buffer, 'file');

      const response = await storage.createFile(bucketId, fileId, inputFile, permissions);
      return response;
    } catch (error) {
      logger.error('Failed to upload file to Appwrite storage', { error, bucketId, fileId });
      throw error;
    }
  },
  getFile: async (bucketId: string, fileId: string) => {
    const storage = getServerStorage();
    if (!storage) {
      throw new Error('Appwrite storage is not configured');
    }

    try {
      const response = await storage.getFile(bucketId, fileId);
      return response;
    } catch (error) {
      logger.error('Failed to get file from Appwrite storage', { error, bucketId, fileId });
      throw error;
    }
  },
  getFileView: (bucketId: string, fileId: string): string => {
    // Generate file view URL
    const endpoint = appwriteConfig.endpoint;
    const projectId = appwriteConfig.projectId;
    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
  },
  getFileDownload: (bucketId: string, fileId: string): string => {
    // Generate file download URL
    const endpoint = appwriteConfig.endpoint;
    const projectId = appwriteConfig.projectId;
    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`;
  },
  deleteFile: async (bucketId: string, fileId: string) => {
    const storage = getServerStorage();
    if (!storage) {
      throw new Error('Appwrite storage is not configured');
    }

    try {
      await storage.deleteFile(bucketId, fileId);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete file from Appwrite storage', { error, bucketId, fileId });
      throw error;
    }
  },
};

/**
 * Errors API
 */
export const appwriteErrors = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('errors', params);
  },
  get: async (id: string) => {
    return await getDocument('errors', id);
  },
  create: async (data: Record<string, unknown>) => {
    return await createDocument('errors', data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument('errors', id, data);
  },
  remove: async (id: string) => {
    return await deleteDocument('errors', id);
  },
};

/**
 * System Alerts API
 */
export const appwriteSystemAlerts = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('systemAlerts', params);
  },
  get: async (id: string) => {
    return await getDocument('systemAlerts', id);
  },
  create: async (data: Record<string, unknown>) => {
    return await createDocument('systemAlerts', data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument('systemAlerts', id, data);
  },
  remove: async (id: string) => {
    return await deleteDocument('systemAlerts', id);
  },
};

/**
 * Audit Logs API
 */
export const appwriteAuditLogs = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('auditLogs', params);
  },
  get: async (id: string) => {
    return await getDocument('auditLogs', id);
  },
  create: async (data: Record<string, unknown>) => {
    return await createDocument('auditLogs', data);
  },
};

/**
 * Communication Logs API
 */
export const appwriteCommunicationLogs = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('communicationLogs', params);
  },
  get: async (id: string) => {
    return await getDocument('communicationLogs', id);
  },
  create: async (data: Record<string, unknown>) => {
    return await createDocument('communicationLogs', data);
  },
};

/**
 * Security Events API
 */
export const appwriteSecurityEvents = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('securityEvents', params);
  },
  get: async (id: string) => {
    return await getDocument('securityEvents', id);
  },
  create: async (data: Record<string, unknown>) => {
    return await createDocument('securityEvents', data);
  },
};

/**
 * Consents API
 */
export const appwriteConsents = {
  list: async (params?: AppwriteQueryParams & { beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.consents;
    const queries = buildQueries(params);

    if (params?.beneficiary_id) {
      queries.push(Query.equal('beneficiary_id', params.beneficiary_id));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list consents', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('consents', id);
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('consents', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('consents', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('consents', id);
  },
};

/**
 * Dependents API
 */
export const appwriteDependents = {
  list: async (params?: AppwriteQueryParams & { beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.dependents;
    const queries = buildQueries(params);

    if (params?.beneficiary_id) {
      queries.push(Query.equal('beneficiary_id', params.beneficiary_id));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list dependents', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('dependents', id);
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('dependents', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('dependents', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('dependents', id);
  },
};

/**
 * Bank Accounts API
 */
export const appwriteBankAccounts = {
  list: async (params?: AppwriteQueryParams & { beneficiary_id?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.bankAccounts;
    const queries = buildQueries(params);

    if (params?.beneficiary_id) {
      queries.push(Query.equal('beneficiary_id', params.beneficiary_id));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list bank accounts', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('bankAccounts', id);
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('bankAccounts', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('bankAccounts', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('bankAccounts', id);
  },
};

/**
 * Parameters API
 */
export const appwriteParameters = {
  list: async (params?: AppwriteQueryParams) => {
    return await listDocuments('parameters', params);
  },
  get: async (id: string) => {
    return await getDocument('parameters', id);
  },
  create: async (data: Record<string, unknown>) => {
    return await createDocument('parameters', data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    return await updateDocument('parameters', id, data);
  },
  remove: async (id: string) => {
    return await deleteDocument('parameters', id);
  },
};

/**
 * Scholarships API
 */
export const appwriteScholarships = {
  list: async (params?: AppwriteQueryParams & { category?: string; isActive?: boolean }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarships;
    const queries = buildQueries(params);

    if (params?.category) {
      queries.push(Query.equal('category', params.category));
    }
    if (params?.isActive !== undefined) {
      queries.push(Query.equal('is_active', params.isActive));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list scholarships', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('scholarships', id);
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    return await createDocument('scholarships', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('scholarships', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('scholarships', id);
  },
  getStatistics: async (scholarshipId?: string) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarshipApplications;
    const queries: string[] = [];

    if (scholarshipId) {
      queries.push(Query.equal('scholarship_id', scholarshipId));
    }

    try {
      const [all, approved, pending, rejected] = await Promise.all([
        databases.listDocuments(appwriteConfig.databaseId, collectionId, queries),
        databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          ...queries,
          Query.equal('status', 'approved'),
        ]),
        databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          ...queries,
          Query.equal('status', 'pending'),
        ]),
        databases.listDocuments(appwriteConfig.databaseId, collectionId, [
          ...queries,
          Query.equal('status', 'rejected'),
        ]),
      ]);

      return {
        total_applications: all.total,
        approved: approved.total,
        pending: pending.total,
        rejected: rejected.total,
      };
    } catch (error) {
      logger.error('Failed to get scholarship statistics', { error });
      throw error;
    }
  },
};

/**
 * Scholarship Applications API
 */
export const appwriteScholarshipApplications = {
  list: async (
    params?: AppwriteQueryParams & { scholarship_id?: string; status?: string; tc_no?: string }
  ) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarshipApplications;
    const queries = buildQueries(params);

    if (params?.scholarship_id) {
      queries.push(Query.equal('scholarship_id', params.scholarship_id));
    }
    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }
    if (params?.tc_no) {
      queries.push(Query.equal('applicant_tc_no', params.tc_no));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list scholarship applications', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('scholarshipApplications', id);
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
    };
    return await createDocument('scholarshipApplications', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('scholarshipApplications', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('scholarshipApplications', id);
  },
  submit: async (id: string) => {
    const updateData: Record<string, unknown> = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('scholarshipApplications', id, updateData);
  },
};

/**
 * Scholarship Payments API
 */
export const appwriteScholarshipPayments = {
  list: async (params?: AppwriteQueryParams & { application_id?: string; status?: string }) => {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.scholarshipPayments;
    const queries = buildQueries(params);

    if (params?.application_id) {
      queries.push(Query.equal('application_id', params.application_id));
    }
    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );
      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      logger.error('Failed to list scholarship payments', { error });
      throw error;
    }
  },
  get: async (id: string) => {
    return await getDocument('scholarshipPayments', id);
  },
  create: async (data: Record<string, unknown>) => {
    const createData: Record<string, unknown> = {
      ...data,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
    };
    return await createDocument('scholarshipPayments', createData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return await updateDocument('scholarshipPayments', id, updateData);
  },
  remove: async (id: string) => {
    return await deleteDocument('scholarshipPayments', id);
  },
};
