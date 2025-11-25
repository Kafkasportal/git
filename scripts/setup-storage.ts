/**
 * Appwrite Storage Setup Script
 * 
 * Bu script Appwrite'da storage bucket'larını oluşturur.
 * 
 * Kullanım:
 *   npx tsx scripts/setup-storage.ts
 */

import { Client, Storage } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';

if (!projectId || !apiKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_APPWRITE_PROJECT_ID:', projectId ? '✓' : '✗');
  console.error('   APPWRITE_API_KEY:', apiKey ? '✓' : '✗');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client();
client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const storage = new Storage(client);

// Bucket configurations
const buckets = [
  {
    id: 'documents',
    name: 'Documents',
    permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
    fileSecurity: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'],
  },
  {
    id: 'avatars',
    name: 'Avatars',
    permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
    fileSecurity: true,
    maximumFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  {
    id: 'receipts',
    name: 'Receipts',
    permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
    fileSecurity: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
  },
];

async function createBucket(bucketConfig: typeof buckets[0]) {
  console.log(`\n📦 Creating bucket: ${bucketConfig.name} (${bucketConfig.id})`);

  try {
    // Check if bucket exists
    try {
      await storage.getBucket(bucketConfig.id);
      console.log(`   ⚠ Bucket already exists`);
      return;
    } catch (error: unknown) {
      // Bucket doesn't exist, create it
      if (error instanceof Error && error.message.includes('not found')) {
        // Continue to create
      } else {
        throw error;
      }
    }

    // Create bucket
    await storage.createBucket(
      bucketConfig.id,
      bucketConfig.name,
      bucketConfig.permissions,
      bucketConfig.fileSecurity,
      bucketConfig.maximumFileSize,
      bucketConfig.allowedFileExtensions,
      true, // enabled
      undefined, // compression
      undefined, // encryption
      undefined, // antivirus
    );

    console.log(`   ✓ Bucket created successfully`);
    console.log(`     - Max file size: ${bucketConfig.maximumFileSize / 1024 / 1024}MB`);
    console.log(`     - Allowed extensions: ${bucketConfig.allowedFileExtensions.join(', ')}`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`   ⚠ Bucket already exists`);
    } else {
      console.error(`   ✗ Error:`, error);
      if (error instanceof Error) {
        console.error(`     Message: ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Appwrite Storage Setup');
  console.log('='.repeat(50));
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Project: ${projectId}`);
  console.log('='.repeat(50));

  try {
    for (const bucketConfig of buckets) {
      await createBucket(bucketConfig);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n✅ Storage setup completed successfully!');
    console.log(`\nBuckets created: ${buckets.length}`);
    console.log('\nBucket IDs:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.id}: ${bucket.name}`);
    });
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

main();

