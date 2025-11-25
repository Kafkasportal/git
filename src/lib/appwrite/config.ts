/**
 * Appwrite Configuration
 *
 * Central configuration for Appwrite backend services.
 * Manages endpoint, project ID, and database IDs.
 */

// Appwrite Configuration
export const appwriteConfig = {
  // Appwrite Endpoint
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',

  // Appwrite Project ID
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',

  // Appwrite Database ID
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',

  // Appwrite API Key (server-side only)
  apiKey: process.env.APPWRITE_API_KEY || '',

  // Storage Bucket IDs
  buckets: {
    documents: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS || 'documents',
    avatars: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS || 'avatars',
    receipts: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS || 'receipts',
  },

  // Collection IDs
  collections: {
    // User Management
    users: 'users',
    userSessions: 'user_sessions',
    twoFactorSettings: 'two_factor_settings',
    trustedDevices: 'trusted_devices',

    // Core Beneficiary System
    beneficiaries: 'beneficiaries',
    dependents: 'dependents',
    consents: 'consents',
    bankAccounts: 'bank_accounts',

    // Aid/Donations
    donations: 'donations',
    aidApplications: 'aid_applications',
    scholarships: 'scholarships',
    scholarshipApplications: 'scholarship_applications',
    scholarshipPayments: 'scholarship_payments',

    // Finance
    financeRecords: 'finance_records',

    // Communication
    messages: 'messages',
    communicationLogs: 'communication_logs',
    workflowNotifications: 'workflow_notifications',

    // Meetings & Tasks
    meetings: 'meetings',
    meetingDecisions: 'meeting_decisions',
    meetingActionItems: 'meeting_action_items',
    tasks: 'tasks',
    todos: 'todos',

    // Partners
    partners: 'partners',

    // Documents
    files: 'files',
    documentVersions: 'document_versions',

    // Reporting
    reportConfigs: 'report_configs',

    // Security/Audit
    securityEvents: 'security_events',
    auditLogs: 'audit_logs',
    rateLimitLog: 'rate_limit_log',

    // System
    systemSettings: 'system_settings',
    themePresets: 'theme_presets',
    parameters: 'parameters',

    // Error Tracking
    errors: 'errors',
    errorOccurrences: 'error_occurrences',
    errorLogs: 'error_logs',
    systemAlerts: 'system_alerts',

    // Monitoring
    analyticsEvents: 'analytics_events',
    performanceMetrics: 'performance_metrics',

    // AI Features
    aiChats: 'ai_chats',
    agentThreads: 'agent_threads',
    agentMessages: 'agent_messages',
    agentTools: 'agent_tools',
    agentUsage: 'agent_usage',
  },
} as const;

// Type for collection names
export type CollectionName = keyof typeof appwriteConfig.collections;

// Type for bucket names
export type BucketName = keyof typeof appwriteConfig.buckets;

// Helper to get collection ID
export const getCollectionId = (name: CollectionName): string => {
  return appwriteConfig.collections[name];
};

// Helper to get bucket ID
export const getBucketId = (name: BucketName): string => {
  return appwriteConfig.buckets[name];
};

// Validation helper
export const isAppwriteConfigured = (): boolean => {
  return Boolean(
    appwriteConfig.endpoint &&
      appwriteConfig.projectId &&
      appwriteConfig.databaseId &&
      appwriteConfig.projectId !== '' &&
      appwriteConfig.databaseId !== ''
  );
};

// Build-time detection
export const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
