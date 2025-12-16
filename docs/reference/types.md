# TypeScript Type Definitions Reference

Complete type system documentation for the application.

## User & Auth Types

### User

```typescript
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}

type UserRole = 'admin' | 'manager' | 'staff' | 'user' | 'viewer'
```

### Session

```typescript
interface Session {
  userId: string
  token: string
  expiresAt: Date
  isValid: boolean
}
```

### Permission

```typescript
interface Permission {
  id: string
  name: string
  resource: string
  action: string
  conditions?: Record<string, any>
}

type PermissionAction = 
  | 'create' | 'read' | 'update' | 'delete' 
  | 'approve' | 'reject' | 'manage'
```

## Beneficiary Types

```typescript
interface Beneficiary {
  id: string
  name: string
  email?: string
  phone?: string
  address: Address
  status: BeneficiaryStatus
  category: BeneficiaryCategory
  familyMembers: FamilyMember[]
  documents: Document[]
  workflow: WorkflowState
  createdAt: Date
  updatedAt: Date
}

type BeneficiaryStatus = 
  | 'active' | 'inactive' | 'pending' | 'completed'

type BeneficiaryCategory = 
  | 'orphan' | 'elder' | 'disability' | 'poor' | 'education'

interface FamilyMember {
  id: string
  name: string
  relation: string
  age: number
  status: string
}
```

## Financial Types

```typescript
interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  date: Date
  description: string
  account?: string
  category: string
  status: TransactionStatus
  reference?: string
}

type TransactionType = 'income' | 'expense' | 'transfer'
type TransactionStatus = 'pending' | 'completed' | 'cancelled'

interface FinancialReport {
  period: string
  totalIncome: number
  totalExpense: number
  balance: number
  breakdown: Record<string, number>
}
```

## Donation Types

```typescript
interface Donation {
  id: string
  donorName: string
  donorEmail: string
  amount: number
  currency: string
  type: DonationType
  method: PaymentMethod
  date: Date
  purpose?: string
  recurring: boolean
  status: PaymentStatus
}

type DonationType = 'cash' | 'kumbara' | 'in-kind' | 'pledge'
type PaymentMethod = 'bank' | 'card' | 'cash' | 'mobile'
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

interface Kumbara {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  startDate: Date
  endDate?: Date
  status: KumbaraStatus
  items: KumbaraItem[]
}

type KumbaraStatus = 'active' | 'paused' | 'completed' | 'cancelled'

interface KumbaraItem {
  id: string
  amount: number
  contributor: string
  date: Date
}
```

## Scholarship Types

```typescript
interface Scholarship {
  id: string
  studentId: string
  name: string
  amount: number
  period: string
  status: ScholarshipStatus
  startDate: Date
  endDate: Date
  conditions?: string
}

type ScholarshipStatus = 
  | 'pending' | 'approved' | 'rejected' | 'active' | 'completed'

interface ScholarshipApplication {
  id: string
  studentId: string
  applicationDate: Date
  gpa: number
  documents: Document[]
  status: ApplicationStatus
}

type ApplicationStatus = 
  | 'submitted' | 'reviewed' | 'approved' | 'rejected'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  institution: string
  major: string
  gpa: number
  year: number
}
```

## Document Types

```typescript
interface Document {
  id: string
  name: string
  type: DocumentType
  fileId: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
  status: DocumentStatus
  metadata?: Record<string, any>
}

type DocumentType = 
  | 'id' | 'passport' | 'residency' | 'income' 
  | 'education' | 'medical' | 'marriage' | 'other'

type DocumentStatus = 'pending' | 'verified' | 'rejected'
```

## Meeting & Task Types

```typescript
interface Meeting {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees: User[]
  agendaItems: AgendaItem[]
  decisions: Decision[]
  status: MeetingStatus
}

type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled'

interface AgendaItem {
  id: string
  title: string
  duration: number
  owner?: User
}

interface Decision {
  id: string
  title: string
  description: string
  date: Date
  owner: User
}

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: User
  dueDate?: Date
  createdBy: User
  createdAt: Date
  updatedAt: Date
}

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'archived'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
```

## Message Types

```typescript
interface Message {
  id: string
  senderId: string
  recipientIds: string[]
  subject: string
  content: string
  type: MessageType
  status: MessageStatus
  attachments?: Document[]
  createdAt: Date
  readAt?: Date
}

type MessageType = 'system' | 'personal' | 'notification' | 'bulk'
type MessageStatus = 'draft' | 'sent' | 'read' | 'archived'

interface CommunicationLog {
  id: string
  type: CommunicationType
  recipient: string
  status: string
  timestamp: Date
  details?: Record<string, any>
}

type CommunicationType = 'email' | 'sms' | 'in-app' | 'push'
```

## Workflow Types

```typescript
interface WorkflowState {
  id: string
  entityType: string
  entityId: string
  currentStep: string
  status: WorkflowStatus
  history: WorkflowStep[]
}

type WorkflowStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

interface WorkflowStep {
  id: string
  name: string
  completedAt?: Date
  completedBy?: User
  notes?: string
}
```

## Common Types

### Address

```typescript
interface Address {
  street: string
  city: string
  state?: string
  country: string
  postalCode: string
}
```

### Pagination

```typescript
interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
```

### Response Envelope

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: Record<string, any>
  }
  timestamp: Date
}
```

### Query Options

```typescript
interface QueryOptions {
  filters?: Record<string, any>
  search?: string
  pagination?: PaginationParams
  includes?: string[]
  cacheTime?: number
}
```

## Form Types

```typescript
interface FormField {
  name: string
  label: string
  type: FieldType
  required: boolean
  validation?: z.ZodSchema
  placeholder?: string
  options?: Option[]
}

type FieldType = 
  | 'text' | 'email' | 'password' | 'number' 
  | 'date' | 'select' | 'checkbox' | 'radio'
  | 'textarea' | 'file' | 'currency'

interface Option {
  label: string
  value: string | number
}

interface FormError {
  field: string
  message: string
}
```

## Settings & Configuration

```typescript
interface Settings {
  theme: Theme
  language: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  branding: BrandingSettings
}

interface BrandingSettings {
  organizationName: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
}

interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  inApp: boolean
}
```

## Error Types

```typescript
interface AppError extends Error {
  code: string
  statusCode: number
  details?: Record<string, any>
}

interface ValidationError extends AppError {
  fields: FormError[]
}

interface NetworkError extends AppError {
  isNetworkError: true
}
```

---

**Total Type Definitions**: 11+ files
**Interfaces**: 50+
**Union Types**: 30+
**Integration**: 100% TypeScript strict mode
