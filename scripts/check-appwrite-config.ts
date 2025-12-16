#!/usr/bin/env tsx
/**
 * Check Appwrite Configuration
 * 
 * This script verifies that all required Appwrite environment variables are set
 * and optionally verifies that the Appwrite project exists.
 */

// Load environment variables from .env.local BEFORE importing config
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Now import config after env vars are loaded
import { appwriteConfig, isServerConfigured, isClientConfigured } from '../src/lib/appwrite/config';

console.log('🔍 Checking Appwrite Configuration...\n');

const requiredVars = {
  'NEXT_PUBLIC_APPWRITE_ENDPOINT': process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  'NEXT_PUBLIC_APPWRITE_DATABASE_ID': process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY ? '[SET]' : '[MISSING]',
};

console.log('Environment Variables:');
console.log('─'.repeat(60));
for (const [key, value] of Object.entries(requiredVars)) {
  const status = value ? '✅' : '❌';
  const displayValue = key === 'APPWRITE_API_KEY' ? value : (value || '[MISSING]');
  console.log(`${status} ${key}: ${displayValue}`);
}

console.log('\nConfiguration Status:');
console.log('─'.repeat(60));
console.log(`Client Configuration: ${isClientConfigured() ? '✅ Ready' : '❌ Not Ready'}`);
console.log(`Server Configuration: ${isServerConfigured() ? '✅ Ready' : '❌ Not Ready'}`);

console.log('\nCurrent Config Values:');
console.log('─'.repeat(60));
console.log(`Endpoint: ${appwriteConfig.endpoint}`);
console.log(`Project ID: ${appwriteConfig.projectId || '[MISSING]'}`);
console.log(`Database ID: ${appwriteConfig.databaseId || '[MISSING]'}`);
console.log(`API Key: ${appwriteConfig.apiKey ? '[SET]' : '[MISSING]'}`);

// Check configuration using process.env directly
const hasEndpoint = !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const hasProjectId = !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const hasDatabaseId = !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const hasApiKey = !!process.env.APPWRITE_API_KEY;

if (!hasEndpoint || !hasProjectId || !hasDatabaseId) {
  console.log('\n❌ Required configuration is missing!');
  console.log('\nTo fix this, ensure your .env.local file contains:');
  console.log('  NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
  console.log('  NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id');
  console.log('  NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id');
  if (!hasApiKey) {
    console.log('  APPWRITE_API_KEY=your-api-key (required for server-side operations)');
  }
  console.log('\nAfter updating .env.local, restart your development server.');
  process.exit(1);
}

if (!hasApiKey) {
  console.log('\n⚠️  Warning: APPWRITE_API_KEY is missing. Server-side operations will not work.');
}

// Verify project exists in Appwrite
console.log('\n🔍 Verifying Appwrite Project...');
console.log('─'.repeat(60));

async function verifyProject() {
  // Read directly from process.env to ensure we have the latest values
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    console.log('⚠️  Cannot verify project - missing endpoint or project ID');
    return;
  }

  try {
    // Try to make a simple API call to verify the project exists
    // Using the account endpoint which requires a valid project ID
    const response = await fetch(`${endpoint}/account`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId,
      },
    });

    if (response.status === 404) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.type === 'project_not_found') {
        console.log('❌ Project NOT FOUND in Appwrite!');
        console.log(`\nThe project ID "${projectId.substring(0, 8)}..." does not exist at ${endpoint}`);
        console.log('\nPossible causes:');
        console.log('  1. The project ID in .env.local is incorrect');
        console.log('  2. The endpoint points to a different Appwrite instance');
        console.log('  3. The project was deleted or moved');
        console.log('\nTo fix this:');
        console.log('  1. Log into your Appwrite console');
        console.log('  2. Verify the project ID in the project settings');
        console.log('  3. Update NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local');
        console.log('  4. Verify NEXT_PUBLIC_APPWRITE_ENDPOINT matches your Appwrite instance');
        process.exit(1);
      }
    }

    if (response.ok || response.status === 401) {
      // 401 is expected for unauthenticated requests, but means project exists
      console.log('✅ Project verified successfully!');
    } else {
      console.log(`⚠️  Project verification returned status ${response.status}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`⚠️  Could not verify project: ${errorMsg}`);
    console.log('   This might be a network issue or the endpoint is unreachable.');
  }
}

verifyProject().then(() => {
  console.log('\n✅ All required configuration is set!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Error during verification:', error);
  process.exit(1);
});


