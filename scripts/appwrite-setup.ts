/**
 * Appwrite Database Setup Script
 *
 * Bu script Appwrite'da database, collection'lar ve index'leri oluşturur.
 *
 * Kullanım:
 *   npx tsx scripts/appwrite-setup.ts
 *
 * Ortam Değişkenleri (.env.local):
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 */

import { Client, Databases, IndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';

if (!projectId || !apiKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_APPWRITE_PROJECT_ID:', projectId ? '✓' : '✗');
  console.error('   APPWRITE_API_KEY:', apiKey ? '✓' : '✗');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client();
client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

const databases = new Databases(client);

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'kafkasder_db';
const DATABASE_NAME = 'Kafkasder Panel Database';

// Helper types
type AttributeType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'email' | 'url' | 'ip' | 'enum';

interface AttributeConfig {
  key: string;
  type: AttributeType;
  size?: number;
  required?: boolean;
  default?: string | number | boolean | null;
  array?: boolean;
  enumValues?: string[];
}

interface CollectionConfig {
  id: string;
  name: string;
  attributes: AttributeConfig[];
  indexes?: {
    key: string;
    type: IndexType;
    attributes: string[];
    orders?: ('ASC' | 'DESC')[];
  }[];
}

// Collection definitions
const collections: CollectionConfig[] = [
  // ============================================
  // USER MANAGEMENT
  // ============================================
  {
    id: 'users',
    name: 'Kullanıcılar',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'email', type: 'email', required: true },
      { key: 'role', type: 'string', size: 50, required: true },
      { key: 'permissions', type: 'string', size: 65535, array: true },
      { key: 'phone', type: 'string', size: 20 },
      { key: 'avatar', type: 'url' },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'labels', type: 'string', size: 255, array: true },
      { key: 'createdAt', type: 'datetime' },
      { key: 'lastLogin', type: 'datetime' },
      { key: 'passwordHash', type: 'string', size: 255 },
      { key: 'two_factor_enabled', type: 'boolean', default: false },
      { key: 'birth_date', type: 'string', size: 20 },
      { key: 'blood_type', type: 'string', size: 5 },
      { key: 'nationality', type: 'string', size: 100 },
      { key: 'address', type: 'string', size: 500 },
      { key: 'city', type: 'string', size: 100 },
      { key: 'district', type: 'string', size: 100 },
      { key: 'postal_code', type: 'string', size: 20 },
      { key: 'passport_number', type: 'string', size: 50 },
      { key: 'passport_issue_date', type: 'string', size: 20 },
      { key: 'passport_expiry_date', type: 'string', size: 20 },
      { key: 'passport_issuing_country', type: 'string', size: 100 },
      { key: 'emergency_contacts', type: 'string', size: 65535 }, // JSON array
      { key: 'communication_channels', type: 'string', size: 255, array: true },
      { key: 'preferred_language', type: 'string', size: 10 },
      { key: 'newsletter_subscription', type: 'boolean', default: false },
      { key: 'sms_notifications', type: 'boolean', default: true },
      { key: 'email_notifications', type: 'boolean', default: true },
      { key: 'best_contact_time', type: 'string', size: 50 },
    ],
    indexes: [
      { key: 'by_email', type: IndexType.Unique, attributes: ['email'] },
      { key: 'by_role', type: IndexType.Key, attributes: ['role'] },
      { key: 'by_is_active', type: IndexType.Key, attributes: ['isActive'] },
    ],
  },

  {
    id: 'user_sessions',
    name: 'Kullanıcı Oturumları',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'device_info', type: 'string', size: 500 },
      { key: 'ip_address', type: 'string', size: 45 },
      { key: 'user_agent', type: 'string', size: 500 },
      { key: 'is_active', type: 'boolean', required: true, default: true },
      { key: 'last_activity', type: 'datetime', required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'revoked_at', type: 'datetime' },
      { key: 'revocation_reason', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'by_user', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'by_active', type: IndexType.Key, attributes: ['is_active'] },
    ],
  },

  {
    id: 'two_factor_settings',
    name: '2FA Ayarları',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'secret', type: 'string', size: 255, required: true },
      { key: 'backup_codes', type: 'string', size: 65535 }, // JSON array
      { key: 'enabled', type: 'boolean', required: true, default: false },
      { key: 'enabled_at', type: 'datetime' },
      { key: 'disabled_at', type: 'datetime' },
      { key: 'last_verified', type: 'datetime' },
    ],
    indexes: [{ key: 'by_user', type: IndexType.Unique, attributes: ['user_id'] }],
  },

  {
    id: 'trusted_devices',
    name: 'Güvenilen Cihazlar',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'device_fingerprint', type: 'string', size: 255, required: true },
      { key: 'device_name', type: 'string', size: 255 },
      { key: 'added_at', type: 'datetime', required: true },
      { key: 'last_used', type: 'datetime' },
      { key: 'is_active', type: 'boolean', required: true, default: true },
      { key: 'removed_at', type: 'datetime' },
    ],
    indexes: [
      { key: 'by_user', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'by_fingerprint', type: IndexType.Key, attributes: ['device_fingerprint'] },
    ],
  },

  // ============================================
  // BENEFICIARY SYSTEM
  // ============================================
  {
    id: 'beneficiaries',
    name: 'İhtiyaç Sahipleri',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'tc_no', type: 'string', size: 11, required: true },
      { key: 'phone', type: 'string', size: 20, required: true },
      { key: 'email', type: 'email' },
      { key: 'birth_date', type: 'string', size: 20 },
      { key: 'gender', type: 'string', size: 20 },
      { key: 'nationality', type: 'string', size: 100 },
      {
        key: 'category',
        type: 'enum',
        enumValues: ['need_based_family', 'refugee_family', 'orphan_family'],
      },
      { key: 'beneficiary_type', type: 'enum', enumValues: ['primary_person', 'dependent'] },
      { key: 'primary_beneficiary_id', type: 'string', size: 36 },
      { key: 'relationship', type: 'string', size: 50 },
      { key: 'application_count', type: 'integer', default: 0 },
      { key: 'aid_count', type: 'integer', default: 0 },
      { key: 'orphan_count', type: 'integer', default: 0 },
      { key: 'dependent_count', type: 'integer', default: 0 },
      { key: 'last_assignment', type: 'string', size: 255 },
      { key: 'religion', type: 'string', size: 50 },
      { key: 'marital_status', type: 'string', size: 50 },
      { key: 'address', type: 'string', size: 500, required: true },
      { key: 'city', type: 'string', size: 100, required: true },
      { key: 'district', type: 'string', size: 100, required: true },
      { key: 'neighborhood', type: 'string', size: 100, required: true },
      { key: 'family_size', type: 'integer', required: true },
      { key: 'children_count', type: 'integer', default: 0 },
      { key: 'orphan_children_count', type: 'integer', default: 0 },
      { key: 'elderly_count', type: 'integer', default: 0 },
      { key: 'disabled_count', type: 'integer', default: 0 },
      { key: 'income_level', type: 'string', size: 50 },
      { key: 'income_source', type: 'string', size: 255 },
      { key: 'has_debt', type: 'boolean', default: false },
      { key: 'housing_type', type: 'string', size: 50 },
      { key: 'has_vehicle', type: 'boolean', default: false },
      { key: 'health_status', type: 'string', size: 100 },
      { key: 'has_chronic_illness', type: 'boolean', default: false },
      { key: 'chronic_illness_detail', type: 'string', size: 500 },
      { key: 'has_disability', type: 'boolean', default: false },
      { key: 'disability_detail', type: 'string', size: 500 },
      { key: 'has_health_insurance', type: 'boolean', default: false },
      { key: 'regular_medication', type: 'string', size: 500 },
      { key: 'education_level', type: 'string', size: 100 },
      { key: 'occupation', type: 'string', size: 100 },
      { key: 'employment_status', type: 'string', size: 50 },
      { key: 'aid_type', type: 'string', size: 100 },
      { key: 'totalAidAmount', type: 'float', default: 0 },
      { key: 'aid_duration', type: 'string', size: 50 },
      { key: 'priority', type: 'string', size: 20 },
      { key: 'reference_name', type: 'string', size: 255 },
      { key: 'reference_phone', type: 'string', size: 20 },
      { key: 'reference_relation', type: 'string', size: 100 },
      { key: 'application_source', type: 'string', size: 100 },
      { key: 'notes', type: 'string', size: 65535 },
      { key: 'previous_aid', type: 'boolean', default: false },
      { key: 'other_organization_aid', type: 'boolean', default: false },
      { key: 'emergency', type: 'boolean', default: false },
      { key: 'contact_preference', type: 'string', size: 50 },
      { key: 'status', type: 'enum', required: true, enumValues: ['TASLAK', 'AKTIF', 'PASIF', 'SILINDI'] },
      { key: 'approval_status', type: 'enum', enumValues: ['pending', 'approved', 'rejected'] },
      { key: 'approved_by', type: 'string', size: 36 },
      { key: 'approved_at', type: 'datetime' },
    ],
    indexes: [
      { key: 'by_tc_no', type: IndexType.Unique, attributes: ['tc_no'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_city', type: IndexType.Key, attributes: ['city'] },
    ],
  },

  {
    id: 'dependents',
    name: 'Bakmakla Yükümlü Olunanlar',
    attributes: [
      { key: 'beneficiary_id', type: 'string', size: 36, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'relationship', type: 'string', size: 50, required: true },
      { key: 'birth_date', type: 'string', size: 20 },
      { key: 'gender', type: 'string', size: 20 },
      { key: 'tc_no', type: 'string', size: 11 },
      { key: 'phone', type: 'string', size: 20 },
      { key: 'education_level', type: 'string', size: 100 },
      { key: 'occupation', type: 'string', size: 100 },
      { key: 'health_status', type: 'string', size: 100 },
      { key: 'has_disability', type: 'boolean', default: false },
      { key: 'disability_detail', type: 'string', size: 500 },
      { key: 'monthly_income', type: 'float', default: 0 },
      { key: 'notes', type: 'string', size: 65535 },
    ],
    indexes: [
      { key: 'by_beneficiary', type: IndexType.Key, attributes: ['beneficiary_id'] },
      { key: 'by_relationship', type: IndexType.Key, attributes: ['relationship'] },
    ],
  },

  {
    id: 'consents',
    name: 'Rıza Beyanları',
    attributes: [
      { key: 'beneficiary_id', type: 'string', size: 36, required: true },
      { key: 'consent_type', type: 'string', size: 100, required: true },
      { key: 'consent_text', type: 'string', size: 65535, required: true },
      { key: 'status', type: 'enum', required: true, enumValues: ['active', 'revoked', 'expired'] },
      { key: 'signed_at', type: 'datetime', required: true },
      { key: 'signed_by', type: 'string', size: 255 },
      { key: 'expires_at', type: 'datetime' },
      { key: 'created_by', type: 'string', size: 36 },
      { key: 'notes', type: 'string', size: 65535 },
    ],
    indexes: [
      { key: 'by_beneficiary', type: IndexType.Key, attributes: ['beneficiary_id'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  {
    id: 'bank_accounts',
    name: 'Banka Hesapları',
    attributes: [
      { key: 'beneficiary_id', type: 'string', size: 36, required: true },
      { key: 'bank_name', type: 'string', size: 100, required: true },
      { key: 'account_holder', type: 'string', size: 255, required: true },
      { key: 'account_number', type: 'string', size: 50, required: true },
      { key: 'iban', type: 'string', size: 34 },
      { key: 'branch_name', type: 'string', size: 100 },
      { key: 'branch_code', type: 'string', size: 20 },
      { key: 'account_type', type: 'enum', required: true, enumValues: ['checking', 'savings', 'other'] },
      { key: 'currency', type: 'enum', required: true, enumValues: ['TRY', 'USD', 'EUR'] },
      { key: 'is_primary', type: 'boolean', default: false },
      { key: 'status', type: 'enum', required: true, enumValues: ['active', 'inactive', 'closed'] },
      { key: 'notes', type: 'string', size: 65535 },
    ],
    indexes: [
      { key: 'by_beneficiary', type: IndexType.Key, attributes: ['beneficiary_id'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  // ============================================
  // DONATIONS
  // ============================================
  {
    id: 'donations',
    name: 'Bağışlar',
    attributes: [
      { key: 'donor_name', type: 'string', size: 255, required: true },
      { key: 'donor_phone', type: 'string', size: 20, required: true },
      { key: 'donor_email', type: 'email' },
      { key: 'amount', type: 'float', required: true },
      { key: 'currency', type: 'enum', required: true, enumValues: ['TRY', 'USD', 'EUR'] },
      { key: 'donation_type', type: 'string', size: 100, required: true },
      {
        key: 'payment_method',
        type: 'enum',
        required: true,
        enumValues: [
          'cash',
          'check',
          'credit_card',
          'online',
          'bank_transfer',
          'sms',
          'in_kind',
          'NAKIT',
          'CEK_SENET',
          'KREDI_KARTI',
          'ONLINE',
          'BANKA_HAVALESI',
          'SMS',
          'AYNI',
        ],
      },
      { key: 'payment_details', type: 'string', size: 65535 }, // JSON object
      { key: 'donation_purpose', type: 'string', size: 255, required: true },
      { key: 'notes', type: 'string', size: 65535 },
      { key: 'receipt_number', type: 'string', size: 50, required: true },
      { key: 'receipt_file_id', type: 'string', size: 36 },
      {
        key: 'status',
        type: 'enum',
        required: true,
        enumValues: ['pending', 'approved', 'completed', 'cancelled', 'rejected'],
      },
      { key: 'settlement_date', type: 'datetime' },
      { key: 'settlement_amount', type: 'float' },
      { key: 'transaction_reference', type: 'string', size: 100 },
      { key: 'tax_deductible', type: 'boolean', default: true },
      { key: 'is_kumbara', type: 'boolean', default: false },
      { key: 'kumbara_location', type: 'string', size: 255 },
      { key: 'collection_date', type: 'datetime' },
      { key: 'kumbara_institution', type: 'string', size: 255 },
      { key: 'location_coordinates', type: 'string', size: 100 }, // JSON {lat, lng}
      { key: 'location_address', type: 'string', size: 500 },
      { key: 'route_points', type: 'string', size: 65535 }, // JSON array
      { key: 'route_distance', type: 'float' },
      { key: 'route_duration', type: 'float' },
    ],
    indexes: [
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_donor_email', type: IndexType.Key, attributes: ['donor_email'] },
      { key: 'by_receipt_number', type: IndexType.Unique, attributes: ['receipt_number'] },
      { key: 'by_is_kumbara', type: IndexType.Key, attributes: ['is_kumbara'] },
    ],
  },

  {
    id: 'aid_applications',
    name: 'Yardım Başvuruları',
    attributes: [
      { key: 'application_date', type: 'datetime', required: true },
      { key: 'applicant_type', type: 'enum', required: true, enumValues: ['person', 'organization', 'partner'] },
      { key: 'applicant_name', type: 'string', size: 255, required: true },
      { key: 'beneficiary_id', type: 'string', size: 36 },
      { key: 'one_time_aid', type: 'float' },
      { key: 'regular_financial_aid', type: 'float' },
      { key: 'regular_food_aid', type: 'float' },
      { key: 'in_kind_aid', type: 'float' },
      { key: 'service_referral', type: 'float' },
      {
        key: 'stage',
        type: 'enum',
        required: true,
        enumValues: ['draft', 'under_review', 'approved', 'ongoing', 'completed'],
      },
      { key: 'status', type: 'enum', required: true, enumValues: ['open', 'closed'] },
      { key: 'description', type: 'string', size: 65535 },
      { key: 'notes', type: 'string', size: 65535 },
      { key: 'priority', type: 'enum', enumValues: ['low', 'normal', 'high', 'urgent'] },
      { key: 'processed_by', type: 'string', size: 36 },
      { key: 'processed_at', type: 'datetime' },
      { key: 'approved_by', type: 'string', size: 36 },
      { key: 'approved_at', type: 'datetime' },
      { key: 'completed_at', type: 'datetime' },
    ],
    indexes: [
      { key: 'by_beneficiary', type: IndexType.Key, attributes: ['beneficiary_id'] },
      { key: 'by_stage', type: IndexType.Key, attributes: ['stage'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  // ============================================
  // TASKS & MEETINGS
  // ============================================
  {
    id: 'tasks',
    name: 'Görevler',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 65535 },
      { key: 'assigned_to', type: 'string', size: 36 },
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'priority', type: 'enum', required: true, enumValues: ['low', 'normal', 'high', 'urgent'] },
      { key: 'status', type: 'enum', required: true, enumValues: ['pending', 'in_progress', 'completed', 'cancelled'] },
      { key: 'due_date', type: 'datetime' },
      { key: 'completed_at', type: 'datetime' },
      { key: 'category', type: 'string', size: 100 },
      { key: 'tags', type: 'string', size: 255, array: true },
      { key: 'is_read', type: 'boolean', required: true, default: false },
    ],
    indexes: [
      { key: 'by_assigned_to', type: IndexType.Key, attributes: ['assigned_to'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_created_by', type: IndexType.Key, attributes: ['created_by'] },
    ],
  },

  {
    id: 'meetings',
    name: 'Toplantılar',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 65535 },
      { key: 'meeting_date', type: 'datetime', required: true },
      { key: 'location', type: 'string', size: 255 },
      { key: 'organizer', type: 'string', size: 36, required: true },
      { key: 'participants', type: 'string', size: 65535 }, // JSON array of user IDs
      { key: 'status', type: 'enum', required: true, enumValues: ['scheduled', 'ongoing', 'completed', 'cancelled'] },
      { key: 'meeting_type', type: 'enum', required: true, enumValues: ['general', 'committee', 'board', 'other'] },
      { key: 'agenda', type: 'string', size: 65535 },
      { key: 'notes', type: 'string', size: 65535 },
    ],
    indexes: [
      { key: 'by_organizer', type: IndexType.Key, attributes: ['organizer'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_meeting_date', type: IndexType.Key, attributes: ['meeting_date'] },
    ],
  },

  {
    id: 'meeting_decisions',
    name: 'Toplantı Kararları',
    attributes: [
      { key: 'meeting_id', type: 'string', size: 36, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'summary', type: 'string', size: 65535 },
      { key: 'owner', type: 'string', size: 36 },
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'status', type: 'enum', required: true, enumValues: ['acik', 'devam', 'kapatildi'] },
      { key: 'tags', type: 'string', size: 255, array: true },
      { key: 'due_date', type: 'datetime' },
    ],
    indexes: [
      { key: 'by_meeting', type: IndexType.Key, attributes: ['meeting_id'] },
      { key: 'by_owner', type: IndexType.Key, attributes: ['owner'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  {
    id: 'meeting_action_items',
    name: 'Aksiyon Maddeleri',
    attributes: [
      { key: 'meeting_id', type: 'string', size: 36, required: true },
      { key: 'decision_id', type: 'string', size: 36 },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 65535 },
      { key: 'assigned_to', type: 'string', size: 36, required: true },
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'status', type: 'enum', required: true, enumValues: ['beklemede', 'devam', 'hazir', 'iptal'] },
      { key: 'due_date', type: 'datetime' },
      { key: 'completed_at', type: 'datetime' },
      { key: 'status_history', type: 'string', size: 65535 }, // JSON array
      { key: 'notes', type: 'string', size: 65535 }, // JSON array
      { key: 'reminder_scheduled_at', type: 'datetime' },
    ],
    indexes: [
      { key: 'by_meeting', type: IndexType.Key, attributes: ['meeting_id'] },
      { key: 'by_assigned_to', type: IndexType.Key, attributes: ['assigned_to'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  // ============================================
  // PARTNERS
  // ============================================
  {
    id: 'partners',
    name: 'Ortaklar',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'type', type: 'enum', required: true, enumValues: ['organization', 'individual', 'sponsor'] },
      { key: 'contact_person', type: 'string', size: 255 },
      { key: 'email', type: 'email' },
      { key: 'phone', type: 'string', size: 20 },
      { key: 'address', type: 'string', size: 500 },
      { key: 'website', type: 'url' },
      { key: 'tax_number', type: 'string', size: 20 },
      {
        key: 'partnership_type',
        type: 'enum',
        required: true,
        enumValues: ['donor', 'supplier', 'volunteer', 'sponsor', 'service_provider'],
      },
      { key: 'collaboration_start_date', type: 'datetime' },
      { key: 'collaboration_end_date', type: 'datetime' },
      { key: 'notes', type: 'string', size: 65535 },
      { key: 'status', type: 'enum', required: true, enumValues: ['active', 'inactive', 'pending'] },
      { key: 'total_contribution', type: 'float', default: 0 },
      { key: 'contribution_count', type: 'integer', default: 0 },
      { key: 'logo_url', type: 'url' },
    ],
    indexes: [
      { key: 'by_type', type: IndexType.Key, attributes: ['type'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_partnership_type', type: IndexType.Key, attributes: ['partnership_type'] },
    ],
  },

  // ============================================
  // FINANCE
  // ============================================
  {
    id: 'finance_records',
    name: 'Finans Kayıtları',
    attributes: [
      { key: 'record_type', type: 'enum', required: true, enumValues: ['income', 'expense'] },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'currency', type: 'enum', required: true, enumValues: ['TRY', 'USD', 'EUR'] },
      { key: 'description', type: 'string', size: 65535, required: true },
      { key: 'transaction_date', type: 'datetime', required: true },
      { key: 'payment_method', type: 'string', size: 50 },
      { key: 'receipt_number', type: 'string', size: 50 },
      { key: 'receipt_file_id', type: 'string', size: 36 },
      { key: 'related_to', type: 'string', size: 255 },
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'approved_by', type: 'string', size: 36 },
      { key: 'status', type: 'enum', required: true, enumValues: ['pending', 'approved', 'rejected'] },
    ],
    indexes: [
      { key: 'by_record_type', type: IndexType.Key, attributes: ['record_type'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_created_by', type: IndexType.Key, attributes: ['created_by'] },
    ],
  },

  // ============================================
  // MESSAGES & COMMUNICATION
  // ============================================
  {
    id: 'messages',
    name: 'Mesajlar',
    attributes: [
      { key: 'message_type', type: 'enum', required: true, enumValues: ['sms', 'email', 'internal', 'whatsapp'] },
      { key: 'sender', type: 'string', size: 36, required: true },
      { key: 'recipients', type: 'string', size: 65535 }, // JSON array
      { key: 'subject', type: 'string', size: 255 },
      { key: 'content', type: 'string', size: 65535, required: true },
      { key: 'sent_at', type: 'datetime' },
      { key: 'status', type: 'enum', required: true, enumValues: ['draft', 'sent', 'failed'] },
      { key: 'is_bulk', type: 'boolean', required: true, default: false },
      { key: 'template_id', type: 'string', size: 36 },
    ],
    indexes: [
      { key: 'by_sender', type: IndexType.Key, attributes: ['sender'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  {
    id: 'workflow_notifications',
    name: 'İş Akışı Bildirimleri',
    attributes: [
      { key: 'recipient', type: 'string', size: 36, required: true },
      { key: 'triggered_by', type: 'string', size: 36 },
      { key: 'category', type: 'enum', required: true, enumValues: ['meeting', 'gorev', 'rapor', 'hatirlatma'] },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'body', type: 'string', size: 65535 },
      { key: 'status', type: 'enum', required: true, enumValues: ['beklemede', 'gonderildi', 'okundu'] },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'sent_at', type: 'datetime' },
      { key: 'read_at', type: 'datetime' },
      { key: 'reference', type: 'string', size: 65535 }, // JSON object
      { key: 'metadata', type: 'string', size: 65535 }, // JSON object
    ],
    indexes: [
      { key: 'by_recipient', type: IndexType.Key, attributes: ['recipient'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_category', type: IndexType.Key, attributes: ['category'] },
    ],
  },

  // ============================================
  // SCHOLARSHIPS
  // ============================================
  {
    id: 'scholarships',
    name: 'Burs Programları',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 65535 },
      { key: 'amount', type: 'float', required: true },
      { key: 'currency', type: 'enum', required: true, enumValues: ['TRY', 'USD', 'EUR'] },
      { key: 'duration_months', type: 'integer' },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'eligibility_criteria', type: 'string', size: 65535 },
      { key: 'requirements', type: 'string', size: 65535 }, // JSON array
      { key: 'application_start_date', type: 'datetime', required: true },
      { key: 'application_end_date', type: 'datetime', required: true },
      { key: 'academic_year', type: 'string', size: 20 },
      { key: 'max_recipients', type: 'integer' },
      { key: 'is_active', type: 'boolean', required: true, default: true },
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'created_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'by_category', type: IndexType.Key, attributes: ['category'] },
      { key: 'by_is_active', type: IndexType.Key, attributes: ['is_active'] },
    ],
  },

  {
    id: 'scholarship_applications',
    name: 'Burs Başvuruları',
    attributes: [
      { key: 'scholarship_id', type: 'string', size: 36, required: true },
      { key: 'student_id', type: 'string', size: 36 },
      { key: 'created_by', type: 'string', size: 36 },
      { key: 'applicant_name', type: 'string', size: 255, required: true },
      { key: 'applicant_tc_no', type: 'string', size: 11, required: true },
      { key: 'applicant_phone', type: 'string', size: 20, required: true },
      { key: 'applicant_email', type: 'email' },
      { key: 'university', type: 'string', size: 255 },
      { key: 'department', type: 'string', size: 255 },
      { key: 'grade_level', type: 'string', size: 10 },
      { key: 'gpa', type: 'float' },
      { key: 'academic_year', type: 'string', size: 20 },
      { key: 'monthly_income', type: 'float' },
      { key: 'family_income', type: 'float' },
      { key: 'father_occupation', type: 'string', size: 100 },
      { key: 'mother_occupation', type: 'string', size: 100 },
      { key: 'sibling_count', type: 'integer' },
      { key: 'is_orphan', type: 'boolean', default: false },
      { key: 'has_disability', type: 'boolean', default: false },
      { key: 'essay', type: 'string', size: 65535 },
      {
        key: 'status',
        type: 'enum',
        required: true,
        enumValues: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted'],
      },
      { key: 'priority_score', type: 'float' },
      { key: 'reviewer_notes', type: 'string', size: 65535 },
      { key: 'submitted_at', type: 'datetime' },
      { key: 'reviewed_by', type: 'string', size: 36 },
      { key: 'reviewed_at', type: 'datetime' },
      { key: 'documents', type: 'string', size: 65535 }, // JSON array
      { key: 'created_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'by_scholarship', type: IndexType.Key, attributes: ['scholarship_id'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_tc_no', type: IndexType.Key, attributes: ['applicant_tc_no'] },
    ],
  },

  // ============================================
  // SYSTEM
  // ============================================
  {
    id: 'system_settings',
    name: 'Sistem Ayarları',
    attributes: [
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'key', type: 'string', size: 100, required: true },
      { key: 'value', type: 'string', size: 65535 },
      { key: 'label', type: 'string', size: 255 },
      { key: 'description', type: 'string', size: 65535 },
      { key: 'is_public', type: 'boolean', default: false },
      { key: 'is_encrypted', type: 'boolean', default: false },
      { key: 'data_type', type: 'string', size: 50 },
      { key: 'default_value', type: 'string', size: 65535 },
      { key: 'updated_by', type: 'string', size: 36 },
      { key: 'updated_at', type: 'datetime' },
      { key: 'version', type: 'integer', default: 1 },
    ],
    indexes: [
      { key: 'by_category', type: IndexType.Key, attributes: ['category'] },
      { key: 'by_key', type: IndexType.Key, attributes: ['key'] },
    ],
  },

  {
    id: 'parameters',
    name: 'Parametreler',
    attributes: [
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'name_tr', type: 'string', size: 255, required: true },
      { key: 'name_en', type: 'string', size: 255 },
      { key: 'name_ar', type: 'string', size: 255 },
      { key: 'name_ru', type: 'string', size: 255 },
      { key: 'name_fr', type: 'string', size: 255 },
      { key: 'value', type: 'string', size: 255, required: true },
      { key: 'order', type: 'integer', required: true },
      { key: 'is_active', type: 'boolean', required: true, default: true },
    ],
    indexes: [
      { key: 'by_category', type: IndexType.Key, attributes: ['category'] },
      { key: 'by_value', type: IndexType.Key, attributes: ['value'] },
    ],
  },

  // ============================================
  // AUDIT & SECURITY
  // ============================================
  {
    id: 'audit_logs',
    name: 'Denetim Kayıtları',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'userName', type: 'string', size: 255, required: true },
      { key: 'action', type: 'enum', required: true, enumValues: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'] },
      { key: 'resource', type: 'string', size: 100, required: true },
      { key: 'resourceId', type: 'string', size: 36, required: true },
      { key: 'changes', type: 'string', size: 65535 }, // JSON
      { key: 'ipAddress', type: 'string', size: 45 },
      { key: 'userAgent', type: 'string', size: 500 },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_user', type: IndexType.Key, attributes: ['userId'] },
      { key: 'by_resource', type: IndexType.Key, attributes: ['resource', 'resourceId'] },
      { key: 'by_action', type: IndexType.Key, attributes: ['action'] },
      { key: 'by_timestamp', type: IndexType.Key, attributes: ['timestamp'] },
    ],
  },

  {
    id: 'security_events',
    name: 'Güvenlik Olayları',
    attributes: [
      { key: 'event_type', type: 'string', size: 100, required: true },
      { key: 'user_id', type: 'string', size: 36 },
      { key: 'ip_address', type: 'string', size: 45 },
      { key: 'user_agent', type: 'string', size: 500 },
      { key: 'details', type: 'string', size: 65535 }, // JSON
      { key: 'severity', type: 'enum', required: true, enumValues: ['low', 'medium', 'high', 'critical'] },
      { key: 'occurred_at', type: 'datetime', required: true },
      { key: 'reviewed', type: 'boolean', required: true, default: false },
    ],
    indexes: [
      { key: 'by_user', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'by_event_type', type: IndexType.Key, attributes: ['event_type'] },
      { key: 'by_occurred_at', type: IndexType.Key, attributes: ['occurred_at'] },
    ],
  },

  // ============================================
  // DOCUMENTS
  // ============================================
  {
    id: 'files',
    name: 'Dosyalar',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'file_id', type: 'string', size: 36, required: true },
      { key: 'bucket_id', type: 'string', size: 100, required: true },
      { key: 'mime_type', type: 'string', size: 100 },
      { key: 'size', type: 'integer' },
      { key: 'uploaded_by', type: 'string', size: 36, required: true },
      { key: 'uploaded_at', type: 'datetime', required: true },
      { key: 'related_to', type: 'string', size: 100 },
      { key: 'related_id', type: 'string', size: 36 },
      { key: 'category', type: 'string', size: 100 },
      { key: 'tags', type: 'string', size: 255, array: true },
      { key: 'is_public', type: 'boolean', default: false },
    ],
    indexes: [
      { key: 'by_uploaded_by', type: IndexType.Key, attributes: ['uploaded_by'] },
      { key: 'by_related', type: IndexType.Key, attributes: ['related_to', 'related_id'] },
      { key: 'by_category', type: IndexType.Key, attributes: ['category'] },
    ],
  },

  {
    id: 'document_versions',
    name: 'Doküman Versiyonları',
    attributes: [
      { key: 'file_id', type: 'string', size: 36, required: true },
      { key: 'version_number', type: 'integer', required: true },
      { key: 'file_id_version', type: 'string', size: 36, required: true },
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'change_summary', type: 'string', size: 65535 },
      { key: 'is_current', type: 'boolean', required: true, default: true },
    ],
    indexes: [
      { key: 'by_file', type: IndexType.Key, attributes: ['file_id'] },
      { key: 'by_version', type: IndexType.Key, attributes: ['file_id', 'version_number'] },
    ],
  },

  // ============================================
  // REPORTING
  // ============================================
  {
    id: 'report_configs',
    name: 'Rapor Yapılandırmaları',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 100, required: true },
      { key: 'config', type: 'string', size: 65535, required: true }, // JSON
      { key: 'created_by', type: 'string', size: 36, required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'updated_at', type: 'datetime' },
      { key: 'is_active', type: 'boolean', required: true, default: true },
    ],
    indexes: [
      { key: 'by_type', type: IndexType.Key, attributes: ['type'] },
      { key: 'by_created_by', type: IndexType.Key, attributes: ['created_by'] },
    ],
  },

  // ============================================
  // THEME
  // ============================================
  {
    id: 'theme_presets',
    name: 'Tema Ön Ayarları',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'theme_config', type: 'string', size: 65535, required: true }, // JSON
      { key: 'is_default', type: 'boolean', default: false },
      { key: 'created_by', type: 'string', size: 36 },
      { key: 'created_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'by_name', type: IndexType.Key, attributes: ['name'] },
      { key: 'by_default', type: IndexType.Key, attributes: ['is_default'] },
    ],
  },

  // ============================================
  // RATE LIMITING
  // ============================================
  {
    id: 'rate_limit_log',
    name: 'Rate Limit Log',
    attributes: [
      { key: 'ip_address', type: 'string', size: 45, required: true },
      { key: 'endpoint', type: 'string', size: 255, required: true },
      { key: 'request_count', type: 'integer', required: true },
      { key: 'window_start', type: 'datetime', required: true },
      { key: 'window_end', type: 'datetime', required: true },
      { key: 'blocked', type: 'boolean', required: true, default: false },
    ],
    indexes: [
      { key: 'by_ip', type: IndexType.Key, attributes: ['ip_address'] },
      { key: 'by_endpoint', type: IndexType.Key, attributes: ['endpoint'] },
      { key: 'by_window', type: IndexType.Key, attributes: ['window_start'] },
    ],
  },

  // ============================================
  // COMMUNICATION LOGS
  // ============================================
  {
    id: 'communication_logs',
    name: 'İletişim Logları',
    attributes: [
      { key: 'message_id', type: 'string', size: 36 },
      { key: 'recipient', type: 'string', size: 255, required: true },
      { key: 'channel', type: 'enum', required: true, enumValues: ['sms', 'email', 'whatsapp', 'internal'] },
      { key: 'status', type: 'enum', required: true, enumValues: ['sent', 'delivered', 'failed', 'pending'] },
      { key: 'sent_at', type: 'datetime' },
      { key: 'delivered_at', type: 'datetime' },
      { key: 'error_message', type: 'string', size: 65535 },
      { key: 'metadata', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_recipient', type: IndexType.Key, attributes: ['recipient'] },
      { key: 'by_channel', type: IndexType.Key, attributes: ['channel'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  // ============================================
  // SCHOLARSHIP PAYMENTS
  // ============================================
  {
    id: 'scholarship_payments',
    name: 'Burs Ödemeleri',
    attributes: [
      { key: 'scholarship_application_id', type: 'string', size: 36, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'currency', type: 'enum', required: true, enumValues: ['TRY', 'USD', 'EUR'] },
      { key: 'payment_date', type: 'datetime', required: true },
      { key: 'payment_method', type: 'string', size: 50 },
      { key: 'transaction_reference', type: 'string', size: 100 },
      { key: 'status', type: 'enum', required: true, enumValues: ['pending', 'completed', 'failed', 'cancelled'] },
      { key: 'processed_by', type: 'string', size: 36 },
      { key: 'notes', type: 'string', size: 65535 },
    ],
    indexes: [
      { key: 'by_application', type: IndexType.Key, attributes: ['scholarship_application_id'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_payment_date', type: IndexType.Key, attributes: ['payment_date'] },
    ],
  },

  // ============================================
  // ERROR TRACKING
  // ============================================
  {
    id: 'errors',
    name: 'Hatalar',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 65535, required: true },
      { key: 'stack', type: 'string', size: 65535 },
      { key: 'severity', type: 'enum', required: true, enumValues: ['low', 'medium', 'high', 'critical'] },
      { key: 'status', type: 'enum', required: true, enumValues: ['open', 'investigating', 'resolved', 'ignored'] },
      { key: 'assigned_to', type: 'string', size: 36 },
      { key: 'first_occurred', type: 'datetime', required: true },
      { key: 'last_occurred', type: 'datetime', required: true },
      { key: 'occurrence_count', type: 'integer', required: true, default: 1 },
    ],
    indexes: [
      { key: 'by_severity', type: IndexType.Key, attributes: ['severity'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
      { key: 'by_assigned_to', type: IndexType.Key, attributes: ['assigned_to'] },
    ],
  },

  {
    id: 'error_occurrences',
    name: 'Hata Oluşumları',
    attributes: [
      { key: 'error_id', type: 'string', size: 36, required: true },
      { key: 'occurred_at', type: 'datetime', required: true },
      { key: 'user_id', type: 'string', size: 36 },
      { key: 'ip_address', type: 'string', size: 45 },
      { key: 'user_agent', type: 'string', size: 500 },
      { key: 'context', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_error', type: IndexType.Key, attributes: ['error_id'] },
      { key: 'by_occurred_at', type: IndexType.Key, attributes: ['occurred_at'] },
    ],
  },

  {
    id: 'error_logs',
    name: 'Hata Logları',
    attributes: [
      { key: 'error_id', type: 'string', size: 36 },
      { key: 'level', type: 'enum', required: true, enumValues: ['error', 'warning', 'info', 'debug'] },
      { key: 'message', type: 'string', size: 65535, required: true },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_error', type: IndexType.Key, attributes: ['error_id'] },
      { key: 'by_level', type: IndexType.Key, attributes: ['level'] },
      { key: 'by_timestamp', type: IndexType.Key, attributes: ['timestamp'] },
    ],
  },

  {
    id: 'system_alerts',
    name: 'Sistem Uyarıları',
    attributes: [
      { key: 'alert_type', type: 'string', size: 100, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 65535, required: true },
      { key: 'severity', type: 'enum', required: true, enumValues: ['info', 'warning', 'error', 'critical'] },
      { key: 'status', type: 'enum', required: true, enumValues: ['active', 'acknowledged', 'resolved'] },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'acknowledged_at', type: 'datetime' },
      { key: 'acknowledged_by', type: 'string', size: 36 },
    ],
    indexes: [
      { key: 'by_type', type: IndexType.Key, attributes: ['alert_type'] },
      { key: 'by_severity', type: IndexType.Key, attributes: ['severity'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  // ============================================
  // MONITORING
  // ============================================
  {
    id: 'analytics_events',
    name: 'Analitik Olayları',
    attributes: [
      { key: 'event_type', type: 'string', size: 100, required: true },
      { key: 'user_id', type: 'string', size: 36 },
      { key: 'session_id', type: 'string', size: 36 },
      { key: 'properties', type: 'string', size: 65535 }, // JSON
      { key: 'timestamp', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'by_event_type', type: IndexType.Key, attributes: ['event_type'] },
      { key: 'by_user', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'by_timestamp', type: IndexType.Key, attributes: ['timestamp'] },
    ],
  },

  {
    id: 'performance_metrics',
    name: 'Performans Metrikleri',
    attributes: [
      { key: 'metric_name', type: 'string', size: 100, required: true },
      { key: 'value', type: 'float', required: true },
      { key: 'unit', type: 'string', size: 20 },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_metric', type: IndexType.Key, attributes: ['metric_name'] },
      { key: 'by_timestamp', type: IndexType.Key, attributes: ['timestamp'] },
    ],
  },

  // ============================================
  // AI FEATURES
  // ============================================
  {
    id: 'ai_chats',
    name: 'AI Sohbetleri',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'title', type: 'string', size: 255 },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'updated_at', type: 'datetime', required: true },
      { key: 'message_count', type: 'integer', default: 0 },
    ],
    indexes: [
      { key: 'by_user', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'by_updated_at', type: IndexType.Key, attributes: ['updated_at'] },
    ],
  },

  {
    id: 'agent_threads',
    name: 'Agent Threads',
    attributes: [
      { key: 'chat_id', type: 'string', size: 36 },
      { key: 'thread_id', type: 'string', size: 100, required: true },
      { key: 'status', type: 'enum', required: true, enumValues: ['active', 'completed', 'cancelled'] },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'updated_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'by_chat', type: IndexType.Key, attributes: ['chat_id'] },
      { key: 'by_thread', type: IndexType.Key, attributes: ['thread_id'] },
      { key: 'by_status', type: IndexType.Key, attributes: ['status'] },
    ],
  },

  {
    id: 'agent_messages',
    name: 'Agent Mesajları',
    attributes: [
      { key: 'thread_id', type: 'string', size: 100, required: true },
      { key: 'role', type: 'enum', required: true, enumValues: ['user', 'assistant', 'system'] },
      { key: 'content', type: 'string', size: 65535, required: true },
      { key: 'created_at', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_thread', type: IndexType.Key, attributes: ['thread_id'] },
      { key: 'by_role', type: IndexType.Key, attributes: ['role'] },
      { key: 'by_created_at', type: IndexType.Key, attributes: ['created_at'] },
    ],
  },

  {
    id: 'agent_tools',
    name: 'Agent Araçları',
    attributes: [
      { key: 'tool_name', type: 'string', size: 100, required: true },
      { key: 'tool_type', type: 'string', size: 50, required: true },
      { key: 'config', type: 'string', size: 65535 }, // JSON
      { key: 'is_active', type: 'boolean', required: true, default: true },
    ],
    indexes: [
      { key: 'by_name', type: IndexType.Key, attributes: ['tool_name'] },
      { key: 'by_type', type: IndexType.Key, attributes: ['tool_type'] },
    ],
  },

  {
    id: 'agent_usage',
    name: 'Agent Kullanımı',
    attributes: [
      { key: 'user_id', type: 'string', size: 36 },
      { key: 'thread_id', type: 'string', size: 100 },
      { key: 'tool_name', type: 'string', size: 100 },
      { key: 'usage_count', type: 'integer', required: true, default: 1 },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 65535 }, // JSON
    ],
    indexes: [
      { key: 'by_user', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'by_thread', type: IndexType.Key, attributes: ['thread_id'] },
      { key: 'by_tool', type: IndexType.Key, attributes: ['tool_name'] },
    ],
  },
];

// ============================================
// SETUP FUNCTIONS
// ============================================

async function createDatabase() {
  console.log('\n📦 Creating database...');
  try {
    await databases.create(DATABASE_ID, DATABASE_NAME);
    console.log(`   ✓ Database "${DATABASE_NAME}" created`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`   ⚠ Database "${DATABASE_NAME}" already exists`);
    } else {
      throw error;
    }
  }
}

async function createCollection(config: CollectionConfig) {
  console.log(`\n📁 Creating collection: ${config.name} (${config.id})`);

  try {
    // Create collection
    await databases.createCollection(DATABASE_ID, config.id, config.name);
    console.log(`   ✓ Collection created`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`   ⚠ Collection already exists`);
    } else {
      throw error;
    }
  }

  // Create attributes
  for (const attr of config.attributes) {
    await createAttribute(config.id, attr);
  }

  // Create indexes
  if (config.indexes) {
    for (const index of config.indexes) {
      await createIndex(config.id, index);
    }
  }
}

async function createAttribute(collectionId: string, attr: AttributeConfig) {
  try {
    const commonParams = {
      databaseId: DATABASE_ID,
      collectionId,
      key: attr.key,
      required: attr.required || false,
      array: attr.array || false,
    };

    // Appwrite doesn't allow default values for required attributes
    const canHaveDefault = !commonParams.required;
    const defaultValue = canHaveDefault ? attr.default : undefined;

    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          attr.size || 255,
          commonParams.required,
          defaultValue as string | undefined,
          commonParams.array
        );
        break;

      case 'integer':
        await databases.createIntegerAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          undefined,
          undefined,
          defaultValue as number | undefined,
          commonParams.array
        );
        break;

      case 'float':
        await databases.createFloatAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          undefined,
          undefined,
          defaultValue as number | undefined,
          commonParams.array
        );
        break;

      case 'boolean':
        await databases.createBooleanAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          defaultValue as boolean | undefined,
          commonParams.array
        );
        break;

      case 'datetime':
        await databases.createDatetimeAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          defaultValue as string | undefined,
          commonParams.array
        );
        break;

      case 'email':
        await databases.createEmailAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          defaultValue as string | undefined,
          commonParams.array
        );
        break;

      case 'url':
        await databases.createUrlAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          defaultValue as string | undefined,
          commonParams.array
        );
        break;

      case 'ip':
        await databases.createIpAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          commonParams.required,
          defaultValue as string | undefined,
          commonParams.array
        );
        break;

      case 'enum':
        await databases.createEnumAttribute(
          commonParams.databaseId,
          commonParams.collectionId,
          commonParams.key,
          attr.enumValues || [],
          commonParams.required,
          defaultValue as string | undefined,
          commonParams.array
        );
        break;
    }

    console.log(`   ✓ Attribute: ${attr.key} (${attr.type})`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`   ⚠ Attribute: ${attr.key} already exists`);
    } else {
      console.error(`   ✗ Attribute: ${attr.key} - Error:`, error);
    }
  }
}

async function createIndex(
  collectionId: string,
  index: { key: string; type: IndexType; attributes: string[]; orders?: ('ASC' | 'DESC')[] }
) {
  try {
    await databases.createIndex(
      DATABASE_ID,
      collectionId,
      index.key,
      index.type,
      index.attributes,
      index.orders
    );
    console.log(`   ✓ Index: ${index.key}`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`   ⚠ Index: ${index.key} already exists`);
    } else {
      console.error(`   ✗ Index: ${index.key} - Error:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Appwrite Database Setup');
  console.log('=' .repeat(50));
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Project: ${projectId}`);
  console.log(`Database: ${DATABASE_ID}`);
  console.log('=' .repeat(50));

  try {
    // Create database
    await createDatabase();

    // Create collections
    for (const config of collections) {
      await createCollection(config);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n✅ Setup completed successfully!');
    console.log(`\nDatabase ID: ${DATABASE_ID}`);
    console.log(`Collections created: ${collections.length}`);
    console.log('\nAdd these to your .env.local:');
    console.log(`NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DATABASE_ID}`);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
