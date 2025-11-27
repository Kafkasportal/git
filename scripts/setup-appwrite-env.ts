/**
 * Appwrite Environment Setup Script
 *
 * Bu script .env.local dosyasını Appwrite yapılandırması ile günceller.
 * Global MCP ayarlarından veya manuel olarak değerleri alır.
 *
 * Kullanım:
 *   npx tsx scripts/setup-appwrite-env.ts
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

interface McpConfig {
  appwrite?: {
    endpoint?: string;
    projectId?: string;
    databaseId?: string;
    apiKey?: string;
  };
}

interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  apiKey: string;
}

/**
 * MCP yapılandırma dosyasını oku
 * Öncelik: .cursor/mcp_settings.json > environment variables > defaults
 */
function loadMcpConfig(): AppwriteConfig {
  const mcpConfigPath = join(process.cwd(), ".cursor", "mcp_settings.json");
  const mcpExamplePath = join(
    process.cwd(),
    ".cursor",
    "mcp_settings.example.json",
  );

  let mcpConfig: McpConfig = {};

  // MCP config dosyasını oku
  if (existsSync(mcpConfigPath)) {
    try {
      const content = readFileSync(mcpConfigPath, "utf-8");
      mcpConfig = JSON.parse(content);
      console.log("✓ MCP yapılandırması yüklendi: .cursor/mcp_settings.json");
    } catch (_error) {
      console.warn("⚠ Mevcut .env.local okunamadı, yeni dosya oluşturulacak");
    }
  } else if (existsSync(mcpExamplePath)) {
    console.log("⚠ mcp_settings.json bulunamadı.");
    console.log("  Lütfen örnek dosyayı kopyalayıp düzenleyin:");
    console.log(
      "  cp .cursor/mcp_settings.example.json .cursor/mcp_settings.json",
    );
  }

  // Öncelik: MCP config > environment variables > defaults
  return {
    endpoint:
      mcpConfig.appwrite?.endpoint ||
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      "https://cloud.appwrite.io/v1",
    projectId:
      mcpConfig.appwrite?.projectId ||
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
      "",
    databaseId:
      mcpConfig.appwrite?.databaseId ||
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
      "kafkasder_db",
    apiKey: mcpConfig.appwrite?.apiKey || process.env.APPWRITE_API_KEY || "",
  };
}

// MCP veya environment'tan yapılandırmayı yükle
const APPWRITE_CONFIG = loadMcpConfig();

const envLocalPath = join(process.cwd(), ".env.local");

function updateEnvFile() {
  let envContent = "";

  // Mevcut .env.local dosyasını oku
  if (existsSync(envLocalPath)) {
    envContent = readFileSync(envLocalPath, "utf-8");
    console.log("✓ Mevcut .env.local dosyası okundu");
  } else {
    console.log(
      "⚠ .env.local dosyası bulunamadı, yeni dosya oluşturuluyor...",
    );
  }

  // Appwrite değişkenlerini güncelle veya ekle
  const appwriteVars = {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: APPWRITE_CONFIG.endpoint,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: APPWRITE_CONFIG.projectId,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID: APPWRITE_CONFIG.databaseId,
    APPWRITE_API_KEY: APPWRITE_CONFIG.apiKey,
    NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS: "documents",
    NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS: "avatars",
    NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS: "receipts",
    NEXT_PUBLIC_BACKEND_PROVIDER: "appwrite",
  };

  // Her değişken için güncelleme yap
  let updated = false;
  for (const [key, value] of Object.entries(appwriteVars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      // Mevcut değeri güncelle
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✓ ${key} güncellendi`);
      updated = true;
    } else {
      // Yeni değişken ekle
      if (!envContent.endsWith("\n") && envContent.length > 0) {
        envContent += "\n";
      }
      envContent += `${key}=${value}\n`;
      console.log(`✓ ${key} eklendi`);
      updated = true;
    }
  }

  // Dosyayı kaydet
  if (updated) {
    writeFileSync(envLocalPath, envContent, "utf-8");
    console.log("\n✅ .env.local dosyası başarıyla güncellendi!");
    console.log("\n📋 Güncellenen değişkenler:");
    Object.keys(appwriteVars).forEach((key) => {
      console.log(`   - ${key}`);
    });
  } else {
    console.log("ℹ Tüm değişkenler zaten güncel");
  }
}

function main() {
  console.log("🔧 Appwrite Environment Setup");
  console.log("=".repeat(50));
  console.log(`Endpoint: ${APPWRITE_CONFIG.endpoint}`);
  console.log(`Project ID: ${APPWRITE_CONFIG.projectId || "(boş)"}`);
  console.log(`Database ID: ${APPWRITE_CONFIG.databaseId}`);
  console.log(
    `API Key: ${APPWRITE_CONFIG.apiKey ? `***${APPWRITE_CONFIG.apiKey.slice(-8)}` : "(boş)"}`,
  );
  console.log("=".repeat(50));
  console.log();

  // Gerekli değerleri kontrol et
  const missingValues: string[] = [];
  if (!APPWRITE_CONFIG.projectId) missingValues.push("projectId");
  if (!APPWRITE_CONFIG.apiKey) missingValues.push("apiKey");

  if (missingValues.length > 0) {
    console.error("❌ Eksik yapılandırma değerleri:", missingValues.join(", "));
    console.log("\n📝 Çözüm:");
    console.log(
      "   1. .cursor/mcp_settings.example.json dosyasını kopyalayın:",
    );
    console.log(
      "      cp .cursor/mcp_settings.example.json .cursor/mcp_settings.json",
    );
    console.log(
      "   2. mcp_settings.json dosyasında Appwrite değerlerini düzenleyin",
    );
    console.log("   3. Ya da .env.local dosyasına değerleri manuel ekleyin");
    process.exit(1);
  }

  try {
    updateEnvFile();
    console.log("\n✅ Setup tamamlandı!");
    console.log("\n⚠ ÖNEMLİ: .env.local dosyası .gitignore'da, güvenlidir.");
    console.log("   Ancak API key'i asla commit etmeyin!");
  } catch (error) {
    console.error("\n❌ Hata:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
    process.exit(1);
  }
}

main();
