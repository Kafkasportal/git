# Dernek Yönetim Sistemi - API Dokumentasyonu

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Kimlik Doğrulama ve Yetkilendirme](#kimlik-doğrulama-ve-yetkilendirme)
- [API Yapısı](#api-yapısı)
- [Hata Yönetimi](#hata-yönetimi)
- [Hız Sınırlandırması](#hız-sınırlandırması)
- [Endpoint Kategorileri](#endpoint-kategorileri)
- [Örnek İstekler](#örnek-istekler)

---

## Genel Bakış

Dernek Yönetim Sistemi, kapsamlı bir REST API'si sunmaktadır. API, Next.js 16 ve Appwrite üzerine inşa edilmiştir ve 97+ endpoint içermektedir.

### Temel Bilgiler

- **Base URL**: `https://your-domain.com/api`
- **API Version**: v1
- **Response Format**: JSON
- **Authentication**: Session-based (Cookie) veya Bearer Token
- **Rate Limiting**: 100 requests / 15 minutes (default)

### Desteklenen HTTP Metotları

- `GET` - Veri alma
- `POST` - Yeni kayıt oluşturma
- `PUT` - Tam güncelleme
- `PATCH` - Kısmi güncelleme
- `DELETE` - Veri silme

---

## Kimlik Doğrulama ve Yetkilendirme

### Oturum Yönetimi

Sistem, HMAC imzalı session cookie'leri kullanır:

```typescript
// Session Cookie Yapısı
interface AuthSession {
  sessionId: string;
  userId: string;
  expire?: string;  // ISO 8601 format
}

// Serialized Format: base64url.payload.signature
```

### Oturum Kurma

#### POST /api/auth/login

Kullanıcı kimlik bilgileri ile oturum açar.

**İstek Parametreleri:**

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "rememberMe": false
}
```

**Başarılı Yanıt (200):**

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Kullanıcı Adı",
    "role": "Dernek Başkanı",
    "permissions": ["beneficiaries", "donations", "settings"],
    "isActive": true
  },
  "sessionId": "session-id"
}
```

**Hata Yanıtları:**

```json
{
  "success": false,
  "error": "Email veya şifre hatalı",
  "code": "INVALID_CREDENTIALS"
}
```

```json
{
  "success": false,
  "error": "Hesap geçici olarak kilitlendi. 15 dakika sonra tekrar deneyin.",
  "locked": true,
  "remainingSeconds": 900,
  "code": "ACCOUNT_LOCKED"
}
```

#### POST /api/auth/logout

Oturumu sonlandırır.

**Başarılı Yanıt (200):**

```json
{
  "success": true,
  "message": "Oturum sonlandırıldı"
}
```

#### GET /api/auth/session

Mevcut oturum bilgisini döndürür.

**Başarılı Yanıt (200):**

```json
{
  "success": true,
  "session": {
    "sessionId": "session-id",
    "userId": "user-id",
    "expire": "2025-12-14T18:45:00Z"
  }
}
```

#### GET /api/auth/user

Mevcut kullanıcının profil bilgisini döndürür.

**Başarılı Yanıt (200):**

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Kullanıcı Adı",
    "role": "Yönetici",
    "permissions": ["beneficiaries", "donations", "scholarships"],
    "isActive": true
  }
}
```

### İki Faktörlü Kimlik Doğrulama (2FA)

#### POST /api/auth/2fa/setup

2FA kurulumunu başlatır.

**Başarılı Yanıt (200):**

```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "backupCodes": ["code-1", "code-2", "code-3"]
}
```

### CSRF Koruması

Tüm mutating işlemler (POST, PUT, PATCH, DELETE) için CSRF token gereklidir.

#### GET /api/csrf

CSRF token alır.

**Başarılı Yanıt (200):**

```json
{
  "token": "csrf-token-value"
}
```

**İstek Header'ları:**

```
X-CSRF-Token: csrf-token-value
Cookie: csrf-token=csrf-token-value
```

### İzin Sistemi

Sistem rol ve izin tabanlı erişim kontrolü (RBAC) kullanır.

**Modül İzinleri:**

- `beneficiaries` - Yardımcı yönetimi
- `donations` - Bağış yönetimi
- `scholarships` - Burs yönetimi
- `aid_applications` - Yardım başvuruları
- `finance` - Mali yönetim
- `workflow` - İş akışı
- `messages` - Mesajlaşma
- `reports` - Raporlar
- `partners` - Ortak yönetimi
- `settings` - Sistem ayarları

**Özel İzinler:**

- `users_manage` - Kullanıcı yönetimi (Admin)
- `audit_logs` - Denetim günlükleri (Admin)

**Rol ve İzin Eşleştirmesi:**

```typescript
{
  "Dernek Başkanı": ["all_modules", "users_manage"],
  "Yönetici": ["all_modules"],
  "Personel": ["beneficiaries", "donations", "messages"],
  "Görüntüleyici": ["beneficiaries", "donations", "reports"]
}
```

---

## API Yapısı

### Standart Yanıt Formatı

**Başarılı Yanıt:**

```json
{
  "success": true,
  "data": {
    "id": "record-id",
    "name": "value",
    "createdAt": "2025-12-14T10:00:00Z",
    "updatedAt": "2025-12-14T12:00:00Z"
  }
}
```

**Liste Yanıtı:**

```json
{
  "success": true,
  "data": [
    {"id": "1", "name": "Item 1"},
    {"id": "2", "name": "Item 2"}
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Sorgu Parametreleri

Tüm liste endpoint'ları şu parametreleri destekler:

| Parameter | Tip | Açıklama |
|-----------|-----|----------|
| `page` | number | Sayfa numarası (default: 1) |
| `limit` | number | Sayfa başı kayıt sayısı (default: 20, max: 100) |
| `search` | string | Tam metni arama |
| `sortBy` | string | Sıralama alanı (örn: `name`, `-createdAt`) |
| `filters` | JSON | Filtreler (format: `{"field":"value"}`) |

**Örnek İstek:**

```
GET /api/beneficiaries?page=2&limit=25&search=ali&sortBy=-createdAt&filters={"status":"AKTIF"}
```

### Pagination

```json
{
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "pages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

---

## Hata Yönetimi

### HTTP Durum Kodları

| Kod | Anlamı | Açıklama |
|-----|--------|----------|
| 200 | OK | İstek başarılı |
| 201 | Created | Kayıt oluşturuldu |
| 204 | No Content | Başarılı ancak içerik yok |
| 400 | Bad Request | Hatalı parametre |
| 401 | Unauthorized | Kimlik doğrulama gerekli |
| 403 | Forbidden | Yetki yok |
| 404 | Not Found | Kayıt bulunamadı |
| 429 | Too Many Requests | Hız sınırı aşıldı |
| 500 | Internal Server Error | Sunucu hatası |

### Hata Yanıtı Formatı

```json
{
  "success": false,
  "error": "Hata açıklaması",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "message": "Alan hatası"
  }
}
```

### Genel Hata Kodları

| Kod | HTTP | Açıklama |
|-----|------|----------|
| `INVALID_CREDENTIALS` | 401 | Email veya şifre hatalı |
| `ACCOUNT_LOCKED` | 429 | Çok fazla başarısız deneme |
| `UNAUTHORIZED` | 401 | Oturum açılı değil |
| `FORBIDDEN` | 403 | Bu işlem için izin yok |
| `NOT_FOUND` | 404 | Kayıt bulunamadı |
| `VALIDATION_ERROR` | 400 | Doğrulama hatası |
| `DUPLICATE_ENTRY` | 400 | Benzersiz alan çakışması |
| `INVALID_CSRF` | 403 | CSRF token doğrulaması başarısız |

---

## Hız Sınırlandırması

Sistem, kötüye kullanımı önlemek için hız sınırlandırması uygular.

### Varsayılan Limitler

| Endpoint | Limit | Pencere |
|----------|-------|--------|
| Genel API | 100 | 15 dakika |
| Login | 5 | 15 dakika |
| Dosya Upload | 50 | 1 saat |
| Arama | 200 | 15 dakika |

### Hız Sınırı Header'ları

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1702564500000
```

### Hız Sınırı Aşıldığında

**Yanıt (429 Too Many Requests):**

```json
{
  "success": false,
  "error": "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.",
  "retryAfter": 900
}
```

---

## Endpoint Kategorileri

### 1. Yardımcı Yönetimi (10+ endpoints)

#### GET /api/beneficiaries

Yardımcı listesini alır.

**Parametreler:**
- `page` (number)
- `limit` (number)
- `search` (string)
- `status` (string): AKTIF, PASIF, TASLAK
- `city` (string)
- `sortBy` (string): name, createdAt

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "beneficiary-id",
      "name": "Ali Yılmaz",
      "tcNo": "12345678901",
      "phone": "+90 555 123 4567",
      "email": "ali@example.com",
      "address": "Ankara, Keçiören",
      "status": "AKTIF",
      "familySize": 4,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {"total": 50, "page": 1, "limit": 20}
}
```

#### POST /api/beneficiaries

Yeni yardımcı kaydı oluşturur.

**İstek Body:**
```json
{
  "name": "Ali Yılmaz",
  "tcNo": "12345678901",
  "phone": "+90 555 123 4567",
  "email": "ali@example.com",
  "address": "Ankara, Keçiören",
  "city": "Ankara",
  "district": "Keçiören",
  "familySize": 4
}
```

#### GET /api/beneficiaries/{id}

Yardımcı detaylarını alır.

#### PUT /api/beneficiaries/{id}

Yardımcı bilgisini günceller.

#### DELETE /api/beneficiaries/{id}

Yardımcı kaydını siler.

#### GET /api/beneficiaries/{id}/documents

Yardımcının dosyalarını listeler.

#### POST /api/beneficiaries/{id}/family

Aile üyesi ekler.

#### GET /api/beneficiaries/{id}/family

Aile üyelerini listeler.

#### POST /api/beneficiaries/bulk

Toplu yardımcı oluşturur.

#### POST /api/beneficiaries/bulk-delete

Toplu silme işlemi.

#### POST /api/beneficiaries/bulk-update-status

Toplu durum güncelleme.

#### GET /api/beneficiaries/map-data

Harita verisi alır.

### 2. Bağış Yönetimi (9+ endpoints)

#### GET /api/donations

Bağış listesini alır.

**Parametreler:**
- `status` (string): AKTIF, İPTAL
- `donorType` (string): BIREY, KURUM
- `dateFrom`, `dateTo` (string): ISO 8601 format

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "donation-id",
      "amount": 5000,
      "currency": "TRY",
      "donorName": "Ahmet Demir",
      "donorEmail": "ahmet@example.com",
      "donorType": "BIREY",
      "donationDate": "2025-12-10T14:30:00Z",
      "status": "AKTIF",
      "description": "Yıllık bağış"
    }
  ]
}
```

#### POST /api/donations

Yeni bağış kaydı oluşturur.

#### GET /api/donations/{id}

Bağış detaylarını alır.

#### PUT /api/donations/{id}

Bağış bilgisini günceller.

#### DELETE /api/donations/{id}

Bağış kaydını siler.

#### GET /api/donations/stats

Bağış istatistiklerini alır.

```json
{
  "success": true,
  "data": {
    "totalAmount": 500000,
    "totalDonations": 150,
    "averageAmount": 3333.33,
    "donationsByMonth": [
      {"month": "2025-11", "total": 45000},
      {"month": "2025-12", "total": 52000}
    ]
  }
}
```

#### POST /api/donations/bulk

Toplu bağış kaydı.

#### POST /api/donations/bulk-delete

Toplu silme.

### 3. Burs Yönetimi (5+ endpoints)

#### GET /api/scholarships

Burs listesini alır.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "scholarship-id",
      "studentName": "Fatma Yüksel",
      "studentEmail": "fatma@example.com",
      "degree": "Lisans",
      "university": "Ankara Üniversitesi",
      "faculty": "İktisadi İdari Bilimler",
      "monthlyAmount": 1500,
      "status": "AKTIF",
      "startDate": "2025-09-01"
    }
  ]
}
```

#### POST /api/scholarships

Yeni burs kaydı oluşturur.

#### GET /api/scholarships/{id}

Burs detaylarını alır.

#### PUT /api/scholarships/{id}

Burs bilgisini günceller.

#### GET /api/scholarships/statistics

Burs istatistiklerini alır.

### 4. Mali Yönetim (6+ endpoints)

#### GET /api/finance

Mali kayıtları listeler.

**Parametreler:**
- `type` (string): GELİR, GİDER
- `category` (string): Bağış, Burs, Vergi, vb.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "finance-id",
      "type": "GELİR",
      "category": "Bağış",
      "amount": 5000,
      "description": "Bağışçı: Ahmet Demir",
      "date": "2025-12-10T14:30:00Z"
    }
  ]
}
```

#### POST /api/finance

Yeni mali kayıt oluşturur.

#### GET /api/finance/{id}

Mali kayıt detaylarını alır.

#### PUT /api/finance/{id}

Mali kayıt günceller.

#### GET /api/finance/stats

Mali istatistikler.

#### GET /api/finance/monthly

Aylık mali rapor.

### 5. Kullanıcı Yönetimi (5+ endpoints)

#### GET /api/users

Kullanıcı listesini alır. (Admin)

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "Kullanıcı Adı",
      "role": "Yönetici",
      "permissions": ["beneficiaries", "donations"],
      "isActive": true,
      "lastLogin": "2025-12-14T10:30:00Z"
    }
  ]
}
```

#### POST /api/users

Yeni kullanıcı oluşturur. (Admin)

#### GET /api/users/{id}

Kullanıcı detaylarını alır. (Admin)

#### PUT /api/users/{id}

Kullanıcı bilgisini günceller. (Admin)

#### POST /api/users/batch

Toplu kullanıcı işlemleri. (Admin)

### 6. Mesajlaşma (4+ endpoints)

#### GET /api/messages

Mesaj listesini alır.

#### POST /api/messages

Yeni mesaj gönderi.

#### GET /api/messages/{id}

Mesaj detaylarını alır.

#### POST /api/messages/send-bulk

Toplu mesaj gönderimi.

### 7. Toplantı Yönetimi (6+ endpoints)

#### GET /api/meetings

Toplantı listesini alır.

#### POST /api/meetings

Yeni toplantı oluşturur.

#### GET /api/meetings/{id}

Toplantı detaylarını alır.

#### PUT /api/meetings/{id}

Toplantı günceller.

#### GET /api/meetings/upcoming

Yaklaşan toplantılar.

#### POST /api/meeting-decisions

Toplantı kararını kayıt eder.

### 8. Görev Yönetimi (5+ endpoints)

#### GET /api/tasks

Görev listesini alır.

#### POST /api/tasks

Yeni görev oluşturur.

#### GET /api/tasks/{id}

Görev detaylarını alır.

#### PUT /api/tasks/{id}

Görev günceller.

#### POST /api/tasks/bulk-assign

Toplu görev atama.

### 9. Ayarlar (6+ endpoints)

#### GET /api/settings/all

Tüm ayarları alır.

#### GET /api/settings/{category}

Kategori ayarlarını alır.

#### GET /api/settings/{category}/{key}

Spesifik ayarı alır.

#### PUT /api/settings/{category}/{key}

Ayarı günceller.

#### GET /api/settings/theme-presets

Tema ayarlarını alır.

#### POST /api/settings/theme-presets

Yeni tema kaydeder.

### 10. Dosya Yükleme (3+ endpoints)

#### POST /api/storage/upload

Dosya yükler.

**Form Data:**
```
Content-Type: multipart/form-data

file: <binary file>
bucketId: <bucket-id>
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "fileId": "file-id",
    "fileName": "document.pdf",
    "size": 102400,
    "uploadedAt": "2025-12-14T10:00:00Z"
  }
}
```

#### GET /api/storage/{fileId}

Dosya indir.

#### DELETE /api/storage/{fileId}

Dosya sil.

### 11. Arama (1 endpoint)

#### GET /api/search

Global arama yapır.

**Parametreler:**
- `q` (string): Arama terimi
- `types` (string): Aranacak tip (beneficiaries, donations, vb.)

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "beneficiaries": [...],
    "donations": [...],
    "users": [...]
  }
}
```

### 12. Sağlık Kontrolü (1 endpoint)

#### GET /api/health

Sistem sağlığını kontrol eder. (Public)

**Yanıt:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-14T10:00:00Z",
  "database": "connected",
  "storage": "connected"
}
```

---

## Örnek İstekler

### cURL

#### Login

```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "email": "user@example.com",
    "password": "password",
    "rememberMe": false
  }'
```

#### Yardımcı Listesi

```bash
curl -X GET "https://your-domain.com/api/beneficiaries?page=1&limit=20&status=AKTIF" \
  -H "Cookie: auth-session=your-session-cookie"
```

#### Yeni Bağış Kaydı

```bash
curl -X POST https://your-domain.com/api/donations \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -H "Cookie: auth-session=your-session-cookie" \
  -d '{
    "amount": 5000,
    "currency": "TRY",
    "donorName": "Ahmet Demir",
    "donorEmail": "ahmet@example.com",
    "donorType": "BIREY"
  }'
```

### JavaScript/Fetch

```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
  }),
  credentials: 'include',
});

const loginData = await loginResponse.json();

// Get Beneficiaries
const beneficiariesResponse = await fetch(
  '/api/beneficiaries?page=1&limit=20&status=AKTIF',
  {
    method: 'GET',
    credentials: 'include',
  }
);

const beneficiaries = await beneficiariesResponse.json();

// Create Donation
const donationResponse = await fetch('/api/donations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'TRY',
    donorName: 'Ahmet Demir',
    donorEmail: 'ahmet@example.com',
  }),
  credentials: 'include',
});

const donation = await donationResponse.json();
```

### TypeScript (API Client)

```typescript
import { apiClient } from '@/lib/api-client';

// Login
const user = await apiClient.auth.login({
  email: 'user@example.com',
  password: 'password',
});

// Get Beneficiaries
const { data: beneficiaries } = await apiClient.beneficiaries.list({
  page: 1,
  limit: 20,
  status: 'AKTIF',
});

// Create Donation
const newDonation = await apiClient.donations.create({
  amount: 5000,
  currency: 'TRY',
  donorName: 'Ahmet Demir',
  donorEmail: 'ahmet@example.com',
});
```

---

## API Sürüm Yönetimi

API'nin geriye uyumluluğu sağlamak için, breaking changes genellikle yeni sürüm numarası ile gelir.

Mevcut sürüm: **v1**

Gelecek sürümlerde, `/api/v2/` gibi route'lar kullanılacaktır.

---

## Destek ve Hata Bildirimi

API kullanırken sorunla karşılaştıysanız:

1. Hata kodunu ve açıklamasını not alın
2. İstek body'sini ve parametrelerini kontrol edin
3. Kimlik doğrulama ve izinlerinizi doğrulayın
4. Sistem belgelerine (docs/) bakın
5. GitHub issues'da bildirin veya destek ekibiyle iletişime geçin

---

## Revizyon Tarihi

| Tarih | Versiyon | Değişiklik |
|-------|----------|-----------|
| 2025-12-14 | 1.0 | İlk versiyon |

---

*Son güncelleme: 2025-12-14*
