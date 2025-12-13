/**
 * Set user permissions and role in Appwrite
 * Adds beneficiaries:access permission to user
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
const ROLE = process.argv[3] || 'Personel'; // Default role
const PERMISSIONS = [
  'beneficiaries:access',
  'donations:access',
  'aid_applications:access',
  'scholarships:access',
  'messages:access',
  'finance:access',
  'reports:access',
  'settings:access',
  'workflow:access',
  'partners:access',
];

async function setUserPermissions() {
  try {
    console.log(`🔍 Searching for user: ${EMAIL}\n`);

    // Search for user by email
    const usersList = await users.list([Query.equal('email', EMAIL.toLowerCase()), Query.limit(1)]);

    if (!usersList.users || usersList.users.length === 0) {
      console.error('❌ User not found');
      process.exit(1);
    }

    const user = usersList.users[0];
    console.log('✅ User found!');
    console.log(`   User ID: ${user.$id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Current Role: ${(user.prefs as any)?.role || 'N/A'}`);
    console.log(`   Current Permissions: ${JSON.stringify((user.prefs as any)?.permissions || [])}\n`);

    // Get current preferences
    const currentPrefs = (user.prefs || {}) as Record<string, unknown>;
    
    // Update preferences with role and permissions
    const newPrefs = {
      ...currentPrefs,
      role: ROLE,
      permissions: JSON.stringify(PERMISSIONS),
    };

    console.log('🔄 Updating user permissions...');
    console.log(`   New Role: ${ROLE}`);
    console.log(`   New Permissions: ${PERMISSIONS.join(', ')}\n`);

    await users.updatePrefs(user.$id, newPrefs);

    console.log('✅ User permissions updated successfully!\n');

    // Verify update
    const updatedUser = await users.get(user.$id);
    console.log('📋 Updated User Info:');
    console.log(`   Role: ${(updatedUser.prefs as any)?.role || 'N/A'}`);
    const updatedPerms = (updatedUser.prefs as any)?.permissions;
    if (typeof updatedPerms === 'string') {
      try {
        const parsed = JSON.parse(updatedPerms);
        console.log(`   Permissions: ${Array.isArray(parsed) ? parsed.join(', ') : updatedPerms}`);
      } catch {
        console.log(`   Permissions: ${updatedPerms}`);
      }
    } else {
      console.log(`   Permissions: ${JSON.stringify(updatedPerms || [])}`);
    }

    console.log('\n🎉 Done! User can now access beneficiaries module.');
  } catch (error: any) {
    console.error('❌ Error updating user permissions:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

setUserPermissions();

