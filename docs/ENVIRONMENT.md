# Environment Variables Configuration

## Overview

This document describes all environment variables used in the Kafkasder Panel application.

## Required Variables

### Application

```bash
# Application Name
NEXT_PUBLIC_APP_NAME=Dernek Yönetim Sistemi

# Application Version
NEXT_PUBLIC_APP_VERSION=1.0.0

# Backend Provider
NEXT_PUBLIC_BACKEND_PROVIDER=appwrite
```

### Appwrite Configuration

```bash
# Appwrite Endpoint
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1

# Appwrite Project ID
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id

# Appwrite Database ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=kafkasder_db

# Appwrite API Key (server-side only)
APPWRITE_API_KEY=your_api_key

# Appwrite Bucket IDs
NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS=documents
NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS=avatars
NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS=receipts
```

### Security

```bash
# Session Secret (minimum 32 characters)
SESSION_SECRET=your_session_secret_minimum_32_characters

# CSRF Secret (minimum 32 characters)
CSRF_SECRET=your_csrf_secret_minimum_32_characters
```

## Optional Variables

### Development

```bash
# Node Environment
NODE_ENV=development

# Enable Realtime Features
NEXT_PUBLIC_ENABLE_REALTIME=true

# Enable Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Error Tracking (Sentry)

```bash
# Sentry DSN
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn
SENTRY_DSN=https://your_sentry_dsn
SENTRY_ORG=your_organization
SENTRY_PROJECT=your_project
```

### Email Configuration

```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@kafkasder.org
```

### SMS Configuration (Twilio)

```bash
# Twilio Settings
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Rate Limiting

```bash
# Rate Limit Settings
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_PREMIUM_MULTIPLIER=2.0

# IP Lists
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1
RATE_LIMIT_BLACKLIST_IPS=
```

### File Upload

```bash
# Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=5
```

### MCP Configuration

```bash
# MCP Test Credentials (for development)
MCP_TEST_EMAIL=mcp-login@example.com
MCP_TEST_PASSWORD=SecurePass123!
```

## Configuration Files

### MCP Settings (.cursor/mcp_settings.json)

```json
{
  "_appwrite": {
    "_endpoint": "https://cloud.appwrite.io/v1",
    "_projectId": "your_project_id",
    "_apiKey": "your_api_key",
    "_databaseId": "kafkasder_db"
  },
  "_testCredentials": {
    "_email": "mcp-login@example.com",
    "_password": "SecurePass123!"
  }
}
```

### Environment Files Priority

1. `.env.local` (highest priority)
2. `.env.development` / `.env.production`
3. `.env` (lowest priority)

## Setup Instructions

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Appwrite

```bash
# Get Appwrite credentials from:
# https://cloud.appwrite.io/console -> Your Project -> Settings -> API Keys
```

### 3. Generate Secrets

```bash
# Generate secure secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For CSRF_SECRET
```

### 4. Setup MCP Configuration

```bash
# Copy MCP template
cp .cursor/mcp_settings.example.json .cursor/mcp_settings.json

# Edit with your credentials
nano .cursor/mcp_settings.json
```

### 5. Run Setup Scripts

```bash
# Update environment from MCP config
npx tsx scripts/setup-appwrite-env.ts

# Setup Appwrite database
npm run appwrite:setup

# Create test user
npx tsx scripts/create-user-for-login.ts
```

## Validation

### Environment Validation

The application validates environment variables at startup:

```typescript
import { validateServerEnv } from "@/lib/env-validation";

// This will throw if required variables are missing
const env = validateServerEnv();
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Security Considerations

### Production Requirements

- All secrets must be at least 32 characters
- Use HTTPS in production
- Rotate secrets regularly
- Never commit `.env.local` to version control

### Environment Variable Security

```bash
# .gitignore should include:
.env.local
.env.production
.cursor/mcp_settings.json
```

### Best Practices

1. Use different secrets for development and production
2. Store secrets in environment variables, not in code
3. Use MCP configuration for sensitive data
4. Validate all environment variables at startup
5. Use read-only API keys when possible

## Troubleshooting

### Common Issues

#### Missing Appwrite Configuration

```
Error: Appwrite not configured
Solution: Check NEXT_PUBLIC_APPWRITE_* variables
```

#### Invalid Session Secret

```
Error: Session secret must be at least 32 characters
Solution: Generate a new secret with openssl
```

#### MCP Configuration Not Found

```
Error: MCP configuration file not found
Solution: Copy .cursor/mcp_settings.example.json to .cursor/mcp_settings.json
```

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development npm run dev
```

### Validation Script

Run environment validation:

```bash
npx tsx -e "
import { validateServerEnv } from './src/lib/env-validation';
try {
  validateServerEnv();
  console.log('✅ Environment variables are valid');
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
}
"
```

## Support

For configuration support:

- Check the MCP setup guide: `.cursor/README.md`
- Review the setup scripts in `scripts/`
- Check the validation utilities in `src/lib/env-validation.ts`
