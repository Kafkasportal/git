/**
 * Appwrite Server Client
 *
 * Server-side Appwrite SDK initialization with API key.
 * Use this for API routes and server-side operations.
 * 
 * Uses lazy initialization to ensure environment variables are loaded.
 */

import { Client, Databases, Storage, Users, Account } from 'node-appwrite';
import logger from '@/lib/logger';

// Cached client instance
let _serverClient: Client | null = null;
let _initAttempted = false;

// Check if server is configured (read env vars directly for fresh values)
const checkServerConfig = () => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  
  return {
    endpoint: endpoint || 'https://cloud.appwrite.io/v1',
    projectId: projectId || '',
    databaseId: databaseId || '',
    apiKey: apiKey || '',
    isConfigured: Boolean(endpoint && projectId && databaseId && apiKey && 
      projectId !== '' && databaseId !== '' && apiKey !== ''),
  };
};

// Check if we're in build time
const isBuildTime = () => {
  return process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
};

// Create server client with API key (lazy initialization)
const createServerClient = (): Client | null => {
  // Return cached client if already initialized
  if (_serverClient) {
    return _serverClient;
  }
  
  // Skip during build time
  if (isBuildTime()) {
    return null;
  }

  const config = checkServerConfig();

  if (!config.isConfigured) {
    // Only log once per process
    if (!_initAttempted) {
      _initAttempted = true;
      logger.warn('Appwrite server client not configured', {
        endpoint: config.endpoint,
        projectId: config.projectId ? '[set]' : '[missing]',
        databaseId: config.databaseId ? '[set]' : '[missing]',
        apiKey: config.apiKey ? '***MASKED***' : '[missing]',
      });
    }
    return null;
  }

  try {
    const client = new Client();
    client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);

    _serverClient = client;
    return client;
  } catch (error) {
    logger.error('Failed to initialize Appwrite server client', { error });
    return null;
  }
};

// Export getter for server client (lazy initialization)
export const getServerClient = (): Client => {
  const client = createServerClient();
  if (!client) {
    const config = checkServerConfig();
    logger.error('Appwrite server client not configured', { error: config });
    throw new Error('Appwrite server client is not configured');
  }
  return client;
};

// For backward compatibility - but prefer using getServerClient()
export const serverClient = null as Client | null; // Deprecated: use getServerClient()

// Helper to check if server client is ready
export const isServerClientReady = (): boolean => {
  return createServerClient() !== null;
};

// Get server databases on demand
export const getServerDatabases = (): Databases => {
  return new Databases(getServerClient());
};

// Get server storage on demand
export const getServerStorage = (): Storage => {
  return new Storage(getServerClient());
};

// Get server users on demand
export const getServerUsers = (): Users => {
  return new Users(getServerClient());
};

// Get server account on demand
export const getServerAccount = (): Account => {
  return new Account(getServerClient());
};

// Deprecated exports for backward compatibility
export const serverDatabases = null as Databases | null;
export const serverStorage = null as Storage | null;
export const serverUsers = null as Users | null;
export const serverAccount = null as Account | null;
