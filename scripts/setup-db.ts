import { Client, Databases, ID } from "node-appwrite";
import dotenv from "dotenv";
import path from "path";
import {
  COLLECTIONS,
  DB_ID,
  CollectionConfig,
  Attribute,
  Index,
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setupDatabase() {
  console.log("🚀 Starting Database Setup...");
  console.log(`📍 Database ID: ${DB_ID}`);

  // 1. Check Database
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

  // 2. Process Collections
  for (const col of COLLECTIONS) {
    console.log(`\n📦 Processing Collection: ${col.name} (${col.id})`);

    // Check/Create Collection
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
        ); // Doc security = false primarily
        console.log("   ✅ Created");
      } else {
        console.error(`   ❌ Error getting collection: ${error.message}`);
        continue;
      }
    }

    // Process Attributes
    console.log("   - Checking attributes...");
    const existingAttributes = await databases.listAttributes(DB_ID, col.id);
    const existingAttrKeys = existingAttributes.attributes.map(
      (a: any) => a.key,
    );

    for (const attr of col.attributes) {
      if (existingAttrKeys.includes(attr.key)) {
        // console.log(`     - Attribute ${attr.key} exists`);
        continue;
      }

      console.log(`     ➕ Creating attribute: ${attr.key} (${attr.type})`);
      try {
        switch (attr.type) {
          case "string":
            await databases.createStringAttribute(
              DB_ID,
              col.id,
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
              col.id,
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
              col.id,
              attr.key,
              attr.required,
              attr.default as boolean,
              attr.array,
            );
            break;
          case "double": // float in SDK often used as float/double
            await databases.createFloatAttribute(
              DB_ID,
              col.id,
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
              col.id,
              attr.key,
              attr.required,
              attr.default as string,
              attr.array,
            );
            break;
          case "url":
            await databases.createUrlAttribute(
              DB_ID,
              col.id,
              attr.key,
              attr.required,
              attr.default as string,
              attr.array,
            );
            break;
          case "ip":
            await databases.createIpAttribute(
              DB_ID,
              col.id,
              attr.key,
              attr.required,
              attr.default as string,
              attr.array,
            );
            break;
          case "datetime":
            await databases.createDatetimeAttribute(
              DB_ID,
              col.id,
              attr.key,
              attr.required,
              attr.default as string,
              attr.array,
            );
            break;
          case "enum":
            await databases.createEnumAttribute(
              DB_ID,
              col.id,
              attr.key,
              attr.elements || [],
              attr.required,
              attr.default as string,
              attr.array,
            );
            break;
        }
        // Wait a bit because attribute creation is async in Appwrite backend
        await sleep(500);
      } catch (error: any) {
        console.error(
          `     ❌ Error creating attribute ${attr.key}: ${error.message}`,
        );
      }
    }

    // Wait for attributes to be available (indexes require attributes to be 'available')
    // In a real robust script, we should poll attribute status.
    // For now, we will wait if we created any.

    // Process Indexes
    if (col.indexes && col.indexes.length > 0) {
      console.log("   - Checking indexes...");
      const existingIndexes = await databases.listIndexes(DB_ID, col.id);
      const existingIndexKeys = existingIndexes.indexes.map((i: any) => i.key);

      for (const idx of col.indexes) {
        if (existingIndexKeys.includes(idx.key)) {
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
          // Often fails if attributes aren't ready yet
          console.error(
            `     ❌ Error creating index ${idx.key}: ${error.message}`,
          );
          console.log(
            "        Note: Attributes might not be ready. Run script again later.",
          );
        }
      }
    }
  }

  console.log("\n🎉 Setup Complete!");
}

setupDatabase().catch(console.error);
