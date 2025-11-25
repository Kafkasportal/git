# API Routes Reference

Bu doküman, Kafkasder Panel projesinin tüm API route'larını ve kullanımlarını detaylı olarak açıklar.

## Genel Bakış

- **Toplam API Route:** 25+ endpoint
- **Middleware Pattern:** Standardized middleware factory (`buildApiRoute`)
- **Authentication:** Session-based authentication
- **Security:** CSRF protection, Rate limiting, Input sanitization
- **Base Path:** `/api/*`

## API Route Kategorileri

### 1. Authentication (`/api/auth/*`)

#### POST `/api/auth/login`
Kullanıcı girişi.

**Request:**
```typescript
{
  email: string;
  password: string;
  csrfToken: string;
}
```

**Response:**
```typescript
{
  success: true;
  user: SessionUser;
  session: AuthSession;
}
```

**Rate Limit:** 10 requests / 10 minutes
**CSRF:** Required

#### POST `/api/auth/logout`
Kullanıcı çıkışı.

**Response:**
```typescript
{
  success: true;
}
```

**Rate Limit:** 20 requests / 15 minutes

#### GET `/api/auth/session`
Mevcut oturum bilgisi.

**Response:**
```typescript
{
  user: SessionUser | null;
  session: AuthSession | null;
}
```

### 2. CSRF Protection (`/api/csrf`)

#### GET `/api/csrf`
CSRF token al.

**Response:**
```typescript
{
  csrfToken: string;
}
```

**Public:** Yes (no authentication required)

### 3. Health Check (`/api/health`)

#### GET `/api/health`
Sistem sağlık kontrolü.

**Query Parameters:**
- `detailed` (optional): `true` for detailed health info

**Response:**
```typescript
{
  ok: boolean;
  provider: 'appwrite';
  appwrite: {
    endpoint: boolean;
    projectId: boolean;
    databaseId: boolean;
    apiKey: boolean;
    configured: boolean;
    active: boolean;
  };
}
```

**Public:** Yes

### 4. Beneficiaries (`/api/beneficiaries`)

#### GET `/api/beneficiaries`
İhtiyaç sahiplerini listele.

**Query Parameters:**
- `status` (optional): Filter by status
- `city` (optional): Filter by city
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```typescript
{
  data: Beneficiary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `beneficiaries.read`

#### POST `/api/beneficiaries`
Yeni ihtiyaç sahibi oluştur.

**Request:**
```typescript
BeneficiaryCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: Beneficiary;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `beneficiaries.write`

#### GET `/api/beneficiaries/[id]`
İhtiyaç sahibi detayı.

**Response:**
```typescript
{
  data: Beneficiary;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `beneficiaries.read`

#### PUT `/api/beneficiaries/[id]`
İhtiyaç sahibi güncelle.

**Request:**
```typescript
BeneficiaryUpdateInput
```

**Response:**
```typescript
{
  success: true;
  data: Beneficiary;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `beneficiaries.write`

#### DELETE `/api/beneficiaries/[id]`
İhtiyaç sahibi sil.

**Response:**
```typescript
{
  success: true;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `beneficiaries.delete`

### 5. Donations (`/api/donations`)

#### GET `/api/donations`
Bağışları listele.

**Query Parameters:**
- `status` (optional): Filter by status
- `is_kumbara` (optional): Filter kumbara donations
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```typescript
{
  data: Donation[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `donations.read`

#### POST `/api/donations`
Yeni bağış oluştur.

**Request:**
```typescript
DonationCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: Donation;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `donations.write`

#### GET `/api/donations/[id]`
Bağış detayı.

**Response:**
```typescript
{
  data: Donation;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `donations.read`

### 6. Kumbara (`/api/kumbara`)

#### GET `/api/kumbara`
Kumbara bağışlarını listele.

**Query Parameters:**
- `status` (optional): Filter by status
- `location` (optional): Filter by location

**Response:**
```typescript
{
  data: Donation[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `donations.read`

#### POST `/api/kumbara`
Kumbara bağışı oluştur.

**Request:**
```typescript
KumbaraDonationInput
```

**Response:**
```typescript
{
  success: true;
  data: Donation;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `donations.write`

### 7. Users (`/api/users`)

#### GET `/api/users`
Kullanıcıları listele.

**Query Parameters:**
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```typescript
{
  data: User[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `users.read`

#### POST `/api/users`
Yeni kullanıcı oluştur.

**Request:**
```typescript
UserCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: User;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `users.write`

#### GET `/api/users/[id]`
Kullanıcı detayı.

**Response:**
```typescript
{
  data: User;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `users.read`

#### PUT `/api/users/[id]`
Kullanıcı güncelle.

**Request:**
```typescript
UserUpdateInput
```

**Response:**
```typescript
{
  success: true;
  data: User;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `users.write`

### 8. Tasks (`/api/tasks`)

#### GET `/api/tasks`
Görevleri listele.

**Query Parameters:**
- `status` (optional): Filter by status
- `assigned_to` (optional): Filter by assignee
- `priority` (optional): Filter by priority

**Response:**
```typescript
{
  data: Task[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `tasks.read`

#### POST `/api/tasks`
Yeni görev oluştur.

**Request:**
```typescript
TaskCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: Task;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `tasks.write`

### 9. Meetings (`/api/meetings`)

#### GET `/api/meetings`
Toplantıları listele.

**Query Parameters:**
- `status` (optional): Filter by status
- `meeting_type` (optional): Filter by type
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response:**
```typescript
{
  data: Meeting[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `meetings.read`

#### POST `/api/meetings`
Yeni toplantı oluştur.

**Request:**
```typescript
MeetingCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: Meeting;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `meetings.write`

### 10. Messages (`/api/messages`)

#### GET `/api/messages`
Mesajları listele.

**Query Parameters:**
- `message_type` (optional): Filter by type
- `status` (optional): Filter by status
- `sender` (optional): Filter by sender

**Response:**
```typescript
{
  data: Message[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `messages.read`

#### POST `/api/messages`
Yeni mesaj gönder.

**Request:**
```typescript
MessageCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: Message;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `messages.write`

### 11. Aid Applications (`/api/aid-applications`)

#### GET `/api/aid-applications`
Yardım başvurularını listele.

**Query Parameters:**
- `stage` (optional): Filter by stage
- `status` (optional): Filter by status
- `beneficiary_id` (optional): Filter by beneficiary

**Response:**
```typescript
{
  data: AidApplication[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `aid_applications.read`

#### POST `/api/aid-applications`
Yeni yardım başvurusu oluştur.

**Request:**
```typescript
AidApplicationCreateInput
```

**Response:**
```typescript
{
  success: true;
  data: AidApplication;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `aid_applications.write`

### 12. Storage (`/api/storage`)

#### POST `/api/storage/upload`
Dosya yükle.

**Request:**
- `FormData` with file

**Response:**
```typescript
{
  success: true;
  data: {
    fileId: string;
    bucketId: string;
    name: string;
    size: number;
    mimeType: string;
  };
}
```

**Rate Limit:** 10 requests / 1 minute
**CSRF:** Required
**Module Access:** `storage.write`

#### GET `/api/storage/[fileId]`
Dosya indir.

**Response:**
- File stream

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `storage.read`

### 13. Partners (`/api/partners`)

#### GET `/api/partners`
Ortakları listele.

**Query Parameters:**
- `type` (optional): Filter by type
- `status` (optional): Filter by status
- `partnership_type` (optional): Filter by partnership type

**Response:**
```typescript
{
  data: Partner[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `partners.read`

### 14. Settings (`/api/settings`)

#### GET `/api/settings`
Sistem ayarlarını al.

**Query Parameters:**
- `category` (optional): Filter by category
- `key` (optional): Filter by key

**Response:**
```typescript
{
  data: SystemSetting[];
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `settings.read`

#### PUT `/api/settings/[id]`
Sistem ayarı güncelle.

**Request:**
```typescript
SystemSettingUpdateInput
```

**Response:**
```typescript
{
  success: true;
  data: SystemSetting;
}
```

**Rate Limit:** 50 requests / 15 minutes
**CSRF:** Required
**Module Access:** `settings.write`

### 15. Audit Logs (`/api/audit-logs`)

#### GET `/api/audit-logs`
Denetim kayıtlarını listele.

**Query Parameters:**
- `userId` (optional): Filter by user
- `action` (optional): Filter by action
- `resource` (optional): Filter by resource
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response:**
```typescript
{
  data: AuditLog[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `audit_logs.read`

### 16. Communication (`/api/communication`)

#### POST `/api/communication/send`
Mesaj gönder (SMS, Email, WhatsApp).

**Request:**
```typescript
{
  channel: 'sms' | 'email' | 'whatsapp';
  recipients: string[];
  subject?: string;
  content: string;
  template_id?: string;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    messageId: string;
    sentCount: number;
    failedCount: number;
  };
}
```

**Rate Limit:** 20 requests / 15 minutes
**CSRF:** Required
**Module Access:** `communication.write`

### 17. Analytics (`/api/analytics`)

#### GET `/api/analytics/events`
Analitik olayları listele.

**Query Parameters:**
- `event_type` (optional): Filter by event type
- `user_id` (optional): Filter by user
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response:**
```typescript
{
  data: AnalyticsEvent[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `analytics.read`

### 18. Monitoring (`/api/monitoring`)

#### GET `/api/monitoring/metrics`
Performans metriklerini al.

**Query Parameters:**
- `metric_name` (optional): Filter by metric
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response:**
```typescript
{
  data: PerformanceMetric[];
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `monitoring.read`

### 19. Errors (`/api/errors`)

#### GET `/api/errors`
Hataları listele.

**Query Parameters:**
- `severity` (optional): Filter by severity
- `status` (optional): Filter by status
- `assigned_to` (optional): Filter by assignee

**Response:**
```typescript
{
  data: Error[];
  pagination: PaginationInfo;
}
```

**Rate Limit:** 200 requests / 15 minutes
**Module Access:** `errors.read`

### 20. Webhooks (`/api/webhooks`)

#### POST `/api/webhooks/[event]`
Webhook event handler.

**Request:**
- Event-specific payload

**Response:**
```typescript
{
  success: true;
}
```

**Rate Limit:** 100 requests / 15 minutes
**CSRF:** Not required (webhook signature verification)

## Middleware Pattern

Tüm API route'ları standardized middleware pattern kullanır:

```typescript
import { buildApiRoute } from '@/lib/api/middleware';

export const GET = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 200, windowMs: 900000 },
})(async (request) => {
  // Handler logic
  const data = await beneficiaries.list();
  return successResponse(data);
});
```

### Middleware Options

- **requireModule:** Module access control
- **allowedMethods:** HTTP method whitelist
- **rateLimit:** Rate limiting configuration
- **requireAuth:** Authentication requirement (default: true)
- **supportOfflineSync:** Offline sync support

## Rate Limiting

### Default Limits

- **Read Operations:** 200 requests / 15 minutes
- **Write Operations:** 50 requests / 15 minutes
- **Upload Operations:** 10 requests / 1 minute
- **Auth Operations:** 10 requests / 10 minutes

### Environment Variables

```env
RATE_LIMIT_DEFAULT_MAX=100
RATE_LIMIT_DEFAULT_WINDOW=900000
RATE_LIMIT_READ_MAX=200
RATE_LIMIT_READ_WINDOW=900000
RATE_LIMIT_DATA_MODIFY_MAX=50
RATE_LIMIT_DATA_MODIFY_WINDOW=900000
RATE_LIMIT_UPLOAD_MAX=10
RATE_LIMIT_UPLOAD_WINDOW=60000
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW=600000
```

## CSRF Protection

Tüm mutation endpoint'leri (POST, PUT, DELETE) CSRF token gerektirir:

```typescript
// 1. Get CSRF token
const { csrfToken } = await fetch('/api/csrf').then(r => r.json());

// 2. Include in request
await fetch('/api/beneficiaries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

## Error Responses

### Standard Error Format

```typescript
{
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

### HTTP Status Codes

- **200:** Success
- **201:** Created
- **400:** Bad Request
- **401:** Unauthorized
- **403:** Forbidden
- **404:** Not Found
- **429:** Too Many Requests
- **500:** Internal Server Error

## Success Responses

### Standard Success Format

```typescript
{
  success: true;
  data: T;
  message?: string;
}
```

## Pagination

### Request

```typescript
GET /api/beneficiaries?page=1&limit=20
```

### Response

```typescript
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Module Access Control

Her endpoint belirli bir modül için yetki kontrolü yapar:

- `beneficiaries.read` / `beneficiaries.write` / `beneficiaries.delete`
- `donations.read` / `donations.write` / `donations.delete`
- `users.read` / `users.write` / `users.delete`
- `tasks.read` / `tasks.write` / `tasks.delete`
- `meetings.read` / `meetings.write` / `meetings.delete`
- `messages.read` / `messages.write` / `messages.delete`
- `aid_applications.read` / `aid_applications.write` / `aid_applications.delete`
- `storage.read` / `storage.write` / `storage.delete`
- `settings.read` / `settings.write` / `settings.delete`
- `audit_logs.read`
- `communication.write`
- `analytics.read`
- `monitoring.read`
- `errors.read`

## Related Documentation

- [API Patterns Guide](./api-patterns.md) - API route standartları
- [Security Guide](./PROJECT_ANALYSIS.md#security) - Güvenlik detayları
- [Appwrite Guide](./appwrite-guide.md) - Backend kullanımı

