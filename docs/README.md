# 📘 Dernek Yönetim Sistemi - Dokümantasyon

## 📋 İçindekiler

1. [Proje Hakkında](#proje-hakkında)
2. [Hızlı Başlangıç](./getting-started.md)
3. [Mimari Yapı](./architecture.md)
4. [API Referansı](./api-reference.md)
5. [Bileşen Kütüphanesi](./components.md)
6. [Veritabanı Şeması](./database-schema.md)
7. [Güvenlik](./security.md)
8. [Yetkilendirme Sistemi](./authorization.md)
9. [Form Yönetimi](./forms.md)
10. [Test Yazımı](./testing.md)

---

## 🎯 Proje Hakkında

**Dernek Yönetim Sistemi**, sivil toplum kuruluşları için geliştirilmiş modern bir yönetim platformudur. Bağış takibi, ihtiyaç sahibi yönetimi, burs programları, finansal operasyonlar ve iletişim süreçlerini tek bir çatı altında toplar.

### 🔧 Teknoloji Yığını

| Kategori | Teknoloji | Sürüm |
|----------|-----------|-------|
| **Framework** | Next.js | 16.x |
| **Dil** | TypeScript | 5.x |
| **Backend** | Appwrite | 21.x |
| **State Yönetimi** | Zustand | 5.x |
| **Veri Çekme** | TanStack React Query | 5.x |
| **Form Yönetimi** | React Hook Form + Zod | 7.x / 4.x |
| **UI Bileşenleri** | Radix UI + Tailwind CSS | 4.x |
| **Animasyonlar** | Framer Motion | 12.x |
| **Tablo** | TanStack Table | 8.x |
| **Grafikler** | Recharts | 3.x |
| **AI Entegrasyonu** | Vercel AI SDK | 5.x |
| **Test** | Vitest + Testing Library | 4.x |

### 🏗️ Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard sayfaları (korumalı)
│   ├── api/               # API Route'ları
│   ├── auth/              # Auth sayfaları
│   └── login/             # Giriş sayfası
├── components/            # React Bileşenleri
│   ├── ui/               # Temel UI bileşenleri
│   ├── forms/            # Form bileşenleri
│   └── [feature]/        # Özellik-bazlı bileşenler
├── hooks/                 # Custom React Hooks
├── lib/                   # Yardımcı kütüphaneler
│   ├── api/              # API istemci katmanı
│   ├── appwrite/         # Appwrite SDK wrapper
│   ├── validations/      # Zod şemaları
│   └── security/         # Güvenlik araçları
├── stores/                # Zustand state store'ları
├── types/                 # TypeScript tip tanımları
├── config/                # Uygulama konfigürasyonu
└── contexts/              # React Context'ler
```

### 📦 Ana Modüller

| Modül | Açıklama | Rota |
|-------|----------|------|
| **Bağış Yönetimi** | Bağış kayıtları, raporlar, kumbara sistemi | `/bagis/*` |
| **Yardım Programları** | İhtiyaç sahipleri, başvurular, nakit yardım | `/yardim/*` |
| **Burs Sistemi** | Öğrenci bursları, başvurular, yetim destek | `/burs/*` |
| **Finansal Yönetim** | Gelir-gider takibi, mali raporlar | `/fon/*` |
| **İletişim** | SMS, e-posta, toplu mesaj, WhatsApp | `/mesaj/*` |
| **İş Yönetimi** | Görevler, toplantılar, karar takibi | `/is/*` |
| **Ortak Yönetimi** | Partner kuruluşlar | `/partner/*` |
| **Kullanıcı Yönetimi** | Roller, yetkiler, denetim kayıtları | `/kullanici/*` |
| **Sistem Ayarları** | Tema, marka, güvenlik, parametreler | `/ayarlar/*` |

### 🔐 Güvenlik Özellikleri

- ✅ CSRF koruması (token-based)
- ✅ Rate limiting (IP ve kullanıcı bazlı)
- ✅ HttpOnly cookie oturumları
- ✅ Rol tabanlı erişim kontrolü (RBAC)
- ✅ Input sanitizasyonu (DOMPurify)
- ✅ TC Kimlik No algoritma doğrulaması
- ✅ Dosya yükleme güvenliği
- ✅ Audit logging (KVKK/GDPR uyumlu)

### 📱 PWA Özellikleri

- ✅ Offline çalışma desteği
- ✅ Service Worker
- ✅ App manifest
- ✅ Ağ durumu göstergesi

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 20.x
- npm 9.x veya üzeri
- Appwrite sunucusu (Cloud veya Self-hosted)

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Appwrite kurulumu
npm run appwrite:setup

# Geliştirme sunucusunu başlat
npm run dev
```

### Ortam Değişkenleri

`.env.local` dosyası oluşturun:

```env
# Appwrite Konfigürasyonu
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key

# Storage Bucket'ları
NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS=documents
NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS=avatars
NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS=receipts

# Rate Limiting (Opsiyonel)
RATE_LIMIT_DEFAULT_MAX=100
RATE_LIMIT_DEFAULT_WINDOW=900000
RATE_LIMIT_PREMIUM_MULTIPLIER=2.0
```

---

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi için ilgili dokümantasyon sayfalarını inceleyin:

- **[Mimari Yapı](./architecture.md)** - Uygulama mimarisi ve tasarım kararları
- **[API Referansı](./api-reference.md)** - Tüm API endpoint'leri
- **[Bileşen Kütüphanesi](./components.md)** - UI bileşenleri kullanım rehberi
- **[Veritabanı Şeması](./database-schema.md)** - Appwrite collection yapıları
- **[Güvenlik](./security.md)** - Güvenlik implementasyonları
- **[Yetkilendirme](./authorization.md)** - Rol ve izin sistemi
- **[Form Yönetimi](./forms.md)** - Form yapıları ve validasyonlar
- **[Test Yazımı](./testing.md)** - Test stratejileri ve örnekler

---

## 📝 Lisans

Bu proje özel lisans altındadır. Detaylar için [LICENSE](../LICENSE) dosyasına bakın.

