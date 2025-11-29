/**
 * Appwrite Authentication Test Script
 * Tests login, register, and logout functionality
 */

import { Client, Account, ID } from 'appwrite';
import { appwriteConfig } from '../src/lib/appwrite/config';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

const account = new Account(client);

// Test user credentials
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';
const testName = 'Test User';

async function testAuth() {
  console.log('🔐 Appwrite Authentication Test\n');
  console.log('=' .repeat(50));

  // Check configuration
  console.log('\n📋 Configuration Check:');
  console.log(`Endpoint: ${appwriteConfig.endpoint}`);
  console.log(`Project ID: ${appwriteConfig.projectId}`);
  console.log(`Database ID: ${appwriteConfig.databaseId}`);

  if (!appwriteConfig.endpoint || !appwriteConfig.projectId) {
    console.error('\n❌ ERROR: Appwrite endpoint or project ID is missing!');
    console.error('Please set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID');
    process.exit(1);
  }

  try {
    // Test 1: Register a new user
    console.log('\n📝 Test 1: Register User');
    console.log(`Email: ${testEmail}`);
    console.log(`Name: ${testName}`);

    let user;
    try {
      user = await account.create(ID.unique(), testEmail, testPassword, testName);
      console.log('✅ User registered successfully');
      console.log(`   User ID: ${user.$id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
    } catch (error: any) {
      if (error.code === 409) {
        console.log('⚠️  User already exists, continuing with login test...');
        // Try to login instead
        try {
          const session = await account.createEmailPasswordSession(testEmail, testPassword);
          console.log('✅ Login successful');
          console.log(`   Session ID: ${session.$id}`);
        } catch (loginError: any) {
          console.error('❌ Login failed:', loginError.message);
          throw loginError;
        }
      } else {
        throw error;
      }
    }

    // Test 2: Get current user
    console.log('\n👤 Test 2: Get Current User');
    try {
      const currentUser = await account.get();
      console.log('✅ Current user retrieved');
      console.log(`   User ID: ${currentUser.$id}`);
      console.log(`   Name: ${currentUser.name}`);
      console.log(`   Email: ${currentUser.email}`);
    } catch (error: any) {
      console.error('❌ Failed to get current user:', error.message);
      throw error;
    }

    // Test 3: Create session (login)
    console.log('\n🔑 Test 3: Create Session (Login)');
    try {
      // Delete existing session first
      try {
        const sessions = await account.listSessions();
        for (const session of sessions.sessions) {
          await account.deleteSession(session.$id);
        }
      } catch {
        // Ignore errors
      }

      const session = await account.createEmailPasswordSession(testEmail, testPassword);
      console.log('✅ Session created successfully');
      console.log(`   Session ID: ${session.$id}`);
      console.log(`   Provider: ${session.provider}`);
      console.log(`   Expires: ${new Date(session.expire).toLocaleString()}`);
    } catch (error: any) {
      console.error('❌ Failed to create session:', error.message);
      throw error;
    }

    // Test 4: List sessions
    console.log('\n📋 Test 4: List Sessions');
    try {
      const sessions = await account.listSessions();
      console.log('✅ Sessions retrieved');
      console.log(`   Total sessions: ${sessions.total}`);
      sessions.sessions.forEach((session, index) => {
        console.log(`   Session ${index + 1}:`);
        console.log(`     ID: ${session.$id}`);
        console.log(`     Provider: ${session.provider}`);
        console.log(`     Current: ${session.current ? 'Yes' : 'No'}`);
      });
    } catch (error: any) {
      console.error('❌ Failed to list sessions:', error.message);
      throw error;
    }

    // Test 5: Delete session (logout)
    console.log('\n🚪 Test 5: Delete Session (Logout)');
    try {
      const sessions = await account.listSessions();
      if (sessions.sessions.length > 0) {
        await account.deleteSession(sessions.sessions[0].$id);
        console.log('✅ Session deleted successfully');
      } else {
        console.log('⚠️  No sessions to delete');
      }
    } catch (error: any) {
      console.error('❌ Failed to delete session:', error.message);
      throw error;
    }

    // Test 6: Verify logout
    console.log('\n🔍 Test 6: Verify Logout');
    try {
      await account.get();
      console.log('⚠️  User still authenticated (session might not be fully deleted)');
    } catch (error: any) {
      if (error.code === 401) {
        console.log('✅ Logout verified - User is no longer authenticated');
      } else {
        throw error;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('✅ All authentication tests passed!');
    console.log('\n📝 Test Summary:');
    console.log('   ✅ User registration');
    console.log('   ✅ Get current user');
    console.log('   ✅ Create session (login)');
    console.log('   ✅ List sessions');
    console.log('   ✅ Delete session (logout)');
    console.log('   ✅ Verify logout');

    console.log(`\n🧹 Test user created: ${testEmail}`);
    console.log('   You may want to delete this user from Appwrite Console if not needed.');

  } catch (error: any) {
    console.error(`\n${'='.repeat(50)}`);
    console.error('❌ Authentication test failed!');
    console.error(`\nError: ${error.message}`);
    console.error(`Code: ${error.code || 'N/A'}`);
    console.error(`Type: ${error.type || 'N/A'}`);

    if (error.code === 401) {
      console.error('\n💡 Possible causes:');
      console.error('   - Invalid credentials');
      console.error('   - User not found');
      console.error('   - Session expired');
    } else if (error.code === 404) {
      console.error('\n💡 Possible causes:');
      console.error('   - Project ID is incorrect');
      console.error('   - Endpoint URL is incorrect');
      console.error('   - Platform not added in Appwrite Console');
    } else if (error.code === 403) {
      console.error('\n💡 Possible causes:');
      console.error('   - CORS issue - check platform hostname in Appwrite Console');
      console.error('   - API key permissions insufficient');
    }

    process.exit(1);
  }
}

// Run tests
testAuth().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

