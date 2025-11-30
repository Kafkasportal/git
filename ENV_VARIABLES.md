# Environment Variables Guide

## ⚠️ Global Variable Conflicts

Some environment variables may conflict with global variables set by hosting platforms (Vercel, Netlify, etc.). This document lists potential conflicts and solutions.

## 🔴 Potential Conflicts

### 1. `NODE_ENV`
- **Status:** ⚠️ May conflict with platform defaults
- **Platform Default:** Most platforms set this automatically
- **Solution:** 
  - Don't override `NODE_ENV` in project settings
  - Let the platform set it automatically
  - Only use it for reading, not setting

### 2. `PORT`
- **Status:** ⚠️ May conflict if used
- **Platform Default:** Vercel/Netlify set this automatically
- **Solution:** 
  - Don't define `PORT` in environment variables
  - Use platform's default port configuration
  - Next.js handles port automatically

### 3. `VERCEL_*` Variables
- **Status:** ✅ Safe (Vercel-specific)
- **Platform Default:** Set by Vercel automatically
- **Solution:** 
  - Don't override these
  - Use them for reading only (e.g., `VERCEL_URL`, `VERCEL_ENV`)

## ✅ Safe Environment Variables

These variables are safe to use and won't conflict:

### Public Variables (Client-side accessible)
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_ENABLE_REALTIME`
- `NEXT_PUBLIC_ENABLE_ANALYTICS`
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_APPWRITE_BUCKET_*`

### Private Variables (Server-side only)
- `APPWRITE_API_KEY`
- `APPWRITE_SITE_ID` (for Appwrite Sites deployment)
- `CSRF_SECRET`
- `SESSION_SECRET`
- `SMTP_*` (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM)
- `TWILIO_*` (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- `RATE_LIMIT_*` (RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)
- `MAX_FILE_SIZE`
- `MAX_FILES_PER_UPLOAD`

## 🔧 How to Fix Conflicts

### If you see a conflict warning:

1. **Check Project Settings:**
   - Go to your hosting platform's project settings
   - Navigate to Environment Variables section
   - Look for variables marked with a warning

2. **Remove Conflicting Variables:**
   - Remove `NODE_ENV` if you've set it manually
   - Remove `PORT` if defined
   - Don't override platform-specific variables (e.g., `VERCEL_*`)

3. **Use Platform Defaults:**
   - Let the platform set `NODE_ENV` automatically
   - Use platform's port configuration
   - Read platform variables instead of setting them

## 📋 Recommended Environment Variables

### Required (Production)
```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
APPWRITE_SITE_ID=your-site-id

# Security
CSRF_SECRET=your-32-char-secret-minimum
SESSION_SECRET=your-32-char-secret-minimum
```

### Optional
```bash
# Application
NEXT_PUBLIC_APP_NAME=Dernek Yönetim Sistemi
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=5
```

## 🚫 Variables to Avoid

Do **NOT** set these in your environment variables:
- `NODE_ENV` - Let the platform set it
- `PORT` - Let the platform set it
- `VERCEL_*` - Vercel-specific, don't override
- `NETLIFY_*` - Netlify-specific, don't override
- `NOW_*` - Legacy Vercel variables, don't use

## 🔍 Checking for Conflicts

### Vercel
1. Go to Project Settings → Environment Variables
2. Look for warnings next to variable names
3. Remove any variables marked as conflicting

### Netlify
1. Go to Site Settings → Environment Variables
2. Check for any warnings
3. Remove conflicting variables

### Other Platforms
- Check platform documentation for reserved variable names
- Look for warnings in the platform dashboard
- Review build logs for environment variable warnings

## 📝 Notes

- All `NEXT_PUBLIC_*` variables are exposed to the client-side
- Never commit `.env.local` or `.env.production` files
- Use platform secrets management for sensitive variables
- Test environment variables in development before deploying

