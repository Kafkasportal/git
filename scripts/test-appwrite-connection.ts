/**
 * Appwrite Database Connection Test Script
 * Tests Appwrite connection and fetches database information
 */

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';

console.log('🔍 Appwrite Bağlantı Testi Başlatılıyor...\n');

// Configuration check
console.log('📋 Yapılandırma Kontrolü:');
console.log(`  Endpoint: ${endpoint ? '✅ ' + endpoint : '❌ Eksik'}`);
console.log(`  Project ID: ${projectId ? '✅ ' + projectId : '❌ Eksik'}`);
console.log(`  Database ID: ${databaseId ? '✅ ' + databaseId : '❌ Eksik'}`);
console.log(`  API Key: ${apiKey ? '✅ [SET]' : '❌ Eksik'}\n`);

if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error('❌ Eksik yapılandırma değişkenleri! Lütfen .env.local dosyasını kontrol edin.');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function testConnection() {
  try {
    console.log('🔌 Appwrite Bağlantısı Test Ediliyor...\n');

    // Test 1: List databases
    console.log('📊 Test 1: Veritabanları Listeleniyor...');
    try {
      const dbList = await databases.list();
      console.log(`  ✅ Başarılı! ${dbList.databases.length} veritabanı bulundu:`);
      dbList.databases.forEach((db) => {
        console.log(`     - ${db.name} (ID: ${db.$id})`);
      });
    } catch (error) {
      console.error(`  ❌ Hata: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    // Test 2: Get database info
    console.log('\n📊 Test 2: Veritabanı Bilgileri Alınıyor...');
    try {
      const dbInfo = await databases.get(databaseId);
      console.log(`  ✅ Başarılı! Veritabanı: ${dbInfo.name} (ID: ${dbInfo.$id})`);
    } catch (error) {
      console.error(`  ❌ Hata: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    // Test 3: List collections
    console.log('\n📊 Test 3: Collections Listeleniyor...');
    try {
      const collections = await databases.listCollections(databaseId);
      console.log(`  ✅ Başarılı! ${collections.collections.length} collection bulundu:`);
      collections.collections.forEach((col) => {
        console.log(`     - ${col.name} (ID: ${col.$id})`);
        console.log(`       Attributes: ${col.attributes.length}, Indexes: ${col.indexes.length}`);
      });
    } catch (error) {
      console.error(`  ❌ Hata: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    // Test 4: Sample data fetch from common collections
    console.log('\n📊 Test 4: Örnek Veriler Çekiliyor...');
    const testCollections = ['beneficiaries', 'users', 'donations', 'todos'];
    
    for (const collectionName of testCollections) {
      try {
        const response = await databases.listDocuments(databaseId, collectionName, []);
        console.log(`  ✅ ${collectionName}: ${response.total} doküman bulundu`);
        if (response.documents.length > 0) {
          console.log(`     İlk doküman örneği:`, JSON.stringify(response.documents[0], null, 2).substring(0, 200) + '...');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          console.log(`  ⚠️  ${collectionName}: Collection bulunamadı (normal olabilir)`);
        } else {
          console.error(`  ❌ ${collectionName}: ${errorMsg}`);
        }
      }
    }

    console.log('\n✅ Tüm testler başarıyla tamamlandı!');
    console.log('\n📝 Özet:');
    console.log('  - Appwrite bağlantısı: ✅ Çalışıyor');
    console.log('  - Veritabanı erişimi: ✅ Başarılı');
    console.log('  - Yapılandırma: ✅ Doğru');

  } catch (error) {
    console.error('\n❌ Test başarısız oldu!');
    console.error('Hata detayları:', error);
    process.exit(1);
  }
}

// Run tests
testConnection().catch((error) => {
  console.error('Kritik hata:', error);
  process.exit(1);
});

