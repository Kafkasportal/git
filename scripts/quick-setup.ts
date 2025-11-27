#!/usr/bin/env tsx
/**
 * Quick Setup Script
 * Tek komutla tüm environment variables'ı gerçek değerlerle doldurur
 *
 * Kullanım: npx tsx scripts/quick-setup.ts
 */

import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

// ============================================
// 🔑 GERÇEK APPWRITE CREDENTIALS - BURAYA YAZ
// ============================================
const APPWRITE_CONFIG = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "6927aa95001c4c6b488b",
  projectName: "kafkasportal",
  apiKey:
    "standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308",
  databaseId: "kafkasder_db",
};

// Dev API Key (opsiyonel) - kullanılmıyor ama referans için saklanıyor
const _DEV_API_KEY =
  "d4f8642bb9b6ed09d00a49af1dce70f4f0585314aabe1b89a883fd31cf734a1c5661166b6d5a7fa214057007908c730f7a4741973eb998f512b446290b3f4e6eb3186232b3a0168c6ba98e80d69a484ff2e57d6d0c95b25168d264ed48303b9a2d9c4c65eab5f94e4e96a820db5f615160817eb3d107a0b723be627881cda519";
void _DEV_API_KEY; // Lint uyarısını önle

// Test kullanıcı bilgileri
const TEST_USER = {
  email: "mcp-login@example.com",
  password: "SecurePass123!",
  name: "MCP Login User",
};

// ============================================

console.log("🚀 Quick Setup - Tek Hamle ile Kurulum\n");

const rootDir = process.cwd();

// 1. MCP Settings dosyasını oluştur
const mcpSettingsPath = join(rootDir, ".cursor", "mcp_settings.json");
const mcpSettings = {
  appwrite: {
    endpoint: APPWRITE_CONFIG.endpoint,
    projectId: APPWRITE_CONFIG.projectId,
    apiKey: APPWRITE_CONFIG.apiKey,
    databaseId: APPWRITE_CONFIG.databaseId,
  },
  testCredentials: {
    email: TEST_USER.email,
    password: TEST_USER.password,
    name: TEST_USER.name,
  },
};

writeFileSync(mcpSettingsPath, JSON.stringify(mcpSettings, null, 2));
console.log("✅ .cursor/mcp_settings.json oluşturuldu");

// 2. .env.local dosyasını oluştur/güncelle
const envLocalPath = join(rootDir, ".env.local");
let envContent = "";

if (existsSync(envLocalPath)) {
  envContent = readFileSync(envLocalPath, "utf-8");
}

// Environment variables
const envVars: Record<string, string> = {
  NODE_ENV: "development",
  NEXT_PUBLIC_APP_NAME: "Kafkasder Panel",
  NEXT_PUBLIC_APP_VERSION: "1.0.0",
  NEXT_PUBLIC_BACKEND_PROVIDER: "appwrite",
  NEXT_PUBLIC_APPWRITE_ENDPOINT: APPWRITE_CONFIG.endpoint,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: APPWRITE_CONFIG.projectId,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: APPWRITE_CONFIG.databaseId,
  APPWRITE_API_KEY: APPWRITE_CONFIG.apiKey,
  NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS: "documents",
  NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS: "avatars",
  NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS: "receipts",
  SESSION_SECRET: "development-session-secret-min-32-characters-here",
  CSRF_SECRET: "development-csrf-secret-min-32-characters-here",
  MCP_TEST_EMAIL: TEST_USER.email,
  MCP_TEST_PASSWORD: TEST_USER.password,
};

// Her değişkeni güncelle veya ekle
for (const [key, value] of Object.entries(envVars)) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
}

// Başındaki boş satırları temizle
envContent = envContent.replace(/^\n+/, "");

writeFileSync(envLocalPath, envContent);
console.log("✅ .env.local güncellendi");

// 3. Özet
console.log("\n📋 Yapılandırma Özeti:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`Endpoint:    ${APPWRITE_CONFIG.endpoint}`);
console.log(`Project ID:  ${APPWRITE_CONFIG.projectId}`);
console.log(`Database:    ${APPWRITE_CONFIG.databaseId}`);
console.log(`API Key:     ***${APPWRITE_CONFIG.apiKey.slice(-8)}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("\n📝 Test Kullanıcı:");
console.log(`Email:       ${TEST_USER.email}`);
console.log(`Password:    ${TEST_USER.password}`);

console.log("\n✅ Kurulum tamamlandı!");
console.log("\n🎯 Sonraki adımlar:");
console.log("   1. npm run dev        # Sunucuyu başlat");
console.log("   2. Login sayfasına git - credentials otomatik dolu!");
console.log('   3. "Giriş Yap" butonuna tıkla');

console.log("\n⚠️  NOT: Bu dosya .gitignore'da olmalı!");
