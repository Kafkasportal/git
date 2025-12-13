/**
 * Test Login Endpoint
 * Login API endpoint'ini test eder
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testLogin(email: string, password: string) {
  console.log(`🔍 Login Test Başlatılıyor...\n`);
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📧 Email: ${email}\n`);

  try {
    // Cookie store için node-fetch veya fetch API kullanıyoruz
    // Node.js'de cookie'leri manuel yönetmemiz gerekiyor
    let cookieHeader = "";

    // 1. CSRF token al
    console.log("1️⃣  CSRF token alınıyor...");
    const csrfResponse = await fetch(`${API_URL}/api/csrf`, {
      method: "GET",
      headers: {
        "User-Agent": "test-script",
      },
    });

    if (!csrfResponse.ok) {
      console.error(`❌ CSRF token alınamadı: ${csrfResponse.status}`);
      const text = await csrfResponse.text();
      console.error(`   Response:`, text);
      return;
    }

    // Cookie'leri al
    const setCookieHeader = csrfResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      // İlk cookie'yi al (csrf-token)
      const cookies = setCookieHeader.split(", ");
      cookieHeader = cookies
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
      console.log(`   Cookie alındı: ${cookieHeader.substring(0, 50)}...`);
    }

    const csrfData = await csrfResponse.json();
    if (!csrfData.success || !csrfData.token) {
      console.error(`❌ CSRF token geçersiz:`, csrfData);
      return;
    }

    console.log(`✅ CSRF token alındı: ${csrfData.token.substring(0, 20)}...\n`);

    // 2. Login request gönder
    console.log("2️⃣  Login request gönderiliyor...");
    const loginHeaders: HeadersInit = {
      "Content-Type": "application/json",
      "x-csrf-token": csrfData.token,
      "User-Agent": "test-script",
    };

    // Cookie varsa ekle
    if (cookieHeader) {
      loginHeaders["Cookie"] = cookieHeader;
    }

    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: loginHeaders,
      body: JSON.stringify({
        email,
        password,
        rememberMe: false,
      }),
    });

    const result = await loginResponse.json();

    console.log(`📊 Response Status: ${loginResponse.status}`);
    console.log(`📊 Response Data:`, JSON.stringify(result, null, 2));

    if (loginResponse.ok && result.success) {
      console.log(`\n✅ Login başarılı!`);
      console.log(`   User ID: ${result.data?.user?.id}`);
      console.log(`   Email: ${result.data?.user?.email}`);
      console.log(`   Role: ${result.data?.user?.role}`);
    } else {
      console.log(`\n❌ Login başarısız!`);
      console.log(`   Hata: ${result.error || "Bilinmeyen hata"}`);
    }

    // 3. Cookie'leri kontrol et
    console.log(`\n3️⃣  Response headers kontrol ediliyor...`);
    const cookies = loginResponse.headers.get("set-cookie");
    if (cookies) {
      console.log(`✅ Cookie'ler set edildi`);
      const cookieNames = cookies
        .split(", ")
        .map((c) => c.split("=")[0])
        .filter(Boolean);
      console.log(`   Cookie'ler: ${cookieNames.join(", ")}`);
    } else {
      console.log(`⚠️  Cookie set edilmedi`);
    }
  } catch (error: any) {
    console.error(`\n❌ Test hatası:`);
    console.error(`   Mesaj: ${error.message}`);
    if (error.cause) {
      console.error(`   Detay:`, error.cause);
    }
  }
}

// Test parametrelerini al
const email = process.argv[2] || "test@example.com";
const password = process.argv[3] || "";

if (!password) {
  console.error("❌ Şifre gerekli!");
  console.error("Kullanım: npx tsx scripts/test-login.ts <email> <password>");
  process.exit(1);
}

testLogin(email, password);

