<!-- 7230a01e-6f39-4e67-a860-6f519d0cdd02 e752d22b-703a-4d64-9e76-cecf54163b1f -->

# API Route Test Coverage Completion Plan

## Mevcut Durum

- **Tamamlanan Testler:** 30 test dosyası (beneficiaries, donations, finance, kumbara, tasks, meetings)
- **Placeholder Testler:** 5 route (messages, users, partners, todos, aid-applications)
- **Eksik [id] Endpoint Testleri:** 10 route
- **Yeni Route Testleri:** 15+ route

## Öncelik Sırası

### Faz 1: Placeholder Testlerin Gerçek Testlerle Değiştirilmesi (Yüksek Öncelik)

#### 1.1 `/api/messages` Route Testleri

- **Dosya:** `src/__tests__/api/messages.test.ts`
- **Route:** `src/app/api/messages/route.ts`
- **Testler:**
- GET: Liste, filtreleme, pagination
- POST: Mesaj oluşturma, validasyon
- Error handling
- **Tahmini Test Sayısı:** 10-12 test

#### 1.2 `/api/users` Route Testleri

- **Dosya:** `src/__tests__/api/users.test.ts`
- **Route:** `src/app/api/users/route.ts`
- **Testler:**
- GET: Kullanıcı listesi, filtreleme, pagination
- POST: Kullanıcı oluşturma, role/permission validasyonu
- Error handling
- **Tahmini Test Sayısı:** 10-12 test

#### 1.3 `/api/partners` Route Testleri

- **Dosya:** `src/__tests__/api/partners.test.ts`
- **Route:** `src/app/api/partners/route.ts`
- **Testler:**
- GET: Partner listesi, filtreleme
- POST: Partner oluşturma, validasyon
- Error handling
- **Tahmini Test Sayısı:** 8-10 test

#### 1.4 `/api/todos` Route Testleri

- **Dosya:** `src/__tests__/api/todos.test.ts`
- **Route:** `src/app/api/todos/route.ts`
- **Testler:**
- GET: Todo listesi, filtreleme
- POST: Todo oluşturma, validasyon
- Error handling
- **Tahmini Test Sayısı:** 8-10 test

#### 1.5 `/api/aid-applications` Route Testleri

- **Dosya:** `src/__tests__/api/aid-applications.test.ts`
- **Route:** `src/app/api/aid-applications/route.ts`
- **Testler:**
- GET: Başvuru listesi, filtreleme, status filtreleme
- POST: Başvuru oluşturma, validasyon, priority kontrolü
- Error handling
- **Tahmini Test Sayısı:** 10-12 test

### Faz 2: [id] Endpoint Testleri (Orta Öncelik)

#### 2.1 `/api/messages/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/messages-id.test.ts`
- **Route:** `src/app/api/messages/[id]/route.ts`
- **Testler:**
- GET: Tek mesaj getirme, 404
- PUT: Mesaj güncelleme, validasyon
- DELETE: Mesaj silme, 404
- **Tahmini Test Sayısı:** 9-11 test

#### 2.2 `/api/users/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/users-id.test.ts`
- **Route:** `src/app/api/users/[id]/route.ts`
- **Testler:**
- GET: Tek kullanıcı getirme, 404
- PUT: Kullanıcı güncelleme, role/permission validasyonu
- DELETE: Kullanıcı silme, 404
- **Tahmini Test Sayısı:** 9-11 test

#### 2.3 `/api/partners/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/partners-id.test.ts`
- **Route:** `src/app/api/partners/[id]/route.ts`
- **Testler:**
- GET: Tek partner getirme, 404
- PUT: Partner güncelleme, validasyon
- DELETE: Partner silme, 404
- **Tahmini Test Sayısı:** 9-11 test

#### 2.4 `/api/todos/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/todos-id.test.ts`
- **Route:** `src/app/api/todos/[id]/route.ts`
- **Testler:**
- GET: Tek todo getirme, 404
- PUT: Todo güncelleme, validasyon
- DELETE: Todo silme, 404
- **Tahmini Test Sayısı:** 9-11 test

#### 2.5 `/api/aid-applications/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/aid-applications-id.test.ts`
- **Route:** `src/app/api/aid-applications/[id]/route.ts`
- **Testler:**
- GET: Tek başvuru getirme, 404
- PUT: Başvuru güncelleme, status transition validasyonu
- DELETE: Başvuru silme, 404
- **Tahmini Test Sayısı:** 10-12 test

### Faz 3: Yeni Route Testleri (Orta Öncelik)

#### 3.1 `/api/scholarships` Route Testleri

- **Dosya:** `src/__tests__/api/scholarships.test.ts`
- **Route:** `src/app/api/scholarships/route.ts`
- **Testler:**
- GET: Burs listesi, filtreleme
- POST: Burs oluşturma, validasyon
- Error handling
- **Tahmini Test Sayısı:** 10-12 test

#### 3.2 `/api/scholarships/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/scholarships-id.test.ts`
- **Route:** `src/app/api/scholarships/[id]/route.ts`
- **Testler:**
- GET, PUT, DELETE operasyonları
- **Tahmini Test Sayısı:** 9-11 test

#### 3.3 `/api/meeting-action-items` Route Testleri

- **Dosya:** `src/__tests__/api/meeting-action-items.test.ts`
- **Route:** `src/app/api/meeting-action-items/route.ts`
- **Testler:**
- GET: Aksiyon öğeleri listesi
- POST: Aksiyon öğesi oluşturma
- **Tahmini Test Sayısı:** 8-10 test

#### 3.4 `/api/meeting-decisions` Route Testleri

- **Dosya:** `src/__tests__/api/meeting-decisions.test.ts`
- **Route:** `src/app/api/meeting-decisions/route.ts`
- **Testler:**
- GET: Karar listesi
- POST: Karar oluşturma
- **Tahmini Test Sayısı:** 8-10 test

#### 3.5 `/api/workflow-notifications` Route Testleri

- **Dosya:** `src/__tests__/api/workflow-notifications.test.ts`
- **Route:** `src/app/api/workflow-notifications/route.ts`
- **Testler:**
- GET: Bildirim listesi, filtreleme
- POST: Bildirim oluşturma
- **Tahmini Test Sayısı:** 8-10 test

### Faz 4: Sistem/Utility Route Testleri (Düşük Öncelik)

#### 4.1 `/api/errors` Route Testleri (Mevcut testi kontrol et)

- **Dosya:** `src/__tests__/api/errors.test.ts` (varsa güncelle, yoksa oluştur)
- **Route:** `src/app/api/errors/route.ts`
- **Testler:**
- GET: Hata listesi, filtreleme
- POST: Hata kaydı oluşturma
- **Tahmini Test Sayısı:** 6-8 test

#### 4.2 `/api/errors/[id]` Route Testleri

- **Dosya:** `src/__tests__/api/errors-id.test.ts`
- **Route:** `src/app/api/errors/[id]/route.ts`
- **Testler:**
- GET, PUT, DELETE operasyonları
- **Tahmini Test Sayısı:** 8-10 test

#### 4.3 `/api/settings` Route Testleri (Mevcut testi kontrol et)

- **Dosya:** `src/__tests__/api/settings.test.ts` (varsa güncelle, yoksa oluştur)
- **Route:** `src/app/api/settings/route.ts`
- **Testler:**
- GET: Ayarlar getirme
- PUT: Ayarlar güncelleme
- **Tahmini Test Sayısı:** 6-8 test

#### 4.4 `/api/storage` Route Testleri (Mevcut testi kontrol et)

- **Dosya:** `src/__tests__/api/storage.test.ts` (varsa güncelle, yoksa oluştur)
- **Route:** `src/app/api/storage/route.ts`
- **Testler:**
- GET: Dosya listesi
- POST: Dosya yükleme
- DELETE: Dosya silme
- **Tahmini Test Sayısı:** 8-10 test

#### 4.5 `/api/upload` Route Testleri

- **Dosya:** `src/__tests__/api/upload.test.ts`
- **Route:** `src/app/api/upload/route.ts`
- **Testler:**
- POST: Dosya yükleme, validasyon, file type kontrolü
- **Tahmini Test Sayısı:** 6-8 test

#### 4.6 `/api/whatsapp` Route Testleri

- **Dosya:** `src/__tests__/api/whatsapp.test.ts`
- **Route:** `src/app/api/whatsapp/route.ts`
- **Testler:**
- POST: Mesaj gönderme, validasyon
- **Tahmini Test Sayısı:** 6-8 test

#### 4.7 `/api/communication-logs` Route Testleri

- **Dosya:** `src/__tests__/api/communication-logs.test.ts`
- **Route:** `src/app/api/communication-logs/route.ts`
- **Testler:**
- GET: Log listesi, filtreleme
- POST: Log kaydı oluşturma
- **Tahmini Test Sayısı:** 6-8 test

## Test Pattern'leri

Her test dosyası şu pattern'i takip edecek:

1. **Mock Setup:**

- Appwrite API mock'ları
- Auth utils mock'ları
- Route helpers mock'ları
- Logger mock'ları

2. **GET Endpoint Testleri:**

- Başarılı liste getirme
- Filtreleme (varsa)
- Pagination
- Boş liste
- Hata yönetimi

3. **POST Endpoint Testleri:**

- Başarılı oluşturma
- Required field validasyonu
- Format validasyonu (email, phone, etc.)
- Enum validasyonu (status, priority, etc.)
- Hata yönetimi

4. **[id] Endpoint Testleri:**

- GET: Tek kayıt getirme, 404
- PUT: Güncelleme, validasyon, 404
- DELETE: Silme, 404

## Tahmini Toplam Test Sayısı

- **Faz 1:** 48-56 test
- **Faz 2:** 46-56 test
- **Faz 3:** 43-53 test
- **Faz 4:** 40-52 test
- **TOPLAM:** ~177-217 yeni test

## Öncelik Sırası Özeti

1. **Yüksek Öncelik:** Messages, Users, Partners, Todos, Aid-Applications (Faz 1)
2. **Orta Öncelik:** [id] endpoint'leri ve yeni route'lar (Faz 2-3)
3. **Düşük Öncelik:** Sistem/Utility route'ları (Faz 4)

## Notlar

- Mevcut test pattern'leri (`beneficiaries.test.ts`, `donations.test.ts`) referans alınacak
- Her test dosyası için mock yapısı tutarlı olacak
- Error handling testleri her endpoint için zorunlu
- Validation testleri her POST/PUT endpoint için zorunlu

### To-dos

- [x] Write comprehensive tests for /api/tasks route (GET, POST) - Replace placeholder
- [x] Write comprehensive tests for /api/meetings route (GET, POST) - Replace placeholder
- [x] Write tests for /api/tasks/[id] route - Single task operations
- [x] Write tests for /api/meetings/[id] route - Single meeting operations
- [x]
- [x]
- [x]
- [x]
- [x]
- [x]
