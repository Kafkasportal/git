# Dernek Yönetim Sistemi

Modern, kapsamlı dernek yönetim sistemi - Next.js 16 + Appwrite ile geliştirilmiştir.

## 🚀 Özellikler

- **Kullanıcı Yönetimi**: Rol tabanlı yetkilendirme sistemi
- **Yardım Yönetimi**: İhtiyaç sahipleri ve başvuru takibi
- **Bağış Yönetimi**: Kumbara ve bağış takibi
- **Burs Yönetimi**: Öğrenci burs başvuruları ve ödemeleri
- **Finans Yönetimi**: Gelir-gider takibi ve raporlama
- **Toplantı Yönetimi**: Toplantılar, kararlar ve görevler
- **Mesajlaşma**: Kurum içi ve toplu mesajlaşma
- **Raporlama**: Detaylı analitik ve raporlar
- **PWA Desteği**: Offline çalışma özelliği
- **Gerçek Zamanlı Bildirimler**: SSE ile anlık bildirimler

## 📋 Gereksinimler

- Node.js >= 20.x
- npm >= 9.0.0
- Appwrite hesabı ve projesi

## 🛠️ Hızlı Başlangıç

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd dernek-yonetim-sistemi
npm install
```

### 2. Environment Değişkenlerini Ayarlayın

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin ve Appwrite bilgilerinizi ekleyin.

### 3. Development Server'ı Başlatın

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📝 Environment Variables

Detaylı bilgi için [docs/ENV_SETUP.md](docs/ENV_SETUP.md) dosyasına bakın.

### Zorunlu Değişkenler

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite endpoint URL'i
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Appwrite proje ID'si
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`: Appwrite database ID'si
- `APPWRITE_API_KEY`: Appwrite API key (server-side)

### Production'da Zorunlu

- `CSRF_SECRET`: CSRF koruması için secret (minimum 32 karakter)
- `SESSION_SECRET`: Session yönetimi için secret (minimum 32 karakter)

## 🚀 Deployment

### Vercel (Önerilen)

1. Vercel hesabına projeyi import edin
2. Environment variables'ları ekleyin
3. Deploy edin

Detaylı bilgi için [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) dosyasına bakın.

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm run test:run

# Test coverage
npm run test:coverage

# TypeScript kontrolü
npm run typecheck

# Lint kontrolü
npm run lint:check
```

## 🏗️ Production Build

```bash
# Production build
npm run build

# Production server'ı başlat
npm run start

# Build analizi
npm run analyze
```

## 📦 Önemli Scripts

- `npm run dev:turbo` - Turbopack ile hızlı development server
- `npm run build` - Production build
- `npm run typecheck` - TypeScript tip kontrolü
- `npm run lint:fix` - ESLint hatalarını otomatik düzelt
- `npm run test:run` - Testleri çalıştır (CI için)
- `npm run clean` - Build cache temizle

## 🔒 Güvenlik

- ✅ CSRF koruması aktif
- ✅ Rate limiting (100 req/15min)
- ✅ Input sanitization ve XSS koruması
- ✅ Secure session management (HttpOnly cookies)
- ✅ Environment variables validation
- ✅ Güvenlik headers (CSP, HSTS, vb.)

## 📱 PWA Özellikleri

- Offline çalışma desteği
- Service Worker
- Installable (Android/iOS)
- Push notifications desteği

**Not:** PWA ikonları production'a alınmadan önce `public/icons/` klasörüne eklenmelidir.

## 🏗️ Mimari

Proje Next.js 16 App Router kullanılarak geliştirilmiştir:

```
src/
├── app/              # Next.js App Router (pages & API routes)
├── components/       # React bileşenleri (UI primitives, forms, tables)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions & services
│   ├── appwrite/     # Appwrite SDK wrappers
│   ├── api/          # API utilities
│   ├── auth/         # Authentication
│   └── validations/  # Zod schemas
├── stores/           # Zustand state management
├── types/            # TypeScript type definitions
└── __tests__/        # Test files
```

## 📚 Dokümantasyon

- [Environment Variables Setup](docs/ENV_SETUP.md) - Environment değişkenlerini doğru ayarlama
- [API Documentation](docs/API.md) - REST API referansı (97 endpoints)
- [Architecture](docs/ARCHITECTURE.md) - Mimari dokümantasyonu
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment rehberi

## 📚 Teknoloji Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Backend**: Appwrite (BaaS)
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library
- **UI Components**: Radix UI primitives

## ⚠️ Production'a Almadan Önce

1. ✅ Environment variables'ları kontrol edin (özellikle secrets)
2. ✅ PWA ikonlarını ekleyin (`public/icons/`)
3. ✅ Testleri çalıştırın (`npm run test:run`)
4. ✅ TypeScript kontrolü yapın (`npm run typecheck`)
5. ✅ Lint kontrolü yapın (`npm run lint:check`)
6. ✅ Production build test edin (`npm run build`)
7. ✅ Appwrite collections ve permissions kontrol edin

## 📄 Lisans

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

---

**Son Güncelleme:** 2025-01-12
