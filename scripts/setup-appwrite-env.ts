/**
 * Appwrite Environment Setup Script
 * 
 * Bu script .env.local dosyasını Appwrite yapılandırması ile günceller.
 * Global MCP ayarlarından veya manuel olarak değerleri alır.
 * 
 * Kullanım:
 *   npx tsx scripts/setup-appwrite-env.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Global MCP dosyasından alınan değerler
const APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '69221f39000c1aa90fd6',
  apiKey: 'standard_af9d5a2e7a40ac304118ab6ed3dff44dbeb0889f12ef7fd75d1800c91318012b8ecca90eb216b2fa2df8c7b21bd5936f1124e917878dfc1490fe7172a627d74abf39b5c7c441f9a682fc51be49a7cc36dd063ffc29ed23705b8ed5975433cba679c4d338497522e55d91e2984cd4057383c931ae539631faada99cc1b4e1f821',
  databaseId: 'kafkasder_db', // Varsayılan, değiştirilebilir
};

const envLocalPath = join(process.cwd(), '.env.local');

function updateEnvFile() {
  let envContent = '';
  
  // Mevcut .env.local dosyasını oku
  if (existsSync(envLocalPath)) {
    envContent = readFileSync(envLocalPath, 'utf-8');
    console.log('✓ Mevcut .env.local dosyası okundu');
  } else {
    console.log('⚠ .env.local dosyası bulunamadı, yeni dosya oluşturuluyor...');
  }

  // Appwrite değişkenlerini güncelle veya ekle
  const appwriteVars = {
    'NEXT_PUBLIC_APPWRITE_ENDPOINT': APPWRITE_CONFIG.endpoint,
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID': APPWRITE_CONFIG.projectId,
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID': APPWRITE_CONFIG.databaseId,
    'APPWRITE_API_KEY': APPWRITE_CONFIG.apiKey,
    'NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS': 'documents',
    'NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS': 'avatars',
    'NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS': 'receipts',
    'NEXT_PUBLIC_BACKEND_PROVIDER': 'appwrite',
  };

  // Her değişken için güncelleme yap
  let updated = false;
  for (const [key, value] of Object.entries(appwriteVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      // Mevcut değeri güncelle
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✓ ${key} güncellendi`);
      updated = true;
    } else {
      // Yeni değişken ekle
      if (!envContent.endsWith('\n') && envContent.length > 0) {
        envContent += '\n';
      }
      envContent += `${key}=${value}\n`;
      console.log(`✓ ${key} eklendi`);
      updated = true;
    }
  }

  // Dosyayı kaydet
  if (updated) {
    writeFileSync(envLocalPath, envContent, 'utf-8');
    console.log('\n✅ .env.local dosyası başarıyla güncellendi!');
    console.log('\n📋 Güncellenen değişkenler:');
    Object.keys(appwriteVars).forEach(key => {
      console.log(`   - ${key}`);
    });
  } else {
    console.log('ℹ Tüm değişkenler zaten güncel');
  }
}

function main() {
  console.log('🔧 Appwrite Environment Setup');
  console.log('='.repeat(50));
  console.log(`Endpoint: ${APPWRITE_CONFIG.endpoint}`);
  console.log(`Project ID: ${APPWRITE_CONFIG.projectId}`);
  console.log(`Database ID: ${APPWRITE_CONFIG.databaseId}`);
  console.log('='.repeat(50));
  console.log();

  try {
    updateEnvFile();
    console.log('\n✅ Setup tamamlandı!');
    console.log('\n⚠ ÖNEMLİ: .env.local dosyası .gitignore\'da, güvenlidir.');
    console.log('   Ancak API key\'i asla commit etmeyin!');
  } catch (error) {
    console.error('\n❌ Hata:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

main();

