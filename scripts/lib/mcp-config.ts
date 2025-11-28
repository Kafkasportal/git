/**
 * MCP Configuration Loader
 *
 * Bu modül .cursor/mcp_settings.json dosyasından yapılandırmayı yükler.
 * Öncelik: MCP config > environment variables > defaults
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface McpConfig {
  appwrite?: {
    endpoint?: string;
    projectId?: string;
    databaseId?: string;
    apiKey?: string;
  };
  testCredentials?: {
    email?: string;
    password?: string;
    name?: string;
  };
}

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  apiKey: string;
}

export interface TestCredentials {
  email: string;
  password: string;
  name: string;
}

let cachedConfig: McpConfig | null = null;

/**
 * MCP yapılandırma dosyasını oku (cache'li)
 */
function loadMcpConfigFile(): McpConfig {
  if (cachedConfig) return cachedConfig;

  const mcpConfigPath = join(process.cwd(), ".cursor", "mcp_settings.json");

  if (existsSync(mcpConfigPath)) {
    try {
      const content = readFileSync(mcpConfigPath, "utf-8");
      cachedConfig = JSON.parse(content);
      console.log("✓ MCP yapılandırması yüklendi: .cursor/mcp_settings.json");
      return cachedConfig!;
    } catch (error) {
      console.warn(
        "⚠ MCP config okunamadı:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  cachedConfig = {};
  return cachedConfig;
}

/**
 * Appwrite yapılandırmasını yükle
 * Öncelik: MCP config > environment variables > defaults
 */
export function loadAppwriteConfig(): AppwriteConfig {
  const mcpConfig = loadMcpConfigFile();

  return {
    endpoint:
      mcpConfig.appwrite?.endpoint ||
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      process.env.APPWRITE_ENDPOINT ||
      "https://cloud.appwrite.io/v1",
    projectId:
      mcpConfig.appwrite?.projectId ||
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
      process.env.APPWRITE_PROJECT_ID ||
      "",
    databaseId:
      mcpConfig.appwrite?.databaseId ||
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
      process.env.APPWRITE_DATABASE_ID ||
      "kafkasder_db",
    apiKey: mcpConfig.appwrite?.apiKey || process.env.APPWRITE_API_KEY || "",
  };
}

/**
 * Test credential'larını yükle
 */
export function loadTestCredentials(): TestCredentials {
  const mcpConfig = loadMcpConfigFile();

  return {
    email: mcpConfig.testCredentials?.email || "mcp-login@example.com",
    password: mcpConfig.testCredentials?.password || "SecurePass123!",
    name: mcpConfig.testCredentials?.name || "MCP Login User",
  };
}

/**
 * Yapılandırma değerlerini doğrula
 */
export function validateConfig(config: AppwriteConfig): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!config.projectId) missing.push("projectId");
  if (!config.apiKey) missing.push("apiKey");

  return { valid: missing.length === 0, missing };
}

/**
 * Kurulum talimatlarını göster
 */
export function showSetupInstructions(): void {
  console.log("\n📝 Yapılandırma Talimatları:");
  console.log("   1. Örnek dosyayı kopyalayın:");
  console.log(
    "      cp .cursor/mcp_settings.example.json .cursor/mcp_settings.json",
  );
  console.log("   2. mcp_settings.json dosyasında değerleri düzenleyin");
  console.log("   3. Ya da .env.local dosyasına değerleri manuel ekleyin");
}
