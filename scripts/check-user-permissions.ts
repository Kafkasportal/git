#!/usr/bin/env tsx
/**
 * Script to check user permissions
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { Client, Databases, Query } from 'node-appwrite';

async function checkUserPermissions() {
  try {
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

    const client = new Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);

    const email = 'admin@test.com';

    const response = await databases.listDocuments(
      databaseId,
      'users',
      [Query.equal('email', email.toLowerCase()), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      const user = response.documents[0];
      console.log('✅ Kullanıcı bulundu:');
      console.log({
        id: user.$id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        permissionsCount: Array.isArray(user.permissions) ? user.permissions.length : 0,
        hasWildcard: Array.isArray(user.permissions) && user.permissions.includes('*'),
      });
    } else {
      console.log('❌ Kullanıcı bulunamadı');
    }
  } catch (error) {
    console.error('❌ Hata:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

checkUserPermissions();

