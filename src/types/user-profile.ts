/**
 * Enhanced User Profile Types for KafkasDer System
 *
 * This module provides comprehensive type definitions for advanced profile management,
 * including emergency contacts, passport information, blood type, and communication preferences.
 */

// Type for document IDs (string-based with Appwrite)
type Id<_T extends string> = string;

// ============================================================================
// Blood Type
// ============================================================================

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface BloodTypeConfig {
  value: BloodType;
  label: string;
  labelTr: string;
}

export const BLOOD_TYPE_CONFIGS: BloodTypeConfig[] = [
  { value: 'A+', label: 'A Positive', labelTr: 'A Pozitif' },
  { value: 'A-', label: 'A Negative', labelTr: 'A Negatif' },
  { value: 'B+', label: 'B Positive', labelTr: 'B Pozitif' },
  { value: 'B-', label: 'B Negative', labelTr: 'B Negatif' },
  { value: 'AB+', label: 'AB Positive', labelTr: 'AB Pozitif' },
  { value: 'AB-', label: 'AB Negative', labelTr: 'AB Negatif' },
  { value: 'O+', label: 'O Positive', labelTr: 'O Pozitif' },
  { value: 'O-', label: 'O Negative', labelTr: 'O Negatif' },
];

// ============================================================================
// Emergency Contact
// ============================================================================

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
}

export type RelationshipType =
  | 'spouse' // Eş
  | 'parent' // Ebeveyn
  | 'child' // Çocuk
  | 'sibling' // Kardeş
  | 'friend' // Arkadaş
  | 'colleague' // İş Arkadaşı
  | 'other'; // Diğer

export interface RelationshipConfig {
  id: RelationshipType;
  label: string;
  labelTr: string;
}

export const RELATIONSHIP_TYPES: Record<RelationshipType, RelationshipConfig> = {
  spouse: {
    id: 'spouse',
    label: 'Spouse',
    labelTr: 'Eş',
  },
  parent: {
    id: 'parent',
    label: 'Parent',
    labelTr: 'Ebeveyn',
  },
  child: {
    id: 'child',
    label: 'Child',
    labelTr: 'Çocuk',
  },
  sibling: {
    id: 'sibling',
    label: 'Sibling',
    labelTr: 'Kardeş',
  },
  friend: {
    id: 'friend',
    label: 'Friend',
    labelTr: 'Arkadaş',
  },
  colleague: {
    id: 'colleague',
    label: 'Colleague',
    labelTr: 'İş Arkadaşı',
  },
  other: {
    id: 'other',
    label: 'Other',
    labelTr: 'Diğer',
  },
};

// ============================================================================
// Passport Information
// ============================================================================

export interface PassportInfo {
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_issuing_country?: string;
}

export interface PassportValidation {
  isValid: boolean;
  isExpired: boolean;
  daysUntilExpiry?: number;
  warningLevel?: 'none' | 'warning' | 'urgent' | 'expired';
}

/**
 * Validate passport expiry and return status
 */
export function validatePassport(passportInfo: PassportInfo): PassportValidation {
  if (!passportInfo.passport_expiry_date) {
    return { isValid: false, isExpired: false };
  }

  const expiryDate = new Date(passportInfo.passport_expiry_date);
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isExpired = daysUntilExpiry < 0;
  const isValid = !isExpired;

  let warningLevel: PassportValidation['warningLevel'] = 'none';
  if (isExpired) {
    warningLevel = 'expired';
  } else if (daysUntilExpiry <= 30) {
    warningLevel = 'urgent';
  } else if (daysUntilExpiry <= 90) {
    warningLevel = 'warning';
  }

  return {
    isValid,
    isExpired,
    daysUntilExpiry,
    warningLevel,
  };
}

// ============================================================================
// Communication Preferences
// ============================================================================

export type CommunicationChannel = 'email' | 'sms' | 'phone' | 'whatsapp';

export interface CommunicationChannelConfig {
  id: CommunicationChannel;
  label: string;
  labelTr: string;
  icon: string;
}

export const COMMUNICATION_CHANNELS: Record<CommunicationChannel, CommunicationChannelConfig> = {
  email: {
    id: 'email',
    label: 'Email',
    labelTr: 'E-posta',
    icon: 'Mail',
  },
  sms: {
    id: 'sms',
    label: 'SMS',
    labelTr: 'SMS',
    icon: 'MessageSquare',
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    labelTr: 'Telefon',
    icon: 'Phone',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    labelTr: 'WhatsApp',
    icon: 'MessageCircle',
  },
};

export type ContactTime = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface ContactTimeConfig {
  id: ContactTime;
  label: string;
  labelTr: string;
  hours: string;
}

export const CONTACT_TIMES: Record<ContactTime, ContactTimeConfig> = {
  morning: {
    id: 'morning',
    label: 'Morning',
    labelTr: 'Sabah',
    hours: '08:00-12:00',
  },
  afternoon: {
    id: 'afternoon',
    label: 'Afternoon',
    labelTr: 'Öğleden Sonra',
    hours: '12:00-17:00',
  },
  evening: {
    id: 'evening',
    label: 'Evening',
    labelTr: 'Akşam',
    hours: '17:00-21:00',
  },
  anytime: {
    id: 'anytime',
    label: 'Anytime',
    labelTr: 'Her Zaman',
    hours: '08:00-21:00',
  },
};

export interface CommunicationPreferences {
  communication_channels?: CommunicationChannel[];
  preferred_language?: string;
  newsletter_subscription?: boolean;
  sms_notifications?: boolean;
  email_notifications?: boolean;
  best_contact_time?: ContactTime;
}

// ============================================================================
// Language Support
// ============================================================================

export type LanguageCode = 'tr' | 'en' | 'ar' | 'de' | 'fr';

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  tr: {
    code: 'tr',
    label: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
  },
  en: {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  ar: {
    code: 'ar',
    label: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
  },
  de: {
    code: 'de',
    label: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  fr: {
    code: 'fr',
    label: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
};

// ============================================================================
// Enhanced User Profile
// ============================================================================

export interface EnhancedUserProfile {
  _id: Id<'users'>;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;

  // Personal Information
  birth_date?: string;
  blood_type?: BloodType;
  nationality?: string;

  // Address Information
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;

  // Passport Information
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_issuing_country?: string;

  // Emergency Contacts
  emergency_contacts?: EmergencyContact[];

  // Communication Preferences
  communication_channels?: CommunicationChannel[];
  preferred_language?: string;
  newsletter_subscription?: boolean;
  sms_notifications?: boolean;
  email_notifications?: boolean;
  best_contact_time?: string;

  // Metadata
  createdAt?: string;
  lastLogin?: string;
}

// ============================================================================
// Profile Update Data Transfer Objects
// ============================================================================

export interface PersonalInfoUpdate {
  name?: string;
  birth_date?: string;
  blood_type?: BloodType;
  nationality?: string;
  phone?: string;
}

export interface AddressInfoUpdate {
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;
}

export interface PassportInfoUpdate {
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_issuing_country?: string;
}

export interface EmergencyContactsUpdate {
  emergency_contacts: EmergencyContact[];
}

export interface CommunicationPreferencesUpdate {
  communication_channels?: CommunicationChannel[];
  preferred_language?: string;
  newsletter_subscription?: boolean;
  sms_notifications?: boolean;
  email_notifications?: boolean;
  best_contact_time?: ContactTime;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get primary emergency contact
 */
export function getPrimaryEmergencyContact(
  contacts?: EmergencyContact[]
): EmergencyContact | undefined {
  if (!contacts || contacts.length === 0) return undefined;
  return contacts.find((c) => c.isPrimary) || contacts[0];
}

/**
 * Get label for relationship type (localized)
 */
export function getRelationshipLabel(relationship: string, locale: 'en' | 'tr' = 'tr'): string {
  const config = RELATIONSHIP_TYPES[relationship as RelationshipType];
  if (!config) return relationship;
  return locale === 'tr' ? config.labelTr : config.label;
}

/**
 * Get label for blood type (localized)
 */
export function getBloodTypeLabel(bloodType: BloodType, locale: 'en' | 'tr' = 'tr'): string {
  const config = BLOOD_TYPE_CONFIGS.find((c) => c.value === bloodType);
  if (!config) return bloodType;
  return locale === 'tr' ? config.labelTr : config.label;
}
