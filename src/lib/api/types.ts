/**
 * API Types for CRUD Operations
 *
 * Replaces 'any' types with proper TypeScript interfaces
 * Provides type-safe API contracts for all resources
 */

// Id type
type Id<_T> = string;

// ========================================
// BENEFICIARY TYPES
// ========================================

export interface BeneficiaryCreateInput {
  name: string;
  tc_no: string;
  phone: string;
  address: string;
  email?: string;
  status?: 'TASLAK' | 'AKTIF' | 'PASIF' | 'SILINDI';
  city?: string;
  district?: string;
  neighborhood?: string;
  family_size?: number;
  birth_date?: string;
  gender?: string;
  nationality?: string;
  [key: string]: unknown;
}

export interface BeneficiaryUpdateInput extends Partial<BeneficiaryCreateInput> {
  auth?: { userId: string; role: string };
}

// ========================================
// DONATION TYPES
// ========================================

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'online'
  | 'bank_transfer'
  | 'sms'
  | 'in_kind'
  | 'NAKIT'
  | 'CEK_SENET'
  | 'KREDI_KARTI'
  | 'ONLINE'
  | 'BANKA_HAVALESI'
  | 'SMS'
  | 'AYNI';

export interface DonationCreateInput {
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  donation_type: string;
  payment_method: PaymentMethod;
  donation_purpose: string;
  notes?: string;
  receipt_number: string;
  receipt_file_id?: string;
  status: 'pending' | 'completed' | 'cancelled';
  // Kumbara-specific fields (optional)
  is_kumbara?: boolean;
  kumbara_location?: string;
  collection_date?: string;
  kumbara_institution?: string;
  location_coordinates?: { lat: number; lng: number };
  location_address?: string;
  route_points?: { lat: number; lng: number }[];
  route_distance?: number;
  route_duration?: number;
  [key: string]: unknown;
}

export interface DonationUpdateInput extends Partial<DonationCreateInput> {
  auth?: { userId: string; role: string };
}

// ========================================
// TASK TYPES
// ========================================

export interface TaskCreateInput {
  title: string;
  description?: string;
  assigned_to?: Id<'users'>;
  created_by: Id<'users'>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  category?: string;
  tags?: string[];
  is_read: boolean;
  [key: string]: unknown;
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {
  auth?: { userId: string; role: string };
}

// ========================================
// TODO TYPES
// ========================================

export interface TodoCreateInput {
  title: string;
  description?: string;
  completed?: boolean;
  completed_at?: string;
  created_by: Id<'users'>;
  due_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  is_read: boolean;
  [key: string]: unknown;
}

export interface TodoUpdateInput extends Partial<TodoCreateInput> {
  auth?: { userId: string; role: string };
}

// ========================================
// MEETING TYPES
// ========================================

export interface MeetingCreateInput {
  title: string;
  description?: string;
  meeting_date: string;
  location?: string;
  organizer: Id<'users'>;
  participants: Id<'users'>[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  meeting_type: 'general' | 'committee' | 'board' | 'other';
  agenda?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface MeetingUpdateInput extends Partial<MeetingCreateInput> {
  auth?: { userId: string; role: string };
}

// ========================================
// MEETING DECISION TYPES
// ========================================

export interface MeetingDecisionCreateInput {
  meeting_id: Id<'meetings'>;
  title: string;
  summary?: string;
  owner?: Id<'users'>;
  created_by: Id<'users'>;
  status?: 'acik' | 'devam' | 'kapatildi';
  tags?: string[];
  due_date?: string;
  [key: string]: unknown;
}

export type MeetingDecisionUpdateInput = Partial<MeetingDecisionCreateInput>;

// ========================================
// MEETING ACTION ITEM TYPES
// ========================================

export interface MeetingActionItemCreateInput {
  meeting_id: Id<'meetings'>;
  title: string;
  assigned_to: Id<'users'>;
  created_by: Id<'users'>;
  decision_id?: Id<'meeting_decisions'>;
  description?: string;
  due_date?: string;
  status?: 'devam' | 'beklemede' | 'hazir' | 'iptal';
  notes?: string[];
  reminder_scheduled_at?: string;
  [key: string]: unknown;
}

export type MeetingActionItemUpdateInput = Partial<MeetingActionItemCreateInput>;

// ========================================
// MESSAGE TYPES
// ========================================

export interface MessageCreateInput {
  message_type: 'sms' | 'email' | 'internal';
  sender: Id<'users'>;
  recipients: Id<'users'>[];
  content: string;
  status: 'draft' | 'sent' | 'failed';
  is_bulk: boolean;
  subject?: string;
  template_id?: string;
  [key: string]: unknown;
}

export type MessageUpdateInput = Partial<MessageCreateInput>;

// ========================================
// USER TYPES
// ========================================

export interface UserCreateInput {
  name: string;
  email: string;
  role: string;
  permissions: string[];
  passwordHash: string;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  labels?: string[];
  [key: string]: unknown;
}

export interface UserUpdateInput extends Partial<UserCreateInput> {
  auth?: { userId: string; role: string };
}

// ========================================
// WORKFLOW NOTIFICATION TYPES
// ========================================

export interface WorkflowNotificationCreateInput {
  recipient: Id<'users'>;
  category: 'meeting' | 'gorev' | 'rapor' | 'hatirlatma';
  title: string;
  triggered_by?: Id<'users'>;
  body?: string;
  status?: 'beklemede' | 'gonderildi' | 'okundu';
  reference?: {
    type: 'meeting_action_item' | 'meeting' | 'meeting_decision';
    id: string;
  };
  metadata?: Record<string, unknown>;
  created_at?: string;
  [key: string]: unknown;
}

// ========================================
// AID APPLICATION TYPES
// ========================================

export interface AidApplicationCreateInput {
  application_date: string;
  applicant_type: 'person' | 'organization' | 'partner';
  applicant_name: string;
  beneficiary_id?: Id<'beneficiaries'>;
  one_time_aid?: number;
  regular_financial_aid?: number;
  regular_food_aid?: number;
  in_kind_aid?: number;
  service_referral?: number;
  stage: 'draft' | 'under_review' | 'approved' | 'ongoing' | 'completed';
  status: 'open' | 'closed';
  description?: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  [key: string]: unknown;
}

export type AidApplicationUpdateInput = Partial<AidApplicationCreateInput>;

// ========================================
// FINANCE RECORD TYPES
// ========================================

export interface FinanceRecordCreateInput {
  record_type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  description: string;
  transaction_date: string;
  created_by: Id<'users'>;
  status: 'pending' | 'approved' | 'rejected';
  payment_method?: string;
  receipt_number?: string;
  receipt_file_id?: string;
  related_to?: string;
  [key: string]: unknown;
}

export type FinanceRecordUpdateInput = Partial<FinanceRecordCreateInput>;

// ========================================
// PARTNER TYPES
// ========================================

export interface PartnerCreateInput {
  name: string;
  type: 'organization' | 'individual' | 'sponsor';
  partnership_type: 'donor' | 'supplier' | 'volunteer' | 'sponsor' | 'service_provider';
  status: 'active' | 'inactive' | 'pending';
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  collaboration_start_date?: string;
  collaboration_end_date?: string;
  notes?: string;
  total_contribution?: number;
  contribution_count?: number;
  logo_url?: string;
  [key: string]: unknown;
}

export type PartnerUpdateInput = Partial<PartnerCreateInput>;

// ========================================
// SCHOLARSHIP TYPES
// ========================================

export interface ScholarshipCreateInput {
  beneficiary_id: Id<'beneficiaries'>;
  scholarship_type: string;
  amount: number;
  start_date: string;
  end_date?: string;
  status?: 'active' | 'completed' | 'cancelled';
  [key: string]: unknown;
}

export type ScholarshipUpdateInput = Partial<ScholarshipCreateInput>;

// ========================================
// GENERIC MUTATION PAYLOAD TYPES
// ========================================

/**
 * Payload for create mutations with auth context
 */
export type CreateMutationPayload<T extends { [key: string]: unknown }> = T & {
  auth?: { userId: string; role: string };
};

/**
 * Payload for update mutations with ID and auth
 */
export type UpdateMutationPayload<T extends { [key: string]: unknown }> = T & {
  id: Id<any>;
  auth?: { userId: string; role: string };
};

// ========================================
// API RESPONSE TYPES
// ========================================

/**
 * Standard response from Appwrite HTTP API
 */
export interface ListResponse<T> {
  documents?: T[];
  data?: T[];
  total?: number;
  error?: string | null;
  message?: string;
}

export interface GetResponse<T> {
  data?: T;
  error?: string | null;
}

export interface MutationResponse<T> {
  data?: T;
  error?: string | null;
}

// Legacy aliases for backward compatibility
export type ConvexListResponse<T> = ListResponse<T>;
export type ConvexGetResponse<T> = GetResponse<T>;
export type ConvexMutationResponse<T> = MutationResponse<T>;

// ========================================
// TYPE EXPORTS
// ========================================

export const ApiTypes = {
  Beneficiary: {} as BeneficiaryCreateInput,
  Donation: {} as DonationCreateInput,
  Task: {} as TaskCreateInput,
  Todo: {} as TodoCreateInput,
  Meeting: {} as MeetingCreateInput,
  MeetingDecision: {} as MeetingDecisionCreateInput,
  MeetingActionItem: {} as MeetingActionItemCreateInput,
  Message: {} as MessageCreateInput,
  User: {} as UserCreateInput,
  AidApplication: {} as AidApplicationCreateInput,
  FinanceRecord: {} as FinanceRecordCreateInput,
  Partner: {} as PartnerCreateInput,
  Scholarship: {} as ScholarshipCreateInput,
};
