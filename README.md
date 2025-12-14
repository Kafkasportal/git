# Dernek Yönetim Sistemi

Modern, güvenli ve ölçeklenebilir dernek (non-profit association) yönetim sistemi. Next.js 16, Appwrite, React 19 ve TypeScript ile geliştirilmiştir.

## 🚀 Özellikler

- **Modern Stack**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Appwrite BaaS (MongoDB, Authentication, Storage, Realtime)
- **State Management**: Zustand + React Query
- **UI Framework**: Radix UI + Tailwind CSS 4
- **Form Handling**: React Hook Form + Zod validation
- **Real-time**: Server-Sent Events (SSE) ile canlı güncellemeler
- **Güvenlik**: CSRF koruması, rate limiting, XSS önleme, güvenli session yönetimi
- **Performance**: Bundle optimization, code splitting, image optimization
- **Accessibility**: WCAG uyumlu, klavye navigasyonu, screen reader desteği
- **Testing**: Vitest + Testing Library (70% coverage target)

## 📋 Gereksinimler

- **Node.js**: >=20.x
- **npm**: >=9.0.0
- **Appwrite**: Cloud veya self-hosted Appwrite instance

## 🛠️ Kurulum

### 1. Repository'yi klonlayın

```bash
git clone <repository-url>
cd dernek-nextjs
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Environment variables'ları ayarlayın

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyip kendi Appwrite ve diğer servis bilgilerinizi ekleyin:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
CSRF_SECRET=your-csrf-secret-minimum-32-characters
SESSION_SECRET=your-session-secret-minimum-32-characters
```

Detaylı environment bilgileri için `.env.example` dosyasına bakın.

### 4. Veritabanını hazırlayın

```bash
npm run setup-db
```

### 5. Development server'ı başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📜 Komutlar

### Development

```bash
npm run dev              # Development server (normal mode)
npm run dev:turbo        # Development server (Turbopack - daha hızlı)
```

### Build & Production

```bash
npm run build            # Production build
npm run build:fast       # Production build (env validation atla)
npm run build:turbo      # Production build (Turbopack)
npm run start            # Production server başlat
```

### Testing

```bash
npm run test             # Test'leri watch mode'da çalıştır
npm run test:run         # Test'leri CI mode'da çalıştır
npm run test:ui          # Test UI ile çalıştır
npm run test:coverage    # Test coverage raporu oluştur
```

### Code Quality

```bash
npm run lint:check       # Lint kontrolü yap
npm run lint:fix         # Lint hatalarını otomatik düzelt
npm run typecheck        # TypeScript type checking
```

### Utility

```bash
npm run clean            # Build cache'leri temizle
npm run clean:all        # Tüm cache ve node_modules'ü temizle
npm run analyze          # Bundle analyzer ile analiz yap
```

## 🏗️ Proje Yapısı

```
src/
├── app/                    # Next.js App Router routes
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API routes (87 endpoint)
│   ├── auth/              # Authentication pages
│   └── login/             # Login page
├── components/            # React components
│   ├── ui/               # Radix UI components
│   ├── forms/            # Form components
│   ├── tables/           # Table components
│   └── ...               # Feature-specific components
├── lib/                   # Utilities & services
│   ├── appwrite/         # Appwrite SDK wrappers
│   ├── api/              # API utilities & validation
│   ├── auth/             # Authentication utilities
│   ├── security/         # Security utilities
│   └── validations/      # Zod schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript definitions
└── __tests__/            # Test files
```

Detaylı geliştirme kuralları için [AGENTS.md](./AGENTS.md) dosyasına bakın.

## 🔒 Güvenlik

Proje aşağıdaki güvenlik önlemlerini içerir:

- ✅ **CSRF Protection**: Token tabanlı CSRF koruması
- ✅ **Rate Limiting**: Endpoint bazlı rate limiting
- ✅ **XSS Prevention**: DOMPurify ile input sanitization
- ✅ **Session Security**: HttpOnly cookies, secure sessions
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, vb.
- ✅ **Input Validation**: Zod schemas ile tüm input validasyonu
- ✅ **Environment Variables**: Güvenli env variable yönetimi

## 📊 Test Coverage

Test coverage hedefi: **70%** (lines, functions, branches, statements)

Coverage raporu oluşturmak için:
```bash
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Önerilen)

1. Vercel'e deploy edin:
```bash
vercel
```

2. Environment variables'ları Vercel dashboard'dan ekleyin

### Appwrite Sites

1. Appwrite Console → Functions → Sites
2. GitHub repository'yi bağlayın
3. Environment variables'ları ekleyin
4. Deploy edin

## 📚 Dokümantasyon

- [AGENTS.md](./AGENTS.md) - Development guidelines ve build komutları
- [DEBUG.md](./DEBUG.md) - VS Code debugging rehberi
- `.env.example` - Environment variables şablonu

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje özel bir projedir.

## 🔧 Sorun Giderme

### Next.js Cache Sorunları

Kod değişiklikleri yansımıyorsa veya beklenmedik hatalar alıyorsanız, Next.js cache'ini temizleyin:

```bash
# 1. Development server'ı durdurun (Ctrl+C)

# 2. .next klasörünü temizleyin
rm -rf .next

# 3. Node modules cache'ini temizleyin (opsiyonel)
npm run clean

# 4. Development server'ı yeniden başlatın
npm run dev
```

**Tam temizlik** (tüm cache ve node_modules):
```bash
npm run clean:all
npm install
npm run dev
```

**Tarayıcı cache'i**:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) veya `Cmd+Shift+R` (Mac)
- Veya Developer Tools → Network → "Disable cache" seçeneğini işaretleyin

### Yaygın Sorunlar

- **401 Unauthorized hataları**: Session cookie'lerini temizleyin veya yeniden giriş yapın
- **API route'ları çalışmıyor**: `.next` klasörünü temizleyip server'ı yeniden başlatın
- **TypeScript hataları**: `npm run typecheck` çalıştırıp hataları kontrol edin
- **Build hataları**: `npm run clean:all` ile tam temizlik yapın

## 🆘 Destek

Sorun yaşıyorsanız:
1. [Issues](https://github.com/your-repo/issues) sayfasına bakın
2. Yeni bir issue açın
3. DEBUG.md dosyasına bakın (debugging bilgileri için)

---

**Not**: Bu README genel bir başlangıç noktasıdır. Projenize özgü detayları eklemeyi unutmayın.
