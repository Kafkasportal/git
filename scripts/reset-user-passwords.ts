/**
 * Reset passwords for all users in Appwrite
 * Sets a standard password for login testing
 */

import { Client, Users } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const users = new Users(client);

// Standard password for all test accounts
const STANDARD_PASSWORD = 'Test123!@#';

async function resetPasswords() {
  try {
    console.log('🔄 Fetching all users...');
    const userList = await users.list();
    
    console.log(`\n📋 Found ${userList.total} users\n`);

    for (const user of userList.users) {
      try {
        console.log(`🔄 Updating password for: ${user.email}`);
        console.log(`   User ID: ${user.$id}`);
        console.log(`   Name: ${user.name}`);

        // Update password
        await users.updatePassword(user.$id, STANDARD_PASSWORD);

        // Verify email if not verified
        if (!user.emailVerification) {
          try {
            await users.updateEmailVerification(user.$id, true);
            console.log('   ✅ Email verification enabled');
          } catch (verifyError: any) {
            console.warn(`   ⚠️  Could not enable email verification: ${verifyError.message}`);
          }
        }

        console.log(`   ✅ Password updated to: ${STANDARD_PASSWORD}`);
        console.log('');
      } catch (error: any) {
        console.error(`   ❌ Failed to update password: ${error.message}\n`);
      }
    }

    console.log('\n🎉 Password reset completed!');
    console.log(`\n📝 Login bilgileri (Tüm hesaplar için aynı şifre):`);
    console.log(`   Password: ${STANDARD_PASSWORD}`);
    console.log(`\n📧 Mevcut hesaplar:`);
    userList.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
    });
    console.log(`\n🌐 Login: http://localhost:3000/login`);
  } catch (error: any) {
    console.error('❌ Failed to list users:', error.message);
    process.exit(1);
  }
}

resetPasswords();



