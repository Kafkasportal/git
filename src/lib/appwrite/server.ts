/**
 * Appwrite Server Client
 *
 * Server-side Appwrite SDK initialization with API key.
 * Use this for API routes and server-side operations.
 */

import { Client, Databases, Storage, Users, Account } from 'node-appwrite';
import { appwriteConfig, isAppwriteConfigured, isBuildTime } from './config';
import logger from '@/lib/logger';

// Create server client with API key
const createServerClient = () => {
  if (isBuildTime) {
    return null;
  }

  if (!isAppwriteConfigured() || !appwriteConfig.apiKey) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Appwrite server client not configured', {
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId ? '[set]' : '[missing]',
        apiKey: appwriteConfig.apiKey ? '[set]' : '[missing]',
      });
    }
    return null;
  }

  try {
    const client = new Client();
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setKey(appwriteConfig.apiKey);

    return client;
  } catch (error) {
    logger.error('Failed to initialize Appwrite server client', { error });
    return null;
  }
};

// Export the server client instance
export const serverClient = createServerClient();

// Export service instances
export const serverDatabases = serverClient ? new Databases(serverClient) : null;
export const serverStorage = serverClient ? new Storage(serverClient) : null;
export const serverUsers = serverClient ? new Users(serverClient) : null;
export const serverAccount = serverClient ? new Account(serverClient) : null;

// Helper to check if server client is ready
export const isServerClientReady = (): boolean => {
  return serverClient !== null;
};

// Get server client on demand (for dynamic context)
export const getServerClient = () => {
  if (!serverClient) {
    throw new Error('Appwrite server client is not configured');
  }
  return serverClient;
};

// Get server databases on demand
export const getServerDatabases = () => {
  if (!serverDatabases) {
    throw new Error('Appwrite server databases is not configured');
  }
  return serverDatabases;
};

// Get server storage on demand
export const getServerStorage = () => {
  if (!serverStorage) {
    throw new Error('Appwrite server storage is not configured');
  }
  return serverStorage;
};

// Get server users on demand
export const getServerUsers = () => {
  if (!serverUsers) {
    throw new Error('Appwrite server users is not configured');
  }
  return serverUsers;
};
