/**
 * Appwrite Module Index
 *
 * Central export point for all Appwrite-related modules.
 */

// Configuration
export { 
  appwriteConfig, 
  isAppwriteConfigured, 
  isClientConfigured,
  isServerConfigured,
  isBuildTime 
} from './config';
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
  pingAppwrite,
} from './client';

// Server-side
export {
  isServerClientReady,
  getServerClient,
  getServerDatabases,
  getServerStorage,
  getServerUsers,
  getServerAccount,
  // Deprecated: use getter functions instead
  serverClient,
  serverDatabases,
  serverStorage,
  serverUsers,
  serverAccount,
} from './server';

// API Client
export {
  createAppwriteCrudOperations,
  createAppwriteApiClient,
  appwriteBeneficiaries,
  appwriteDonations,
  appwriteTasks,
  // Note: appwriteUsers is exported from ./api (specific implementation)
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
// Export appwriteUsers from the specific implementation (in api/users.ts)
export { appwriteUsers } from './api/users';
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
