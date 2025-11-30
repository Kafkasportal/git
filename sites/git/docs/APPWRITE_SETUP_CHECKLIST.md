# Appwrite Console Setup Checklist

Bu dokümantasyon, Appwrite Console'da yapılması gereken tüm ayarları içerir.

## 1. Platform Ekleme (Web Platform)

### Adımlar:
1. Appwrite Console'a giriş yapın: https://cloud.appwrite.io
2. Projenizi seçin
3. **Settings** > **Platforms** bölümüne gidin
4. **Add Platform** > **Web App** seçin
5. Platform adı: `Web` veya `Next.js App`
6. **Hostname** alanına şunları ekleyin:
   - `localhost` (development için)
   - `localhost:3000` (development için)
   - Production domain'iniz (örn: `app.kafkasder.com`)
   - `*.vercel.app` (Vercel deploy için)
   - `*.appwrite.cloud` (Appwrite deploy için)

### Önemli Notlar:
- Her hostname'i ayrı satıra ekleyin
- Development için `localhost` mutlaka eklenmelidir
- Production domain'i eklemeden deploy yaparsanız CORS hatası alırsınız
- Wildcard domain'ler (`*.vercel.app`) kullanabilirsiniz

## 2. Environment Variables Oluşturma

### Zorunlu Variables (Minimum)

#### Public Variables (Client-side'da kullanılabilir)

1. **NEXT_PUBLIC_APPWRITE_ENDPOINT**
   - Type: Public
   - Value: `https://cloud.appwrite.io/v1` (veya kendi endpoint'iniz)
   - Açıklama: Appwrite API endpoint URL'i

2. **NEXT_PUBLIC_APPWRITE_PROJECT_ID**
   - Type: Public
   - Value: Proje ID'niz (Settings > General'da bulabilirsiniz)
   - Açıklama: Appwrite Project ID

3. **NEXT_PUBLIC_APPWRITE_DATABASE_ID**
   - Type: Public
   - Value: Database ID'niz
   - Açıklama: Appwrite Database ID

#### Secret Variables (Sadece server-side)

4. **APPWRITE_API_KEY**
   - Type: Secret ⚠️
   - Value: Server API Key (Settings > API Keys'de oluşturun)
   - Açıklama: Server-side işlemler için API key
   - Önemli: "Server" scope'lu API key oluşturun, "Full Access" değil

### Opsiyonel Variables (Önerilen)

#### Security
5. **CSRF_SECRET** (Secret)
   - Min 32 karakter random string
   - Örnek: `openssl rand -hex 32` ile oluşturabilirsiniz

6. **SESSION_SECRET** (Secret)
   - Min 32 karakter random string
   - Örnek: `openssl rand -hex 32` ile oluşturabilirsiniz

#### Email (SMTP)
7. **SMTP_HOST** (Secret)
8. **SMTP_PORT** (Secret) - Genellikle `587`
9. **SMTP_USER** (Secret)
10. **SMTP_PASSWORD** (Secret)
11. **SMTP_FROM** (Secret)

#### SMS (Twilio)
12. **TWILIO_ACCOUNT_SID** (Secret)
13. **TWILIO_AUTH_TOKEN** (Secret)
14. **TWILIO_PHONE_NUMBER** (Secret)

### Appwrite Console'da Oluşturma:
1. **Settings** > **Environment Variables**
2. **Create Variable** butonuna tıklayın
3. Her variable için:
   - **Key**: Variable adı (örn: `NEXT_PUBLIC_APPWRITE_ENDPOINT`)
   - **Value**: Variable değeri
   - **Type**: Public veya Secret seçin
4. **Save**

## 3. API Key Oluşturma

1. **Settings** > **API Keys**
2. **Create API Key**
3. **Name**: `Server API Key` veya `Backend API Key`
4. **Scopes**: 
   - ✅ `users.read`
   - ✅ `users.write`
   - ✅ `databases.read`
   - ✅ `databases.write`
   - ✅ `storage.read`
   - ✅ `storage.write`
   - ✅ `files.read`
   - ✅ `files.write`
   - İhtiyacınıza göre diğer scope'ları ekleyin
5. **Never expire** seçeneğini işaretleyin (veya expiration date belirleyin)
6. **Create**
7. **API Key'i kopyalayın** (bir daha gösterilmeyecek!)
8. `APPWRITE_API_KEY` environment variable'ına yapıştırın

## 4. Database ve Collections Kontrolü

1. **Databases** bölümüne gidin
2. Database'inizin oluşturulduğundan emin olun
3. Database ID'yi kopyalayın → `NEXT_PUBLIC_APPWRITE_DATABASE_ID` variable'ına ekleyin
4. Collections'ların oluşturulduğundan emin olun:
   - `users`
   - `beneficiaries`
   - `donations`
   - `finance_records`
   - vb. (tüm collection'lar `src/lib/appwrite/config.ts` dosyasında listelenmiştir)

## 5. Storage Buckets Kontrolü

1. **Storage** bölümüne gidin
2. Şu bucket'ların oluşturulduğundan emin olun:
   - `documents`
   - `avatars`
   - `receipts`
3. Her bucket için:
   - **File Security**: `Users can read files` ve `Users can create files` seçeneklerini ayarlayın
   - **File Size Limit**: İhtiyacınıza göre ayarlayın (default: 10MB)

## Doğrulama

Tüm ayarları yaptıktan sonra, test scriptini çalıştırarak kontrol edin:

```bash
npm run test:appwrite-connection
```

Veya manuel olarak:

```bash
tsx scripts/test-appwrite-connection.ts
```

## Sorun Giderme

### CORS Hatası
- Platform'da hostname'in doğru eklendiğinden emin olun
- `localhost` mutlaka eklenmelidir
- Production domain'i eklenmiş olmalıdır

### Authentication Hatası
- API Key'in doğru scope'lara sahip olduğundan emin olun
- `APPWRITE_API_KEY` variable'ının Secret olarak işaretlendiğinden emin olun

### Environment Variable Bulunamadı
- Variable isimlerinin tam olarak eşleştiğinden emin olun
- Public/Secret type'ının doğru seçildiğinden emin olun
- Deploy sonrası site'in yeniden başlatıldığından emin olun

