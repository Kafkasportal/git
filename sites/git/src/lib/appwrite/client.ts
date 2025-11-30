/**
 * Appwrite Client
 *
 * Client-side Appwrite SDK initialization.
 * Use this for browser-side operations.
 */

import { Client, Account, Databases, Storage, Avatars, Functions } from 'appwrite';
import { appwriteConfig, isAppwriteConfigured, isBuildTime } from './config';
import logger from '@/lib/logger';

// Create client only when properly configured
const createAppwriteClient = () => {
  if (isBuildTime) {
    return null;
  }

  if (!isAppwriteConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Appwrite client not configured', {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? '[set]' : '[missing]',
        databaseId: appwriteConfig.databaseId ? '[set]' : '[missing]',
      });
    }
    return null;
  }

  try {
    const client = new Client();
    client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId);

    return client;
  } catch (error) {
    logger.error('Failed to initialize Appwrite client', { error });
    return null;
  }
};

// Export the client instance
export const client = createAppwriteClient();

// Export service instances (lazy initialization)
let _account: Account | null = null;
let _databases: Databases | null = null;
let _storage: Storage | null = null;
let _avatars: Avatars | null = null;
let _functions: Functions | null = null;

export const getAccount = (): Account | null => {
  if (!client) return null;
  if (!_account) {
    _account = new Account(client);
  }
  return _account;
};

export const getDatabases = (): Databases | null => {
  if (!client) return null;
  if (!_databases) {
    _databases = new Databases(client);
  }
  return _databases;
};

export const getStorage = (): Storage | null => {
  if (!client) return null;
  if (!_storage) {
    _storage = new Storage(client);
  }
  return _storage;
};

export const getAvatars = (): Avatars | null => {
  if (!client) return null;
  if (!_avatars) {
    _avatars = new Avatars(client);
  }
  return _avatars;
};

export const getFunctions = (): Functions | null => {
  if (!client) return null;
  if (!_functions) {
    _functions = new Functions(client);
  }
  return _functions;
};

// Convenience exports for direct access (when configured)
export const account = client ? new Account(client) : null;
export const databases = client ? new Databases(client) : null;
export const storage = client ? new Storage(client) : null;
export const avatars = client ? new Avatars(client) : null;
export const functions = client ? new Functions(client) : null;

// Helper to check if Appwrite is ready
export const isAppwriteReady = (): boolean => {
  return client !== null;
};

// Ping function to verify Appwrite connection
// This works even if the full client isn't initialized (e.g., no database ID)
export const pingAppwrite = async (): Promise<boolean> => {
  // If main client exists, use it
  if (client) {
    try {
      await client.ping();
      logger.info('Appwrite ping successful - connection verified');
      return true;
    } catch (error) {
      logger.error('Appwrite ping failed', { error });
      return false;
    }
  }

  // If main client isn't available, try creating a minimal client just for ping
  // This allows verifying connection even without full configuration (e.g., no database ID)
  if (appwriteConfig.endpoint && appwriteConfig.projectId) {
    try {
      const { Client } = await import('appwrite');
      const pingClient = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId);
      await pingClient.ping();
      logger.info('Appwrite ping successful - connection verified (minimal client)');
      return true;
    } catch (error) {
      logger.error('Appwrite ping failed', { error });
      return false;
    }
  }

  logger.warn('Cannot ping Appwrite: endpoint or project ID not configured');
  return false;
};

// Log configuration status (development only)
if (process.env.NODE_ENV === 'development' && !isBuildTime) {
  if (isAppwriteReady()) {
    logger.info('Appwrite client initialized successfully', {
      endpoint: appwriteConfig.endpoint,
    });
  }
}
