/**
 * Test Appwrite Authentication
 * Bu script Appwrite auth bağlantısını ve kullanıcı listesini kontrol eder
 */

import { Client, Users } from "node-appwrite";
import dotenv from "dotenv";
import path from "node:path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const projectEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

function validateEnvironment() {
  console.log("📋 Environment Variables:");
  console.log(`   Endpoint: ${projectEndpoint ?? "❌ EKSIK"}`);
  console.log(`   Project ID: ${projectId || "❌ EKSIK"}`);
  console.log(`   API Key: ${apiKey ? "✅ SET" : "❌ EKSIK"}\n`);

  if (!projectEndpoint || !projectId || !apiKey) {
    console.error("❌ Gerekli environment variables eksik!");
    console.error("   .env.local dosyasını kontrol edin");
    process.exit(1);
  }
}

function displayUser(user: any, index: number) {
  console.log(`   ${index + 1}. ${user.email || "Email yok"}`);
  console.log(`      ID: ${user.$id}`);
  console.log(`      İsim: ${user.name || "İsim yok"}`);
  console.log(`      Durum: ${user.status ? "✅ Aktif" : "❌ Pasif"}`);
  console.log(`      Oluşturulma: ${user.$createdAt}`);
  if (user.prefs) {
    console.log(`      Preferences:`, JSON.stringify(user.prefs, null, 2));
  }
  console.log("");
}

function displayUsersList(usersList: any) {
  console.log(`✅ Bağlantı başarılı!\n`);
  console.log(`📊 Toplam Kullanıcı: ${usersList.total}\n`);

  if (usersList.users.length === 0) {
    console.log("⚠️  Henüz hiç kullanıcı yok.");
    console.log("   Appwrite Console'dan kullanıcı oluşturabilirsiniz.\n");
  } else {
    console.log("👥 Kullanıcılar:\n");
    usersList.users.forEach((user: any, index: number) => {
      displayUser(user, index);
    });
  }
}

async function searchUserByEmail(users: Users, email: string) {
  console.log(`🔍 "${email}" email'i ile arama yapılıyor...\n`);

  try {
    const { Query } = await import("node-appwrite");
    const filteredUsers = await users.list([
      Query.equal("email", email),
      Query.limit(1),
    ]);

    if (filteredUsers.users.length > 0) {
      const foundUser = filteredUsers.users[0];
      console.log(`✅ Kullanıcı bulundu!`);
      console.log(`   Email: ${foundUser.email}`);
      console.log(`   ID: ${foundUser.$id}`);
      console.log(`   Durum: ${foundUser.status ? "Aktif" : "Pasif"}`);
    } else {
      console.log(`❌ "${email}" email'ine sahip kullanıcı bulunamadı.`);
    }
  } catch (error: any) {
    console.error(`❌ Email arama hatası:`, error.message);
    console.error(`   Detay:`, error);
  }
}

function handleError(error: any) {
  console.error("\n❌ Hata oluştu:");
  console.error(`   Mesaj: ${error.message}`);
  console.error(`   Kod: ${error.code || "Bilinmiyor"}`);
  
  if (error.code === 401) {
    console.error("\n💡 İpucu: API Key'inizin geçerli ve yeterli izinlere sahip olduğundan emin olun.");
    console.error("   Appwrite Console > Settings > API Keys bölümünden kontrol edin.");
  } else if (error.code === 404) {
    console.error("\n💡 İpucu: Project ID'nin doğru olduğundan emin olun.");
  }
  
  console.error("\n   Tam hata detayı:");
  console.error(error);
  process.exit(1);
}

async function testAuth() {
  console.log("🔍 Appwrite Auth Test Başlatılıyor...\n");

  validateEnvironment();

  // Server client oluştur
  const serverClient = new Client()
    .setEndpoint(projectEndpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const users = new Users(serverClient);

  try {
    // Kullanıcı listesini çek
    console.log("🔍 Appwrite'a bağlanılıyor...");
    const usersList = await users.list();

    displayUsersList(usersList);

    // Email ile arama testi
    if (process.argv[2]) {
      const testEmail = process.argv[2].toLowerCase().trim();
      await searchUserByEmail(users, testEmail);
    }

    console.log("\n✅ Test tamamlandı!");
  } catch (error: any) {
    handleError(error);
  }
}

await testAuth();

