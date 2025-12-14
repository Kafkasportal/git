/**
 * Test Factory System
 * Provides factory functions for creating test data
 * 
 * @module test-utils/factories
 */

import type {
  BeneficiaryDocument,
  DonationDocument,
  UserDocument,
  TaskDocument,
  MeetingDocument,
  FinanceRecordDocument,
  ScholarshipDocument,
  AidApplicationDocument,
} from '@/types/database';
import type { PermissionValue } from '@/types/permissions';

// Counter for unique IDs
let idCounter = 0;

/**
 * Generate a unique ID for test documents
 */
function generateId(prefix = 'test'): string {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

/**
 * Generate ISO date string
 */
function isoDate(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

/**
 * Factory interface for creating test data
 */
export interface TestFactory<T> {
  build(overrides?: Partial<T>): T;
  buildList(count: number, overrides?: Partial<T>): T[];
}

/**
 * Create a factory for a given type
 */
function createFactory<T>(defaults: () => T): TestFactory<T> {
  return {
    build(overrides?: Partial<T>): T {
      return { ...defaults(), ...overrides };
    },
    buildList(count: number, overrides?: Partial<T>): T[] {
      return Array.from({ length: count }, () => this.build(overrides));
    },
  };
}


// ============================================
// USER FACTORY
// ============================================

export const userFactory = createFactory<UserDocument>(() => ({
  $id: generateId('user'),
  name: 'Test User',
  email: `test${idCounter}@example.com`,
  role: 'user',
  permissions: ['beneficiaries:access'] as PermissionValue[],
  isActive: true,
  $createdAt: isoDate(-30),
  $updatedAt: isoDate(),
}));

// ============================================
// BENEFICIARY FACTORY
// ============================================

export const beneficiaryFactory = createFactory<BeneficiaryDocument>(() => ({
  $id: generateId('beneficiary'),
  name: 'Test Beneficiary',
  tc_no: `${10000000000 + idCounter}`,
  phone: `+90532${String(idCounter).padStart(7, '0')}`,
  email: `beneficiary${idCounter}@example.com`,
  address: 'Test Address 123',
  city: 'Istanbul',
  district: 'Kadıköy',
  neighborhood: 'Caferağa',
  family_size: 4,
  status: 'AKTIF',
  $createdAt: isoDate(-30),
  $updatedAt: isoDate(),
}));

// ============================================
// DONATION FACTORY
// ============================================

export const donationFactory = createFactory<DonationDocument>(() => ({
  $id: generateId('donation'),
  donor_name: 'Test Donor',
  donor_phone: `+90533${String(idCounter).padStart(7, '0')}`,
  donor_email: `donor${idCounter}@example.com`,
  amount: 1000,
  currency: 'TRY',
  donation_type: 'general',
  payment_method: 'bank_transfer',
  donation_purpose: 'Genel Bağış',
  receipt_number: `RCP-${Date.now()}-${idCounter}`,
  status: 'completed',
  $createdAt: isoDate(-7),
  $updatedAt: isoDate(),
}));

// ============================================
// TASK FACTORY
// ============================================

export const taskFactory = createFactory<TaskDocument>(() => ({
  $id: generateId('task'),
  title: 'Test Task',
  description: 'Test task description',
  created_by: 'user_1',
  priority: 'normal',
  status: 'pending',
  due_date: isoDate(7),
  is_read: false,
  $createdAt: isoDate(-1),
  $updatedAt: isoDate(),
}));

// ============================================
// MEETING FACTORY
// ============================================

export const meetingFactory = createFactory<MeetingDocument>(() => ({
  $id: generateId('meeting'),
  title: 'Test Meeting',
  description: 'Test meeting description',
  meeting_date: isoDate(3),
  location: 'Conference Room A',
  organizer: 'user_1',
  participants: ['user_1', 'user_2'],
  status: 'scheduled',
  meeting_type: 'general',
  $createdAt: isoDate(-1),
  $updatedAt: isoDate(),
}));

// ============================================
// FINANCE RECORD FACTORY
// ============================================

export const financeRecordFactory = createFactory<FinanceRecordDocument>(() => ({
  $id: generateId('finance'),
  record_type: 'income',
  category: 'donation',
  amount: 5000,
  currency: 'TRY',
  description: 'Test finance record',
  transaction_date: isoDate(-1),
  created_by: 'user_1',
  status: 'approved',
  $createdAt: isoDate(-1),
  $updatedAt: isoDate(),
}));

// ============================================
// SCHOLARSHIP FACTORY
// ============================================

export const scholarshipFactory = createFactory<ScholarshipDocument>(() => ({
  $id: generateId('scholarship'),
  student_name: 'Test Student',
  tc_no: `${20000000000 + idCounter}`,
  school_name: 'Test University',
  grade: 3,
  scholarship_amount: 2500,
  scholarship_type: 'monthly',
  start_date: isoDate(-90),
  status: 'active',
  $createdAt: isoDate(-90),
  $updatedAt: isoDate(),
}));

// ============================================
// AID APPLICATION FACTORY
// ============================================

export const aidApplicationFactory = createFactory<AidApplicationDocument>(() => ({
  $id: generateId('aid_app'),
  application_date: isoDate(-5),
  applicant_type: 'person',
  applicant_name: 'Test Applicant',
  stage: 'under_review',
  status: 'open',
  priority: 'normal',
  $createdAt: isoDate(-5),
  $updatedAt: isoDate(),
}));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Reset the ID counter (useful for deterministic tests)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Create a mock Appwrite list response
 */
export function createListResponse<T>(documents: T[], total?: number) {
  return {
    total: total ?? documents.length,
    documents,
  };
}

/**
 * Create a mock API success response
 */
export function createApiResponse<T>(data: T) {
  return {
    data,
    error: null,
  };
}

/**
 * Create a mock API error response
 */
export function createApiErrorResponse(message: string, code = 400) {
  return {
    data: null,
    error: message,
    code,
  };
}
