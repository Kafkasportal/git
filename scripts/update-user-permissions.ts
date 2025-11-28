#!/usr/bin/env tsx
/**
 * Script to update user permissions in the users collection
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { Client, Databases, Query } from "node-appwrite";
import { appwriteConfig } from "../src/lib/appwrite/config";
import {
  loadAppwriteConfig,
  validateConfig,
  showSetupInstructions,
} from "./lib/mcp-config";

async function updateUserPermissions() {
  try {
    // MCP veya environment'tan yapılandırmayı yükle
    const mcpConfig = loadAppwriteConfig();
    const { valid, missing } = validateConfig(mcpConfig);

    if (!valid) {
      console.error("❌ Eksik yapılandırma değerleri:", missing.join(", "));
      showSetupInstructions();
      process.exit(1);
    }

    const { endpoint, projectId, databaseId, apiKey } = mcpConfig;

    // Initialize Appwrite client
    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

    const databases = new Databases(client);

    const email = "admin@test.com";

    // Get all permissions
    const allPermissions = [
      "beneficiaries:access",
      "donations:access",
      "aid_applications:access",
      "scholarships:access",
      "messages:access",
      "finance:access",
      "reports:access",
      "settings:access",
      "workflow:access",
      "partners:access",
      "users:manage",
      "settings:manage",
      "audit:view",
    ];

    // Find user by email
    console.log("🔍 Searching for user:", email);
    const response = await databases.listDocuments(
      databaseId,
      appwriteConfig.collections.users,
      [Query.equal("email", email.toLowerCase()), Query.limit(1)],
    );

    if (response.documents.length === 0) {
      throw new Error(`User with email ${email} not found`);
    }

    const user = response.documents[0];
    console.log("✅ User found:", user.$id);

    // Update user permissions
    console.log("🔄 Updating permissions...");
    const updated = await databases.updateDocument(
      databaseId,
      appwriteConfig.collections.users,
      user.$id,
      {
        permissions: allPermissions,
      },
    );

    console.log("✅ User permissions updated successfully:");
    console.log({
      id: updated.$id,
      email: updated.email,
      permissions: updated.permissions,
    });
    console.log(
      "\n✅ All permissions granted! Sidebar should now show all modules.",
    );
  } catch (error) {
    console.error("❌ Error updating user:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

updateUserPermissions();
