#!/usr/bin/env tsx
/**
 * Script to create a user in the users collection for login testing
 */

import { Client, Databases } from "node-appwrite";
import { hashPassword } from "../src/lib/auth/password";
import { loadAppwriteConfig, loadTestCredentials } from "./lib/mcp-config";

async function createUser() {
  try {
    // MCP config'den Appwrite ayarlarını yükle
    const appwriteConfig = loadAppwriteConfig();

    console.log("🔧 Appwrite Config:");
    console.log({
      endpoint: appwriteConfig.endpoint,
      projectId: appwriteConfig.projectId
        ? `${appwriteConfig.projectId.substring(0, 8)}...`
        : "[missing]",
      databaseId: appwriteConfig.databaseId
        ? `${appwriteConfig.databaseId.substring(0, 8)}...`
        : "[missing]",
      apiKey: appwriteConfig.apiKey ? "[set]" : "[missing]",
    });

    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setKey(appwriteConfig.apiKey);

    const databases = new Databases(client);

    // MCP config'den test credential'larını yükle
    const { email, password, name } = loadTestCredentials();

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create user in users collection
    const user = await databases.createDocument(
      appwriteConfig.databaseId,
      "users", // users collection ID
      "unique()", // Auto-generate ID
      {
        name,
        email,
        role: "Personel",
        permissions: [],
        passwordHash,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    );

    console.log("✅ User created successfully in users collection:");
    console.log({
      id: user.$id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    console.log("\n📝 Login credentials:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  }
}

createUser();
