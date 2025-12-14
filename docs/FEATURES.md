# Dernek Yönetim Sistemi - Özellikler Dokumentasyonu

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Yardımcı Yönetimi](#yardımcı-yönetimi)
- [Bağış Takibi](#bağış-takibi)
- [Burs Sistemi](#burs-sistemi)
- [Mali Yönetim](#mali-yönetim)
- [Mesajlaşma Sistemi](#mesajlaşma-sistemi)
- [Analitik ve Raporlama](#analitik-ve-raporlama)
- [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
- [PWA Özellikleri](#pwa-özellikleri)
- [Erişilebilirlik](#erişilebilirlik)

---

## Genel Bakış

Dernek Yönetim Sistemi, sosyal yardım kuruluşlarının operasyonlarını yönetmek için tasarlanmış kapsamlı bir web uygulamasıdır. 10+ modül, 97+ API endpoint'i ve gelişmiş özellikleri içerir.

### Temel Modüller

```
Dernek Yönetim Sistemi
├── Yardımcı Yönetimi (Beneficiary Management)
├── Bağış Takibi (Donation Tracking)
├── Burs Sistemi (Scholarship System)
├── Mali Yönetim (Financial Management)
├── Mesajlaşma (Messaging)
├── Kullanıcı Yönetimi (User Management)
├── Analitik (Analytics & Reporting)
├── Toplantı Yönetimi (Meeting Management)
├── Görev Yönetimi (Task Management)
└── Sistem Ayarları (Settings)
```

### Teknoloji Stack

```
Frontend:
  - Next.js 16 (React 19)
  - TypeScript
  - Tailwind CSS
  - Radix UI Components

Backend:
  - Node.js 20+
  - Next.js API Routes
  - Appwrite (BaaS)

Database & Storage:
  - Appwrite Database
  - Appwrite Storage
  - File Upload Support

Real-time Features:
  - Appwrite Realtime SDK
  - WebSocket Support

State Management:
  - Zustand (Global State)
  - React Query (Server State)
  - React Hooks (Local State)
```

---

## Yardımcı Yönetimi

### Amaç

Dernek tarafından yardım alacak kişileri (yardımcılar) kayıt etmek, takip etmek ve yönetmek.

### Özellikleri

#### 1. Yardımcı Kaydı

**İş Akışı:**

```
Yardımcı Kayıt Formu
    ↓
Bilgi Doğrulaması (Zod Schema)
    ↓
Veritabanına Kayıt
    ↓
Taslak Durumunda Kaydedilme
    ↓
Admin Onayı (Opsiyonel)
    ↓
AKTIF Duruma Geçme
```

**Toplanacak Bilgiler:**

- Ad Soyad (Text)
- TC Kimlik No (11 haneli)
- Telefon (10-15 karakter)
- Email (Opsiyonel)
- Adres (Min 10 karakter)
- Şehir, İçe
- Aile Büyüklüğü
- Durum (AKTIF, PASIF, TASLAK)

**Teknik Uygulama:**

```typescript
// src/hooks/useBeneficiaryForm.ts
export function useBeneficiaryForm() {
  const form = useForm({
    resolver: zodResolver(beneficiarySchema),
  });

  const mutation = useMutation({
    mutationFn: (data) => apiClient.beneficiaries.create(data),
    onSuccess: () => {
      toast.success('Yardımcı kaydedildi');
      form.reset();
    },
  });

  return { form, submit: mutation.mutate, isLoading: mutation.isPending };
}
```

#### 2. Yardımcı Arama ve Filtreleme

**Arama Kriterleri:**

- Ad/Soyadya Arama
- Durum Filtresi (AKTIF, PASIF, TASLAK)
- Şehir Filtresi
- İçe Filtresi
- Oluşturma Tarihi Aralığı

**Teknik Uygulama:**

```typescript
// API: GET /api/beneficiaries?search=ali&status=AKTIF&city=Ankara
const { data: beneficiaries } = useAppwriteQuery({
  queryKey: ['beneficiaries', { search: 'ali', status: 'AKTIF' }],
  queryFn: () => apiClient.beneficiaries.list({ search: 'ali', status: 'AKTIF' }),
  entity: 'beneficiaries',
});
```

#### 3. Yardımcı Detayları ve Tarihçesi

**Görüntülenecek Bilgiler:**

- Kişisel Bilgiler (Adı, TC No, İletişim)
- Adres Bilgileri
- Durum Tarihçesi
- İlgili Bağışlar
- İlgili Burslar
- Yardım Başvuruları
- Dosya Ekler

**Teknik Uygulama:**

```typescript
// API: GET /api/beneficiaries/{id}
// API: GET /api/beneficiaries/{id}/documents
const { data: beneficiary } = useAppwriteQuery({
  queryKey: ['beneficiaries', beneficiaryId],
  queryFn: () => apiClient.beneficiaries.get(beneficiaryId),
});
```

#### 4. Toplu İşlemler

**Desteklenen İşlemler:**

- Toplu Yardımcı İçe Aktarma (Bulk Import)
- Toplu Durum Güncelleme
- Toplu Silme
- Toplu Dosya Yükleme

**Teknik Uygulama:**

```typescript
// API: POST /api/beneficiaries/bulk
const bulkCreate = useMutation({
  mutationFn: (beneficiaries) => apiClient.beneficiaries.bulkCreate(beneficiaries),
});

// CSV'den yükle
const handleCSVImport = async (file: File) => {
  const text = await file.text();
  const beneficiaries = parseCSV(text);
  await bulkCreate.mutateAsync(beneficiaries);
};
```

#### 5. Aile Bilgileri

**Aile Üyeleri:**

- Ad, Yaş, Cinsiyet
- İlişki (Eş, Çocuk, Ebeveyn, vb.)
- İş Durumu
- Gelir Bilgisi

**Teknik Uygulama:**

```typescript
// API: GET /api/beneficiaries/{id}/family
// API: POST /api/beneficiaries/{id}/family
const familyMembers = useAppwriteQuery({
  queryKey: ['beneficiaries', beneficiaryId, 'family'],
  queryFn: () => apiClient.beneficiaries.getFamily(beneficiaryId),
});
```

#### 6. Dosya Yönetimi

**Desteklenen Dosya Türleri:**

- Kimlik Belgesi (PDF, Image)
- Gelir Belgesi (PDF)
- Adres Belgesi (PDF, Image)
- Varaka (PDF)
- Diğer Belgeler

**Teknik Uygulama:**

```typescript
// API: POST /api/storage/upload
const uploadFile = useMutation({
  mutationFn: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.storage.upload(formData);
  },
});
```

### İş Akışı Diyagramı

```
START
  ↓
Yardımcı Bilgisi Giriş
  ↓
Doğrulama (Zod)
  ├─ BAŞARILI → Veritabanına Kayıt → TASLAK
  └─ BAŞARISIZ → Hata Mesajı → Düzenleme
  ↓
Yardımcı AKTIF Hale Gelme
  ↓
Bağışlar / Burslar Atanması
  ↓
Takip ve İzleme
  ↓
Dosya Yönetimi
  ↓
Rapor Oluşturma
  ↓
END
```

---

## Bağış Takibi

### Amaç

Dernek'e yapılan bağışları kayıt etmek, takip etmek ve raporlamak.

### Özellikleri

#### 1. Bağış Kaydı

**Bağış Türleri:**

- Nakit Bağış (Para)
- Ayni Bağış (Ürün, Gıda, Eşya)
- Sabit Kıymetler (Emlak, Araç)
- Tekrarlanır Bağışlar (Aylık, Yıllık)

**Bağışçı Bilgileri:**

- Bağışçı Adı
- Telefon / Email
- Bağışçı Türü (Birey, Kurum)
- Vergi ID (Opsiyonel)

**Bağış Detayları:**

- Tutar (TL, USD, EUR)
- Bağış Tarihi
- Açıklama
- Kategori (İhtiyaç Türüne Göre)

**Teknik Uygulama:**

```typescript
// src/lib/validations/donation.ts
export const donationSchema = z.object({
  amount: z.number().positive('Tutar 0'dan büyük olmalıdır'),
  currency: z.enum(['TRY', 'USD', 'EUR']),
  donorName: z.string().min(2),
  donorEmail: z.string().email().optional(),
  donorType: z.enum(['BIREY', 'KURUM']),
  description: z.string().optional(),
  donationDate: z.coerce.date(),
});

// API: POST /api/donations
const createDonation = async (data) => {
  const validated = donationSchema.parse(data);
  return apiClient.donations.create(validated);
};
```

#### 2. Bağış İzleme

**Statüsler:**

- BEKLEME: Bağış henüz işlenmedi
- ONAYLANDI: Admin tarafından onaylandı
- DAĞITILDI: Yardımcılara dağıtıldı
- İPTAL: Bağış iptal edildi

**Bağış Geçmişi:**

- Durum Değişiklik Tarihleri
- Dağıtım Detayları
- Fotoğraf Kanıtı (Opsiyonel)

**Teknik Uygulama:**

```typescript
// API: GET /api/donations/{id}
const { data: donation } = useAppwriteQuery({
  queryKey: ['donations', donationId],
  queryFn: () => apiClient.donations.get(donationId),
});

// Durum güncelle
const updateStatus = useMutation({
  mutationFn: (status) =>
    apiClient.donations.update(donationId, { status }),
});
```

#### 3. Bağış İstatistikleri

**İstatistikler:**

- Toplam Bağış (TL)
- Bağış Sayısı (Ay/Yıl)
- Ortalama Bağış
- Bağışçı Sayısı
- Kategori Bazında Dağılım
- Zaman Serileri Grafikleri

**Teknik Uygulama:**

```typescript
// API: GET /api/donations/stats
const { data: stats } = useAppwriteQuery({
  queryKey: ['donations', 'stats'],
  queryFn: () => apiClient.donations.getStats(),
  staleTime: 60 * 60 * 1000, // 1 saat
});

// Dashboard'da göster
<DonationChart data={stats.donationsByMonth} />
<StatisticCard value={stats.totalAmount} label="Toplam Bağış" />
```

#### 4. Ayni Bağışlar

**Ayni Bağış İşlemi:**

```
Ayni Bağış Kaydı
  ↓
Ürün Listesi
  ├─ Ürün Adı
  ├─ Miktar
  ├─ Birim Değeri
  ├─ Foto Kanıt
  └─ Açıklama
  ↓
Yardımcılara Dağıtım
  ↓
Alıcı Tarafından Onay
  ↓
Dosyalama
```

**Teknik Uygulama:**

```typescript
// Ayni bağış schema
const inKindDonationSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitValue: z.number().optional(),
    description: z.string().optional(),
  })),
});
```

---

## Burs Sistemi

### Amaç

Öğrencilere burs sağlamak, burs başvurularını yönetmek ve akademik performansını takip etmek.

### Özellikleri

#### 1. Burs Uygulaması

**Uygulama Süreci:**

```
Burs Başvuru Formu
  ↓
Dokümantasyon Yükleme
  ├─ Öğrenci Kimliği
  ├─ Transkript
  ├─ Gelir Belgesi
  └─ Referans Mektupları
  ↓
İnceleme (Admin)
  ├─ Akademik Başarı: GPA ≥ 3.0
  ├─ Finansal İhtiyaç: Income < X
  └─ Gerekli Belge Kontrol
  ↓
Onay / Red Kararı
  ↓
Öğrenciye Bildirim
  ↓
Burs Ödeme Planlaması
```

**Başvuru Bilgileri:**

- Öğrenci Bilgileri
- Üniversite ve Bölüm
- Sınıf (1-4 veya Yüksek Lisans)
- GPA
- Aile Geliri
- İhtiyaç Durumu
- Burs Miktarı Talebi

#### 2. Burs Yönetimi

**Burs Türleri:**

- Tam Burs (Tüm masraflar)
- Kısmi Burs (Ücret, Kitap, vb.)
- Ayni Burs (Kitap, Malzeme)
- Loan (Ödenmesi Gereken)

**Burs Statüsü:**

- BAŞVURU: Başvuru alındı
- İNCELENİYOR: Dokümantasyon inceleniyor
- REDDEDILDI: Başvuru reddedildi
- ONAYLANDI: Burs onaylandı
- ÖDENIYOR: Burs ödeme yapılıyor
- TAMAMLANDI: Öğretim süresi bitti

**Teknik Uygulama:**

```typescript
// API: GET /api/scholarships
const { data: scholarships } = useAppwriteQuery({
  queryKey: ['scholarships', { status: 'ONAYLANDI' }],
  queryFn: () => apiClient.scholarships.list({ status: 'ONAYLANDI' }),
});

// API: POST /api/scholarships
const createScholarship = useMutation({
  mutationFn: (data) => apiClient.scholarships.create(data),
});
```

#### 3. Burs İstatistikleri

**Görüntülenecek Veriler:**

- Toplam Burs Öğrenci Sayısı
- Toplam Burs Bütçesi (TL)
- Ort. Aylık Burs
- Başarılı Öğrenci Sayısı
- Burs Türüne Göre Dağılım

**Teknik Uygulama:**

```typescript
// API: GET /api/scholarships/statistics
const { data: stats } = useAppwriteQuery({
  queryKey: ['scholarships', 'stats'],
  queryFn: () => apiClient.scholarships.getStats(),
});
```

---

## Mali Yönetim

### Amaç

Dernek'in finansal durumunu takip etmek, gelir-gider raporları oluşturmak ve bütçe planlaması yapmak.

### Özellikleri

#### 1. Mali Kaydı

**Gelir Kategorileri:**

- Bağış (Bireysel, Kurumsal)
- Hibe (Devlet, Uluslararası)
- Faiz Geliri
- Diğer Gelirler

**Gider Kategorileri:**

- Personel Gideri
- İdari Giderler
- Yardım Dağıtımı
- Burs Ödemeleri
- Ayni Yardımlar
- Vergi ve Resimleri

**Mali Kayıt Formu:**

```typescript
// src/lib/validations/finance-record.ts
export const financeRecordSchema = z.object({
  type: z.enum(['GELİR', 'GİDER']),
  category: z.string(),
  amount: z.number().positive(),
  date: z.coerce.date(),
  description: z.string(),
  beneficiaryId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});
```

**Teknik Uygulama:**

```typescript
// API: POST /api/finance
const createRecord = useMutation({
  mutationFn: (data) => apiClient.finance.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['finance'] });
  },
});
```

#### 2. Finansal Raporlar

**Aylık Rapor:**

```
Mali Özet
├─ Toplam Gelir
├─ Toplam Gider
├─ Net Kar / Zarar
├─ Kategori Detayları
└─ Grafik Analizleri
```

**Yıllık Rapor:**

```
Yıllık Özet
├─ Aylık Dağılım
├─ Kategori Özetleri
├─ Trend Analizi
├─ Bütçe Karşılaştırması
└─ Audit Log
```

**Teknik Uygulama:**

```typescript
// API: GET /api/finance/monthly?month=2025-12
const { data: monthlyReport } = useAppwriteQuery({
  queryKey: ['finance', 'monthly', month],
  queryFn: () => apiClient.finance.getMonthlyReport(month),
});

// API: GET /api/finance/stats
const { data: stats } = useAppwriteQuery({
  queryKey: ['finance', 'stats'],
  queryFn: () => apiClient.finance.getStats(),
});
```

#### 3. Bütçe Planlama

**Bütçe Bileşenleri:**

- Beklenen Gelirler
- Planlanan Giderler
- Acil Durum Rezervi
- Hedefler

**Bütçe Vs. Gerçek Karşılaştırma:**

```
Kategori      | Bütçe  | Gerçek | Fark    | %
Personel      | 100K   | 98K    | -2K     | -2%
Yardım        | 200K   | 210K   | +10K    | +5%
İdari         | 50K    | 48K    | -2K     | -4%
```

---

## Mesajlaşma Sistemi

### Amaç

Sistem içinde ve dışında iletişimi kolaylaştırmak.

### Özellikleri

#### 1. Kurum İçi Mesajlaşma

**Özellikler:**

- Özel Mesaj (1:1)
- Grup Mesajları
- Duyurular
- Notlar

**Mesaj Tipleri:**

- Metin Mesajı
- Dosya Paylaşımı
- Zikir Görevleri
- Yönetici Bildirimi

**Teknik Uygulama:**

```typescript
// API: GET /api/messages
const { data: messages } = useAppwriteQuery({
  queryKey: ['messages'],
  queryFn: () => apiClient.messages.list(),
});

// Real-time listen
const { subscribe } = useAppwriteRealtime();
useEffect(() => {
  const unsubscribe = subscribe('messages', (message) => {
    // Yeni mesaj alındı
  });
  return unsubscribe;
}, []);
```

#### 2. Toplu Mesaj Gönderimi

**Hedef Seçimi:**

- Tüm Yardımcılar
- Duruma Göre Filtreli
- Şehre Göre Filtreli
- Manuel Seçim

**Kanal Seçimi:**

- SMS
- Email
- Push Notification
- İnapp Mesajı

**Teknik Uygulama:**

```typescript
// API: POST /api/messages/send-bulk
const sendBulkMessage = useMutation({
  mutationFn: (params) => apiClient.messages.sendBulk(params),
});

const handleSendBulk = async (recipients, message, channel) => {
  await sendBulkMessage.mutateAsync({
    recipients,
    message,
    channel,
    scheduledAt: new Date(),
  });
};
```

---

## Analitik ve Raporlama

### Amaç

Dernek'in operasyonlarını analiz etmek ve karar vermeyi desteklemek.

### Özellikleri

#### 1. Dashboard Analytics

**Ana Göstergeler (KPI):**

- Toplam Yardımcı Sayısı
- Aktif Burs Sayısı
- Aylık Toplam Bağış
- Dağıtılan Yardım (TL)
- Aylık Gider (TL)

**Grafikler:**

```
Bağış Trendleri (Zaman Serisi)
└─ Line Chart: Aylık Bağış Tutarı

Kategori Dağılımı
└─ Pie Chart: Gider Kategorileri

Yardımcı Durumu
└─ Bar Chart: AKTIF vs PASIF vs TASLAK

Coğrafi Dağılım
└─ Map: Yardımcılar Harita Üzerinde
```

**Teknik Uygulama:**

```typescript
// src/hooks/useDashboardRealtime.ts
export function useDashboardRealtime() {
  const { data: analytics } = useAppwriteQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => apiClient.dashboard.getAnalytics(),
    entity: 'dashboard',
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  return analytics;
}

// Dashboard'da göster
<DashboardCharts analytics={analytics} />
```

#### 2. Özel Raporlar

**Rapor Türleri:**

1. **Yardımcı Raporu**
   - Yardımcı Listesi
   - Demografik Bilgiler
   - Yardım Geçmişi
   - Fotoğraflar/Belgeler

2. **Mali Rapor**
   - Gelir-Gider Detayları
   - Kategori Özetleri
   - Eğilim Analizi
   - Bütçe Karşılaştırması

3. **Burs Raporu**
   - Burs Öğrenci Listesi
   - Akademik Performans
   - Burs Dağılımı
   - Başarı Oranları

4. **Bağış Raporu**
   - Bağışçı Listesi
   - Bağış Tutarları
   - Vergi Belgeleri
   - Teşekkür Mektupları

**Export Formatlari:**

- PDF (Raporlar)
- Excel (Veri Tabloları)
- CSV (Veritabanı İçe Aktarma)

**Teknik Uygulama:**

```typescript
// src/lib/export/report-generator.ts
export async function generateReport(
  type: 'beneficiary' | 'finance' | 'donation',
  format: 'pdf' | 'excel' | 'csv'
) {
  const data = await fetchReportData(type);

  switch (format) {
    case 'pdf':
      return generatePDF(data);
    case 'excel':
      return generateExcel(data);
    case 'csv':
      return generateCSV(data);
  }
}

// API: GET /api/reports/export?type=beneficiary&format=pdf
const exportReport = useMutation({
  mutationFn: (params) => apiClient.reports.export(params),
  onSuccess: (blob) => {
    downloadBlob(blob, 'report.pdf');
  },
});
```

---

## Kullanıcı Yönetimi

### Amaç

Sistem kullanıcılarını yönetmek ve rol tabanlı erişimi kontrol etmek.

### Özellikleri

#### 1. Kullanıcı Rolleri ve İzinleri

**Roller:**

```
┌─────────────────────────────────────────┐
│      Dernek Başkanı (Super Admin)       │
│  - Tüm Sistem İzinleri                  │
│  - Kullanıcı Yönetimi                   │
│  - Sistem Ayarları                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Yönetici (Admin)                │
│  - Tüm Modüllere Erişim                 │
│  - Veri Onayı                           │
│  - Rapor Oluşturma                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       Personel (Staff)                  │
│  - Belirli Modüllere Erişim             │
│  - Veri Girişi                          │
│  - Raporları Görüntüleme                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    Görüntüleyici (Viewer)               │
│  - Sadece Okuma İzni                    │
│  - Raporları Görüntüleme                │
└─────────────────────────────────────────┘
```

**İzinler Matrisi:**

| Modül | Başkan | Admin | Personel | Görüntüleyici |
|-------|--------|-------|----------|---------------|
| Yardımcı | RWD | RWD | RW | R |
| Bağış | RWD | RWD | RW | R |
| Burs | RWD | RWD | RW | R |
| Mali | RWD | RWD | R | R |
| Kullanıcı | RWD | RWD | - | - |
| Ayarlar | RWD | RWD | - | - |

R = Read, W = Write, D = Delete

#### 2. Kullanıcı Yönetimi İşlemleri

**Teknik Uygulama:**

```typescript
// API: POST /api/users (Admin only)
const createUser = useMutation({
  mutationFn: (userData) => apiClient.users.create(userData),
});

// API: PUT /api/users/{id} (Admin only)
const updateUser = useMutation({
  mutationFn: ({ id, data }) => apiClient.users.update(id, data),
});

// API: DELETE /api/users/{id} (Admin only)
const deleteUser = useMutation({
  mutationFn: (id) => apiClient.users.delete(id),
});
```

#### 3. Aktivite Günlüğü

**Kaydedilen Eylemler:**

- Giriş/Çıkış
- Veri Oluşturma/Güncelleme/Silme
- Rapor İndir
- Toplu İşlemler
- Ayar Değişiklikleri

**Teknik Uygulama:**

```typescript
// API: GET /api/audit-logs
const { data: logs } = useAppwriteQuery({
  queryKey: ['audit-logs', { userId, action }],
  queryFn: () => apiClient.auditLogs.list({ userId, action }),
});
```

---

## PWA Özellikleri

### Amaç

Uygulamayı mobil cihazlarda native app gibi kullanmak.

### Özellikleri

#### 1. Kurulum ve Offline

**Özellikler:**

- Home Screen'e Ekle (Add to Home Screen)
- Standalone Mod
- Splash Screen
- Icons (Various Sizes)
- Offline Support

**Teknik Uygulama:**

```json
{
  "manifest.json": {
    "name": "Dernek Yönetim Sistemi",
    "short_name": "Kafkasder",
    "start_url": "/genel",
    "display": "standalone",
    "scope": "/",
    "theme_color": "#3b82f6",
    "background_color": "#ffffff",
    "icons": [
      {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
      {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}
    ]
  }
}
```

#### 2. Service Worker

**Caching Stratejileri:**

- Network First (API çağrıları)
- Cache First (Static assets)
- Stale While Revalidate (Resimleri)

**Teknik Uygulama:**

```typescript
// Appwrite Offline Sync
useOfflineSync({
  syncInterval: 30 * 1000, // 30 saniyelik aralıklar
  maxRetries: 3,
  retryDelay: 5 * 1000,
});
```

#### 3. Push Notifications

**Özellikler:**

- Yeni Mesaj Bildirimi
- Bağış Alındı Bildirimi
- Burs Başvurusu Yapıldı
- Toplantı Hatırlatması

---

## Erişilebilirlik

### WCAG 2.1 Standartları

#### 1. Yardımcı Teknolojiler Desteği

**Desteklenen Teknolojiler:**

- Screen Readers (NVDA, JAWS, VoiceOver)
- Keyboard Navigation
- High Contrast Mode
- Text Scaling

**Teknik Uygulama:**

```typescript
// Semantic HTML
<button aria-label="Sil" onClick={handleDelete}>
  <Icon aria-hidden="true" />
</button>

// ARIA Attributes
<div role="alert" aria-live="polite" aria-atomic="true">
  {errorMessage}
</div>

// Keyboard Navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

#### 2. Renk Kontrastı

**Minimum Kontrastlar:**

- Normal Text: 4.5:1
- Large Text (18pt+): 3:1
- Graphics/UI: 3:1

#### 3. Keyboard Navigation

**Destek:**

- Tab / Shift+Tab: Element arasında gezinme
- Enter / Space: Aktivate
- Escape: Modal kapat
- Arrow Keys: Dropdown/List seçimi

**Teknik Uygulama:**

```typescript
// src/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(items: unknown[]) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case 'ArrowDown':
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case 'Home':
        setActiveIndex(0);
        break;
      case 'End':
        setActiveIndex(items.length - 1);
        break;
    }
  };

  return { activeIndex, handleKeyDown };
}
```

---

## Teknoloji Özellikleri

### Performance

```
Lighthouse Scores (Target)
├─ Performance: 90+
├─ Accessibility: 95+
├─ Best Practices: 95+
└─ SEO: 95+
```

### Responsive Design

```
Breakpoints
├─ Mobile: < 640px
├─ Tablet: 640px - 1024px
├─ Desktop: > 1024px
└─ Wide: > 1920px
```

### Internationalization (i18n)

**Desteklenen Diller:**

- Turkish (tr-TR) - Varsayılan
- English (en-US) - İsteğe bağlı
- Arabic (ar-AE) - Gelecek

---

## İletişim ve Destek

- **Documentation**: /docs
- **GitHub Issues**: Bug raporları ve özellik talepleri
- **Email**: support@yourorganization.com

---

*Son güncelleme: 2025-12-14*
