# Dernek Yönetim Sistemi

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/32fcdacc0b1a4db0bf22deae2a259f9e)](https://app.codacy.com/gh/Kafkasportal/git?utm_source=github.com&utm_medium=referral&utm_content=Kafkasportal/git&utm_campaign=Badge_Grade)

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

## 🛠️ Kurulum

### 1. Projeyi klonlayın

```bash
git clone <repository-url>
cd dernek-yonetim-sistemi
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Environment değişkenlerini ayarlayın

`.env.local` dosyası oluşturun ve `.env.example` dosyasındaki değişkenleri doldurun:

```bash
cp .env.example .env.local
```

### 4. Appwrite kurulumu

1. [Appwrite Cloud](https://cloud.appwrite.io) hesabı oluşturun
2. Yeni proje oluşturun
3. Database ve Collections'ları oluşturun
4. API Key oluşturun (server-side için)
5. Storage buckets oluşturun

### 5. Development server'ı başlatın

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📝 Environment Variables

Gerekli environment değişkenleri için `.env.example` dosyasına bakın.

### Zorunlu Değişkenler

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite endpoint URL'i
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Appwrite proje ID'si
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`: Appwrite database ID'si
- `APPWRITE_API_KEY`: Appwrite API key (server-side)

### Opsiyonel Değişkenler

- `CSRF_SECRET`: CSRF koruması için secret (production'da zorunlu)
- `SESSION_SECRET`: Session yönetimi için secret (production'da zorunlu)
- `SMTP_*`: Email gönderimi için SMTP ayarları
- `TWILIO_*`: SMS gönderimi için Twilio ayarları

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm run test

# Test coverage
npm run test:coverage

# Test UI
npm run test:ui
```

## 🏗️ Build

```bash
# Production build
npm run build

# Build analizi
npm run analyze
```

## 📦 Scripts

- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run lint`: ESLint kontrolü
- `npm run typecheck`: TypeScript tip kontrolü
- `npm run test`: Testleri çalıştır
- `npm run clean`: Cache temizle

## 🏗️ Proje Yapısı

```
src/
├── app/              # Next.js App Router sayfaları
├── components/       # React bileşenleri
├── hooks/            # Custom React hooks
├── lib/              # Utility fonksiyonları ve servisler
├── stores/           # Zustand state management
├── types/            # TypeScript type tanımları
└── __tests__/        # Test dosyaları
```

## 🔒 Güvenlik

- CSRF koruması
- Rate limiting
- Input sanitization
- XSS koruması
- SQL injection koruması
- Secure session management

## 📱 PWA Özellikleri

- Offline çalışma
- Service Worker
- Installable
- Push notifications

## 📄 Lisans

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

## 🚫 Katkı Politikası

Bu depo yalnızca sahibi tarafından geliştirilecektir. Dışarıdan pull request, issue veya fork talepleri kabul edilmez; lütfen değişiklik ihtiyacı olduğunda doğrudan depo sahibine bildirin.

## 📚 Teknolojiler

- **Framework**: Next.js 16
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Backend**: Appwrite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

## 📖 Dokümantasyon

- [README.md](README.md) - Genel bilgiler ve kurulum
- [docs/ENV_SETUP.md](docs/ENV_SETUP.md) - Environment değişkenlerini doğru ve güvenli şekilde ayarlama
- [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Platforma özel değişken çakışmalarını ve önerilen değerleri inceleme
- [docs/API.md](docs/API.md) - REST API dokümantasyonu (87 endpoints)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Mimari dokümantasyonu
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - Katkıda bulunma rehberi
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment rehberi
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Değişiklik geçmişi
- [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) - Güvenlik denetimi
- [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) - Geliştirme yol haritası

## 🎯 Roadmap

- [x] API documentation
- [x] Architecture documentation
- [x] CI/CD pipeline
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Performance optimizations

