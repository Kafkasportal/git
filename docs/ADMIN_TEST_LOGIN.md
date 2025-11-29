# Admin Test Login Bilgileri

## 📋 Admin Kullanıcı Bilgileri

**Email:** `admin@kafkasder.com`  
**İsim:** Admin Kullanıcı  
**Rol:** SUPER_ADMIN

## 🔐 Şifre Yapılandırması

Admin test şifresi environment variable üzerinden ayarlanabilir:

```bash
# .env.local dosyasına ekleyin
NEXT_PUBLIC_ADMIN_TEST_PASSWORD=Admin123!
```

Eğer environment variable ayarlanmamışsa, varsayılan olarak `Admin123!` kullanılır.

## 🚀 Kullanım

### 1. Otomatik Doldurma (Development Mode)

Development modunda (`NODE_ENV=development`), login sayfası açıldığında admin bilgileri otomatik olarak doldurulur:

- **Email:** `admin@kafkasder.com`
- **Şifre:** Environment variable'dan veya varsayılan şifre

### 2. Hızlı Giriş Butonu

Login sayfasında **"Hızlı Giriş"** butonuna tıklayarak tek tıkla admin olarak giriş yapabilirsiniz.

### 3. Admin Bilgileri Kartı

Login sayfasında her zaman görünür olan bir admin test login bilgileri kartı bulunur:

- Admin email adresi
- Admin adı ve rolü
- Hızlı giriş butonu
- Test şifresi bilgisi

## 📍 API Endpoint

### GET `/api/auth/admin-info`

Admin kullanıcı bilgilerini almak için kullanılır (sadece development modunda).

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "admin@kafkasder.com",
    "name": "Admin Kullanıcı",
    "role": "SUPER_ADMIN"
  }
}
```

**Not:** Şifre bilgisi güvenlik nedeniyle döndürülmez.

## 🔒 Güvenlik Notları

1. **Production Modunda:** Admin test login bilgileri ve hızlı giriş butonu gösterilmez.
2. **Sadece Development:** Bu özellikler sadece `NODE_ENV=development` modunda aktif olur.
3. **Şifre Güvenliği:** Şifre hash'lenmiş olarak veritabanında saklanır, API'den döndürülmez.

## 🛠️ Yapılandırma

### Environment Variables

`.env.local` dosyasına ekleyin:

```bash
# Admin Test Password (optional)
NEXT_PUBLIC_ADMIN_TEST_PASSWORD=Admin123!

# Test Login Email (optional, defaults to admin@kafkasder.com)
MCP_TEST_EMAIL=admin@kafkasder.com

# Test Login Password (optional, for test-login endpoint)
MCP_TEST_PASSWORD=Admin123!
```

## 📝 Özellikler

✅ **Otomatik Doldurma:** Development modunda admin bilgileri otomatik doldurulur  
✅ **Hızlı Giriş Butonu:** Tek tıkla admin girişi  
✅ **Her Zaman Görünür:** Login sayfasında admin bilgileri kartı  
✅ **API Desteği:** Admin bilgilerini API üzerinden alma  
✅ **Güvenli:** Production modunda devre dışı  

## 🎯 Kullanım Senaryoları

1. **Geliştirme:** Hızlı test için admin girişi
2. **Demo:** Sistemin gösterilmesi için
3. **Test:** Otomatik test senaryoları için

## ⚠️ Önemli Uyarılar

- Bu özellikler **sadece development modunda** çalışır
- Production'da admin test login bilgileri gösterilmez
- Şifre bilgisi API'den döndürülmez
- Güvenlik için production'da bu özellikler devre dışıdır

