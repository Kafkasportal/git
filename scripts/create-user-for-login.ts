#!/usr/bin/env tsx
/**
 * Script to create a user in the users collection for login testing
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });
import { Client, Databases } from 'node-appwrite';
import { hashPassword } from '../src/lib/auth/password';
import { appwriteConfig } from '../src/lib/appwrite/config';

async function createUser() {
  try {
    console.log('🔧 Appwrite Config:');
    console.log({
      endpoint: appwriteConfig.endpoint,
      projectId: appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 8)}...` : '[missing]',
      databaseId: appwriteConfig.databaseId ? `${appwriteConfig.databaseId.substring(0, 8)}...` : '[missing]',
      apiKey: appwriteConfig.apiKey ? '[set]' : '[missing]',
      usersCollection: appwriteConfig.collections.users,
    });

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setKey(appwriteConfig.apiKey!);

    const databases = new Databases(client);

    const email = 'mcp-login@example.com';
    const password = 'SecurePass123!';
    const name = 'MCP Login User';

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create user in users collection
    const user = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.users,
      'unique()', // Auto-generate ID
      {
        name,
        email,
        role: 'Personel',
        permissions: [],
        passwordHash,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    );

    console.log('✅ User created successfully in users collection:');
    console.log({
      id: user.$id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    console.log('\n📝 Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createUser();

