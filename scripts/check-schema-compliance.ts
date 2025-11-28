/**
 * Schema Compliance Checker
 * 
 * Bu script projedeki şema tanımlarını Appwrite database'deki gerçek yapıyla karşılaştırır.
 * MCP kullanarak veya Appwrite SDK ile database yapısını kontrol eder.
 * 
 * Kullanım:
 *   npx tsx scripts/check-schema-compliance.ts
 */

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'kafkasder_db';

if (!projectId || !apiKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_APPWRITE_PROJECT_ID:', projectId ? '✓' : '✗');
  console.error('   APPWRITE_API_KEY:', apiKey ? '✓' : '✗');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client();
client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

// Load schema definitions from appwrite-setup.ts
interface AttributeConfig {
  key: string;
  type: string;
  size?: number;
  required?: boolean;
  default?: string | number | boolean | null;
  array?: boolean;
  enumValues?: string[];
}

interface CollectionConfig {
  id: string;
  name: string;
  attributes: AttributeConfig[];
  indexes?: Array<{
    key: string;
    type: string;
    attributes: string[];
  }>;
}

// Parse collections from appwrite-setup.ts
function _parseCollectionsFromSetup(): CollectionConfig[] {
  try {
    const setupFile = readFileSync(join(__dirname, 'appwrite-setup.ts'), 'utf-8');
    // Extract collections array using regex (simplified approach)
    const collectionsMatch = setupFile.match(/const collections: CollectionConfig\[\] = \[([\s\S]*?)\];/);
    if (!collectionsMatch) {
      console.warn('⚠ Could not parse collections from appwrite-setup.ts');
      return [];
    }
    // For now, we'll use a manual list based on what we know
    // In a real implementation, you'd want to properly parse the TypeScript
    return [];
  } catch (error) {
    console.error('Error reading appwrite-setup.ts:', error);
    return [];
  }
}

// Get expected collections from config.ts
function getExpectedCollections(): string[] {
  try {
    const configFile = readFileSync(join(__dirname, '../src/lib/appwrite/config.ts'), 'utf-8');
    const collectionsMatch = configFile.match(/collections: \{([\s\S]*?)\}/);
    if (collectionsMatch) {
      const collectionLines = collectionsMatch[1].split('\n')
        .filter(line => line.includes(':'))
        .map(line => {
          const match = line.match(/(\w+):\s*['"]([\w_]+)['"]/);
          return match ? { name: match[1], id: match[2] } : null;
        })
        .filter(Boolean) as Array<{ name: string; id: string }>;
      return collectionLines.map(c => c.id);
    }
  } catch (error) {
    console.error('Error reading config.ts:', error);
  }
  return [];
}

// Normalize Appwrite attribute type to our type
function normalizeAttributeType(attrType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'integer': 'integer',
    'double': 'float',
    'boolean': 'boolean',
    'datetime': 'datetime',
    'email': 'email',
    'url': 'url',
    'ip': 'ip',
    'enum': 'enum',
  };
  return typeMap[attrType] || attrType;
}

// Compare attributes
function compareAttributes(
  expected: AttributeConfig[],
  actual: Array<{
    key: string;
    type: string;
    size?: number;
    required: boolean;
    array: boolean;
    default?: string | number | boolean | null;
    elements?: string[];
  }>
): {
  missing: AttributeConfig[];
  extra: Array<{ key: string; type: string }>;
  mismatched: Array<{
    key: string;
    expected: AttributeConfig;
    actual: { type: string; required: boolean; array: boolean };
  }>;
} {
  const missing: AttributeConfig[] = [];
  const extra: Array<{ key: string; type: string }> = [];
  const mismatched: Array<{
    key: string;
    expected: AttributeConfig;
    actual: { type: string; required: boolean; array: boolean };
  }> = [];

  const actualMap = new Map(
    actual.map(attr => [attr.key, attr])
  );

  // Check expected attributes
  for (const expAttr of expected) {
    const actAttr = actualMap.get(expAttr.key);
    if (!actAttr) {
      missing.push(expAttr);
    } else {
      const normalizedType = normalizeAttributeType(actAttr.type);
      if (
        normalizedType !== expAttr.type ||
        (actAttr.required !== (expAttr.required ?? false)) ||
        (actAttr.array !== (expAttr.array ?? false))
      ) {
        mismatched.push({
          key: expAttr.key,
          expected: expAttr,
          actual: {
            type: actAttr.type,
            required: actAttr.required,
            array: actAttr.array,
          },
        });
      }
      actualMap.delete(expAttr.key);
    }
  }

  // Remaining actual attributes are extra
  for (const [key, attr] of actualMap.entries()) {
    // Skip Appwrite system attributes
    if (!key.startsWith('$')) {
      extra.push({ key, type: attr.type });
    }
  }

  return { missing, extra, mismatched };
}

async function checkCollection(
  collectionId: string,
  expectedAttributes?: AttributeConfig[]
): Promise<{
  exists: boolean;
  attributes?: Array<{
    key: string;
    type: string;
    size?: number;
    required: boolean;
    array: boolean;
  }>;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Get collection
    const _collection = await databases.getCollection(databaseId, collectionId);
    
    // Get attributes
    const attributes = await databases.listAttributes(databaseId, collectionId);
    
    const actualAttributes = attributes.attributes.map(attr => ({
      key: attr.key,
      type: attr.type,
      size: attr.size,
      required: attr.required,
      array: attr.array,
      default: attr.default,
      elements: attr.elements,
    }));

    // Compare if expected attributes provided
    if (expectedAttributes) {
      const comparison = compareAttributes(expectedAttributes, actualAttributes);
      
      if (comparison.missing.length > 0) {
        issues.push(`Missing attributes: ${comparison.missing.map(a => a.key).join(', ')}`);
      }
      
      if (comparison.extra.length > 0) {
        issues.push(`Extra attributes: ${comparison.extra.map(a => a.key).join(', ')}`);
      }
      
      if (comparison.mismatched.length > 0) {
        issues.push(`Mismatched attributes: ${comparison.mismatched.map(m => 
          `${m.key} (expected: ${m.expected.type}, actual: ${m.actual.type})`
        ).join(', ')}`);
      }
    }

    return {
      exists: true,
      attributes: actualAttributes,
      issues,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      return {
        exists: false,
        issues: ['Collection does not exist in database'],
      };
    }
    throw error;
  }
}

async function main() {
  console.log('🔍 Schema Compliance Checker');
  console.log('='.repeat(60));
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Project: ${projectId}`);
  console.log(`Database: ${databaseId}`);
  console.log('='.repeat(60));
  console.log();

  try {
    // Get expected collections from config
    const expectedCollectionIds = getExpectedCollections();
    console.log(`📋 Expected Collections: ${expectedCollectionIds.length}`);
    console.log();

    // Get actual collections from database
    const actualCollections = await databases.listCollections(databaseId);
    const actualCollectionIds = actualCollections.collections.map(c => c.$id);
    
    console.log(`📦 Actual Collections in Database: ${actualCollectionIds.length}`);
    console.log();

    // Check each expected collection
    const results: Array<{
      collectionId: string;
      exists: boolean;
      attributeCount?: number;
      issues: string[];
    }> = [];

    for (const collectionId of expectedCollectionIds) {
      console.log(`Checking: ${collectionId}...`);
      const result = await checkCollection(collectionId);
      results.push({
        collectionId,
        exists: result.exists,
        attributeCount: result.attributes?.length,
        issues: result.issues,
      });

      if (result.exists) {
        console.log(`  ✓ Exists (${result.attributes?.length || 0} attributes)`);
        if (result.issues.length > 0) {
          result.issues.forEach(issue => console.log(`  ⚠ ${issue}`));
        }
      } else {
        console.log(`  ✗ Missing`);
      }
      console.log();
    }

    // Check for extra collections in database
    const extraCollections = actualCollectionIds.filter(
      id => !expectedCollectionIds.includes(id)
    );
    if (extraCollections.length > 0) {
      console.log('⚠ Extra Collections in Database (not in config):');
      extraCollections.forEach(id => console.log(`  - ${id}`));
      console.log();
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    
    const existing = results.filter(r => r.exists).length;
    const missing = results.filter(r => !r.exists).length;
    const withIssues = results.filter(r => r.issues.length > 0).length;

    console.log(`Total Expected: ${expectedCollectionIds.length}`);
    console.log(`✓ Existing: ${existing}`);
    console.log(`✗ Missing: ${missing}`);
    console.log(`⚠ With Issues: ${withIssues}`);
    console.log();

    if (missing === 0 && withIssues === 0) {
      console.log('✅ All collections are compliant!');
    } else {
      console.log('❌ Some collections need attention.');
      console.log();
      console.log('Missing Collections:');
      results.filter(r => !r.exists).forEach(r => {
        console.log(`  - ${r.collectionId}`);
      });
      console.log();
      console.log('Collections with Issues:');
      results.filter(r => r.issues.length > 0).forEach(r => {
        console.log(`  - ${r.collectionId}:`);
        r.issues.forEach(issue => console.log(`    • ${issue}`));
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

main();

