/**
 * Create test user in Appwrite
 * This script creates a user directly in the Appwrite project specified in environment variables
 */

import { Client, Users, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing environment variables');
  console.error('ENDPOINT:', ENDPOINT ? '✓' : '✗');
  console.error('PROJECT_ID:', PROJECT_ID ? '✓' : '✗');
  console.error('API_KEY:', API_KEY ? '✓' : '✗');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const users = new Users(client);

const TEST_EMAIL = 'mcp-login@example.com';
const TEST_PASSWORD = 'SecurePass123!';
const TEST_NAME = 'MCP Test User';

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');
    console.log(`📍 Endpoint: ${ENDPOINT}`);
    console.log(`🆔 Project ID: ${PROJECT_ID}`);
    console.log(`📧 Email: ${TEST_EMAIL}`);

    // Try to create user
    const userId = ID.unique();
    const user = await users.create(userId, TEST_EMAIL, undefined, TEST_PASSWORD, TEST_NAME);

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${user.$id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email Verification: ${user.emailVerification}`);

    // Verify email (bypass email verification requirement)
    try {
      await users.updateEmailVerification(user.$id, true);
      console.log('✅ Email verification set to verified');
    } catch (verifyError: any) {
      console.warn('⚠️  Could not set email verification (may not be needed):', verifyError.message);
    }

    // Set role in preferences
    try {
      await users.updatePrefs(user.$id, {
        role: 'Personel',
        permissions: JSON.stringify([]),
      });
      console.log('✅ User preferences set');
    } catch (prefsError: any) {
      console.warn('⚠️  Could not set preferences:', prefsError.message);
    }

    console.log('\n🎉 Test user is ready!');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('\nYou can now login at: http://localhost:3000/login');
    } catch (error: any) {
    if (error.code === 409 || error.message.includes('already') || error.message.includes('exists')) {
      console.log('ℹ️  User already exists with this email');
      console.log('   Trying to find and update existing user...');
      
      // Try known user IDs
      const knownUserIds = ['mcp-test-user-001'];
      let foundUser = null;

      for (const knownId of knownUserIds) {
        try {
          const existingUser = await users.get(knownId);
          if (existingUser.email === TEST_EMAIL) {
            foundUser = existingUser;
            console.log(`   ✅ Found user with ID: ${existingUser.$id}`);
            break;
          }
        } catch {
          // User not found with this ID, continue
        }
      }

      // If not found, try to search by creating a new one with unique ID
      if (!foundUser) {
        console.log('   User exists but could not be found by ID');
        console.log('   Creating new user with different ID...');
        try {
          const newUserId = ID.unique();
          const newUser = await users.create(newUserId, TEST_EMAIL, undefined, TEST_PASSWORD, TEST_NAME);
          foundUser = newUser;
          console.log(`   ✅ Created new user with ID: ${newUser.$id}`);
        } catch (createError: any) {
          console.error('❌ Failed to create user:', createError.message);
          console.log('\n💡 Solution: Please delete the existing user from Appwrite Console');
          console.log('   Then run this script again, or use a different email address');
          process.exit(1);
        }
      }

      if (foundUser) {
        // Verify email (bypass email verification requirement)
        try {
          await users.updateEmailVerification(foundUser.$id, true);
          console.log('✅ Email verification set to verified');
        } catch (verifyError: any) {
          console.warn('⚠️  Could not set email verification (may not be needed):', verifyError.message);
        }

        // Update password to ensure it's correct
        try {
          await users.updatePassword(foundUser.$id, TEST_PASSWORD);
          console.log('✅ Password updated');
        } catch (passError: any) {
          console.warn('⚠️  Could not update password:', passError.message);
        }

        // Set role in preferences
        try {
          await users.updatePrefs(foundUser.$id, {
            role: 'Personel',
            permissions: JSON.stringify([]),
          });
          console.log('✅ User preferences updated');
        } catch (prefsError: any) {
          console.warn('⚠️  Could not update preferences:', prefsError.message);
        }

        console.log('\n🎉 Test user is ready!');
        console.log(`   User ID: ${foundUser.$id}`);
        console.log(`   Email: ${TEST_EMAIL}`);
        console.log(`   Password: ${TEST_PASSWORD}`);
        console.log('\nYou can now login at: http://localhost:3000/login');
      }
    } else {
      console.error('❌ Failed to create user:', error.message);
      console.error('   Code:', error.code);
      process.exit(1);
    }
  }
}

createTestUser();

