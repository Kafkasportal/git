/**
 * Test Appwrite Session Creation
 * Appwrite REST API ile session oluşturmayı test eder
 */

import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

async function testSessionCreation(email: string, password: string) {
  console.log("🔍 Appwrite Session Oluşturma Testi\n");
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🆔 Project ID: ${projectId}`);
  console.log(`📧 Email: ${email}\n`);

  if (!endpoint || !projectId) {
    console.error("❌ Environment variables eksik!");
    process.exit(1);
  }

  try {
    console.log("1️⃣  Session oluşturuluyor...");
    const sessionResponse = await fetch(`${endpoint}/account/sessions/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
      }),
    });

    console.log(`📊 Status: ${sessionResponse.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(sessionResponse.headers.entries()));

    const sessionData = await sessionResponse.json().catch(() => null);
    
    if (sessionResponse.ok && sessionData) {
      console.log(`\n✅ Session başarıyla oluşturuldu!`);
      console.log(`   Session ID: ${sessionData.$id}`);
      console.log(`   User ID: ${sessionData.userId}`);
      console.log(`   Expiry: ${sessionData.expire}`);
      
      // Session'ı temizle
      if (sessionData.$id) {
        console.log(`\n2️⃣  Session siliniyor...`);
        const deleteResponse = await fetch(`${endpoint}/account/sessions/${sessionData.$id}`, {
          method: "DELETE",
          headers: {
            "X-Appwrite-Project": projectId,
            "X-Appwrite-Key": process.env.APPWRITE_API_KEY || "",
          },
        });
        console.log(`   Delete Status: ${deleteResponse.status}`);
      }
    } else {
      console.log(`\n❌ Session oluşturulamadı!`);
      console.log(`   Response:`, sessionData);
    }
  } catch (error: any) {
    console.error(`\n❌ Hata:`);
    console.error(`   Mesaj: ${error.message}`);
    console.error(`   Detay:`, error);
  }
}

const email = process.argv[2] || "test@example.com";
const password = process.argv[3] || "";

if (!password) {
  console.error("❌ Şifre gerekli!");
  console.error("Kullanım: npx tsx scripts/test-appwrite-session.ts <email> <password>");
  process.exit(1);
}

await testSessionCreation(email, password);

