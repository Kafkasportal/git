# KAFKASDER PANEL - Product Requirements Document (PRD)

**Proje Adı:** Kafkasder Panel - Dernek Yönetim Sistemi
**Versiyon:** 1.0
**Oluşturulma Tarihi:** 23 Kasım 2025
**Güncelleme Tarihi:** 23 Kasım 2025

---

## 1. PROJE GENEL BAKIŞ

### 1.1 Vizyon
Kafkasder Panel, sivil toplum kuruluşlarının operasyonlarını dijitalleştiren, modern ve güvenli bir dernek yönetim platformudur. Platform, ihtiyaç sahiplerinden bağış yönetimine, toplantı takibinden finansal raporlamaya kadar tüm dernek süreçlerini tek bir çatı altında toplar.

### 1.2 Hedef Kitle
- Dernek yöneticileri ve personeli
- Gönüllüler ve saha çalışanları
- Mali müşavirler ve denetçiler
- Sistem yöneticileri

### 1.3 Temel Özellikler
| Özellik | Açıklama |
|---------|----------|
| İhtiyaç Sahibi Yönetimi | Kayıt, takip, profil ve aile bilgileri |
| Bağış Takibi | Online/offline bağış, kumbara sistemi |
| Burs Yönetimi | Öğrenci ve yetim burs programları |
| Toplantı Yönetimi | Takvim, karar takibi, görev atama |
| İletişim Merkezi | SMS, Email, WhatsApp entegrasyonu |
| Finansal Raporlama | Gelir/gider takibi, PDF/Excel export |
| Güvenlik Denetimi | KVKK uyumlu audit logging |

---

## 2. TEKNİK MİMARİ

### 2.1 Teknoloji Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16          │  React Framework (App Router)        │
│  React 19            │  UI Library                          │
│  TypeScript 5        │  Static Typing (Strict Mode)         │
│  Tailwind CSS 4      │  Utility-First CSS Framework         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI FRAMEWORK                            │
├─────────────────────────────────────────────────────────────┤
│  Radix UI            │  Accessible Components (18+ bileşen) │
│  Lucide React        │  Icon Library                        │
│  Framer Motion       │  Animation Library                   │
│  Recharts            │  Data Visualization                  │
│  React Hook Form     │  Form Management                     │
│  Zod                 │  Schema Validation                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                        │
├─────────────────────────────────────────────────────────────┤
│  Zustand             │  Global State (Auth Store)           │
│  TanStack Query      │  Server State & Caching              │
│  React Context       │  Settings & Theme Context            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  Appwrite 21.4       │  Backend-as-a-Service                │
│  Node Appwrite 20.3  │  Server-side SDK                     │
│  Next.js API Routes  │  API Proxy Layer (66 endpoint)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SECURITY                               │
├─────────────────────────────────────────────────────────────┤
│  bcryptjs            │  Password Hashing                    │
│  CSRF Protection     │  Double Submit Cookie                │
│  Rate Limiting       │  Per-endpoint Limits                 │
│  DOMPurify           │  XSS Prevention                      │
│  HMAC Sessions       │  Signed Session Cookies              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Dizin Yapısı

```
Kafkasportal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard Layout Group
│   │   │   ├── genel/          # Ana Dashboard
│   │   │   ├── bagis/          # Bağış Modülü
│   │   │   ├── yardim/         # Yardım Modülü
│   │   │   ├── burs/           # Burs Modülü
│   │   │   ├── fon/            # Finans Modülü
│   │   │   ├── partner/        # Partner Modülü
│   │   │   ├── kullanici/      # Kullanıcı Yönetimi
│   │   │   ├── is/             # İş/Görev Yönetimi
│   │   │   ├── mesaj/          # İletişim Merkezi
│   │   │   ├── analitik/       # Analitik Dashboard
│   │   │   └── ayarlar/        # Sistem Ayarları
│   │   ├── api/                # API Routes (66 endpoint)
│   │   └── login/              # Giriş Sayfası
│   ├── components/             # React Bileşenleri
│   │   ├── ui/                 # Base UI (34+ komponent)
│   │   ├── forms/              # Form Bileşenleri
│   │   ├── layouts/            # Layout Bileşenleri
│   │   └── [feature]/          # Feature-specific
│   ├── lib/                    # Utility & Services
│   │   ├── appwrite/           # Appwrite Client/Server
│   │   ├── auth/               # Authentication
│   │   ├── api/                # API Helpers
│   │   └── validations/        # Zod Schemas
│   ├── hooks/                  # Custom React Hooks
│   ├── stores/                 # Zustand Stores
│   └── types/                  # TypeScript Definitions
├── public/                     # Static Assets & PWA
├── docs/                       # Documentation
└── e2e/                        # Playwright E2E Tests
```

### 2.3 Database Schema (Appwrite Collections)

| Koleksiyon | Açıklama | İlişkiler |
|------------|----------|-----------|
| `users` | Sistem kullanıcıları | sessions, audit_logs |
| `beneficiaries` | İhtiyaç sahipleri | dependents, bank_accounts, donations |
| `donations` | Bağış kayıtları | beneficiaries, partners |
| `scholarships` | Burs kayıtları | beneficiaries |
| `aid_applications` | Yardım başvuruları | beneficiaries |
| `meetings` | Toplantılar | meeting_decisions, action_items |
| `meeting_decisions` | Toplantı kararları | meetings, tasks |
| `tasks` | Görevler | users, meetings |
| `messages` | İletişim kayıtları | communication_logs |
| `partners` | Ortak kuruluşlar | donations |
| `finance_records` | Mali kayıtlar | - |
| `audit_logs` | Denetim kayıtları | users |
| `system_settings` | Sistem ayarları | - |
| `parameters` | Dinamik parametreler | - |

---

## 3. UI/UX TASARIM SİSTEMİ

### 3.1 Renk Paleti

#### Light Mode (Varsayılan)

| Değişken | Hex Kodu | Kullanım |
|----------|----------|----------|
| `--background` | `#FFFFFF` | Sayfa arka planı |
| `--foreground` | `#0F172A` | Ana metin |
| `--primary` | `#1E40AF` | Birincil aksiyonlar |
| `--primary-light` | `#3B82F6` | Hover durumları |
| `--secondary` | `#F1F5F9` | İkincil arka planlar |
| `--muted` | `#64748B` | Soluk metinler |
| `--destructive` | `#DC2626` | Hata/Silme |
| `--success` | `#10B981` | Başarı durumları |
| `--warning` | `#F59E0B` | Uyarılar |
| `--info` | `#3B82F6` | Bilgilendirme |

#### Dark Mode

| Değişken | Hex Kodu | Kullanım |
|----------|----------|----------|
| `--background` | `#0F172A` | Sayfa arka planı |
| `--foreground` | `#F1F5F9` | Ana metin |
| `--primary` | `#60A5FA` | Birincil aksiyonlar |
| `--card` | `#1E293B` | Kart arka planları |
| `--border` | `#334155` | Kenar çizgileri |

#### Sidebar Renkleri

| Değişken | Light | Dark |
|----------|-------|------|
| `--sidebar` | `#1E293B` | `#0F172A` |
| `--sidebar-foreground` | `#F1F5F9` | `#CBD5E1` |
| `--sidebar-primary` | `#3B82F6` | `#60A5FA` |
| `--sidebar-accent` | `#334155` | `#1E293B` |

#### Chart Renkleri (Grafikler)

```css
--chart-1: #3B82F6 (Blue)    /* Ana veri serisi */
--chart-2: #10B981 (Emerald) /* İkincil seri */
--chart-3: #F59E0B (Amber)   /* Üçüncül seri */
--chart-4: #8B5CF6 (Violet)  /* Dördüncül seri */
--chart-5: #EC4899 (Pink)    /* Beşinci seri */
```

### 3.2 Tipografi

| Özellik | Değer |
|---------|-------|
| Font Family | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` |
| Mono Font | `'JetBrains Mono', 'Fira Code', Consolas` |
| Base Size | `14px` |
| Line Height | `1.5` |
| Font Weights | 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold) |

### 3.3 Spacing Sistemi

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--spacing-xs` | `4px` | İkon padding |
| `--spacing-sm` | `8px` | Küçük gap |
| `--spacing-md` | `16px` | Standart gap |
| `--spacing-lg` | `24px` | Section gap |
| `--spacing-xl` | `32px` | Container padding |
| `--spacing-2xl` | `48px` | Page sections |

**Spacing Varyantları:**
- `tight` - Tüm değerler %50 küçük
- `normal` - Varsayılan
- `relaxed` - Tüm değerler %50 büyük

### 3.4 Border Radius

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--border-radius-sm` | `4px` | Küçük elementler |
| `--border-radius` | `8px` | Varsayılan |
| `--border-radius-lg` | `12px` | Kartlar |
| `--border-radius-full` | `9999px` | Pill shapes |

### 3.5 Shadow Sistemi

```css
/* Light Mode */
--shadow-xs:    0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-sm:    0 1px 3px 0 rgba(0, 0, 0, 0.1)
--shadow-md:    0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg:    0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl:    0 20px 25px -5px rgba(0, 0, 0, 0.1)
--shadow-2xl:   0 25px 50px -12px rgba(0, 0, 0, 0.1)
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)
--shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.1)
```

---

## 4. ANİMASYON SİSTEMİ

### 4.1 Transition Süreleri

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--transition-fast` | `150ms` | Hover efektleri |
| `--transition-normal` | `200ms` | Standart geçişler |
| `--transition-slow` | `300ms` | Modal/Page geçişleri |

### 4.2 Keyframe Animasyonları

#### Page Transitions (Framer Motion)

```typescript
// Sayfa Girişi
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.3, ease: 'easeOut' }

// Header Girişi
initial: { opacity: 0, y: -20 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.3 }
```

#### Loading Animasyonları

```css
/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Bounce Dots */
@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* Shimmer (Skeleton) */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### UI Efektleri

```css
/* Fade In Up (Liste öğeleri) */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Float (Dekoratif) */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Gradient Shift (Arka planlar) */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Ripple (Button click) */
@keyframes ripple {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
```

#### Stagger Animation (Liste geçişleri)

```css
.stagger-item:nth-child(1) { animation-delay: 50ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 150ms; }
.stagger-item:nth-child(4) { animation-delay: 200ms; }
.stagger-item:nth-child(5) { animation-delay: 250ms; }
```

### 4.3 Hover Efektleri

| Element | Efekt |
|---------|-------|
| Button | `translateY(-1px)`, `shadow-md` |
| Card | `translateY(-2px)`, `shadow-lg`, `scale-[1.02]` |
| KPI Card | `scale-105`, `shadow-lg` |
| Quick Action | `scale-105`, `border-primary/50` |
| Icon Container | `scale-110` |
| Table Row | `bg-muted/50` |

### 4.4 Accessibility (Hareket Azaltma)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. KOMPONENT KÜTÜPHANESİ

### 5.1 Base UI Komponentleri (34+)

#### Form Bileşenleri
| Komponent | Dosya | Özellikler |
|-----------|-------|------------|
| `Button` | `button.tsx` | 6 variant (default, destructive, outline, secondary, ghost, link), 6 size |
| `Input` | `input.tsx` | 3 variant (default, error, success), accessibility |
| `Textarea` | `textarea.tsx` | Çok satırlı metin |
| `Select` | `select.tsx` | Radix UI dropdown |
| `Checkbox` | `checkbox.tsx` | Radix UI checkbox |
| `RadioGroup` | `radio-group.tsx` | Radix UI radio |
| `Switch` | `switch.tsx` | Toggle switch |
| `DatePicker` | `date-picker.tsx` | Tarih seçici |
| `FileUpload` | `file-upload.tsx` | Drag-drop, preview |

#### Veri Gösterimi
| Komponent | Dosya | Özellikler |
|-----------|-------|------------|
| `Card` | `card.tsx` | 5 variant (default, interactive, elevated, outline, ghost) |
| `MetricCard` | `metric-card.tsx` | Animasyonlu sayı, 8 variant, trend göstergesi |
| `StatCard` | `stat-card.tsx` | 9 renk teması, progress bar |
| `KPICard` | `kpi-card.tsx` | 6 renk teması (green, orange, blue, red, gray, purple) |
| `GlassCard` | `glass-card.tsx` | Glassmorphism efekti |
| `Table` | `table.tsx` | Temel tablo |
| `DataTable` | `data-table.tsx` | Arama, sıralama, pagination, filtreleme |
| `VirtualizedDataTable` | `virtualized-data-table.tsx` | Büyük veri setleri için |

#### Dialog & Feedback
| Komponent | Dosya | Özellikler |
|-----------|-------|------------|
| `Dialog` | `dialog.tsx` | Modal pencere |
| `AlertDialog` | `alert-dialog.tsx` | Onay dialogu |
| `Popover` | `popover.tsx` | Açılır pencere |
| `Tooltip` | `tooltip.tsx` | İpucu |
| `Alert` | `alert.tsx` | Bilgi mesajı |
| `Badge` | `badge.tsx` | Etiket/rozet |
| `Progress` | `progress.tsx` | İlerleme çubuğu |
| `Skeleton` | `skeleton.tsx` | Yükleme iskeleti |
| `EnhancedToast` | `enhanced-toast.tsx` | Bildirimler |

#### Navigation & Layout
| Komponent | Dosya | Özellikler |
|-----------|-------|------------|
| `ModernSidebar` | `modern-sidebar.tsx` | Daraltılabilir, yetki bazlı |
| `BreadcrumbNav` | `breadcrumb-nav.tsx` | Breadcrumb navigasyonu |
| `Pagination` | `pagination.tsx` | Sayfa numaralandırma |
| `Tabs` | `tabs.tsx` | Sekme bileşeni |
| `ScrollArea` | `scroll-area.tsx` | Özel kaydırma alanı |

### 5.2 Form Komponentleri

| Form | Dosya | Kullanım |
|------|-------|----------|
| `BeneficiaryForm` | `BeneficiaryForm.tsx` | İhtiyaç sahibi ekleme |
| `BeneficiaryFormWizard` | `BeneficiaryFormWizard.tsx` | 5 adımlı wizard |
| `DonationForm` | `DonationForm.tsx` | Bağış kaydı |
| `MeetingForm` | `MeetingForm.tsx` | Toplantı oluşturma |
| `MessageForm` | `MessageForm.tsx` | Mesaj gönderimi |
| `TaskForm` | `TaskForm.tsx` | Görev atama |
| `UserForm` | `user-form.tsx` | Kullanıcı yönetimi |
| `AidApplicationForm` | `AidApplicationForm.tsx` | Yardım başvurusu |

### 5.3 Dashboard Komponentleri

| Komponent | Açıklama |
|-----------|----------|
| `CurrencyWidget` | Real-time döviz kurları |
| `OrganizationChart` | Organizasyon şeması |
| `KanbanBoard` | Görev panosu |
| `CalendarView` | Toplantı takvimi |
| `NotificationCenter` | Bildirim merkezi |

---

## 6. SAYFA YAPILARI VE NAVİGASYON

### 6.1 Sidebar Navigasyon Yapısı

```
┌─────────────────────────────────────────────────────────────┐
│  LOGO + "Dernek Yönetim Sistemi"                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏠 Genel                          → /genel                 │
│                                                             │
│  ─────────── YÖNETİM ───────────                           │
│                                                             │
│  ❤️ Bağışlar                                                │
│     ├─ Bağış Listesi              → /bagis/liste            │
│     ├─ Bağış Raporları            → /bagis/raporlar         │
│     └─ Kumbara                    → /bagis/kumbara          │
│                                                             │
│  🤝 Yardım Programları                                      │
│     ├─ İhtiyaç Sahipleri          → /yardim/ihtiyac-sahipleri│
│     ├─ Başvurular                 → /yardim/basvurular      │
│     ├─ Yardım Listesi             → /yardim/liste           │
│     └─ Nakit Vezne                → /yardim/nakdi-vezne     │
│                                                             │
│  🎓 Burs Sistemi                                            │
│     ├─ Öğrenciler                 → /burs/ogrenciler        │
│     ├─ Başvurular                 → /burs/basvurular        │
│     └─ Yetimler                   → /burs/yetim             │
│                                                             │
│  💰 Finans                                                  │
│     ├─ Gelir Gider                → /fon/gelir-gider        │
│     └─ Mali Raporlar              → /fon/raporlar           │
│                                                             │
│  🏢 Ortaklar                      → /partner/liste          │
│                                                             │
│  ─────────── İLETİŞİM ───────────                          │
│                                                             │
│  💬 Mesajlar                                                │
│     ├─ Kurum İçi                  → /mesaj/kurum-ici        │
│     ├─ Toplu Mesaj                → /mesaj/toplu            │
│     └─ İletişim Geçmişi           → /mesaj/gecmis           │
│                                                             │
│  📅 İş Yönetimi                                             │
│     ├─ Yönetim Paneli             → /is/yonetim             │
│     ├─ Görevler                   → /is/gorevler            │
│     └─ Toplantılar                → /is/toplantilar         │
│                                                             │
│  ─────────── RAPORLAR ───────────                          │
│                                                             │
│  📊 Analitik                      → /analitik               │
│                                                             │
│  ─────────── AYARLAR ───────────                           │
│                                                             │
│  👥 Kullanıcılar                  → /kullanici              │
│  📋 Denetim Kayıtları             → /denetim-kayitlari      │
│                                                             │
│  ⚙️ Ayarlar                                                 │
│     ├─ Genel Ayarlar              → /ayarlar                │
│     ├─ Tema Ayarları              → /ayarlar/tema           │
│     ├─ Marka                      → /ayarlar/marka          │
│     ├─ İletişim                   → /ayarlar/iletisim       │
│     ├─ Güvenlik                   → /ayarlar/guvenlik       │
│     └─ Parametreler               → /ayarlar/parametreler   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Ana Dashboard (/genel)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                                │
│  "Sistemin genel durumunu takip edin"                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ KPI Card 1  │ │ KPI Card 2  │ │ KPI Card 3  │           │
│  │ Bekleyen    │ │ Takipteki   │ │ Takvim      │           │
│  │ İşlemler    │ │ İş Kayıtları│ │ Etkinlikleri│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ KPI Card 4  │ │ KPI Card 5  │ │ KPI Card 6  │           │
│  │ Toplantılar │ │ Kurul &     │ │ Seyahat     │           │
│  │             │ │ Komisyonlar │ │ Kayıtları   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ │
│  │      BAĞIŞ TRENDİ        │ │    YARDIM KATEGORİLERİ   │ │
│  │      (Area Chart)        │ │      (Pie Chart)         │ │
│  │                          │ │                          │ │
│  │    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄      │ │         🔵 %35           │ │
│  │  ▄▀              ▀▄     │ │      🟢 %25  🟡 %20      │ │
│  │ ▄▀                ▀▄    │ │         🟣 %15           │ │
│  │ Oca  Şub  Mar  Nis  May │ │         ⚫ %5            │ │
│  └──────────────────────────┘ └──────────────────────────┘ │
│                                                             │
│  ─────────── HIZLI ERİŞİM ───────────                      │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 👥 İhtiyaç  │ │ ❤️ Bağışlar │ │ 📊 Raporlar │           │
│  │   Sahipleri │ │             │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ─────────── İSTATİSTİKLER ───────────                     │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐│
│  │ StatCard    │ │ StatCard    │ │ StatCard    │ │StatCard││
│  │ İhtiyaç     │ │ Bağış       │ │ Bağış       │ │ Aktif  ││
│  │ Sahibi      │ │ Sayısı      │ │ Tutarı      │ │Kullanıc││
│  │ ████████ 85%│ │ ████████ 92%│ │ ████████ 78%│ │███ 65% ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘│
│                                                             │
│  ─────────── SİSTEM DURUMU ───────────                     │
│                                                             │
│  ✅ Veritabanı: Aktif   ✅ Auth: Aktif   ✅ API: Aktif     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Yetki Sistemi

| Modül | Permission | Açıklama |
|-------|------------|----------|
| Bağışlar | `view:donations` | Bağış sayfalarına erişim |
| Yardım | `view:beneficiaries` | İhtiyaç sahibi sayfalarına erişim |
| Başvurular | `view:aid_applications` | Başvuru sayfalarına erişim |
| Burslar | `view:scholarships` | Burs sayfalarına erişim |
| Finans | `view:finance` | Finansal sayfalara erişim |
| Mesajlar | `view:messages` | Mesaj sayfalarına erişim |
| İş Yönetimi | `view:workflow` | Görev/toplantı sayfalarına erişim |
| Ortaklar | `view:partners` | Partner sayfalarına erişim |
| Raporlar | `view:reports` | Analitik sayfalarına erişim |
| Ayarlar | `manage:settings` | Ayar sayfalarına erişim |
| Kullanıcılar | `manage:users` | Kullanıcı yönetimi (admin) |

---

## 7. BACKEND API YAPISI

### 7.1 API Endpoint'leri (66 adet)

#### Authentication
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | Kullanıcı girişi |
| POST | `/api/auth/logout` | Çıkış |
| POST | `/api/auth/register` | Kayıt (admin) |
| GET | `/api/csrf` | CSRF token |

#### Beneficiaries (İhtiyaç Sahipleri)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/beneficiaries` | Liste |
| POST | `/api/beneficiaries` | Oluştur |
| GET | `/api/beneficiaries/[id]` | Detay |
| PATCH | `/api/beneficiaries/[id]` | Güncelle |
| DELETE | `/api/beneficiaries/[id]` | Sil |

#### Donations (Bağışlar)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/donations` | Liste |
| POST | `/api/donations` | Oluştur |
| GET | `/api/donations/[id]` | Detay |
| PATCH | `/api/donations/[id]` | Güncelle |
| DELETE | `/api/donations/[id]` | Sil |
| GET | `/api/donations/reports` | Raporlar |

#### Kumbara (Bağış Kutuları)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/kumbara` | Liste |
| POST | `/api/kumbara` | Oluştur |
| GET | `/api/kumbara/[id]` | Detay |
| PATCH | `/api/kumbara/[id]` | Güncelle |
| DELETE | `/api/kumbara/[id]` | Sil |

#### Diğer Endpoint'ler
- `/api/meetings/*` - Toplantı yönetimi
- `/api/meeting-decisions/*` - Toplantı kararları
- `/api/tasks/*` - Görev yönetimi
- `/api/messages/*` - Mesaj yönetimi
- `/api/partners/*` - Partner yönetimi
- `/api/scholarships/*` - Burs yönetimi
- `/api/finance/*` - Finansal işlemler
- `/api/users/*` - Kullanıcı yönetimi
- `/api/audit-logs/*` - Denetim kayıtları
- `/api/system-settings/*` - Sistem ayarları
- `/api/parameters/*` - Parametreler
- `/api/branding/*` - Marka ayarları
- `/api/errors/*` - Hata yönetimi

### 7.2 Rate Limiting Politikaları

| Endpoint Türü | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 | 10 dakika |
| Data Modification (POST/PUT/DELETE) | 50 | 15 dakika |
| Read Only (GET) | 200 | 15 dakika |
| File Upload | 10 | 1 dakika |
| Search | 30 | 1 dakika |
| Dashboard | 60 | 1 dakika |
| General API | 100 | 15 dakika |

### 7.3 Güvenlik Katmanları

```
Request Flow:
┌─────────────────────────────────────────────────────────────┐
│  1. RATE LIMITING                                           │
│     └─ IP bazlı, endpoint-specific limitler                │
├─────────────────────────────────────────────────────────────┤
│  2. CSRF VALIDATION (POST/PUT/PATCH/DELETE)                │
│     └─ Double submit cookie pattern                        │
├─────────────────────────────────────────────────────────────┤
│  3. AUTHENTICATION                                          │
│     └─ HMAC signed session cookies                         │
├─────────────────────────────────────────────────────────────┤
│  4. AUTHORIZATION                                           │
│     └─ Module-based permission check                       │
├─────────────────────────────────────────────────────────────┤
│  5. INPUT VALIDATION                                        │
│     └─ Zod schema validation                               │
├─────────────────────────────────────────────────────────────┤
│  6. INPUT SANITIZATION                                      │
│     └─ DOMPurify XSS prevention                            │
├─────────────────────────────────────────────────────────────┤
│  7. BUSINESS LOGIC                                          │
│     └─ Appwrite CRUD operations                            │
├─────────────────────────────────────────────────────────────┤
│  8. AUDIT LOGGING                                           │
│     └─ All mutations logged                                │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Account Lockout Politikası

| Parametre | Değer |
|-----------|-------|
| Maksimum başarısız giriş | 5 |
| Deneme penceresi | 15 dakika |
| Kilit süresi | 30 dakika |
| Otomatik temizleme | 1 saat |

---

## 8. PERFORMANS OPTİMİZASYONLARI

### 8.1 Frontend

| Optimizasyon | Uygulama |
|--------------|----------|
| Code Splitting | Route-based chunks |
| Dynamic Imports | Recharts, heavy components |
| Image Optimization | AVIF/WebP, responsive sizes |
| Font Loading | Inter font with display=swap |
| Bundle Analysis | @next/bundle-analyzer |
| Tree Shaking | ES modules |
| CSS Optimization | Tailwind CSS purge |

### 8.2 Caching Stratejisi

| Kaynak | Cache Süresi |
|--------|--------------|
| Static assets (images, fonts) | 1 yıl |
| CSS/JS bundles | İmmutable |
| API responses | No-cache (dynamic) |
| User session | 1-30 gün (remember me) |

### 8.3 Webpack Chunks

```javascript
chunks: {
  framework: ['react', 'react-dom', 'next'],
  'radix-ui': ['@radix-ui/*'],
  lucide: ['lucide-react'],
  tanstack: ['@tanstack/*'],
  framer: ['framer-motion'],
  recharts: ['recharts'],
  vendors: ['zod', 'date-fns', 'zustand']
}
```

---

## 9. TEST STRATEJİSİ

### 9.1 Unit Tests (Vitest)

| Alan | Test Sayısı | Coverage |
|------|-------------|----------|
| Hooks | 5 | ~80% |
| Utils | 8 | ~90% |
| Validations | 6 | ~95% |
| Components | 8 | ~70% |
| **Toplam** | **27** | **~75%** |

### 9.2 E2E Tests (Playwright)

| Senaryo | Açıklama |
|---------|----------|
| Auth Flow | Login, logout, session |
| CRUD Operations | Beneficiary, donation, meeting |
| Navigation | Sidebar, breadcrumb, routing |
| Forms | Validation, submission, error states |
| Permissions | Role-based access |

### 9.3 Test Komutları

```bash
npm run test           # Unit tests (watch mode)
npm run test:run       # Single run
npm run test:coverage  # Coverage report
npm run test:ui        # Vitest UI
npm run test:e2e       # Playwright E2E
```

---

## 10. DEPLOYMENT

### 10.1 Environment Variables

```env
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key

# Security
CSRF_SECRET=minimum_32_karakter_secret
SESSION_SECRET=minimum_32_karakter_secret

# Optional - Communication
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Optional - Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_ID=your_ga_id
```

### 10.2 Build & Deploy

```bash
# Development
npm run dev

# Production Build
npm run build


# Appwrite Setup
npm run appwrite:setup
```

### 10.3 PWA Support

| Dosya | Açıklama |
|-------|----------|
| `manifest.json` | Web app manifest |
| `sw.js` | Service Worker |
| `offline.html` | Offline fallback |

---

## 11. GELİŞTİRME REHBERİ

### 11.1 Yeni Sayfa Ekleme

1. Route dosyası oluştur: `src/app/(dashboard)/[module]/page.tsx`
2. Navigation'a ekle: `src/config/navigation.ts`
3. Permission tanımla: `MODULE_PERMISSIONS`
4. PageLayout kullan
5. Gerekli komponentleri import et

### 11.2 Yeni Komponent Ekleme

```typescript
// src/components/ui/my-component.tsx
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
}
```

### 11.3 Form Oluşturma

```typescript
import { useStandardForm } from '@/hooks/useStandardForm';
import { mySchema } from '@/lib/validations/my-schema';

function MyForm({ initialData, onSuccess }) {
  const form = useStandardForm({
    defaultValues: initialData || { name: '', status: 'active' },
    schema: mySchema,
    mutationFn: initialData
      ? (data) => myApi.update(initialData.id, data)
      : myApi.create,
    onSuccess,
  });

  return <form onSubmit={form.handleSubmit}>...</form>;
}
```

### 11.4 API Route Oluşturma

```typescript
// src/app/api/my-resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfToken, requireModuleAccess } from '@/lib/api/auth-utils';
import { appwriteMyResource } from '@/lib/appwrite';

export async function GET(request: NextRequest) {
  const { user } = await requireModuleAccess('my_module');
  const data = await appwriteMyResource.list();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  await verifyCsrfToken(request);
  const { user } = await requireModuleAccess('my_module');
  const body = await request.json();
  const data = await appwriteMyResource.create(body);
  return NextResponse.json({ success: true, data }, { status: 201 });
}
```

---

## 12. SONUÇ

Kafkasder Panel, modern web teknolojileri kullanılarak geliştirilmiş, güvenli, ölçeklenebilir ve kullanıcı dostu bir dernek yönetim sistemidir. Bu PRD, projenin teknik detaylarını, UI/UX tasarım sistemini, API yapısını ve geliştirme rehberini kapsamlı şekilde dokümante etmektedir.

### Önemli Linkler

| Kaynak | Konum |
|--------|-------|
| Proje Ana Dizini | `/home/user/Kafkasportal` |
| Ana Dokümantasyon | `CLAUDE.md` |
| API Patterns | `docs/api-patterns.md` |
| Test Rehberi | `docs/testing.md` |
| Deployment Rehberi | `docs/deployment.md` |
| MCP Kurulum | `docs/mcp-setup.md` |
| Katkı Rehberi | `CONTRIBUTING.md` |
| Güvenlik Politikası | `SECURITY.md` |

---

**Hazırlayan:** Claude Code AI Assistant
**Tarih:** 23 Kasım 2025
**Versiyon:** 1.0
