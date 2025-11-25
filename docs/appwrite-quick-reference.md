# Appwrite Quick Reference Guide

Bu dosya, Appwrite kullanımı için hızlı referans örnekleri içerir.

## 1. Real-time Subscriptions

### Basic Usage

```typescript
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  
  // Subscribe to donations collection
  const { isConnected } = useAppwriteRealtime(
    appwriteConfig.collections.donations,
    {
      notifyOnChange: true,
      onChange: (event, payload) => {
        queryClient.invalidateQueries(['donations']);
      }
    }
  );

  return <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>;
}
```

### Multiple Collections

```typescript
import { useAppwriteRealtimeMultiple } from '@/hooks/useAppwriteRealtime';

const { connections, isAllConnected } = useAppwriteRealtimeMultiple(
  [
    appwriteConfig.collections.donations,
    appwriteConfig.collections.beneficiaries,
  ],
  {
    onChange: (event, payload) => {
      console.log('Change detected:', event);
    }
  }
);
```

## 2. OAuth Authentication

### Setup (Appwrite Console)

1. Go to **Authentication > Providers**
2. Enable desired providers (Google, GitHub, Microsoft, etc.)
3. Add redirect URLs: `https://yourdomain.com/auth/callback`

### Client-side Implementation

```typescript
import { oauthAuth } from '@/lib/appwrite/auth-oauth';

// Google ile giriş
await oauthAuth.loginWithGoogle();

// GitHub ile giriş  
await oauthAuth.loginWithGitHub();

// Microsoft ile giriş
await oauthAuth.loginWithMicrosoft();
```

### OAuth Button Component

```tsx
import { OAuthButton } from '@/components/auth/OAuthButton';

<OAuthButton provider="google" />
<OAuthButton provider="github" />
<OAuthButton provider="microsoft" />
```

### Callback Handler

Create `/app/auth/callback/page.tsx` (see examples in `docs/appwrite-examples.md`)

## 3. Database Query Best Practices

### Efficient Query Example

```typescript
import { Query } from 'appwrite';
import { getDatabases } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';

const databases = getDatabases();
const queries = [
  Query.equal('status', 'active'),
  Query.greaterThan('amount', 100),
  Query.orderDesc('created_at'),
  Query.limit(20),
  Query.offset(0),
];

const response = await databases.listDocuments(
  appwriteConfig.databaseId,
  appwriteConfig.collections.donations,
  queries
);
```

### Query Builder Pattern

```typescript
import { AppwriteQueryBuilder } from '@/lib/appwrite/query-builder';

const builder = new AppwriteQueryBuilder();
const queries = builder
  .equal('status', 'active')
  .greaterThan('amount', 100)
  .orderBy('created_at', 'desc')
  .limit(20)
  .offset(0)
  .build();
```

### Best Practices Checklist

- ✅ Always set `limit` (max 100)
- ✅ Use `offset` for pagination
- ✅ Create indexes for frequently queried fields
- ✅ Use `select` to fetch only needed fields
- ✅ Combine filters efficiently
- ✅ Cache results with React Query

## 4. File Uploads

### Basic Upload

```typescript
import { appwriteStorageService } from '@/lib/appwrite/storage';
import { appwriteConfig } from '@/lib/appwrite/config';

const file = event.target.files[0];
const bucketId = appwriteConfig.buckets.documents;

const uploadedFile = await appwriteStorageService.uploadFile(
  bucketId,
  file,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### Upload with Metadata

```typescript
await appwriteStorageService.uploadWithMetadata(
  bucketId,
  file,
  {
    beneficiaryId: 'beneficiary123',
    documentType: 'identity',
    uploadedBy: userId,
  },
  (progress) => setUploadProgress(progress)
);
```

### Get File URLs

```typescript
// Preview URL (for images)
const previewUrl = appwriteStorageService.getFilePreview(bucketId, fileId, 800, 600);

// View URL (public)
const viewUrl = appwriteStorageService.getFileView(bucketId, fileId);

// Download URL
const downloadUrl = appwriteStorageService.getFileDownload(bucketId, fileId);
```

## 5. Appwrite Functions

### Function Structure

```typescript
// functions/my-function/index.ts
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);

  try {
    // Your logic here
    log('Function executed successfully');
    return res.json({ success: true });
  } catch (err) {
    error('Function failed', err);
    return res.json({ success: false }, 500);
  }
};
```

### Trigger from API Route

```typescript
// src/app/api/trigger-function/route.ts
export async function POST() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/functions/my-function/executions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
      },
      body: JSON.stringify({ data: {} }),
    }
  );

  const result = await response.json();
  return NextResponse.json({ executionId: result.$id });
}
```

## Configuration

### Environment Variables

```env
# Client-side
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id

# Server-side
APPWRITE_API_KEY=your-api-key
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
```

## Common Patterns

### Error Handling

```typescript
try {
  const result = await databases.createDocument(/*...*/);
} catch (error) {
  if (error instanceof Error) {
    // Handle Appwrite error
    if (error.message.includes('duplicate')) {
      // Handle duplicate
    }
  }
}
```

### Permission Patterns

```typescript
// User can only read their own documents
const permissions = [`read("user:${userId}")`, `write("user:${userId}")`];

// Public read, user write
const permissions = ['read("any")', `write("user:${userId}")`];

// Team access
const permissions = [`read("team:${teamId}")`, `write("team:${teamId}")`];
```

## Resources

- Full examples: `docs/appwrite-examples.md`
- Appwrite Docs: https://appwrite.io/docs
- Appwrite SDK: https://github.com/appwrite/sdk-for-web

