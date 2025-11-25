#!/usr/bin/env tsx
/**
 * Script to update user permissions in the users collection
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { Client, Databases, Query } from 'node-appwrite';
import { appwriteConfig } from '../src/lib/appwrite/config';

async function updateUserPermissions() {
  try {
    // Try to get from env first, then fallback to MCP values
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 
                     process.env.APPWRITE_ENDPOINT || 
                     'https://fra.cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 
                      process.env.APPWRITE_PROJECT_ID || 
                      '69221f39000c1aa90fd6';
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 
                       process.env.APPWRITE_DATABASE_ID || 
                       'kafkasder_db';
    const apiKey = process.env.APPWRITE_API_KEY || 
                   'standard_af9d5a2e7a40ac304118ab6ed3dff44dbeb0889f12ef7fd75d1800c91318012b8ecca90eb216b2fa2df8c7b21bd5936f1124e917878dfc1490fe7172a627d74abf39b5c7c441f9a682fc51be49a7cc36dd063ffc29ed23705b8ed5975433cba679c4d338497522e55d91e2984cd4057383c931ae539631faada99cc1b4e1f821';

    if (!apiKey || !projectId || !databaseId) {
      throw new Error('Appwrite configuration is missing.');
    }

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);

    const email = 'admin@test.com';

    // Get all permissions
    const allPermissions = [
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
      'users:manage',
      'settings:manage',
      'audit:view',
    ];

    // Find user by email
    console.log('🔍 Searching for user:', email);
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.collections.users,
      [Query.equal('email', email.toLowerCase()), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      throw new Error(`User with email ${email} not found`);
    }

    const user = response.documents[0];
    console.log('✅ User found:', user.$id);

    // Update user permissions
    console.log('🔄 Updating permissions...');
    const updated = await databases.updateDocument(
      databaseId,
      appwriteConfig.collections.users,
      user.$id,
      {
        permissions: allPermissions,
      }
    );

    console.log('✅ User permissions updated successfully:');
    console.log({
      id: updated.$id,
      email: updated.email,
      permissions: updated.permissions,
    });
    console.log('\n✅ All permissions granted! Sidebar should now show all modules.');
  } catch (error) {
    console.error('❌ Error updating user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

updateUserPermissions();

