#!/usr/bin/env tsx
/**
 * Script to create a user in the users collection for login testing
 * This creates a user in the Appwrite users collection (not Appwrite Auth)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { Client, Databases, ID, Query } from 'node-appwrite';
import { hashPassword } from '../src/lib/auth/password';

async function createUserInCollection() {
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
    const usersCollection = 'users';

    console.log('🔧 Appwrite Config:');
    console.log({
      endpoint,
      projectId: projectId ? `${projectId.substring(0, 8)}...` : '[missing]',
      databaseId: databaseId || '[missing]',
      apiKey: apiKey ? '[set]' : '[missing]',
      usersCollection,
    });

    if (!apiKey || !projectId || !databaseId) {
      throw new Error('Appwrite configuration is missing. Please check .env.local file or provide values.');
    }

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);

    const email = 'admin@test.com';
    const password = 'Admin123!@#';
    const name = 'Test Admin User';

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Try to create database if it doesn't exist
    try {
      await databases.get(databaseId);
      console.log('✅ Database found:', databaseId);
    } catch (_error) {
      console.log('⚠️  Database not found, attempting to create...');
      try {
        await databases.create(databaseId, 'Kafkasder Panel Database');
        console.log('✅ Database created:', databaseId);
      } catch (createError) {
        console.error('❌ Failed to create database:', createError);
        throw new Error(`Database ${databaseId} not found and could not be created. Please create it manually in Appwrite Console.`);
      }
    }

    // Get all permissions from types
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

    // Check if user already exists
    const existingUsers = await databases.listDocuments(
      databaseId,
      usersCollection,
      [Query.equal('email', email.toLowerCase()), Query.limit(1)]
    );

    let user;
    if (existingUsers.total > 0) {
      // User exists, update it
      user = existingUsers.documents[0];
      console.log('⚠️  User already exists, updating permissions...');
      
      user = await databases.updateDocument(
        databaseId,
        usersCollection,
        user.$id,
        {
          permissions: allPermissions,
          isActive: true,
        }
      );

      console.log('✅ User permissions updated successfully:');
    } else {
      // Create new user
      user = await databases.createDocument(
        databaseId,
        usersCollection,
        ID.unique(),
        {
          name,
          email: email.toLowerCase(),
          role: 'Yönetici',
          permissions: allPermissions,
          passwordHash,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      );

      console.log('✅ User created successfully in users collection:');
    }

    console.log({
      id: user.$id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    });

    console.log('\n📝 Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n✅ User is ready for login!');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

createUserInCollection();
