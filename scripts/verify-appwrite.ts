import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const projectEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectEndpoint || !projectId || !apiKey) {
  console.error("❌ Missing environment variables!");
  console.error("Endpoint:", projectEndpoint);
  console.error("Project ID:", projectId);
  console.error("API Key:", apiKey ? "***" : "Missing");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(projectEndpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function verifyConnection() {
  try {
    console.log("🔄 Connecting to Appwrite...");
    console.log(`📍 Endpoint: ${projectEndpoint}`);
    console.log(`🆔 Project ID: ${projectId}`);

    // Try to list databases to verify connection and permissions
    const dbs = await databases.list();

    console.log("✅ Connection Successful!");
    console.log(`📚 Found ${dbs.total} database(s)`);
    dbs.databases.forEach((db) => {
      console.log(`   - ${db.name} (ID: ${db.$id})`);
    });
  } catch (error: any) {
    console.error("❌ Connection Failed:", error.message);
    if (error.code === 401) {
      console.error("   Hint: Check your API Key permissions and validity.");
    }
    process.exit(1);
  }
}

verifyConnection();
