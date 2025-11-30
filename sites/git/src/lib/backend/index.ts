/**
 * Backend API
 *
 * Appwrite backend interface.
 * All operations use Appwrite.
 */

import type { QueryParams, CreateDocumentData, UpdateDocumentData } from '@/types/database';

// Backend provider type (only Appwrite now)
export type BackendProvider = 'appwrite';

export type BackendResponse<T> = T;

// Get current backend provider (always Appwrite)
export const getBackendProvider = (): BackendProvider => {
  return 'appwrite';
};

// Check if using Appwrite (always true)
export const isUsingAppwrite = (): boolean => {
  return true;
};

/**
 * Generic CRUD operations interface
 */
export interface UnifiedCrudOperations<T> {
  list: (params?: QueryParams) => Promise<BackendResponse<{ documents: T[]; total: number }>>;
  get: (id: string) => Promise<BackendResponse<T>>;
  create: (data: CreateDocumentData<T>) => Promise<BackendResponse<T>>;
  update: (id: string, data: UpdateDocumentData<T>) => Promise<BackendResponse<T>>;
  delete: (id: string) => Promise<BackendResponse<void>>;
}

/**
 * Create CRUD operations for Appwrite
 */
export async function createUnifiedCrud<T>(
  entityName: string,
  appwriteCollectionName?: string
): Promise<UnifiedCrudOperations<T>> {
  // Always use Appwrite
  const { createAppwriteCrudOperations } = await import('@/lib/appwrite/api-client');
  const { appwriteConfig } = await import('@/lib/appwrite/config');

  // Find the collection name
  const collectionKey = appwriteCollectionName || entityName;
  const collectionId = appwriteConfig.collections[collectionKey as keyof typeof appwriteConfig.collections];

  if (!collectionId) {
    throw new Error(`Unknown Appwrite collection: ${collectionKey}`);
  }

  const appwriteOps = createAppwriteCrudOperations(collectionKey as keyof typeof appwriteConfig.collections);

  return {
    list: appwriteOps.list as unknown as UnifiedCrudOperations<T>['list'],
    get: appwriteOps.get as unknown as UnifiedCrudOperations<T>['get'],
    create: appwriteOps.create as unknown as UnifiedCrudOperations<T>['create'],
    update: appwriteOps.update as unknown as UnifiedCrudOperations<T>['update'],
    delete: async (id: string) => {
      await appwriteOps.delete(id);
    },
  };
}

/**
 * Pre-configured unified CRUD operations
 * These lazy-load the appropriate backend implementation
 */
let _beneficiaries: UnifiedCrudOperations<unknown> | null = null;
let _donations: UnifiedCrudOperations<unknown> | null = null;
let _tasks: UnifiedCrudOperations<unknown> | null = null;
let _users: UnifiedCrudOperations<unknown> | null = null;
let _meetings: UnifiedCrudOperations<unknown> | null = null;
let _messages: UnifiedCrudOperations<unknown> | null = null;
let _partners: UnifiedCrudOperations<unknown> | null = null;
let _scholarships: UnifiedCrudOperations<unknown> | null = null;

export const getBeneficiaries = async () => {
  if (!_beneficiaries) {
    _beneficiaries = await createUnifiedCrud('beneficiaries');
  }
  return _beneficiaries;
};

export const getDonations = async () => {
  if (!_donations) {
    _donations = await createUnifiedCrud('donations');
  }
  return _donations;
};

export const getTasks = async () => {
  if (!_tasks) {
    _tasks = await createUnifiedCrud('tasks');
  }
  return _tasks;
};

export const getUsers = async () => {
  if (!_users) {
    _users = await createUnifiedCrud('users');
  }
  return _users;
};

export const getMeetings = async () => {
  if (!_meetings) {
    _meetings = await createUnifiedCrud('meetings');
  }
  return _meetings;
};

export const getMessages = async () => {
  if (!_messages) {
    _messages = await createUnifiedCrud('messages');
  }
  return _messages;
};

export const getPartners = async () => {
  if (!_partners) {
    _partners = await createUnifiedCrud('partners');
  }
  return _partners;
};

export const getScholarships = async () => {
  if (!_scholarships) {
    _scholarships = await createUnifiedCrud('scholarships');
  }
  return _scholarships;
};

/**
 * Auth provider abstraction
 */
export interface UnifiedAuth {
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<{ success: boolean; error: string | null }>;
  getCurrentUser: () => Promise<{ user: unknown | null; error: string | null }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error: string | null }>;
}

export const getAuth = async (): Promise<UnifiedAuth> => {
  // Always use Appwrite
  const { appwriteAuth } = await import('@/lib/appwrite/auth');

  return {
    login: async (email, password) => {
      const { session, error } = await appwriteAuth.createSession(email, password);
      return { success: !!session, error };
    },
    logout: async () => {
      return appwriteAuth.deleteSession();
    },
    getCurrentUser: async () => {
      return appwriteAuth.getCurrentUser();
    },
    register: async (email, password, name) => {
      const { user, error } = await appwriteAuth.createAccount(email, password, name);
      return { success: !!user, error };
    },
  };
};

// Export provider info
export const backendInfo = {
  provider: 'appwrite' as const,
  isAppwrite: true,
};
