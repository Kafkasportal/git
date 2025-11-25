#!/usr/bin/env tsx
/**
 * Appwrite Cloud Bilgilerini Alma Script'i
 * 
 * Bu script Appwrite Cloud Console'dan bilgileri almak için rehberlik eder.
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🚀 Appwrite Cloud Bilgilerini Alma\n');
  console.log('Bu script, Appwrite Cloud Console\'dan bilgileri almanıza yardımcı olur.\n');
  
  console.log('📋 Adımlar:');
  console.log('1. https://cloud.appwrite.io/console adresine gidin');
  console.log('2. Giriş yapın (yoksa hesap oluşturun)');
  console.log('3. Proje seçin veya yeni proje oluşturun\n');
  
  const projectId = await question('📌 Project ID (Settings > General > Project ID): ');
  const apiKey = await question('🔑 API Key (Settings > API Keys > Create API Key): ');
  const databaseId = await question('💾 Database ID (varsa, yoksa "kafkasder_db" yazın): ') || 'kafkasder_db';
  const endpoint = await question('🌐 Endpoint (varsayılan: https://cloud.appwrite.io/v1): ') || 'https://cloud.appwrite.io/v1';
  
  // .env.local dosyasını güncelle
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  } else {
    // .env.example'dan kopyala
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf-8');
    }
  }
  
  // Değerleri güncelle
  envContent = envContent.replace(
    /NEXT_PUBLIC_BACKEND_PROVIDER=.*/,
    'NEXT_PUBLIC_BACKEND_PROVIDER=appwrite'
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_APPWRITE_ENDPOINT=.*/,
    `NEXT_PUBLIC_APPWRITE_ENDPOINT=${endpoint}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_APPWRITE_PROJECT_ID=.*/,
    `NEXT_PUBLIC_APPWRITE_PROJECT_ID=${projectId}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_APPWRITE_DATABASE_ID=.*/,
    `NEXT_PUBLIC_APPWRITE_DATABASE_ID=${databaseId}`
  );
  envContent = envContent.replace(
    /APPWRITE_API_KEY=.*/,
    `APPWRITE_API_KEY=${apiKey}`
  );
  
  // Eğer değişkenler yoksa ekle
  if (!envContent.includes('NEXT_PUBLIC_BACKEND_PROVIDER')) {
    envContent += '\nNEXT_PUBLIC_BACKEND_PROVIDER=appwrite\n';
  }
  if (!envContent.includes('NEXT_PUBLIC_APPWRITE_ENDPOINT')) {
    envContent += `NEXT_PUBLIC_APPWRITE_ENDPOINT=${endpoint}\n`;
  }
  if (!envContent.includes('NEXT_PUBLIC_APPWRITE_PROJECT_ID')) {
    envContent += `NEXT_PUBLIC_APPWRITE_PROJECT_ID=${projectId}\n`;
  }
  if (!envContent.includes('NEXT_PUBLIC_APPWRITE_DATABASE_ID')) {
    envContent += `NEXT_PUBLIC_APPWRITE_DATABASE_ID=${databaseId}\n`;
  }
  if (!envContent.includes('APPWRITE_API_KEY')) {
    envContent += `APPWRITE_API_KEY=${apiKey}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ .env.local dosyası güncellendi!');
  console.log('\n📝 Sonraki adım:');
  console.log('   npm run appwrite:setup\n');
  
  rl.close();
}

main().catch(console.error);

