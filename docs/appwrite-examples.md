# Appwrite Implementation Examples

Bu doküman, Kafkasportal projesinde Appwrite kullanımı için pratik örnekler içerir.

## 1. Real-time Subscriptions (Gerçek Zamanlı Abonelikler)

### Client-side Realtime Hook

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

// Kullanım örneği - Donations için realtime
export function useDonationsRealtime() {
  const queryClient = useQueryClient();
  const { databaseId } = appwriteConfig;
  const { collections } = appwriteConfig;

  useAppwriteRealtime(
    [`databases.${databaseId}.collections.${collections.donations}.documents`],
    {
      onCreate: (newDonation) => {
        queryClient.invalidateQueries({ queryKey: ['donations'] });
        toast.success('Yeni bağış eklendi');
      },
      onUpdate: (updatedDonation) => {
        queryClient.setQueryData(
          ['donation', updatedDonation.$id],
          updatedDonation
        );
        toast.info('Bağış güncellendi');
      },
      onDelete: ({ $id }) => {
        queryClient.invalidateQueries({ queryKey: ['donations'] });
        toast.warning('Bağış silindi');
      },
    }
  );
}
```

### Server-side Realtime Example

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

## 2. OAuth Authentication (OAuth Kimlik Doğrulama)

### Client-side OAuth Setup

```typescript
// src/lib/appwrite/auth-oauth.ts
import { Account, OAuthProvider } from 'appwrite';
import { client } from './client'; // Client-side Appwrite client
import logger from '@/lib/logger';

export const oauthAuth = {
  /**
   * Google OAuth ile giriş
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
   * GitHub OAuth ile giriş
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
   * Microsoft OAuth ile giriş
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
        // Get OAuth session from URL
        const account = new Account(client);
        const session = await account.getSession('current');

        if (session) {
          // Get user info
          const user = await account.get();
          
          // Update auth store
          setUser({
            id: user.$id,
            email: user.email,
            name: user.name,
          });

          // Redirect to dashboard
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
        <p className="mt-4 text-muted-foreground">Giriş yapılıyor...</p>
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
    try {
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
    } catch (error) {
      console.error(`OAuth login failed for ${provider}:`, error);
    }
  };

  const icons = {
    google: Chrome,
    github: Github,
    microsoft: Chrome, // You can add a Microsoft icon
  };

  const labels = {
    google: 'Google ile Giriş',
    github: 'GitHub ile Giriş',
    microsoft: 'Microsoft ile Giriş',
  };

  const Icon = icons[provider];

  return (
    <Button
      variant="outline"
      onClick={handleOAuth}
      className="w-full"
    >
      <Icon className="mr-2 h-4 w-4" />
      {labels[provider]}
    </Button>
  );
}
```

## 3. Database Query Best Practices (Veritabanı Sorgu En İyi Uygulamaları)

### Efficient Query Building

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
   * Filter by array contains any
   */
  containsAny(field: string, values: (string | number)[]): this {
    this.queries.push(Query.containsAny(field, values));
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

// Kullanım örneği
export async function getActiveDonations(page: number = 1, limit: number = 20) {
  const builder = new AppwriteQueryBuilder();
  
  const queries = builder
    .equal('status', 'active')
    .greaterThan('amount', 0)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit)
    .build();

  const databases = getDatabases();
  return await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.donations,
    queries
  );
}
```

### Query Optimization Tips

```typescript
// 1. Use indexes for frequently queried fields
// Appwrite Console'da collection settings'ten index oluşturun

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

// 5. Use cursor-based pagination for large datasets (if supported)
// Instead of offset, use last document ID
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

## 4. File Uploads with Appwrite Storage (Dosya Yükleme)

### Enhanced Upload Handler

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
        undefined, // permissions - set after upload
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
    // Upload file
    const uploadedFile = await this.uploadFile(bucketId, file, onProgress);

    // Set permissions (user can read/write their own files)
    if (metadata.uploadedBy) {
      await this.storage.updateFile(
        bucketId,
        uploadedFile.$id,
        undefined,
        [`user:${metadata.uploadedBy}`]
      );
    }

    // Create metadata document in files collection
    const { appwriteFiles } = await import('@/lib/appwrite/api');
    await appwriteFiles.create({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket: bucketId,
      storageId: uploadedFile.$id,
      beneficiaryId: metadata.beneficiaryId,
      documentType: metadata.documentType,
      uploadedBy: metadata.uploadedBy,
    });

    return uploadedFile;
  }

  /**
   * Get file preview URL
   */
  getFilePreview(bucketId: string, fileId: string, width?: number, height?: number): string {
    return this.storage.getFilePreview(bucketId, fileId, width, height);
  }

  /**
   * Get file view URL
   */
  getFileView(bucketId: string, fileId: string): string {
    return this.storage.getFileView(bucketId, fileId);
  }

  /**
   * Get file download URL
   */
  getFileDownload(bucketId: string, fileId: string): string {
    return this.storage.getFileDownload(bucketId, fileId);
  }

  /**
   * Delete file
   */
  async deleteFile(bucketId: string, fileId: string): Promise<void> {
    await this.storage.deleteFile(bucketId, fileId);
  }

  /**
   * List files in bucket
   */
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

### React Component with Upload Progress

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
  maxSize?: number; // in bytes
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

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`Dosya boyutu çok büyük. Maksimum ${maxSize / 1024 / 1024}MB olabilir.`);
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

      toast.success('Dosya başarıyla yüklendi');
      onUploadComplete?.(uploadedFile.$id);
      setSelectedFile(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      toast.error('Dosya yükleme hatası: ' + err.message);
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
              Dosya Seç
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
            {progress}% yüklendi...
          </p>
        </div>
      )}

      {selectedFile && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Yükle
        </Button>
      )}
    </div>
  );
}
```

## 5. Appwrite Functions (Serverless Functions)

### Function Example - Send Email Notification

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
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const users = new Users(client);

    // Get data from request
    const { notificationId, userId, message } = JSON.parse(req.body);

    log(`Processing notification ${notificationId} for user ${userId}`);

    // Get user details
    const user = await users.get(userId);
    
    // Send email (integrate with your email service)
    // Example with nodemailer or similar
    await sendEmail({
      to: user.email,
      subject: 'Yeni Bildirim',
      body: message,
    });

    // Update notification status
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
  // Example: use nodemailer, SendGrid, etc.
}
```

### Function Example - Data Processing

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
    // Get pending donations
    const donations = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_DONATIONS!,
      [Query.equal('status', 'pending')]
    );

    log(`Processing ${donations.total} pending donations`);

    // Process each donation
    for (const donation of donations.documents) {
      // Calculate totals, generate receipts, etc.
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
// src/app/api/process-donations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedUser();

    // Trigger Appwrite Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/functions/process-donations/executions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
        },
        body: JSON.stringify({
          data: {
            // Function parameters
          },
        }),
      }
    );

    const result = await response.json();
    return NextResponse.json({ success: true, executionId: result.$id });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Function execution failed' }, { status: 500 });
  }
}
```

## Best Practices Summary

### 1. Real-time
- ✅ Use specific channels for better performance
- ✅ Unsubscribe on component unmount
- ✅ Handle connection errors gracefully
- ✅ Debounce rapid updates

### 2. OAuth
- ✅ Set proper redirect URLs
- ✅ Handle OAuth callback errors
- ✅ Store session securely
- ✅ Implement logout cleanup

### 3. Queries
- ✅ Always set reasonable limits
- ✅ Use indexes for frequently queried fields
- ✅ Select only needed fields
- ✅ Cache results appropriately
- ✅ Combine filters efficiently

### 4. Storage
- ✅ Validate file types and sizes
- ✅ Set appropriate permissions
- ✅ Track upload progress
- ✅ Clean up failed uploads
- ✅ Generate unique file IDs

### 5. Functions
- ✅ Use environment variables for config
- ✅ Handle errors properly
- ✅ Log important events
- ✅ Set proper timeouts
- ✅ Use async/await correctly

