# Appwrite Kullanim Rehberi

Bu dokuman, Kafkasportal projesinde Appwrite kullanimina dair kapsamli bir rehber ve pratik ornekler icerir.

## Icindekiler

1. [Yapilandirma](#yapilandirma)
2. [Real-time Subscriptions](#real-time-subscriptions)
3. [OAuth Authentication](#oauth-authentication)
4. [Database Queries](#database-queries)
5. [File Uploads](#file-uploads)
6. [Appwrite Functions](#appwrite-functions)
7. [Common Patterns](#common-patterns)
8. [Best Practices](#best-practices)
9. [Resources](#resources)

---

## Yapilandirma

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

### Config Dosyasi

```typescript
// src/lib/appwrite/config.ts
export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  collections: {
    donations: 'donations',
    beneficiaries: 'beneficiaries',
    // ... diger koleksiyonlar
  },
  buckets: {
    documents: 'documents',
    // ... diger bucketlar
  },
};
```

---

## Real-time Subscriptions

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

### Client-side Realtime Hook Implementation

```typescript
// src/hooks/useAppwriteRealtime.ts
import { useEffect, useState } from 'react';
import { Client, RealtimeResponseEvent } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';

export function useAppwriteRealtime<T>(
  channels: string[],
  callbacks: {
    onCreate?: (payload: T) => void;
    onUpdate?: (payload: T) => void;
    onDelete?: (payload: { $id: string }) => void;
  }
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!appwriteConfig.endpoint || !appwriteConfig.projectId) {
      return;
    }

    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    // Subscribe to channels
    const unsubscribe = client.subscribe(channels, (response: RealtimeResponseEvent<T>) => {
      if (response.events.includes(`databases.${appwriteConfig.databaseId}.collections.*.documents.*.create`)) {
        callbacks.onCreate?.(response.payload as T);
      } else if (response.events.includes(`databases.${appwriteConfig.databaseId}.collections.*.documents.*.update`)) {
        callbacks.onUpdate?.(response.payload as T);
      } else if (response.events.includes(`databases.${appwriteConfig.databaseId}.collections.*.documents.*.delete`)) {
        callbacks.onDelete?.({ $id: (response.payload as { $id?: string }).$id || '' });
      }
    });

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [channels.join(',')]);

  return { isConnected };
}
```

### Donations Realtime Example

```typescript
// Kullanim ornegi - Donations icin realtime
export function useDonationsRealtime() {
  const queryClient = useQueryClient();
  const { databaseId } = appwriteConfig;
  const { collections } = appwriteConfig;

  useAppwriteRealtime(
    [`databases.${databaseId}.collections.${collections.donations}.documents`],
    {
      onCreate: (newDonation) => {
        queryClient.invalidateQueries({ queryKey: ['donations'] });
        toast.success('Yeni bagis eklendi');
      },
      onUpdate: (updatedDonation) => {
        queryClient.setQueryData(
          ['donation', updatedDonation.$id],
          updatedDonation
        );
        toast.info('Bagis guncellendi');
      },
      onDelete: ({ $id }) => {
        queryClient.invalidateQueries({ queryKey: ['donations'] });
        toast.warning('Bagis silindi');
      },
    }
  );
}
```

### Server-side Realtime

```typescript
// src/lib/appwrite/realtime.ts
import { Client } from 'appwrite';
import { appwriteConfig } from './config';

export function createRealtimeClient() {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

  return client;
}

// Subscribe to specific collection
export function subscribeToCollection<T>(
  collectionId: string,
  callbacks: {
    onCreate?: (payload: T) => void;
    onUpdate?: (payload: T) => void;
    onDelete?: (payload: { $id: string }) => void;
  }
) {
  const client = createRealtimeClient();
  const channel = `databases.${appwriteConfig.databaseId}.collections.${collectionId}.documents`;

  return client.subscribe(channel, (response) => {
    const eventType = response.events[0]?.split('.').pop();

    switch (eventType) {
      case 'create':
        callbacks.onCreate?.(response.payload as T);
        break;
      case 'update':
        callbacks.onUpdate?.(response.payload as T);
        break;
      case 'delete':
        callbacks.onDelete?.(response.payload as { $id: string });
        break;
    }
  });
}
```

---

## OAuth Authentication

### Setup (Appwrite Console)

1. Go to **Authentication > Providers**
2. Enable desired providers (Google, GitHub, Microsoft, etc.)
3. Add redirect URLs: `https://yourdomain.com/auth/callback`

### Client-side Implementation

```typescript
import { oauthAuth } from '@/lib/appwrite/auth-oauth';

// Google ile giris
await oauthAuth.loginWithGoogle();

// GitHub ile giris
await oauthAuth.loginWithGitHub();

// Microsoft ile giris
await oauthAuth.loginWithMicrosoft();
```

### OAuth Auth Service

```typescript
// src/lib/appwrite/auth-oauth.ts
import { Account, OAuthProvider } from 'appwrite';
import { client } from './client';
import logger from '@/lib/logger';

export const oauthAuth = {
  /**
   * Google OAuth ile giris
   */
  async loginWithGoogle(redirectUrl: string = window.location.origin + '/auth/callback') {
    try {
      const account = new Account(client);
      account.createOAuth2Session(
        OAuthProvider.Google,
        redirectUrl, // success URL
        redirectUrl + '?error=true' // failure URL
      );
    } catch (error) {
      logger.error('Google OAuth failed', { error });
      throw error;
    }
  },

  /**
   * GitHub OAuth ile giris
   */
  async loginWithGitHub(redirectUrl: string = window.location.origin + '/auth/callback') {
    try {
      const account = new Account(client);
      account.createOAuth2Session(
        OAuthProvider.GitHub,
        redirectUrl,
        redirectUrl + '?error=true'
      );
    } catch (error) {
      logger.error('GitHub OAuth failed', { error });
      throw error;
    }
  },

  /**
   * Microsoft OAuth ile giris
   */
  async loginWithMicrosoft(redirectUrl: string = window.location.origin + '/auth/callback') {
    try {
      const account = new Account(client);
      account.createOAuth2Session(
        OAuthProvider.Microsoft,
        redirectUrl,
        redirectUrl + '?error=true'
      );
    } catch (error) {
      logger.error('Microsoft OAuth failed', { error });
      throw error;
    }
  },
};
```

### OAuth Callback Handler

```typescript
// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Account } from 'appwrite';
import { client } from '@/lib/appwrite/client';
import { useAuthStore } from '@/stores/authStore';
import logger from '@/lib/logger';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      try {
        const account = new Account(client);
        const session = await account.getSession('current');

        if (session) {
          const user = await account.get();

          setUser({
            id: user.$id,
            email: user.email,
            name: user.name,
          });

          router.push('/genel');
        } else {
          throw new Error('Session not found');
        }
      } catch (error) {
        logger.error('OAuth callback failed', { error });
        router.push('/login?error=oauth_failed');
      }
    }

    const error = searchParams.get('error');
    if (error) {
      router.push('/login?error=oauth_failed');
      return;
    }

    handleCallback();
  }, [router, searchParams, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Giris yapiliyor...</p>
      </div>
    </div>
  );
}
```

### OAuth Button Component

```typescript
// src/components/auth/OAuthButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { oauthAuth } from '@/lib/appwrite/auth-oauth';
import { Github, Chrome } from 'lucide-react';

interface OAuthButtonProps {
  provider: 'google' | 'github' | 'microsoft';
  redirectUrl?: string;
}

export function OAuthButton({ provider, redirectUrl }: OAuthButtonProps) {
  const handleOAuth = async () => {
    switch (provider) {
      case 'google':
        await oauthAuth.loginWithGoogle(redirectUrl);
        break;
      case 'github':
        await oauthAuth.loginWithGitHub(redirectUrl);
        break;
      case 'microsoft':
        await oauthAuth.loginWithMicrosoft(redirectUrl);
        break;
    }
  };

  const icons = {
    google: Chrome,
    github: Github,
    microsoft: Chrome,
  };

  const labels = {
    google: 'Google ile Giris',
    github: 'GitHub ile Giris',
    microsoft: 'Microsoft ile Giris',
  };

  const Icon = icons[provider];

  return (
    <Button variant="outline" onClick={handleOAuth} className="w-full">
      <Icon className="mr-2 h-4 w-4" />
      {labels[provider]}
    </Button>
  );
}

// Kullanim
<OAuthButton provider="google" />
<OAuthButton provider="github" />
<OAuthButton provider="microsoft" />
```

---

## Database Queries

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
// src/lib/appwrite/query-builder.ts
import { Query } from 'appwrite';

export class AppwriteQueryBuilder {
  private queries: string[] = [];

  /**
   * Limit results (default: 20, max: 100)
   */
  limit(count: number): this {
    this.queries.push(Query.limit(Math.min(count, 100)));
    return this;
  }

  /**
   * Pagination - use offset
   */
  offset(count: number): this {
    this.queries.push(Query.offset(Math.max(0, count)));
    return this;
  }

  /**
   * Order by field
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.queries.push(Query.orderAsc(field));
    if (direction === 'desc') {
      this.queries = this.queries.filter(q => !q.includes(`order("${field}"`));
      this.queries.push(Query.orderDesc(field));
    }
    return this;
  }

  /**
   * Filter by exact match
   */
  equal(field: string, value: string | number | boolean): this {
    this.queries.push(Query.equal(field, value));
    return this;
  }

  /**
   * Filter by multiple values (OR condition)
   */
  equalAny(field: string, values: (string | number)[]): this {
    this.queries.push(Query.equal(field, values));
    return this;
  }

  /**
   * Filter by not equal
   */
  notEqual(field: string, value: string | number): this {
    this.queries.push(Query.notEqual(field, value));
    return this;
  }

  /**
   * Filter by less than
   */
  lessThan(field: string, value: string | number): this {
    this.queries.push(Query.lessThan(field, value));
    return this;
  }

  /**
   * Filter by greater than
   */
  greaterThan(field: string, value: string | number): this {
    this.queries.push(Query.greaterThan(field, value));
    return this;
  }

  /**
   * Filter by range (between)
   */
  between(field: string, min: string | number, max: string | number): this {
    this.queries.push(Query.between(field, min, max));
    return this;
  }

  /**
   * Full-text search
   */
  search(field: string, value: string): this {
    if (value.trim()) {
      this.queries.push(Query.search(field, value));
    }
    return this;
  }

  /**
   * Filter by array contains
   */
  contains(field: string, value: string | number): this {
    this.queries.push(Query.contains(field, value));
    return this;
  }

  /**
   * Select specific fields only
   */
  select(fields: string[]): this {
    this.queries.push(Query.select(fields));
    return this;
  }

  /**
   * Build and return queries array
   */
  build(): string[] {
    return [...this.queries];
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.queries = [];
    return this;
  }
}

// Kullanim ornegi
const builder = new AppwriteQueryBuilder();
const queries = builder
  .equal('status', 'active')
  .greaterThan('amount', 100)
  .orderBy('created_at', 'desc')
  .limit(20)
  .offset(0)
  .build();
```

### Query Optimization Tips

```typescript
// 1. Use indexes for frequently queried fields
// Appwrite Console'da collection settings'ten index olusturun

// 2. Limit result size - always set reasonable limits
const queries = [
  Query.limit(50), // Never fetch thousands of records at once
  Query.offset(0),
];

// 3. Use select to fetch only needed fields
const queries = [
  Query.select(['name', 'email', 'role']), // Only fetch needed fields
  Query.limit(20),
];

// 4. Combine filters efficiently
const queries = [
  Query.equal('status', 'active'),
  Query.equal('city', 'Istanbul'),
  Query.greaterThan('amount', 1000),
  Query.orderDesc('created_at'),
  Query.limit(20),
];

// 5. Use cursor-based pagination for large datasets
const lastId = 'lastDocumentId';
const queries = [
  Query.cursorAfter(lastId),
  Query.limit(20),
];

// 6. Cache frequently accessed data
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['donations', filters],
  queryFn: () => fetchDonations(filters),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
});
```

### Best Practices Checklist

- Always set `limit` (max 100)
- Use `offset` for pagination
- Create indexes for frequently queried fields
- Use `select` to fetch only needed fields
- Combine filters efficiently
- Cache results with React Query

---

## File Uploads

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

### Storage Service Implementation

```typescript
// src/lib/appwrite/storage.ts
import { Storage, ID } from 'appwrite';
import { client } from './client';
import { appwriteConfig } from './config';
import logger from '@/lib/logger';

export class AppwriteStorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage(client);
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    bucketId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ $id: string; name: string; sizeOriginal: number; mimeType: string }> {
    try {
      const fileId = ID.unique();

      const response = await this.storage.createFile(
        bucketId,
        fileId,
        file,
        undefined,
        (progress) => {
          onProgress?.(progress);
        }
      );

      return response;
    } catch (error) {
      logger.error('File upload failed', { error, bucketId, fileName: file.name });
      throw error;
    }
  }

  /**
   * Upload with metadata
   */
  async uploadWithMetadata(
    bucketId: string,
    file: File,
    metadata: {
      beneficiaryId?: string;
      documentType?: string;
      uploadedBy?: string;
    },
    onProgress?: (progress: number) => void
  ) {
    const uploadedFile = await this.uploadFile(bucketId, file, onProgress);

    if (metadata.uploadedBy) {
      await this.storage.updateFile(
        bucketId,
        uploadedFile.$id,
        undefined,
        [`user:${metadata.uploadedBy}`]
      );
    }

    return uploadedFile;
  }

  getFilePreview(bucketId: string, fileId: string, width?: number, height?: number): string {
    return this.storage.getFilePreview(bucketId, fileId, width, height);
  }

  getFileView(bucketId: string, fileId: string): string {
    return this.storage.getFileView(bucketId, fileId);
  }

  getFileDownload(bucketId: string, fileId: string): string {
    return this.storage.getFileDownload(bucketId, fileId);
  }

  async deleteFile(bucketId: string, fileId: string): Promise<void> {
    await this.storage.deleteFile(bucketId, fileId);
  }

  async listFiles(
    bucketId: string,
    queries?: string[]
  ): Promise<{ files: Array<{ $id: string; name: string; sizeOriginal: number }>; total: number }> {
    const response = await this.storage.listFiles(bucketId, queries);
    return {
      files: response.files,
      total: response.total,
    };
  }
}

export const appwriteStorageService = new AppwriteStorageService();
```

### React Upload Component with Progress

```typescript
// src/components/ui/file-upload-with-progress.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';
import { appwriteStorageService } from '@/lib/appwrite/storage';
import { appwriteConfig } from '@/lib/appwrite/config';
import { toast } from 'sonner';

interface FileUploadWithProgressProps {
  bucket?: string;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: Error) => void;
  maxSize?: number;
  acceptedTypes?: string[];
}

export function FileUploadWithProgress({
  bucket = 'documents',
  onUploadComplete,
  onUploadError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf'],
}: FileUploadWithProgressProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast.error(`Dosya boyutu cok buyuk. Maksimum ${maxSize / 1024 / 1024}MB olabilir.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const bucketId = appwriteConfig.buckets[bucket as keyof typeof appwriteConfig.buckets] || bucket;

      const uploadedFile = await appwriteStorageService.uploadFile(
        bucketId,
        selectedFile,
        (uploadProgress) => {
          setProgress(uploadProgress);
        }
      );

      toast.success('Dosya basariyla yuklendi');
      onUploadComplete?.(uploadedFile.$id);
      setSelectedFile(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      toast.error('Dosya yukleme hatasi: ' + err.message);
      onUploadError?.(err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" disabled={uploading} asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Dosya Sec
            </span>
          </Button>
        </label>

        {selectedFile && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            {progress}% yuklendi...
          </p>
        </div>
      )}

      {selectedFile && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Yukle
        </Button>
      )}
    </div>
  );
}
```

---

## Appwrite Functions

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

### Send Email Notification Function

```typescript
// functions/send-notification/index.ts
import { Client, Databases, Users } from 'node-appwrite';

export default async ({ req, res, log, error }: {
  req: any;
  res: any;
  log: (message: string) => void;
  error: (message: string, err?: any) => void;
}) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const users = new Users(client);

    const { notificationId, userId, message } = JSON.parse(req.body);

    log(`Processing notification ${notificationId} for user ${userId}`);

    const user = await users.get(userId);

    await sendEmail({
      to: user.email,
      subject: 'Yeni Bildirim',
      body: message,
    });

    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_NOTIFICATIONS!,
      notificationId,
      {
        sent: true,
        sentAt: new Date().toISOString(),
      }
    );

    log('Notification sent successfully');

    return res.json({ success: true });
  } catch (err) {
    error('Function execution failed', err);
    return res.json({ success: false, error: err.message }, 500);
  }
};

async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  // Implement your email sending logic
}
```

### Data Processing Function

```typescript
// functions/process-donations/index.ts
import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log }: {
  req: any;
  res: any;
  log: (message: string) => void;
}) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);

  try {
    const donations = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_DONATIONS!,
      [Query.equal('status', 'pending')]
    );

    log(`Processing ${donations.total} pending donations`);

    for (const donation of donations.documents) {
      const processedData = {
        ...donation,
        processedAt: new Date().toISOString(),
        status: 'processed',
      };

      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_COLLECTION_DONATIONS!,
        donation.$id,
        processedData
      );
    }

    return res.json({
      success: true,
      processed: donations.total,
    });
  } catch (err) {
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

### Trigger Function from API Route

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

---

## Common Patterns

### Error Handling

```typescript
try {
  const result = await databases.createDocument(/*...*/);
} catch (error) {
  if (error instanceof Error) {
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

---

## Best Practices

### Real-time

- Use specific channels for better performance
- Unsubscribe on component unmount
- Handle connection errors gracefully
- Debounce rapid updates

### OAuth

- Set proper redirect URLs
- Handle OAuth callback errors
- Store session securely
- Implement logout cleanup

### Queries

- Always set reasonable limits
- Use indexes for frequently queried fields
- Select only needed fields
- Cache results appropriately
- Combine filters efficiently

### Storage

- Validate file types and sizes
- Set appropriate permissions
- Track upload progress
- Clean up failed uploads
- Generate unique file IDs

### Functions

- Use environment variables for config
- Handle errors properly
- Log important events
- Set proper timeouts
- Use async/await correctly

---

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite SDK for Web](https://github.com/appwrite/sdk-for-web)
- [Appwrite SDK for Node.js](https://github.com/appwrite/sdk-for-node)
- [Project Config](../src/lib/appwrite/config.ts)
- [Client SDK](../src/lib/appwrite/client.ts)
- [Server SDK](../src/lib/appwrite/server.ts)
