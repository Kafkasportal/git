# 📡 API Referansı

Bu döküman, Dernek Yönetim Sistemi'nin tüm API endpoint'lerini detaylı olarak açıklar.

## 🔑 Kimlik Doğrulama

Tüm protected API'ler HttpOnly cookie tabanlı session kullanır.

### `POST /api/auth/login`

Kullanıcı girişi.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "Kullanıcı Adı",
      "email": "user@example.com",
      "role": "Yönetici",
      "permissions": ["beneficiaries:access", "donations:access"]
    },
    "session": {
      "expire": "2024-12-31T23:59:59.000Z"
    }
  }
}
```

### `POST /api/auth/logout`

Oturumu sonlandırır.

**Headers:**
```
x-csrf-token: <csrf_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Çıkış yapıldı"
}
```

### `GET /api/auth/user`

Mevcut kullanıcı bilgilerini döner.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "Kullanıcı Adı",
    "email": "user@example.com",
    "role": "Yönetici",
    "permissions": ["beneficiaries:access", "donations:access"],
    "avatar": null,
    "isActive": true
  }
}
```

### `GET /api/csrf`

CSRF token alır.

**Response:**
```json
{
  "success": true,
  "token": "csrf_token_value"
}
```

---

## 👥 İhtiyaç Sahipleri (Beneficiaries)

### `GET /api/beneficiaries`

İhtiyaç sahiplerini listeler.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `page` | number | Sayfa numarası |
| `limit` | number | Sayfa başına kayıt (max: 100) |
| `search` | string | İsim araması |
| `status` | string | Durum filtresi (TASLAK, AKTIF, PASIF, SILINDI) |
| `city` | string | Şehir filtresi |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "$id": "beneficiary_id",
      "name": "Ahmet Yılmaz",
      "tc_no": "12345678901",
      "phone": "5551234567",
      "address": "...",
      "city": "İstanbul",
      "district": "Kadıköy",
      "status": "AKTIF",
      "family_size": 4,
      "$createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "25 kayıt bulundu"
}
```

### `GET /api/beneficiaries/:id`

Tekil ihtiyaç sahibi detayı.

**Response:**
```json
{
  "success": true,
  "data": {
    "$id": "beneficiary_id",
    "name": "Ahmet Yılmaz",
    "tc_no": "12345678901",
    "phone": "5551234567",
    "email": "ahmet@example.com",
    "birth_date": "1985-05-15",
    "gender": "Erkek",
    "marital_status": "Evli",
    "address": "...",
    "city": "İstanbul",
    "district": "Kadıköy",
    "neighborhood": "Caferağa",
    "family_size": 4,
    "children_count": 2,
    "income_level": "Düşük",
    "housing_type": "Kiracı",
    "health_status": "İyi",
    "status": "AKTIF",
    "notes": "..."
  }
}
```

### `POST /api/beneficiaries`

Yeni ihtiyaç sahibi oluşturur.

**Headers:**
```
Content-Type: application/json
x-csrf-token: <csrf_token>
```

**Request:**
```json
{
  "name": "Ahmet Yılmaz",
  "tc_no": "12345678901",
  "phone": "5551234567",
  "address": "Örnek Mahallesi, Örnek Sokak No:1",
  "city": "İstanbul",
  "district": "Kadıköy",
  "neighborhood": "Caferağa",
  "family_size": 4,
  "status": "TASLAK"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "$id": "new_beneficiary_id", ... },
  "message": "İhtiyaç sahibi başarıyla oluşturuldu"
}
```

### `PUT /api/beneficiaries/:id`

İhtiyaç sahibini günceller.

### `DELETE /api/beneficiaries/:id`

İhtiyaç sahibini siler.

---

## 💝 Bağışlar (Donations)

### `GET /api/donations`

Bağış listesi.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `page` | number | Sayfa numarası |
| `limit` | number | Sayfa başına kayıt |
| `status` | string | pending, completed, cancelled |
| `search` | string | Bağışçı adı araması |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "$id": "donation_id",
      "donor_name": "Mehmet Kaya",
      "donor_phone": "5559876543",
      "amount": 1000,
      "currency": "TRY",
      "donation_type": "Nakdi",
      "payment_method": "Havale",
      "donation_purpose": "Genel Bağış",
      "receipt_number": "BGS-2024-001",
      "status": "completed",
      "$createdAt": "2024-01-20T14:00:00.000Z"
    }
  ]
}
```

### `POST /api/donations`

Yeni bağış kaydı.

**Request:**
```json
{
  "donor_name": "Mehmet Kaya",
  "donor_phone": "5559876543",
  "donor_email": "mehmet@example.com",
  "amount": 1000,
  "currency": "TRY",
  "donation_type": "Nakdi",
  "payment_method": "Havale",
  "donation_purpose": "Genel Bağış",
  "receipt_number": "BGS-2024-001",
  "notes": "Aylık düzenli bağış"
}
```

### `GET /api/donations/stats`

Bağış istatistikleri.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_count": 150,
    "total_amount": 250000,
    "this_month": 35000,
    "pending_count": 5,
    "by_type": {
      "Nakdi": 180000,
      "Ayni": 70000
    }
  }
}
```

---

## 📝 Yardım Başvuruları (Aid Applications)

### `GET /api/aid-applications`

Başvuru listesi.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `stage` | string | draft, under_review, approved, ongoing, completed |
| `beneficiary_id` | string | İhtiyaç sahibi filtresi |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "$id": "application_id",
      "application_date": "2024-01-15",
      "applicant_type": "person",
      "applicant_name": "Ahmet Yılmaz",
      "beneficiary_id": "beneficiary_id",
      "one_time_aid": 500,
      "regular_financial_aid": 1000,
      "stage": "approved",
      "status": "open"
    }
  ]
}
```

---

## 📊 Finans (Finance)

### `GET /api/finance`

Finans kayıtları.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `record_type` | string | income, expense |
| `created_by` | string | Oluşturan kullanıcı ID |

### `GET /api/finance/metrics`

Finansal metrikler.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_income": 500000,
    "total_expense": 350000,
    "balance": 150000,
    "this_month_income": 45000,
    "this_month_expense": 30000
  }
}
```

### `GET /api/finance/monthly`

Aylık gelir/gider dağılımı.

---

## 📅 Toplantılar (Meetings)

### `GET /api/meetings`

Toplantı listesi.

### `GET /api/meetings/upcoming`

Yaklaşan toplantılar.

### `POST /api/meetings`

Yeni toplantı.

**Request:**
```json
{
  "title": "Aylık Yönetim Kurulu Toplantısı",
  "description": "Ocak ayı değerlendirmesi",
  "meeting_date": "2024-02-01T14:00:00.000Z",
  "location": "Merkez Ofis",
  "meeting_type": "board",
  "participants": ["user_id_1", "user_id_2"],
  "agenda": "1. Açılış\n2. Geçen ay değerlendirmesi\n..."
}
```

### `GET /api/meeting-decisions`

Toplantı kararları.

### `GET /api/meeting-action-items`

Görev atamaları.

---

## ✅ Görevler (Tasks)

### `GET /api/tasks`

Görev listesi.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `assigned_to` | string | Atanan kişi ID |
| `created_by` | string | Oluşturan kişi ID |
| `status` | string | pending, in_progress, completed, cancelled |

### `POST /api/tasks`

Yeni görev.

**Request:**
```json
{
  "title": "Bağışçı raporu hazırla",
  "description": "Ocak ayı bağışçı listesi ve detayları",
  "assigned_to": "user_id",
  "priority": "high",
  "due_date": "2024-01-25"
}
```

---

## 👤 Kullanıcılar (Users)

### `GET /api/users`

Kullanıcı listesi.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `role` | string | Rol filtresi |
| `isActive` | boolean | Aktiflik durumu |
| `search` | string | İsim araması |

### `POST /api/users`

Yeni kullanıcı.

**Request:**
```json
{
  "name": "Yeni Kullanıcı",
  "email": "yeni@example.com",
  "password": "SecurePassword123!",
  "role": "Personel",
  "permissions": ["beneficiaries:access", "donations:access"],
  "phone": "5551234567"
}
```

### `POST /api/users/batch`

Toplu kullanıcı işlemleri.

---

## 💬 Mesajlar (Messages)

### `GET /api/messages`

Mesaj listesi.

### `POST /api/messages`

Yeni mesaj.

**Request:**
```json
{
  "message_type": "email",
  "recipients": ["recipient@example.com"],
  "subject": "Bilgilendirme",
  "content": "Mesaj içeriği...",
  "is_bulk": false
}
```

### `POST /api/messages/send-bulk`

Toplu mesaj gönderimi.

---

## 📁 Dosya Yönetimi (Storage)

### `POST /api/storage/upload`

Dosya yükleme.

**Request:** `multipart/form-data`
| Alan | Tip | Açıklama |
|------|-----|----------|
| `file` | File | Yüklenecek dosya |
| `bucket` | string | Bucket ID (documents, avatars, receipts) |

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_id",
    "name": "document.pdf",
    "size": 102400,
    "mimeType": "application/pdf"
  }
}
```

### `GET /api/storage/:fileId`

Dosya bilgisi.

### `DELETE /api/storage/:fileId`

Dosya silme.

---

## ⚙️ Ayarlar (Settings)

### `GET /api/settings/all`

Tüm ayarlar.

### `GET /api/settings/:category`

Kategori bazlı ayarlar.

**Kategoriler:**
- `theme` - Tema ayarları
- `branding` - Marka ayarları
- `communication` - İletişim ayarları
- `security` - Güvenlik ayarları

### `PUT /api/settings/:category`

Ayar güncelleme.

**Request:**
```json
{
  "primary_color": "#3b82f6",
  "sidebar_collapsed": false
}
```

---

## 📊 Analitik & Monitoring

### `GET /api/analytics`

Analitik verileri.

### `GET /api/monitoring/stats`

Sistem istatistikleri.

### `GET /api/monitoring/kpis`

KPI metrikleri.

### `GET /api/monitoring/rate-limit`

Rate limit durumu.

### `GET /api/health`

Sistem sağlık kontrolü.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `detailed` | boolean | Detaylı bilgi |

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "storage": "connected"
}
```

---

## 🔔 Bildirimler (Notifications)

### `GET /api/workflow-notifications`

Bildirim listesi.

**Query Parameters:**
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `recipient` | string | Alıcı ID |
| `status` | string | beklemede, gonderildi, okundu |
| `category` | string | meeting, gorev, rapor, hatirlatma |

---

## 🚨 Hata Yanıtları

Tüm API'ler tutarlı hata formatı kullanır:

```json
{
  "success": false,
  "error": "Hata mesajı",
  "errors": ["Detaylı hata 1", "Detaylı hata 2"]
}
```

### HTTP Durum Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Yetkisiz |
| 403 | Erişim reddedildi |
| 404 | Bulunamadı |
| 409 | Çakışma (duplicate) |
| 429 | Rate limit aşıldı |
| 500 | Sunucu hatası |

### Rate Limiting

Rate limit aşıldığında:

```json
{
  "success": false,
  "error": "Çok fazla istek. Lütfen bekleyin.",
  "retryAfter": 60
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705750800
```

