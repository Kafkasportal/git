# API Documentation

Dernek Yönetim Sistemi REST API dokümantasyonu.

## 📋 Genel Bilgiler

- **Base URL**: `https://your-domain.com/api`
- **Authentication**: Session-based (CSRF token gerekli)
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests / 15 minutes (varsayılan)

## 🔐 Authentication

Çoğu endpoint authentication gerektirir. Session cookie ve CSRF token kullanılır.

### CSRF Token Alma

```http
GET /api/csrf
```

Response:
```json
{
  "token": "csrf-token-string"
}
```

## 📚 Endpoint Kategorileri

### Authentication & Users

#### `GET /api/auth/user`
Mevcut kullanıcı bilgilerini getirir.

#### `POST /api/auth/login`
Kullanıcı girişi.

Request Body:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### `POST /api/auth/logout`
Kullanıcı çıkışı.

#### `GET /api/auth/session`
Session bilgilerini getirir.

---

### Beneficiaries (İhtiyaç Sahipleri)

#### `GET /api/beneficiaries`
Tüm ihtiyaç sahiplerini listeler.

Query Parameters:
- `search`: Arama metni
- `status`: Durum filtresi
- `limit`: Sayfa başına kayıt (default: 100)
- `offset`: Sayfa offset (default: 0)

#### `GET /api/beneficiaries/[id]`
Belirli bir ihtiyaç sahibini getirir.

#### `POST /api/beneficiaries`
Yeni ihtiyaç sahibi oluşturur.

#### `PUT /api/beneficiaries/[id]`
İhtiyaç sahibi bilgilerini günceller.

#### `DELETE /api/beneficiaries/[id]`
İhtiyaç sahibini siler.

#### `POST /api/beneficiaries/bulk-delete`
Toplu silme işlemi.

#### `POST /api/beneficiaries/bulk-update-status`
Toplu durum güncelleme.

---

### Donations (Bağışlar)

#### `GET /api/donations`
Tüm bağışları listeler.

Query Parameters:
- `status`: Durum filtresi
- `dateFrom`: Başlangıç tarihi
- `dateTo`: Bitiş tarihi
- `donorId`: Bağışçı ID'si
- `limit`: Sayfa başına kayıt
- `offset`: Sayfa offset

#### `GET /api/donations/[id]`
Belirli bir bağışı getirir.

#### `POST /api/donations`
Yeni bağış oluşturur.

#### `PUT /api/donations/[id]`
Bağış bilgilerini günceller.

#### `DELETE /api/donations/[id]`
Bağışı siler.

#### `GET /api/donations/stats`
Bağış istatistikleri.

#### `POST /api/donations/bulk-delete`
Toplu silme.

#### `POST /api/donations/bulk-update-status`
Toplu durum güncelleme.

---

### Scholarships (Burslar)

#### `GET /api/scholarships`
Tüm bursları listeler.

#### `GET /api/scholarships/[id]`
Belirli bir bursu getirir.

#### `POST /api/scholarships`
Yeni burs oluşturur.

#### `PUT /api/scholarships/[id]`
Burs bilgilerini günceller.

#### `DELETE /api/scholarships/[id]`
Bursu siler.

#### `GET /api/scholarships/statistics`
Burs istatistikleri.

---

### Finance (Finans)

#### `GET /api/finance`
Finans kayıtlarını listeler.

Query Parameters:
- `record_type`: `income` | `expense`
- `status`: `pending` | `approved` | `rejected`
- `dateFrom`: Başlangıç tarihi
- `dateTo`: Bitiş tarihi
- `category`: Kategori filtresi

#### `GET /api/finance/[id]`
Belirli bir finans kaydını getirir.

#### `POST /api/finance`
Yeni finans kaydı oluşturur.

#### `PUT /api/finance/[id]`
Finans kaydını günceller.

#### `DELETE /api/finance/[id]`
Finans kaydını siler.

#### `GET /api/finance/metrics`
Finans metrikleri.

#### `GET /api/finance/monthly`
Aylık finans raporu.

#### `GET /api/financial/stats`
Finansal istatistikler.

---

### Meetings (Toplantılar)

#### `GET /api/meetings`
Tüm toplantıları listeler.

#### `GET /api/meetings/[id]`
Belirli bir toplantıyı getirir.

#### `POST /api/meetings`
Yeni toplantı oluşturur.

#### `PUT /api/meetings/[id]`
Toplantı bilgilerini günceller.

#### `DELETE /api/meetings/[id]`
Toplantıyı siler.

#### `GET /api/meetings/upcoming`
Yaklaşan toplantılar.

---

### Messages (Mesajlar)

#### `GET /api/messages`
Tüm mesajları listeler.

#### `GET /api/messages/[id]`
Belirli bir mesajı getirir.

#### `POST /api/messages`
Yeni mesaj oluşturur.

#### `PUT /api/messages/[id]`
Mesaj bilgilerini günceller.

#### `DELETE /api/messages/[id]`
Mesajı siler.

#### `POST /api/messages/send-bulk`
Toplu mesaj gönderimi.

---

### Todos & Tasks

#### `GET /api/todos`
Tüm todo'ları listeler.

Query Parameters:
- `completed`: Tamamlanma durumu
- `priority`: Öncelik seviyesi
- `created_by`: Oluşturan kullanıcı ID'si
- `tags`: Etiket filtresi
- `search`: Arama metni

#### `GET /api/todos/[id]`
Belirli bir todo'yu getirir.

#### `POST /api/todos`
Yeni todo oluşturur.

Request Body:
```json
{
  "title": "Todo başlığı",
  "description": "Açıklama",
  "priority": "normal",
  "due_date": "2024-12-31",
  "tags": ["tag1", "tag2"],
  "is_read": false,
  "created_by": "user-id"
}
```

#### `PUT /api/todos/[id]`
Todo bilgilerini günceller.

#### `DELETE /api/todos/[id]`
Todo'yu siler.

---

### Storage (Dosya Yönetimi)

#### `GET /api/storage`
Dosyaları listeler.

Query Parameters:
- `beneficiaryId`: İhtiyaç sahibi ID'si
- `bucket`: Bucket adı (`documents`, `avatars`, `receipts`)
- `documentType`: Belge tipi

#### `GET /api/storage/[fileId]`
Dosyayı indirir.

#### `POST /api/storage/upload`
Dosya yükler.

Request: `multipart/form-data`
- `file`: Dosya
- `beneficiaryId`: İhtiyaç sahibi ID'si (opsiyonel)
- `bucket`: Bucket adı
- `documentType`: Belge tipi

---

### Monitoring & Analytics

#### `GET /api/health`
Sistem sağlık durumu.

Query Parameters:
- `detailed`: Detaylı bilgi için `true`

#### `GET /api/monitoring/stats`
Sistem istatistikleri.

#### `GET /api/monitoring/kpis`
KPI metrikleri.

#### `GET /api/monitoring/rate-limit`
Rate limit durumu.

Query Parameters:
- `action`: `stats` | `violations` | `ip-stats` | `export` | `reset`

#### `GET /api/analytics`
Analitik verileri.

#### `GET /api/dashboard/charts`
Dashboard grafik verileri.

---

### Settings

#### `GET /api/settings`
Tüm ayarları getirir.

#### `GET /api/settings/[category]`
Kategoriye göre ayarları getirir.

#### `GET /api/settings/[category]/[key]`
Belirli bir ayarı getirir.

#### `PUT /api/settings/[category]/[key]`
Ayarı günceller.

---

### Errors

#### `GET /api/errors`
Hata kayıtlarını listeler.

#### `GET /api/errors/[id]`
Belirli bir hatayı getirir.

#### `POST /api/errors`
Yeni hata kaydı oluşturur.

#### `GET /api/errors/stats`
Hata istatistikleri.

---

## 📝 Response Format

### Başarılı Response

```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

### Hata Response

```json
{
  "success": false,
  "error": "Hata mesajı",
  "details": { ... }
}
```

## 🔒 Rate Limiting

Rate limiting varsayılan olarak:
- **100 requests** / **15 dakika** (900000ms)

Rate limit aşıldığında:
- HTTP Status: `429 Too Many Requests`
- Response Header: `X-RateLimit-Remaining: 0`
- Response Header: `X-RateLimit-Reset: timestamp`

## 📊 Pagination

Liste endpoint'leri pagination destekler:

Query Parameters:
- `limit`: Sayfa başına kayıt sayısı (default: 100, max: 1000)
- `offset`: Başlangıç noktası (default: 0)

Response:
```json
{
  "success": true,
  "data": [ ... ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

## 🔍 Filtering & Search

Çoğu liste endpoint'i filtreleme ve arama destekler:

- `search`: Genel arama metni
- `status`: Durum filtresi
- `dateFrom` / `dateTo`: Tarih aralığı
- `category`: Kategori filtresi

## 📦 Error Codes

- `400`: Bad Request - Geçersiz istek
- `401`: Unauthorized - Authentication gerekli
- `403`: Forbidden - Yetki yetersiz
- `404`: Not Found - Kayıt bulunamadı
- `429`: Too Many Requests - Rate limit aşıldı
- `500`: Internal Server Error - Sunucu hatası

## 🔗 Webhooks

### `POST /api/webhooks/donation-created`
Bağış oluşturulduğunda tetiklenir.

### `POST /api/webhooks/error-logged`
Hata kaydedildiğinde tetiklenir.

### `POST /api/webhooks/telegram-notify`
Telegram bildirimi gönderir.

## 📡 Real-time Notifications

### `GET /api/notifications/stream`
Server-Sent Events (SSE) ile gerçek zamanlı bildirimler.

Event Types:
- `connected`: Bağlantı kuruldu
- `notification`: Yeni bildirim
- `heartbeat`: Bağlantı kontrolü
- `error`: Hata mesajı

## 🧪 Test Endpoints

### `GET /api/auth/test-login`
Test için hızlı login (development only).

### `GET /api/auth/dev-login`
Development login endpoint.

### `POST /api/messages/test`
Test mesajı gönderimi.

---

## 📚 Örnek Kullanımlar

### JavaScript/TypeScript

```typescript
// CSRF token al
const csrfResponse = await fetch('/api/csrf');
const { token } = await csrfResponse.json();

// Authenticated request
const response = await fetch('/api/beneficiaries', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
  },
  credentials: 'include',
});

const data = await response.json();
```

### cURL

```bash
# CSRF token al
CSRF_TOKEN=$(curl -s http://localhost:3000/api/csrf | jq -r '.token')

# Authenticated request
curl -X GET http://localhost:3000/api/beneficiaries \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

---

Daha fazla bilgi için [README.md](README.md) dosyasına bakın.

