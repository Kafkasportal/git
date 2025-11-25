/**
 * Backend Test Script
 * 
 * Tests which backend provider is currently being used and verifies Appwrite configuration
 * 
 * Usage: npx tsx scripts/test-backend.ts
 */

import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

// Test 1: Backend Provider
function testBackendProvider() {
  const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER || 'appwrite';
  
  if (provider === 'appwrite') {
    addResult('Backend Provider', 'pass', `Using Appwrite (${provider})`);
  } else {
    addResult('Backend Provider', 'fail', `Unknown provider: ${provider}`);
  }
  
  return provider;
}

// Test 2: Appwrite Configuration
function testAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint) {
    addResult('Appwrite Endpoint', 'fail', 'NEXT_PUBLIC_APPWRITE_ENDPOINT not set');
  } else {
    addResult('Appwrite Endpoint', 'pass', endpoint);
  }

  if (!projectId) {
    addResult('Appwrite Project ID', 'fail', 'NEXT_PUBLIC_APPWRITE_PROJECT_ID not set');
  } else {
    addResult('Appwrite Project ID', 'pass', `${projectId.substring(0, 8)}...`);
  }

  if (!databaseId) {
    addResult('Appwrite Database ID', 'warn', 'NEXT_PUBLIC_APPWRITE_DATABASE_ID not set (will use default)');
  } else {
    addResult('Appwrite Database ID', 'pass', databaseId);
  }

  if (!apiKey) {
    addResult('Appwrite API Key', 'fail', 'APPWRITE_API_KEY not set (required for server-side operations)');
  } else {
    addResult('Appwrite API Key', 'pass', `${apiKey.substring(0, 8)}...`);
  }

  return { endpoint, projectId, databaseId, apiKey };
}

// Test 3: Reserved for future tests

// Test 4: Reserved for future tests

// Test 5: Appwrite Library Check
function testAppwriteLibrary() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['appwrite']) {
      addResult('Appwrite Client SDK', 'pass', `Installed (${deps['appwrite']})`);
    } else {
      addResult('Appwrite Client SDK', 'fail', 'Not installed. Run: npm install appwrite');
    }
    
    if (deps['node-appwrite']) {
      addResult('Appwrite Server SDK', 'pass', `Installed (${deps['node-appwrite']})`);
    } else {
      addResult('Appwrite Server SDK', 'fail', 'Not installed. Run: npm install node-appwrite');
    }
  } catch (_error) {
    addResult('Appwrite Library Check', 'fail', 'Could not read package.json');
  }
}

// Test 6: Appwrite Config Files
function testAppwriteFiles() {
  const files = [
    'src/lib/appwrite/config.ts',
    'src/lib/appwrite/client.ts',
    'src/lib/appwrite/server.ts',
    'src/lib/appwrite/api-client.ts',
    'src/lib/appwrite/auth.ts',
  ];

  files.forEach(file => {
    if (existsSync(file)) {
      addResult(`File: ${file}`, 'pass', 'Exists');
    } else {
      addResult(`File: ${file}`, 'fail', 'Missing');
    }
  });
}

// Test 7: Unified Backend Check
function testUnifiedBackend() {
  const unifiedBackend = 'src/lib/backend/index.ts';
  
  if (existsSync(unifiedBackend)) {
    addResult('Unified Backend Interface', 'pass', 'Exists');
  } else {
    addResult('Unified Backend Interface', 'fail', 'Missing');
  }
}

// Main test function
async function main() {
  console.log('\n🔍 Backend Configuration Test\n');
  console.log('='.repeat(50));
  
  const provider = testBackendProvider();
  console.log('');
  
  const _appwriteConfig = testAppwriteConfig();
  console.log('');
  
  testAppwriteLibrary();
  console.log('');
  
  testAppwriteFiles();
  console.log('');
  
  testUnifiedBackend();
  console.log('');
  
  // Summary
  console.log('='.repeat(50));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);
  
  console.log(`\n${  '='.repeat(50)}`);
  
  if (provider === 'appwrite') {
    if (failed === 0) {
      console.log('\n✅ Backend is configured for Appwrite!');
      console.log('   All critical checks passed.');
    } else {
      console.log('\n⚠️  Backend is set to Appwrite but some configuration is missing.');
      console.log('   Please fix the failed checks above.');
    }
  } else {
    console.log('\n⚠️  Backend provider is not set to Appwrite.');
    console.log('   Set NEXT_PUBLIC_BACKEND_PROVIDER=appwrite in .env.local');
  }
  
  console.log(`\n${  '='.repeat(50)  }\n`);
  
  // Exit with error code if any critical tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});

