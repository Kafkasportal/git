# Appwrite Console - Hızlı Erişim Linkleri

## Proje Bilgileri
- **Project ID**: `6927aa95001c4c6b488b`
- **Project Name**: `kafkasportal`
- **Endpoint**: `https://fra.cloud.appwrite.io/v1`

## Hızlı Erişim Linkleri

### 1. Platform Ekleme
**Link**: https://cloud.appwrite.io/console/project-6927aa95001c4c6b488b/settings/platforms

**Yapılacaklar:**
- "Add Platform" butonuna tıklayın
- "Web App" seçin
- Hostname'lere ekleyin:
  - `localhost`
  - `localhost:3000`
  - Production domain'iniz (varsa)

### 2. Environment Variables
**Link**: https://cloud.appwrite.io/console/project-6927aa95001c4c6b488b/settings/variables

**Oluşturulacak Variables:**

1. **NEXT_PUBLIC_APPWRITE_ENDPOINT**
   - Type: Public
   - Value: `https://fra.cloud.appwrite.io/v1`

2. **NEXT_PUBLIC_APPWRITE_PROJECT_ID**
   - Type: Public
   - Value: `6927aa95001c4c6b488b`

3. **NEXT_PUBLIC_APPWRITE_DATABASE_ID**
   - Type: Public
   - Value: `kafkasder_db`

4. **APPWRITE_API_KEY**
   - Type: Secret
   - Value: `standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308`

### 3. API Keys
**Link**: https://cloud.appwrite.io/console/project-6927aa95001c4c6b488b/settings/api-keys

### 4. Database
**Link**: https://cloud.appwrite.io/console/project-6927aa95001c4c6b488b/databases

### 5. Storage
**Link**: https://cloud.appwrite.io/console/project-6927aa95001c4c6b488b/storage

## Test Etme

Tüm ayarları yaptıktan sonra:

```bash
npx tsx scripts/test-appwrite-auth-with-config.ts
```

