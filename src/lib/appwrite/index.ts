/**
 * Appwrite Module Index
 *
 * Central export point for all Appwrite-related modules.
 */

// Configuration
export { appwriteConfig, isAppwriteConfigured, isBuildTime } from './config';
export type { CollectionName, BucketName } from './config';

// Client-side
export {
  client,
  account,
  databases,
  storage,
  avatars,
  functions,
  isAppwriteReady,
  getAccount,
  getDatabases,
  getStorage,
  getAvatars,
  getFunctions,
} from './client';

// Server-side
export {
  serverClient,
  serverDatabases,
  serverStorage,
  serverUsers,
  serverAccount,
  isServerClientReady,
  getServerClient,
  getServerDatabases,
  getServerStorage,
  getServerUsers,
} from './server';

// API Client
export {
  createAppwriteCrudOperations,
  createAppwriteApiClient,
  appwriteBeneficiaries,
  appwriteDonations,
  appwriteTasks,
  appwriteUsers,
  appwriteMeetings,
  appwriteMessages,
  appwriteAidApplications,
  appwritePartners,
  appwriteScholarships,
  appwriteFinanceRecords,
  appwriteErrors,
  appwriteAuditLogs,
  appwriteCommunicationLogs,
  appwriteSystemAlerts,
  appwriteSecurityEvents,
  appwriteSystemSettings,
  appwriteParameters,
} from './api-client';
export type { AppwriteDocument, AppwriteCrudOperations } from './api-client';

// Auth
export {
  appwriteAuth,
  getCurrentUser,
  createSession,
  deleteSession,
  createAccount,
  updatePassword,
  sendPasswordRecovery,
  confirmPasswordRecovery,
  createJWT,
  verifySession,
} from './auth';
