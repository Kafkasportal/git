# Yardım Modülü Geliştirme Planı

## 📋 Mevcut Durum Analizi

### Mevcut Yapı
- **Sayfalar**: `/yardim/ihtiyac-sahipleri`, `/yardim/basvurular`, `/yardim/liste`, `/yardim/nakdi-vezne`
- **API Endpoints**: `/api/beneficiaries`, `/api/aid-applications`
- **Bileşenler**: `BeneficiaryForm`, `BeneficiaryQuickAddModal`, `AidApplicationForm`, `BeneficiaryFormWizard`
- **Validasyon**: 495 satırlık kapsamlı Zod schema (`beneficiary.ts`)
- **Tipler**: 559 satırlık detaylı enum ve tip tanımları

### Mevcut Özellikler
- ✅ İhtiyaç sahipleri CRUD işlemleri
- ✅ Hızlı kayıt modal
- ✅ Bulk işlemler (silme, durum güncelleme)
- ✅ Virtualized data table (performans optimizasyonu)
- ✅ Arama ve filtreleme
- ✅ Export (PDF, Excel, CSV)
- ✅ TC Kimlik No algoritma kontrolü

---

## 🎯 Önerilen Geliştirmeler

### 1. Yardım Talebi Workflow Sistemi
**Öncelik: Yüksek**

```
Talep → İnceleme → Onay → Dağıtım → Tamamlandı
```

- [ ] Workflow durumları için state machine
- [ ] Her aşamada yetki kontrolü
- [ ] Otomatik bildirimler (onay bekleyen, geciken talepler)
- [ ] Workflow geçmiş logları

### 2. Gelişmiş Filtreleme ve Raporlama
**Öncelik: Yüksek**

- [ ] Çoklu filtre kombinasyonları (şehir + kategori + durum)
- [ ] Tarih aralığı filtreleme
- [ ] Kaydedilmiş filtre şablonları
- [ ] Özet dashboard kartları (toplam yardım alan, bekleyen, aylık dağılım)
- [ ] Grafik/chart görselleştirmeleri

### 3. Coğrafi Haritalama
**Öncelik: Orta**

- [ ] İhtiyaç sahiplerinin harita üzerinde gösterimi
- [ ] Bölgesel yoğunluk analizi
- [ ] Adres doğrulama entegrasyonu
- [ ] Rota optimizasyonu (dağıtım için)

### 4. Belge Yönetimi Geliştirmeleri
**Öncelik: Yüksek**

- [ ] Kimlik belgesi yükleme ve doğrulama
- [ ] Gelir belgesi takibi
- [ ] İkamet belgesi yönetimi
- [ ] Belge son kullanma tarihi hatırlatmaları
- [ ] Toplu belge indirme

### 5. Aile Yapısı ve Bağımlı Yönetimi
**Öncelik: Orta**

- [ ] Aile üyeleri ağacı görünümü
- [ ] Bağımlı kişi ekleme/düzenleme
- [ ] Eğitim durumu takibi (çocuklar için)
- [ ] Sağlık durumu takibi
- [ ] Aile bazlı yardım geçmişi

### 6. Mükerrer Kayıt Kontrolü
**Öncelik: Yüksek**

- [ ] TC Kimlik No ile otomatik kontrol
- [ ] Benzer isim/adres uyarısı
- [ ] Kayıt birleştirme özelliği
- [ ] Mükerrer kayıt raporu

### 7. Yardım Planlama ve Takvim
**Öncelik: Orta**

- [ ] Periyodik yardım planlaması (aylık, yıllık)
- [ ] Takvim görünümü
- [ ] Ramazan/Kurban bayramı özel planlaması
- [ ] Otomatik hatırlatmalar

### 8. Entegrasyonlar
**Öncelik: Düşük**

- [ ] E-Devlet kimlik doğrulama
- [ ] SGK sorgulama
- [ ] Banka hesap doğrulama (IBAN)
- [ ] SMS/Email bildirim entegrasyonu

### 9. Mobil Deneyim İyileştirmeleri
**Öncelik: Orta**

- [ ] Responsive form tasarımı
- [ ] Touch-friendly kontroller
- [ ] Offline kayıt oluşturma
- [ ] QR kod ile hızlı erişim

### 10. Performans ve UX
**Öncelik: Yüksek**

- [ ] Form auto-save özelliği
- [ ] Infinite scroll iyileştirmesi
- [ ] Lazy loading optimizasyonu
- [ ] Skeleton loading states

---

## 📂 Dosya Yapısı Önerisi

```
src/
├── app/(dashboard)/yardim/
│   ├── ihtiyac-sahipleri/
│   │   ├── [id]/
│   │   │   ├── page.tsx           # Detay sayfası
│   │   │   ├── edit/page.tsx      # Düzenleme
│   │   │   └── documents/page.tsx # Belgeler
│   │   ├── new/page.tsx           # Yeni kayıt
│   │   └── page.tsx               # Liste
│   ├── basvurular/
│   │   ├── [id]/page.tsx          # Başvuru detay
│   │   └── page.tsx               # Başvuru listesi
│   ├── workflow/
│   │   └── page.tsx               # Workflow dashboard (YENİ)
│   ├── raporlar/
│   │   └── page.tsx               # Raporlar (YENİ)
│   └── harita/
│       └── page.tsx               # Harita görünümü (YENİ)
│
├── components/
│   ├── beneficiary/               # (YENİ klasör)
│   │   ├── BeneficiaryCard.tsx
│   │   ├── BeneficiaryTimeline.tsx
│   │   ├── BeneficiaryMap.tsx
│   │   ├── FamilyTree.tsx
│   │   └── DuplicateChecker.tsx
│   └── workflow/                  # (YENİ klasör)
│       ├── WorkflowBoard.tsx
│       ├── WorkflowStep.tsx
│       └── WorkflowHistory.tsx
│
├── lib/
│   └── beneficiary/               # (YENİ klasör)
│       ├── workflow-engine.ts
│       ├── duplicate-detection.ts
│       └── geo-utils.ts
```

---

## 🚀 Uygulama Öncelikleri

### Faz 1 (1-2 Hafta)
1. Mükerrer kayıt kontrolü
2. Belge yönetimi geliştirmeleri
3. Form auto-save

### Faz 2 (2-3 Hafta)
1. Workflow sistemi
2. Gelişmiş filtreleme
3. Dashboard kartları

### Faz 3 (3-4 Hafta)
1. Aile yapısı yönetimi
2. Raporlama modülü
3. Takvim/planlama

### Faz 4 (4+ Hafta)
1. Harita entegrasyonu
2. Dış sistem entegrasyonları
3. Mobil optimizasyonlar

---

## 🛠️ Teknik Gereksinimler

### Yeni Bağımlılıklar
```json
{
  "@tanstack/react-table": "mevcut",
  "leaflet": "harita için",
  "react-leaflet": "React harita bileşenleri",
  "fuse.js": "fuzzy search (mükerrer kontrol)"
}
```

### Yeni API Endpoints
- `POST /api/beneficiaries/check-duplicate`
- `GET /api/beneficiaries/[id]/documents`
- `POST /api/beneficiaries/[id]/documents`
- `GET /api/beneficiaries/workflow/pending`
- `PATCH /api/beneficiaries/[id]/workflow`
- `GET /api/beneficiaries/reports/summary`
- `GET /api/beneficiaries/map-data`

### Yeni Appwrite Collections
- `beneficiary_documents` - Belge yönetimi
- `beneficiary_workflow_logs` - Workflow geçmişi
- `beneficiary_family_members` - Aile üyeleri

---

## 📝 Sonraki Adım

Hangi geliştirmeyle başlamak istersiniz?

1. **Mükerrer Kayıt Kontrolü** - Veri kalitesi için kritik
2. **Workflow Sistemi** - Süreç yönetimi için
3. **Belge Yönetimi** - Dokümantasyon için
4. **Dashboard/Raporlama** - Görünürlük için
5. **Başka bir özellik** - Belirtin

Seçiminizi yapın, hemen uygulamaya başlayalım!
