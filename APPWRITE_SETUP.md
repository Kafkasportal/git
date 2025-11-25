# Appwrite Cloud Kurulum Rehberi

## 🚀 Hızlı Kurulum

### Adım 1: Appwrite Cloud Bilgilerini Alın

1. **Appwrite Cloud Console'a gidin**: https://cloud.appwrite.io/console
2. **Giriş yapın** (yoksa ücretsiz hesap oluşturun)
3. **Proje seçin** veya **yeni proje oluşturun**

### Adım 2: Project ID'yi Alın

1. **Settings** > **General** bölümüne gidin
2. **Project ID**'yi kopyalayın

### Adım 3: API Key Oluşturun

1. **Settings** > **API Keys** bölümüne gidin
2. **Create API Key** butonuna tıklayın
3. **İzinleri seçin**:
   - ✅ `users.read`
   - ✅ `users.write`
   - ✅ `databases.read`
   - ✅ `databases.write`
   - ✅ `storage.read`
   - ✅ `storage.write`
4. **API Key**'i kopyalayın (sadece bir kez gösterilir!)

### Adım 4: Otomatik Kurulum

```bash
# Script'i çalıştırın
./scripts/auto-setup-appwrite.sh
```

Script size Project ID, API Key ve Database ID soracak. Bilgileri girin.

### Adım 5: Database Kurulumu

```bash
# Database ve collection'ları oluştur
npm run appwrite:setup
```

Bu komut:
- Database oluşturur (`kafkasder_db`)
- Tüm collection'ları oluşturur
- Attribute'ları ve index'leri kurar

### Adım 6: Test

```bash
# Backend durumunu test et
npm run test:backend

# Health check
curl http://localhost:3000/api/health?detailed=true
```

## 📝 Manuel Kurulum

Eğer script kullanmak istemiyorsanız, `.env.local` dosyasını manuel olarak düzenleyin:

```env
NEXT_PUBLIC_BACKEND_PROVIDER=appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=kafkasder_db
APPWRITE_API_KEY=your-api-key-here
```

## ✅ Kurulum Kontrolü

Kurulumun başarılı olduğunu kontrol etmek için:

```bash
# Health check
curl http://localhost:3000/api/health?detailed=true
```

Başarılı yanıt şöyle görünmelidir:
```json
{
  "ok": true,
  "provider": "appwrite",
  "appwrite": {
    "endpoint": true,
    "projectId": true,
    "databaseId": true,
    "apiKey": true,
    "configured": true,
    "active": true
  }
}
```

## 🔧 Sorun Giderme

### "Project not found" hatası
- Project ID'nin doğru olduğundan emin olun
- Project ID'yi Settings > General'den kontrol edin

### "Unauthorized" hatası
- API Key'in doğru olduğundan emin olun
- API Key'in gerekli izinlere sahip olduğundan emin olun

### "Database not found" hatası
- Önce `npm run appwrite:setup` komutunu çalıştırın
- Database ID'nin doğru olduğundan emin olun

## 📚 Daha Fazla Bilgi

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Cloud Console](https://cloud.appwrite.io/console)
- [Project Documentation](./docs/appwrite-migration.md)

