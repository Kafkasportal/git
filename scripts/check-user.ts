/**
 * Check if a user exists in Appwrite by email
 */

import { Client, Users, Query } from 'node-appwrite';
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

const EMAIL = process.argv[2] || 'isahamid095@gmail.com';

async function checkUser() {
  try {
    console.log(`🔍 Checking user: ${EMAIL}\n`);

    // Search for user by email in Appwrite Auth
    const usersList = await users.list([Query.equal('email', EMAIL.toLowerCase()), Query.limit(1)]);

    if (usersList.users && usersList.users.length > 0) {
      const user = usersList.users[0];
      console.log('✅ User found in Appwrite Auth!');
      console.log(`   User ID: ${user.$id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Status: ${user.status ? 'Active' : 'Disabled'}`);
      console.log(`   Email Verified: ${user.emailVerification ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(user.$createdAt).toLocaleString('tr-TR')}`);
      
      if (user.prefs) {
        console.log(`   Role: ${user.prefs.role || 'N/A'}`);
        if (user.prefs.permissions) {
          const perms = typeof user.prefs.permissions === 'string' 
            ? JSON.parse(user.prefs.permissions) 
            : user.prefs.permissions;
          console.log(`   Permissions: ${Array.isArray(perms) ? perms.length : 0} permission(s)`);
        }
      }

      console.log('\n📝 Login Information:');
      console.log(`   Email: ${EMAIL}`);
      console.log(`   Password: [Your Appwrite password]`);
      console.log('\n💡 To use with MCP, set in .env.local:');
      console.log(`   MCP_TEST_EMAIL=${EMAIL}`);
      console.log(`   MCP_TEST_PASSWORD=your-password-here`);
    } else {
      console.log('❌ User not found in Appwrite Auth');
      console.log('\n💡 To create this user, you can:');
      console.log('   1. Use Appwrite Console to create the user');
      console.log('   2. Or modify scripts/create-test-user.ts with this email');
      console.log('   3. Or use the Appwrite Users API directly');
    }
  } catch (error: any) {
    console.error('❌ Error checking user:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

checkUser();

