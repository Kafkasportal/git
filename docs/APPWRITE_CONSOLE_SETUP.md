# Appwrite Console Setup - Hızlı Rehber

Bu dokümantasyon, paylaşılan Appwrite bilgileriyle Console'da yapılması gereken ayarları içerir.

## Mevcut Konfigürasyon

- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **Project ID**: `6927aa95001c4c6b488b`
- **Project Name**: `kafkasportal`
- **Database ID**: `kafkasder_db`
- **API Key**: `standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308`

## 1. Platform Ekleme (Web Platform) ✅ YAPILMALI

### Adımlar:
1. Appwrite Console'a giriş yapın: https://cloud.appwrite.io
2. Proje: **kafkasportal** (`6927aa95001c4c6b488b`)
3. **Settings** > **Platforms** bölümüne gidin
4. **Add Platform** > **Web App** seçin
5. Platform adı: `Web` veya `Next.js App`
6. **Hostname** alanına şunları ekleyin (her biri ayrı satır):
   ```
   localhost
   localhost:3000
   *.vercel.app
   *.appwrite.cloud
   ```
   - Production domain'inizi de ekleyin (varsa)

### ⚠️ ÖNEMLİ:
- `localhost` mutlaka eklenmelidir (development için)
- Production domain'i eklemeden deploy yaparsanız CORS hatası alırsınız

## 2. Environment Variables Oluşturma ✅ YAPILMALI

### Appwrite Console'da (Settings > Environment Variables):

#### Public Variables (Client-side'da kullanılabilir)

1. **NEXT_PUBLIC_APPWRITE_ENDPOINT**
   - Type: **Public**
   - Value: `https://fra.cloud.appwrite.io/v1`

2. **NEXT_PUBLIC_APPWRITE_PROJECT_ID**
   - Type: **Public**
   - Value: `6927aa95001c4c6b488b`

3. **NEXT_PUBLIC_APPWRITE_DATABASE_ID**
   - Type: **Public**
   - Value: `kafkasder_db`

#### Secret Variables (Sadece server-side)

4. **APPWRITE_API_KEY**
   - Type: **Secret** ⚠️
   - Value: `standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308`

### Oluşturma Adımları:
1. **Settings** > **Environment Variables**
2. **Create Variable** butonuna tıklayın
3. Her variable için:
   - **Key**: Variable adı (yukarıdaki listeden)
   - **Value**: Variable değeri (yukarıdaki listeden)
   - **Type**: Public veya Secret seçin
4. **Save**

## 3. API Key Kontrolü

1. **Settings** > **API Keys**
2. Mevcut API key'inizin doğru scope'lara sahip olduğundan emin olun:
   - ✅ `users.read`
   - ✅ `users.write`
   - ✅ `databases.read`
   - ✅ `databases.write`
   - ✅ `storage.read`
   - ✅ `storage.write`

## 4. Database ve Collections Kontrolü

1. **Databases** bölümüne gidin
2. Database: **kafkasder_db** kontrol edin
3. Collections'ların oluşturulduğundan emin olun:
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

## Test Etme

Tüm ayarları yaptıktan sonra:

```bash
# Environment variable'ları set ederek test
export NEXT_PUBLIC_APPWRITE_ENDPOINT="https://fra.cloud.appwrite.io/v1"
export NEXT_PUBLIC_APPWRITE_PROJECT_ID="6927aa95001c4c6b488b"
export NEXT_PUBLIC_APPWRITE_DATABASE_ID="kafkasder_db"
export APPWRITE_API_KEY="standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308"

# Auth testi
npm run test:appwrite-auth

# Veya direkt script ile
tsx scripts/test-appwrite-auth-with-config.ts
```

## Sorun Giderme

### CORS Hatası
- Platform'da `localhost` hostname'inin eklendiğinden emin olun
- Production domain'i eklenmiş olmalıdır

### Authentication Hatası
- API Key'in doğru scope'lara sahip olduğundan emin olun
- `APPWRITE_API_KEY` variable'ının Secret olarak işaretlendiğinden emin olun

### Environment Variable Bulunamadı
- Variable isimlerinin tam olarak eşleştiğinden emin olun
- Public/Secret type'ının doğru seçildiğinden emin olun

