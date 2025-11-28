# Yapılması Gerekenler (TODO)

Bu doküman, Kafkasder Panel projesinde yapılması gereken tüm görevleri, iyileştirmeleri ve eksiklikleri içerir.

## 📋 İçindekiler

1. [Yüksek Öncelikli Görevler](#yüksek-öncelikli-görevler)
2. [Orta Öncelikli Görevler](#orta-öncelikli-görevler)
3. [Düşük Öncelikli Görevler](#düşük-öncelikli-görevler)
4. [Güvenlik İyileştirmeleri](#güvenlik-iyileştirmeleri)
5. [Test Coverage İyileştirmeleri](#test-coverage-iyileştirmeleri)
6. [Performans İyileştirmeleri](#performans-iyileştirmeleri)
7. [Dokümantasyon İyileştirmeleri](#dokümantasyon-iyileştirmeleri)
8. [Kod Kalitesi İyileştirmeleri](#kod-kalitesi-iyileştirmeleri)

---

## 🔴 Yüksek Öncelikli Görevler

### 1. Appwrite Realtime Migration ✅

**Durum:** 🟢 Tamamlandı
**Öncelik:** Yüksek
**Kategori:** Infrastructure
**Tahmini Süre:** ~~2-3 hafta~~ **Tamamlandı**

**Açıklama:** ~~Appwrite Realtime migration tamamlandı. `useRealtimeQuery` ve `useRealtimeList` hook'ları artık Appwrite Realtime API kullanıyor.~~

**ÇÖZÜLDÜ:** Appwrite Realtime implementasyonu tamamlandı. Tüm hook'lar artık Appwrite Realtime API kullanıyor.

**Gereksinimler:**
- [x] `useRealtimeQuery` hook'unu Appwrite Realtime ile implement et *(Tamamlandı)*
- [x] `useRealtimeList` hook'unu implement et *(Tamamlandı)*
- [x] `usePresence` hook'unu implement et *(Placeholder olarak mevcut)*
- [x] Appwrite `client.subscribe()` kullanarak realtime channels oluştur *(Tamamlandı)*
- [x] Conflict resolution stratejisi belirle ve implement et *(useEditConflictDetection mevcut)*
- [x] Realtime subscription yönetimi (subscribe/unsubscribe) *(Tamamlandı)*
- [x] Error handling ve reconnection logic *(useAppwriteReconnect ile tamamlandı)*
- [ ] Unit testler yaz *(TODO: Gelecek sprint'te eklenecek)*

**Implementasyon:**
- ✅ `src/hooks/useAppwriteRealtime.ts` - Tam Appwrite Realtime implementasyonu
  - `useAppwriteDocument` - Tek dokuman aboneliği
  - `useAppwriteCollection` - Collection aboneliği
  - `useAppwriteMultipleChannels` - Çoklu kanal aboneliği
  - `useAppwriteReconnect` - Otomatik yeniden bağlanma
- ✅ `src/hooks/useRealtimeQuery.ts` - Backward compatibility wrapper
- ✅ Error handling, toast notifications, reconnection logic

**İlgili Dosyalar:**
- `src/hooks/useRealtimeQuery.ts` ✅
- `src/hooks/useAppwriteRealtime.ts` ✅
- `src/lib/appwrite/client.ts`

**Dokümantasyon:**
- [Issue #2: Appwrite Realtime Migration](./ISSUES.md#issue-2-appwrite-realtime-migration)

---

## 🟡 Orta Öncelikli Görevler

### 2. Financial Dashboard API Endpoints

**Durum:** 🟡 Planlanıyor  
**Öncelik:** Orta  
**Kategori:** Finance  
**Tahmini Süre:** 1 hafta

**Açıklama:** Financial dashboard için optimize edilmiş API endpoint'leri oluştur. Şu anda dashboard sayfası doğrudan collection query'leri yapıyor, bu büyük veri setleri için performans sorunlarına yol açabilir.

**Gereksinimler:**
- [ ] `/api/finance/metrics` (GET) - Aggregated metrics endpoint
- [ ] `/api/finance/monthly` (GET) - Monthly breakdown endpoint
- [ ] Query optimization (büyük veri setleri için)
- [ ] Caching stratejisi implementasyonu
- [ ] Response time < 500ms hedefi
- [ ] Unit testler yaz

**İlgili Dosyalar:**
- `src/app/(dashboard)/financial-dashboard/page.tsx`
- `src/app/api/finance/metrics/route.ts` (oluşturulacak)
- `src/app/api/finance/monthly/route.ts` (oluşturulacak)

**Dokümantasyon:**
- [Issue #3: Financial Dashboard API Endpoints](./ISSUES.md#issue-3-financial-dashboard-api-endpoints)

### 3. Financial Reports Export

**Durum:** 🟡 Planlanıyor  
**Öncelik:** Orta  
**Kategori:** Finance  
**Tahmini Süre:** 1 hafta

**Açıklama:** PDF ve Excel export özelliği ekle. jsPDF ve jspdf-autotable zaten dependency'lerde mevcut, sadece implementation gerekiyor.

**Gereksinimler:**
- [ ] jsPDF ve jspdf-autotable kullanarak PDF export
- [ ] ExcelJS kullanarak Excel export (xlsx yerine, güvenlik açığı nedeniyle)
- [ ] Custom report templates
- [ ] Logo ve branding desteği
- [ ] Export progress indicator
- [ ] Error handling
- [ ] Unit testler yaz

**İlgili Dosyalar:**
- `src/app/(dashboard)/financial-dashboard/page.tsx`
- `src/lib/utils/pdf-export.ts` (oluşturulacak)
- `src/lib/utils/excel-export.ts` (oluşturulacak)

**Dokümantasyon:**
- [Issue #4: Financial Reports Export](./ISSUES.md#issue-4-financial-reports-export)

### 4. API Route Test Coverage

**Durum:** 🟡 Devam Ediyor  
**Öncelik:** Orta  
**Kategori:** Testing  
**Tahmini Süre:** 2 hafta

**Açıklama:** API route'lar için test coverage'ı %0'dan %50'ye çıkar.

**Gereksinimler:**
- [ ] API route handler testleri
- [ ] Middleware testleri (rate limiting, CSRF, auth)
- [ ] Error handling testleri
- [ ] Input validation testleri
- [ ] Response format testleri
- [ ] Integration testleri

**Hedef Coverage:**
- API Routes: %0 → %50
- Middleware: %0 → %80
- Error Handling: %0 → %70

**İlgili Dosyalar:**
- `src/app/api/**/*.ts`
- `src/__tests__/api/` (oluşturulacak)

**Dokümantasyon:**
- [Test Coverage Report](./test-coverage-report.md)

---

## 🟢 Düşük Öncelikli Görevler

### 5. AI Agent API Endpoints

**Durum:** 🟢 Nice-to-have  
**Öncelik:** Düşük  
**Kategori:** AI Features  
**Tahmini Süre:** 1 hafta

**Açıklama:** AI Agent chat için backend API endpoint'leri oluştur. Frontend component zaten mevcut.

**Gereksinimler:**
- [ ] `/api/agent/threads` (GET, POST)
- [ ] `/api/agent/threads/[id]/messages` (GET, POST)
- [ ] `/api/agent/threads/[id]/archive` (POST)
- [ ] `/api/agent/usage` (GET)
- [ ] OpenAI/Anthropic API integration
- [ ] Appwrite'da `agent_threads` ve `agent_messages` collection'ları kullanımı
- [ ] Rate limiting (AI API calls için)
- [ ] Error handling

**İlgili Dosyalar:**
- `src/components/ai/AgentChat.tsx`
- `src/app/api/agent/threads/route.ts` (oluşturulacak)
- `src/app/api/agent/threads/[id]/messages/route.ts` (oluşturulacak)

**Dokümantasyon:**
- [Issue #1: AI Agent API Endpoints](./ISSUES.md#issue-1-ai-agent-api-endpoints)

### 6. Transaction Edit Dialog

**Durum:** 🟢 Nice-to-have  
**Öncelik:** Düşük  
**Kategori:** Finance  
**Tahmini Süre:** 2-3 gün

**Açıklama:** Gelir-gider kayıtları için edit dialog ekle. Edit API endpoint'i zaten mevcut.

**Gereksinimler:**
- [ ] TransactionEditDialog component oluştur
- [ ] TransactionForm component'ini re-use et
- [ ] Edit API endpoint'i entegrasyonu
- [ ] Validation
- [ ] Error handling

**İlgili Dosyalar:**
- `src/app/(dashboard)/fon/gelir-gider/page.tsx`
- `src/components/forms/TransactionEditDialog.tsx` (oluşturulacak)

**Dokümantasyon:**
- [Issue #5: Transaction Edit Dialog](./ISSUES.md#issue-5-transaction-edit-dialog)

### 7. Meeting Delete Functionality

**Durum:** 🟢 Nice-to-have  
**Öncelik:** Düşük  
**Kategori:** Meetings  
**Tahmini Süre:** 1-2 gün

**Açıklama:** Toplantı silme özelliği ekle. Delete API endpoint'i zaten mevcut.

**Gereksinimler:**
- [ ] Delete confirmation dialog
- [ ] API integration (endpoint zaten mevcut)
- [ ] Cascade delete (action items, decisions)
- [ ] Error handling
- [ ] Success notification

**İlgili Dosyalar:**
- `src/app/(dashboard)/is/toplantilar/page.tsx`

**Dokümantasyon:**
- [Issue #6: Meeting Delete Functionality](./ISSUES.md#issue-6-meeting-delete-functionality)

---

## 🔒 Güvenlik İyileştirmeleri

### 8. xlsx Package Vulnerability Fix ✅

**Durum:** 🟢 Tamamlandı
**Öncelik:** Yüksek
**Kategori:** Security
**Tahmini Süre:** ~~1 hafta~~ **Tamamlandı**

**Açıklama:** ~~xlsx package'inde Prototype Pollution ve ReDoS güvenlik açıkları var. ExcelJS'e migration yapılmalı.~~

**ÇÖZÜLDÜ:** xlsx paketi hiç kullanılmamış. Proje baştan ExcelJS kullanıyor.

**Gereksinimler:**
- [x] ExcelJS dependency ekle *(Zaten mevcut)*
- [x] xlsx kullanımlarını ExcelJS ile değiştir *(xlsx hiç kullanılmamış)*
- [x] Export functionality'leri test et *(ExcelJS zaten src/lib/export/export-service.ts'de kullanılıyor)*
- [x] Breaking changes kontrolü *(Gerekli değil)*
- [x] Migration guide yaz *(Gerekli değil)*

**Durum:**
- ✅ ExcelJS zaten `package.json` dependencies'de mevcut
- ✅ `src/lib/export/export-service.ts` baştan ExcelJS kullanıyor
- ✅ xlsx paketi hiçbir yerde kullanılmamış
- ✅ Güvenlik açığı riski YOK

**İlgili Dosyalar:**
- `src/lib/export/export-service.ts` *(ExcelJS kullanan export service)*

**Dokümantasyon:**
- [Security Policy](../SECURITY.md)

### 9. whatsapp-web.js Dependencies Fix

**Durum:** 🟡 Orta  
**Öncelik:** Orta  
**Kategori:** Security  
**Tahmini Süre:** 2-3 hafta

**Açıklama:** whatsapp-web.js bağımlılıklarında (tar-fs, ws) güvenlik açıkları var. Breaking change gerektiriyor.

**Gereksinimler:**
- [ ] whatsapp-web.js alternatifleri araştır
- [ ] Migration planı oluştur
- [ ] Yeni library implementasyonu
- [ ] Test coverage
- [ ] Breaking changes dokümante et

**CVEs:**
- tar-fs: 3 CVE
- ws: 1 CVE

**İlgili Dosyalar:**
- `src/lib/services/whatsapp.ts`
- `package.json` (whatsapp-web.js)

**Dokümantasyon:**
- [Security Policy](../SECURITY.md)

---

## 🧪 Test Coverage İyileştirmeleri

### 10. Component Test Coverage

**Durum:** 🟡 Planlanıyor  
**Öncelik:** Orta  
**Kategori:** Testing  
**Tahmini Süre:** 3-4 hafta

**Açıklama:** Component test coverage'ı %10'dan %40'a çıkar.

**Gereksinimler:**
- [ ] Form component testleri
- [ ] Dashboard component testleri
- [ ] Modal component testleri
- [ ] Data table component testleri
- [ ] UI component testleri (button, input, etc.)

**Hedef Coverage:**
- Components: %10 → %40
- Form Components: %0 → %60
- UI Components: %20 → %50

**İlgili Dosyalar:**
- `src/components/**/*.tsx`
- `src/__tests__/components/` (genişletilecek)

**Dokümantasyon:**
- [Test Coverage Report](./test-coverage-report.md)

### 11. Business Logic Test Coverage

**Durum:** 🟡 Planlanıyor  
**Öncelik:** Orta  
**Kategori:** Testing  
**Tahmini Süre:** 2-3 hafta

**Açıklama:** Business logic test coverage'ı %30'dan %60'a çıkar.

**Gereksinimler:**
- [ ] Beneficiary management testleri
- [ ] Donation processing testleri
- [ ] Financial calculation testleri
- [ ] Validation logic testleri
- [ ] Business rule testleri

**Hedef Coverage:**
- Business Logic: %30 → %60
- Validation: %80 → %90
- Calculations: %0 → %70

**İlgili Dosyalar:**
- `src/lib/**/*.ts`
- `src/__tests__/lib/` (genişletilecek)

**Dokümantasyon:**
- [Test Coverage Report](./test-coverage-report.md)

### 12. Security Test Coverage

**Durum:** 🟡 Planlanıyor  
**Öncelik:** Orta  
**Kategori:** Testing  
**Tahmini Süre:** 2 hafta

**Açıklama:** Security test coverage'ı %20'den %50'ye çıkar.

**Gereksinimler:**
- [ ] Authentication flow testleri
- [ ] Authorization check testleri
- [ ] Input sanitization testleri
- [ ] CSRF protection testleri
- [ ] Rate limiting testleri
- [ ] SQL injection prevention testleri
- [ ] XSS prevention testleri

**Hedef Coverage:**
- Security: %20 → %50
- Authentication: %30 → %70
- Authorization: %20 → %60

**İlgili Dosyalar:**
- `src/lib/security/**/*.ts`
- `src/lib/api/middleware.ts`
- `src/__tests__/security/` (oluşturulacak)

**Dokümantasyon:**
- [Test Coverage Report](./test-coverage-report.md)

---

## ⚡ Performans İyileştirmeleri

### 13. Large Dataset Query Optimization

**Durum:** 🟡 Planlanıyor  
**Öncelik:** Orta  
**Kategori:** Performance  
**Tahmini Süre:** 1-2 hafta

**Açıklama:** Büyük veri setleri için query optimizasyonu yap.

**Gereksinimler:**
- [ ] Pagination optimizasyonu
- [ ] Index optimizasyonu (Appwrite)
- [ ] Query caching stratejisi
- [ ] Lazy loading implementasyonu
- [ ] Virtual scrolling optimizasyonu
- [ ] Performance monitoring

**Hedef Metrikler:**
- Query response time: < 500ms
- Large list render: < 100ms
- Memory usage: < 200MB

**İlgili Dosyalar:**
- `src/lib/api/crud-factory.ts`
- `src/components/ui/virtualized-data-table.tsx`
- `src/app/api/**/route.ts`

### 14. Bundle Size Optimization

**Durum:** 🟢 Nice-to-have  
**Öncelik:** Düşük  
**Kategori:** Performance  
**Tahmini Süre:** 1 hafta

**Açıklama:** Bundle size'ı optimize et, code splitting iyileştir.

**Gereksinimler:**
- [ ] Bundle analyzer çalıştır
- [ ] Unused dependencies temizle
- [ ] Dynamic imports ekle
- [ ] Tree shaking optimizasyonu
- [ ] Code splitting iyileştirmeleri

**Hedef Metrikler:**
- Initial bundle: < 200KB
- Total bundle: < 1MB
- First Contentful Paint: < 1.5s

**İlgili Dosyalar:**
- `next.config.ts`
- `package.json`

---

## 📚 Dokümantasyon İyileştirmeleri

### 15. API Documentation Completion

**Durum:** 🟡 Devam Ediyor  
**Öncelik:** Orta  
**Kategori:** Documentation  
**Tahmini Süre:** 1 hafta

**Açıklama:** API dokümantasyonunu tamamla, OpenAPI/Swagger spec ekle.

**Gereksinimler:**
- [ ] OpenAPI/Swagger spec oluştur
- [ ] API endpoint'leri için detaylı örnekler
- [ ] Error response dokümantasyonu
- [ ] Authentication flow dokümantasyonu
- [ ] Rate limiting dokümantasyonu

**İlgili Dosyalar:**
- `docs/api-routes-reference.md` (güncellenecek)
- `docs/openapi.yaml` (oluşturulacak)

### 16. Component Storybook

**Durum:** 🟢 Nice-to-have  
**Öncelik:** Düşük  
**Kategori:** Documentation  
**Tahmini Süre:** 2 hafta

**Açıklama:** Component'ler için Storybook ekle.

**Gereksinimler:**
- [ ] Storybook kurulumu
- [ ] Component story'leri yaz
- [ ] Interactive examples
- [ ] Documentation generation

**İlgili Dosyalar:**
- `src/components/**/*.tsx`
- `.storybook/` (oluşturulacak)

---

## 🛠️ Kod Kalitesi İyileştirmeleri

### 17. TypeScript Strict Mode Improvements

**Durum:** 🟡 Devam Ediyor  
**Öncelik:** Orta  
**Kategori:** Code Quality  
**Tahmini Süre:** 1-2 hafta

**Açıklama:** TypeScript strict mode'da kalan hataları düzelt.

**Gereksinimler:**
- [ ] `any` type'ları kaldır
- [ ] `unknown` type kullanımı
- [ ] Type narrowing iyileştirmeleri
- [ ] Generic type improvements
- [ ] Type safety artırma

**İlgili Dosyalar:**
- `tsconfig.json`
- `src/**/*.ts`, `src/**/*.tsx`

### 18. ESLint Rule Improvements

**Durum:** 🟢 Nice-to-have  
**Öncelik:** Düşük  
**Kategori:** Code Quality  
**Tahmini Süre:** 3-5 gün

**Açıklama:** ESLint kurallarını iyileştir, yeni kurallar ekle.

**Gereksinimler:**
- [ ] React hooks rules
- [ ] Accessibility rules
- [ ] Performance rules
- [ ] Security rules
- [ ] Best practices rules

**İlgili Dosyalar:**
- `.eslintrc.json`
- `eslint.config.js`

---

## 📊 Özet İstatistikler

### Öncelik Dağılımı
- 🔴 Yüksek Öncelik: 0 görev
- 🟡 Orta Öncelik: 7 görev
- 🟢 Düşük Öncelik: 9 görev
- ✅ Tamamlanan: 2 görev

### Kategori Dağılımı
- Infrastructure: 1 görev (✅ 1 tamamlandı)
- Finance: 2 görev
- Testing: 3 görev
- Security: 2 görev (✅ 1 tamamlandı)
- Performance: 2 görev
- Documentation: 2 görev
- Code Quality: 2 görev
- AI Features: 1 görev
- Meetings: 1 görev

### Tahmini Toplam Süre
- Yüksek Öncelik: ✅ Tamamlandı
- Orta Öncelik: 10-12 hafta
- Düşük Öncelik: 8-10 hafta
- **Toplam:** ~18-22 hafta (4.5-5.5 ay)

---

## 📝 Notlar

### Öncelik Seviyeleri
- **🔴 Yüksek:** Production için kritik, en kısa sürede tamamlanmalı
- **🟡 Orta:** Önemli özellik, planlanan release'e dahil edilmeli
- **🟢 Düşük:** Nice-to-have, zaman kalırsa tamamlanabilir

### İlerleme Takibi
- Her görev tamamlandığında bu dosyada işaretlenmeli
- Tamamlanan görevler `docs/ISSUES.md` dosyasına taşınmalı
- GitHub Issues ile senkronize edilmeli

### İlgili Dokümantasyon
- [Issues](./ISSUES.md) - Detaylı issue listesi
- [Project Analysis](./PROJECT_ANALYSIS.md) - Proje analizi
- [Test Coverage Report](./test-coverage-report.md) - Test coverage durumu
- [Security Policy](../SECURITY.md) - Güvenlik politikası

---

**Son Güncelleme:** 2024-11-24
**Toplam Görev:** 18 görev
**Tamamlanan:** 2 görev (✅ xlsx güvenlik açığı, ✅ Appwrite Realtime)
**Devam Eden:** 3 görev
**Planlanan:** 13 görev

