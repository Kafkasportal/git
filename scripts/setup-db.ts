import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";
import path from "node:path";
import {
  COLLECTIONS,
  DB_ID,
} from "../src/lib/appwrite/schema";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const sleep = (ms: number) => new Promise((resolve) => {setTimeout(resolve, ms)});

async function ensureDatabaseExists() {
  try {
    await databases.get(DB_ID);
    console.log("✅ Database exists");
  } catch (error: any) {
    if (error.code === 404) {
      console.log("creating database...");
      await databases.create(DB_ID, DB_ID, true);
      console.log("✅ Database created");
    } else {
      throw error;
    }
  }
}

async function ensureCollectionExists(col: any) {
  try {
    await databases.getCollection(DB_ID, col.id);
    console.log("   - Exists");
  } catch (error: any) {
    if (error.code === 404) {
      console.log("   - Creating...");
      await databases.createCollection(
        DB_ID,
        col.id,
        col.name,
        col.permissions,
        false,
        true,
      );
      console.log("   ✅ Created");
    } else {
      console.error(`   ❌ Error getting collection: ${error.message}`);
      throw error;
    }
  }
}

async function createAttributeByType(attr: any, collectionId: string) {
  switch (attr.type) {
    case "string":
      await databases.createStringAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.size || 128,
        attr.required,
        attr.default,
        attr.array,
      );
      break;
    case "integer":
      await databases.createIntegerAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        undefined,
        undefined,
        attr.default as number,
        attr.array,
      );
      break;
    case "boolean":
      await databases.createBooleanAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default as boolean,
        attr.array,
      );
      break;
    case "double":
      await databases.createFloatAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        undefined,
        undefined,
        attr.default as number,
        attr.array,
      );
      break;
    case "email":
      await databases.createEmailAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default as string,
        attr.array,
      );
      break;
    case "url":
      await databases.createUrlAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default as string,
        attr.array,
      );
      break;
    case "ip":
      await databases.createIpAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default as string,
        attr.array,
      );
      break;
    case "datetime":
      await databases.createDatetimeAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default as string,
        attr.array,
      );
      break;
    case "enum":
      await databases.createEnumAttribute(
        DB_ID,
        collectionId,
        attr.key,
        attr.elements || [],
        attr.required,
        attr.default as string,
        attr.array,
      );
      break;
  }
}

async function processAttributes(col: any) {
  console.log("   - Checking attributes...");
  const existingAttributes = await databases.listAttributes(DB_ID, col.id);
  const existingAttrKeys = new Set(
    existingAttributes.attributes.map((a: any) => a.key),
  );

  for (const attr of col.attributes) {
    if (existingAttrKeys.has(attr.key)) {
      continue;
    }

    console.log(`     ➕ Creating attribute: ${attr.key} (${attr.type})`);
    try {
      await createAttributeByType(attr, col.id);
      await sleep(500);
    } catch (error: any) {
      console.error(
        `     ❌ Error creating attribute ${attr.key}: ${error.message}`,
      );
    }
  }
}

async function processIndexes(col: any) {
  if (!col.indexes || col.indexes.length === 0) {
    return;
  }

  console.log("   - Checking indexes...");
  const existingIndexes = await databases.listIndexes(DB_ID, col.id);
  const existingIndexKeys = new Set(
    existingIndexes.indexes.map((i: any) => i.key),
  );

  for (const idx of col.indexes) {
    if (existingIndexKeys.has(idx.key)) {
      continue;
    }
    console.log(`     ➕ Creating index: ${idx.key}`);
    try {
      await databases.createIndex(
        DB_ID,
        col.id,
        idx.key,
        idx.type,
        idx.attributes,
        idx.orders,
      );
      await sleep(1000);
    } catch (error: any) {
      console.error(
        `     ❌ Error creating index ${idx.key}: ${error.message}`,
      );
      console.log(
        "        Note: Attributes might not be ready. Run script again later.",
      );
    }
  }
}

async function processCollection(col: any) {
  console.log(`\n📦 Processing Collection: ${col.name} (${col.id})`);

  try {
    await ensureCollectionExists(col);
    await processAttributes(col);
    await processIndexes(col);
  } catch (error: any) {
    console.error(`   ❌ Error processing collection: ${error.message}`);
  }
}

async function setupDatabase() {
  console.log("🚀 Starting Database Setup...");
  console.log(`📍 Database ID: ${DB_ID}`);

  await ensureDatabaseExists();

  for (const col of COLLECTIONS) {
    await processCollection(col);
  }

  console.log("\n🎉 Setup Complete!");
}

await setupDatabase();
