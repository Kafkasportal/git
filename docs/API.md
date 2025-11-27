# Kafkasder Panel API Documentation

## Overview

This document describes the REST API endpoints for the Kafkasder Panel management system.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API endpoints require authentication except for:

- `/api/auth/login`
- `/api/auth/test-login`
- `/api/auth/oauth/callback`
- `/api/health`

### Authentication Headers

```http
Authorization: Bearer <session_token>
X-User-ID: <user_id>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- **Default**: 100 requests per 15 minutes
- **Authenticated**: 200 requests per 15 minutes
- **Admin**: 500 requests per 15 minutes

Rate limit headers are included in responses:

```http
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T00:15:00.000Z
```

## Core Endpoints

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Get Current User

```http
GET /api/auth/user
Authorization: Bearer <token>
```

### Beneficiaries

#### List Beneficiaries

```http
GET /api/beneficiaries?page=1&limit=20&search=keyword
Authorization: Bearer <token>
```

#### Create Beneficiary

```http
POST /api/beneficiaries
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+905555555555",
  "address": "123 Main St",
  "type": "individual"
}
```

#### Update Beneficiary

```http
PUT /api/beneficiaries/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Delete Beneficiary

```http
DELETE /api/beneficiaries/{id}
Authorization: Bearer <token>
```

### Donations

#### List Donations

```http
GET /api/donations?page=1&limit=20&status=completed
Authorization: Bearer <token>
```

#### Create Donation

```http
POST /api/donations
Authorization: Bearer <token>
Content-Type: application/json

{
  "beneficiary_id": "beneficiary_id",
  "amount": 1000,
  "type": "cash",
  "payment_method": "bank_transfer",
  "notes": "Monthly support"
}
```

#### Get Donation Stats

```http
GET /api/donations/stats?period=monthly
Authorization: Bearer <token>
```

### Messages

#### Send Message

```http
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": "user_id",
  "subject": "Meeting Reminder",
  "content": "Don't forget our meeting tomorrow",
  "type": "email"
}
```

#### Get Messages

```http
GET /api/messages?page=1&limit=20&folder=inbox
Authorization: Bearer <token>
```

### Tasks

#### List Tasks

```http
GET /api/tasks?status=pending&assigned_to=me
Authorization: Bearer <token>
```

#### Create Task

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Review applications",
  "description": "Review pending scholarship applications",
  "assigned_to": "user_id",
  "due_date": "2024-01-15T00:00:00.000Z",
  "priority": "high"
}
```

## Error Codes

| Code                  | Description                       |
| --------------------- | --------------------------------- |
| `UNAUTHORIZED`        | Invalid or missing authentication |
| `FORBIDDEN`           | Insufficient permissions          |
| `NOT_FOUND`           | Resource not found                |
| `VALIDATION_ERROR`    | Invalid input data                |
| `RATE_LIMIT_EXCEEDED` | Too many requests                 |
| `SERVER_ERROR`        | Internal server error             |

## Data Models

### Beneficiary

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "type": "individual|organization",
  "status": "active|inactive|pending",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Donation

```json
{
  "id": "string",
  "beneficiary_id": "string",
  "amount": "number",
  "type": "cash|goods|service",
  "payment_method": "bank_transfer|cash|online",
  "status": "pending|completed|failed",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Task

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "assigned_to": "string",
  "created_by": "string",
  "status": "pending|in_progress|completed",
  "priority": "low|medium|high",
  "due_date": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## WebSocket Events

Real-time updates are available via WebSocket connection:

### Connection

```javascript
const ws = new WebSocket("wss://your-domain.com/api/realtime");
```

### Events

- `beneficiary:created` - New beneficiary added
- `donation:updated` - Donation status changed
- `message:received` - New message received
- `task:assigned` - Task assigned to user

## SDK Examples

### JavaScript/TypeScript

```typescript
import { apiClient } from "@/lib/api/api-client";

// Get beneficiaries
const beneficiaries = await apiClient.get("/beneficiaries");

// Create donation
const donation = await apiClient.post("/donations", {
  beneficiary_id: "123",
  amount: 1000,
  type: "cash",
});
```

### Python

```python
import requests

headers = {
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'application/json'
}

response = requests.get(
  'https://your-domain.com/api/beneficiaries',
  headers=headers
)
```

## Testing

Use the test endpoint for development:

```http
POST /api/auth/test-login
Content-Type: application/json

{
  "email": "mcp-login@example.com",
  "password": "SecurePass123!"
}
```

## Support

For API support and questions:

- Email: support@kafkasder.org
- Documentation: https://docs.kafkasder.org
- Issues: https://github.com/kafkasder/panel/issues
