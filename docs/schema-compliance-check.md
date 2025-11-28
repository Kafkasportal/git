# Şema Uyumluluk Kontrolü

Bu dokümantasyon, projedeki şema tanımlarının Appwrite database ile uyumlu olup olmadığını kontrol etme sürecini açıklar.

## Genel Bakış

Appwrite MCP server sadece **kullanıcı yönetimi** için kullanılabilir. Database collection'ları ve attribute'ları kontrol etmek için Appwrite SDK kullanılmalıdır.

## Kontrol Script'i

`scripts/check-schema-compliance.ts` script'i şunları yapar:

1. ✅ Projedeki beklenen collection'ları `src/lib/appwrite/config.ts`'den okur
2. ✅ Appwrite database'deki gerçek collection'ları listeler
3. ✅ Her collection'ın varlığını kontrol eder
4. ✅ Attribute'ları karşılaştırır (gelecekte)
5. ✅ Uyumsuzlukları raporlar

## Kullanım

### 1. Environment Variables Ayarlayın

`.env.local` dosyasında şunlar olmalı:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=kafkasder_db
```

### 2. Script'i Çalıştırın

```bash
npx tsx scripts/check-schema-compliance.ts
```

### 3. Sonuçları İnceleyin

Script şu bilgileri gösterir:

- ✅ **Existing**: Database'de mevcut collection'lar
- ✗ **Missing**: Database'de olmayan collection'lar
- ⚠ **With Issues**: Attribute uyumsuzlukları olan collection'lar

## Örnek Çıktı

```
🔍 Schema Compliance Checker
============================================================
Endpoint: https://cloud.appwrite.io/v1
Project: your-project-id
Database: kafkasder_db
============================================================

📋 Expected Collections: 25

📦 Actual Collections in Database: 20

Checking: users...
  ✓ Exists (25 attributes)

Checking: beneficiaries...
  ✓ Exists (45 attributes)

Checking: donations...
  ✓ Exists (30 attributes)

...

============================================================
📊 Summary
============================================================
Total Expected: 25
✓ Existing: 20
✗ Missing: 5
⚠ With Issues: 0

Missing Collections:
  - scholarship_payments
  - document_versions
  - report_configs
  - theme_presets
  - rate_limit_log
```

## Eksik Collection'ları Oluşturma

Eğer eksik collection'lar varsa, bunları oluşturmak için:

```bash
npx tsx scripts/appwrite-setup.ts
```

Bu script tüm collection'ları, attribute'ları ve index'leri oluşturur.

## MCP ile Kullanıcı Kontrolü

Appwrite MCP server ile kullanıcıları kontrol edebilirsiniz:

### Kullanıcıları Listeleme

Cursor'da:
```
"Appwrite kullanıcılarını listele"
```

### Kullanıcı Oluşturma

```
"Appwrite'da yeni kullanıcı oluştur: test@example.com, şifre: Test123!, isim: Test User"
```

### Kullanıcı Bilgilerini Getirme

```
"test-user-id kullanıcısının bilgilerini getir"
```

## Şema Tanımları

Projedeki şema tanımları şu dosyalarda:

1. **`scripts/appwrite-setup.ts`**: Collection ve attribute tanımları
2. **`src/lib/appwrite/config.ts`**: Collection ID mapping'leri
3. **`src/types/database.ts`**: TypeScript type tanımları

## Karşılaştırma Detayları

Script şu alanları karşılaştırır:

- ✅ Collection varlığı
- ✅ Attribute sayısı
- ⏳ Attribute tipleri (gelecekte)
- ⏳ Required/optional durumları (gelecekte)
- ⏳ Index'ler (gelecekte)

## Sorun Giderme

### "Missing environment variables"

`.env.local` dosyasını kontrol edin ve gerekli değişkenleri ekleyin.

### "Collection does not exist"

Eksik collection'ları oluşturmak için:
```bash
npx tsx scripts/appwrite-setup.ts
```

### "Authentication failed"

API key'in doğru izinlere sahip olduğundan emin olun:
- `databases.read`
- `collections.read`
- `attributes.read`

## İleri Seviye Kullanım

### Sadece Belirli Collection'ları Kontrol Etme

Script'i düzenleyerek sadece belirli collection'ları kontrol edebilirsiniz.

### Attribute Detaylı Karşılaştırma

Gelecekte script'e attribute karşılaştırma özelliği eklenecek:
- Type uyumluluğu
- Required/optional durumları
- Default değerler
- Array durumları
- Enum değerleri

## İlgili Dokümantasyon

- [Appwrite MCP Guide](./appwrite-mcp-guide.md)
- [Appwrite Migration Plan](./appwrite-migration-plan.md)
- [Appwrite Setup Script](../scripts/appwrite-setup.ts)

