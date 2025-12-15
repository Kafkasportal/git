# API Endpoints Documentation

Auto-generated API reference for Dernek Yönetim Sistemi.

## Overview

- **Total Endpoints**: 99
- **Base URL**: `/api`
- **Authentication**: Session-based (HttpOnly cookies)
- **Rate Limiting**: 100 requests/15 minutes

## Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/user` | Get current user |
| POST | `/api/auth/oauth/callback` | OAuth callback |
| POST | `/api/auth/2fa/setup` | Setup 2FA |

## Users Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create new user |
| GET | `/api/users/[id]` | Get user by ID |
| PATCH | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |
| POST | `/api/users/batch` | Batch operations |

## Beneficiaries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beneficiaries` | List beneficiaries |
| GET | `/api/beneficiaries/[id]` | Get beneficiary details |
| GET | `/api/beneficiaries/[id]/family` | Get family info |
| GET | `/api/beneficiaries/[id]/documents` | Get documents |
| GET | `/api/beneficiaries/[id]/workflow` | Get workflow status |
| GET | `/api/beneficiaries/workflow` | List all workflows |
| POST | `/api/beneficiaries/bulk-update-status` | Bulk status update |
| POST | `/api/beneficiaries/bulk-delete` | Bulk delete |
| GET | `/api/beneficiaries/map-data` | Get map data |

## Donations & Kumbara

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donations` | List donations |
| POST | `/api/donations` | Create donation |
| GET | `/api/donations/[id]` | Get donation details |
| GET | `/api/kumbara` | List kumbaras |
| POST | `/api/kumbara` | Create kumbara |
| GET | `/api/kumbara/[id]` | Get kumbara details |

## Scholarships

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scholarships` | List scholarships |
| POST | `/api/scholarships` | Create scholarship |
| GET | `/api/scholarships/[id]` | Get scholarship details |
| POST | `/api/scholarships/[id]/approve` | Approve application |
| POST | `/api/scholarships/[id]/reject` | Reject application |

## Financial

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/transactions` | List transactions |
| POST | `/api/finance/transactions` | Create transaction |
| GET | `/api/finance/reports` | Get financial reports |
| POST | `/api/analytics` | Analytics data |

## Meetings & Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | List meetings |
| POST | `/api/meetings` | Create meeting |
| GET | `/api/meetings/[id]` | Get meeting details |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/[id]` | Get task details |

## Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | List messages |
| POST | `/api/messages` | Send message |
| GET | `/api/messages/[id]` | Get message |
| GET | `/api/communication-logs` | Communication logs |

## Settings & Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get settings |
| PATCH | `/api/settings` | Update settings |
| GET | `/api/branding/organization` | Get org branding |
| POST | `/api/branding/logo` | Upload logo |
| GET | `/api/parameters` | Get parameters |

## Error Handling

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/errors` | List errors |
| GET | `/api/errors/[id]` | Get error details |
| PATCH | `/api/errors/[id]` | Update error status |
| GET | `/api/audit-logs` | Audit logs |

## Security Headers

All endpoints include:
- `CSRF-Token` validation
- Rate limiting
- Input validation (Zod)
- SQL injection prevention
- XSS protection (DOMPurify)

## Response Format

### Success (2xx)
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Authentication

Use session cookies from login endpoint. Include in subsequent requests automatically.

```bash
# Example login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "..."}'
```

## Rate Limiting

- Limit: 100 requests per 15 minutes
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Status: 429 Too Many Requests when exceeded

---

**Last Updated**: $(date)
**Total Endpoints**: 99
