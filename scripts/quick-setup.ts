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
  endpoint: "https://cloud.appwrite.io/v1",
  projectId: "YOUR_PROJECT_ID",
  projectName: "kafkasportal",
  apiKey: "YOUR_APPWRITE_API_KEY",
  databaseId: "kafkasder_db",
};

// Dev API Key (opsiyonel) - kullanılmıyor ama referans için saklanıyor
const _DEV_API_KEY = "YOUR_DEV_API_KEY";
void _DEV_API_KEY; // Lint uyarısını önle

// GitHub Token
const _GITHUB_TOKEN = "YOUR_GITHUB_TOKEN";
void _GITHUB_TOKEN; // Lint uyarısını önle

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
