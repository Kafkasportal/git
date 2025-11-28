// KafkasDer Burs Yönetimi Modülü Types
// Burs başvuruları, öğrenci bilgileri ve değerlendirme sistemi

// === ENUMS ===

export enum ScholarshipType {
  ACADEMIC = 'ACADEMIC',
  NEED_BASED = 'NEED_BASED',
  ORPHAN = 'ORPHAN',
  SPECIAL_NEEDS = 'SPECIAL_NEEDS',
  REFUGEE = 'REFUGEE',
  DISASTER_VICTIM = 'DISASTER_VICTIM',
  TALENT = 'TALENT',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  WITHDRAWN = 'WITHDRAWN',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  SUSPENDED = 'SUSPENDED',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  SUSPENDED = 'SUSPENDED',
  DROPPED_OUT = 'DROPPED_OUT',
  TRANSFERRED = 'TRANSFERRED',
}

export enum EducationLevel {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
  VOCATIONAL = 'VOCATIONAL',
}

export enum OrphanStatus {
  FULL_ORPHAN = 'FULL_ORPHAN',
  PARTIAL_ORPHAN = 'PARTIAL_ORPHAN',
  ABANDONED = 'ABANDONED',
  PROTECTED = 'PROTECTED',
}

// === INTERFACES ===

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  type: ScholarshipType;
  amount: number;
  currency: string;
  duration: number; // months
  maxRecipients: number;
  requirements: string[];
  eligibilityCriteria: string[];
  applicationDeadline: Date;
  disbursementDate?: Date;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Student {
  id: string;
  beneficiaryId?: string; // Link to main beneficiary record
  firstName: string;
  lastName: string;
  nationalId?: string;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  educationLevel: EducationLevel;
  institution: string;
  department?: string;
  grade?: string;
  gpa?: number;
  academicYear: string;
  status: StudentStatus;
  familyIncome?: number;
  familySize?: number;
  isOrphan: boolean;
  orphanStatus?: OrphanStatus;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  documents: StudentDocument[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface StudentDocument {
  id: string;
  type: 'TRANSCRIPT' | 'DIPLOMA' | 'REGISTRATION' | 'IDENTITY' | 'INCOME' | 'MEDICAL' | 'OTHER';
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  studentId: string;
  applicationDate: Date;
  status: ApplicationStatus;
  personalStatement?: string;
  motivationLetter?: string;
  documents: ApplicationDocument[];
  familySituation?: string;
  financialNeed?: string;
  academicAchievements?: string;
  extracurricularActivities?: string;
  references?: Reference[];
  priority: number;
  assignedReviewer?: string;
  reviewNotes?: string;
  reviewDate?: Date;
  decisionDate?: Date;
  decisionNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // Populated fields for UI
  scholarship?: Scholarship;
  student?: Student;
}

export interface ApplicationDocument {
  id: string;
  type: 'PERSONAL_STATEMENT' | 'TRANSCRIPT' | 'RECOMMENDATION' | 'INCOME_PROOF' | 'OTHER';
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Reference {
  id: string;
  name: string;
  title: string;
  organization: string;
  email: string;
  phone: string;
  relationship: string;
  submitted: boolean;
  submittedAt?: Date;
  content?: string;
  rating?: number;
}

export interface Payment {
  id: string;
  applicationId: string;
  amount: number;
  currency: string;
  paymentDate?: Date;
  status: PaymentStatus;
  transactionId?: string;
  bankAccount?: string;
  description?: string;
  processedBy?: string;
  processedAt?: Date;
  nextPaymentDate?: Date;
  installments: number;
  currentInstallment: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrphanAssistance {
  id: string;
  studentId: string;
  orphanType: OrphanStatus;
  guardianInfo: GuardianInfo;
  assistanceType: 'SCHOLARSHIP' | 'MONTHLY_AID' | 'EMERGENCY' | 'EDUCATIONAL_SUPPORT';
  amount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
  caseManager: string;
  regularCheckups: boolean;
  lastCheckupDate?: Date;
  nextCheckupDate?: Date;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface GuardianInfo {
  name: string;
  relationship: string;
  age: number;
  occupation?: string;
  income?: number;
  healthStatus?: string;
  contactInfo: {
    phone: string;
    email?: string;
    address?: string;
  };
}

// === FORM TYPES ===

export type ScholarshipFormData = Partial<Scholarship>;
export type StudentFormData = Partial<Student>;
export type ApplicationFormData = Partial<ScholarshipApplication>;

export interface ScholarshipFormErrors {
  [key: string]: string | undefined;
}

export interface StudentFormErrors {
  [key: string]: string | undefined;
}

export interface ApplicationFormErrors {
  [key: string]: string | undefined;
}

// === API RESPONSE TYPES ===

export interface ScholarshipListResponse {
  data: Scholarship[];
  total: number;
  page: number;
  limit: number;
}

export interface StudentListResponse {
  data: Student[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplicationListResponse {
  data: ScholarshipApplication[];
  total: number;
  page: number;
  limit: number;
}

export interface ScholarshipResponse {
  data: Scholarship;
  success: boolean;
  message?: string;
}

export interface StudentResponse {
  data: Student;
  success: boolean;
  message?: string;
}

export interface ApplicationResponse {
  data: ScholarshipApplication;
  success: boolean;
  message?: string;
}

// === SEARCH AND FILTER TYPES ===

export interface ScholarshipSearchParams {
  search?: string;
  type?: ScholarshipType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface StudentSearchParams {
  search?: string;
  status?: StudentStatus;
  educationLevel?: EducationLevel;
  isOrphan?: boolean;
  city?: string;
  page?: number;
  limit?: number;
}

export interface ApplicationSearchParams {
  search?: string;
  scholarshipId?: string;
  studentId?: string;
  status?: ApplicationStatus;
  assignedReviewer?: string;
  page?: number;
  limit?: number;
}

// === DASHBOARD AND REPORTING TYPES ===

export interface ScholarshipStats {
  total: number;
  active: number;
  byType: Record<ScholarshipType, number>;
  totalBudget: number;
  totalRecipients: number;
  applicationsReceived: number;
  applicationsApproved: number;
  approvalRate: number;
}

export interface StudentStats {
  total: number;
  active: number;
  byEducationLevel: Record<EducationLevel, number>;
  orphans: number;
  byStatus: Record<StudentStatus, number>;
}

export interface PaymentStats {
  totalPaid: number;
  pending: number;
  byStatus: Record<PaymentStatus, number>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface OrphanStats {
  total: number;
  byType: Record<OrphanStatus, number>;
  assistanceTypes: Record<string, number>;
  totalAssistance: number;
}

// === EXPORT TYPES ===

export interface ExportParams {
  format: 'CSV' | 'PDF' | 'EXCEL';
  type: 'SCHOLARSHIPS' | 'STUDENTS' | 'APPLICATIONS' | 'PAYMENTS' | 'ORPHANS';
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    type?: string;
  };
  fields?: string[];
}

// === WORKFLOW TYPES ===

export interface ReviewWorkflow {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedAt: Date;
  completedAt?: Date;
  score?: number;
  notes?: string;
  recommendations?: string[];
  nextSteps?: string[];
}

export interface ApprovalWorkflow {
  id: string;
  applicationId: string;
  approverId: string;
  approverName: string;
  level: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision: 'APPROVE' | 'REJECT' | 'CONDITIONAL';
  amount?: number;
  conditions?: string[];
  notes?: string;
  decidedAt: Date;
}
