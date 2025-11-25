/**
 * GDPR Compliance Tools
 * Provides utilities for data protection and user privacy rights
 */

export interface UserDataExportRequest {
  userId: string;
  requestDate: string;
  includePersonalData: boolean;
  includeActivityLogs: boolean;
  includeConsents: boolean;
}

export interface UserDataDeletionRequest {
  userId: string;
  requestDate: string;
  reason?: string;
  retentionOverride: boolean; // For legal hold scenarios
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: string;
  ipAddress?: string;
  version: string; // Version of terms/privacy policy
}

/**
 * Data retention periods (in days)
 */
export const DATA_RETENTION_PERIODS = {
  AUDIT_LOGS: 2555, // 7 years for compliance
  USER_ACTIVITY: 730, // 2 years
  BENEFICIARY_DATA: 3650, // 10 years for aid organizations
  DONATION_RECORDS: 3650, // 10 years for tax/audit
  SESSION_LOGS: 90, // 3 months
  ERROR_LOGS: 365, // 1 year
  DELETED_USER_DATA: 30, // 30 days before permanent deletion
} as const;

/**
 * Personal data fields that require special handling
 */
export const PERSONAL_DATA_FIELDS = {
  SENSITIVE: [
    'tc_no', // Turkish ID number
    'passwordHash',
    'two_factor_secret',
    'ssn',
    'health_status',
    'chronic_illness_detail',
    'disability_detail',
  ],
  IDENTIFIABLE: ['name', 'email', 'phone', 'address', 'birth_date', 'ip_address'],
  CONTACT: ['email', 'phone', 'address', 'donor_email', 'donor_phone'],
} as const;

/**
 * Anonymize personal data for compliance
 */
export function anonymizePersonalData<T extends Record<string, unknown>>(
  data: T,
  fieldsToAnonymize: string[] = [...PERSONAL_DATA_FIELDS.IDENTIFIABLE]
): T {
  const anonymized: Record<string, unknown> = { ...data };

  for (const field of fieldsToAnonymize) {
    if (field in anonymized) {
      if (field === 'email') {
        anonymized[field] = `anonymized_${Date.now()}@example.com`;
      } else if (field === 'phone') {
        anonymized[field] = '0000000000';
      } else if (field === 'tc_no') {
        anonymized[field] = '***********';
      } else if (field === 'name') {
        anonymized[field] = 'Anonymous User';
      } else {
        anonymized[field] = '[REDACTED]';
      }
    }
  }

  return anonymized as T;
}

/**
 * Check if data retention period has expired
 */
export function isRetentionPeriodExpired(
  creationDate: Date | string | number,
  retentionDays: number
): boolean {
  const created =
    typeof creationDate === 'number' ? creationDate : new Date(creationDate).getTime();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  return Date.now() - created > retentionMs;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface ActivityLog {
  timestamp: string;
  action: string;
  details?: Record<string, unknown>;
}

export interface DonationRecord {
  id: string;
  amount: number;
  date: string;
  [key: string]: unknown;
}

export interface ApplicationRecord {
  id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface UserDataExport {
  exportDate: string;
  userId: string;
  format: 'JSON';
  data: {
    personalInformation: {
      name: string;
      email: string;
      phone?: string;
      accountCreated: string;
      lastLogin?: string;
    };
    activityLogs: ActivityLog[];
    consents: ConsentRecord[];
    donations: DonationRecord[];
    applications: ApplicationRecord[];
    exportMetadata: {
      requestDate: string;
      dataTypes: string[];
      gdprCompliant: boolean;
    };
  };
}

/**
 * Generate user data export package
 */
export function generateUserDataExport(userData: {
  profile: UserProfile;
  activityLogs?: ActivityLog[];
  consents?: ConsentRecord[];
  donations?: DonationRecord[];
  applications?: ApplicationRecord[];
}): UserDataExport {
  return {
    exportDate: new Date().toISOString(),
    userId: userData.profile.id,
    format: 'JSON',
    data: {
      personalInformation: {
        name: userData.profile.name,
        email: userData.profile.email,
        phone: userData.profile.phone,
        accountCreated: userData.profile.createdAt,
        lastLogin: userData.profile.lastLogin,
      },
      activityLogs: userData.activityLogs || [],
      consents: userData.consents || [],
      donations: userData.donations || [],
      applications: userData.applications || [],
      exportMetadata: {
        requestDate: new Date().toISOString(),
        dataTypes: Object.keys(userData),
        gdprCompliant: true,
      },
    },
  };
}

/**
 * Validate data deletion request
 */
export function validateDeletionRequest(request: UserDataDeletionRequest): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.userId) {
    errors.push('User ID is required');
  }

  if (!request.requestDate) {
    errors.push('Request date is required');
  }

  // Check if legal hold applies (e.g., pending investigations)
  if (request.retentionOverride) {
    warnings.push('Retention override enabled - ensure legal compliance');
  }

  // Validate request date is not in future
  if (new Date(request.requestDate) > new Date()) {
    errors.push('Request date cannot be in the future');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export interface DeletionAuditTrail {
  auditId: string;
  userId: string;
  action: 'DATA_DELETION_REQUESTED' | 'DATA_DELETION_COMPLETED';
  timestamp: string;
  reason?: string;
  metadata: {
    retentionOverride: boolean;
    requestDate: string;
    gdprCompliant: boolean;
  };
}

/**
 * Create deletion audit trail
 */
export function createDeletionAuditTrail(request: UserDataDeletionRequest): DeletionAuditTrail {
  return {
    auditId: `DEL_${Date.now()}_${request.userId}`,
    userId: request.userId,
    action: 'DATA_DELETION_REQUESTED',
    timestamp: new Date().toISOString(),
    reason: request.reason,
    metadata: {
      retentionOverride: request.retentionOverride,
      requestDate: request.requestDate,
      gdprCompliant: true,
    },
  };
}

/**
 * Consent management
 */
export class ConsentManager {
  /**
   * Record user consent
   */
  static recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    version: string,
    ipAddress?: string
  ): ConsentRecord {
    return {
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      ipAddress,
      version,
    };
  }

  /**
   * Check if consent is still valid
   */
  static isConsentValid(consent: ConsentRecord, currentVersion: string): boolean {
    // Consent is invalid if version doesn't match
    if (consent.version !== currentVersion) {
      return false;
    }

    // Consent is invalid if it's not granted
    if (!consent.granted) {
      return false;
    }

    // Consent is valid for 2 years, then needs renewal
    const consentAge = Date.now() - new Date(consent.timestamp).getTime();
    const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;

    return consentAge < twoYearsMs;
  }

  /**
   * Get consent types required
   */
  static getRequiredConsentTypes(): string[] {
    return [
      'privacy_policy',
      'terms_of_service',
      'data_processing',
      'marketing_communications', // Optional
      'cookies', // Optional for web
    ];
  }
}

/**
 * Data breach notification helper
 */
export interface DataBreachNotification {
  breachId: string;
  detectedAt: string;
  affectedUsers: number;
  dataTypesAffected: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  containmentActions: string[];
  notificationSent: boolean;
  reportedToAuthorities: boolean;
}

export function createBreachNotification(breach: {
  affectedUsers: number;
  dataTypes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}): DataBreachNotification {
  return {
    breachId: `BREACH_${Date.now()}`,
    detectedAt: new Date().toISOString(),
    affectedUsers: breach.affectedUsers,
    dataTypesAffected: breach.dataTypes,
    severity: breach.severity,
    containmentActions: [],
    notificationSent: false,
    reportedToAuthorities: false,
  };
}

/**
 * Check if breach requires authority notification (GDPR Article 33)
 * Must notify within 72 hours if high risk
 */
export function requiresAuthorityNotification(breach: DataBreachNotification): boolean {
  // High or critical severity always requires notification
  if (breach.severity === 'high' || breach.severity === 'critical') {
    return true;
  }

  // Check if sensitive data is affected
  const sensitiveFields = PERSONAL_DATA_FIELDS.SENSITIVE as readonly string[];
  const sensitiveDataAffected = breach.dataTypesAffected.some((type) =>
    sensitiveFields.includes(type)
  );

  // Large number of users affected
  const largeScale = breach.affectedUsers > 100;

  return sensitiveDataAffected || largeScale;
}

/**
 * Privacy impact assessment helper
 */
export interface PrivacyImpactAssessment {
  assessmentId: string;
  date: string;
  dataProcessing: string;
  purposeAndMeans: string;
  necessityAndProportionality: string;
  risksIdentified: string[];
  mitigationMeasures: string[];
  conclusion: 'low_risk' | 'medium_risk' | 'high_risk';
}

export function createPrivacyImpactAssessment(
  dataProcessing: string,
  risks: string[]
): PrivacyImpactAssessment {
  return {
    assessmentId: `PIA_${Date.now()}`,
    date: new Date().toISOString(),
    dataProcessing,
    purposeAndMeans: '',
    necessityAndProportionality: '',
    risksIdentified: risks,
    mitigationMeasures: [],
    conclusion: risks.length > 3 ? 'high_risk' : risks.length > 1 ? 'medium_risk' : 'low_risk',
  };
}
