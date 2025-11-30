/**
 * Appwrite API Module Index
 * Re-exports all API modules for convenient importing
 */

// Base utilities
export {
  type AppwriteQueryParams,
  type AuthContext,
  normalizeQueryParams,
  buildQueries,
  getDatabases,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./base";

// Entity APIs
export { appwriteBeneficiaries } from "./beneficiaries";
export { appwriteDonations } from "./donations";
export { appwriteTasks } from "./tasks";
export { appwriteTodos } from "./todos";
export {
  appwriteMeetings,
  appwriteMeetingDecisions,
  appwriteMeetingActionItems,
} from "./meetings";
export { appwriteWorkflowNotifications } from "./notifications";
export { appwriteMessages } from "./messages";
export { appwriteUsers } from "./users";
export { appwriteAidApplications } from "./aid-applications";
export { appwriteFinanceRecords } from "./finance";
export { appwritePartners } from "./partners";
export { appwriteSystemSettings, appwriteThemePresets } from "./settings";
export { appwriteFiles, appwriteStorage } from "./files";
export {
  appwriteErrors,
  appwriteSystemAlerts,
  appwriteAuditLogs,
  appwriteCommunicationLogs,
  appwriteSecurityEvents,
} from "./logs";
export {
  appwriteConsents,
  appwriteDependents,
  appwriteBankAccounts,
} from "./beneficiary-related";
export { appwriteParameters } from "./parameters";
export {
  appwriteScholarships,
  appwriteScholarshipApplications,
  appwriteScholarshipPayments,
} from "./scholarships";

