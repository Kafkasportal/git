# Kurulum Rehberi

Kafkasder Panel projesini yerel ortamınızda çalıştırmak için adım adım kurulum rehberi.

## Gereksinimler

- **Node.js**: >= 20.9.0 (Önerilen: 20.x LTS)
- **npm**: >= 9.0.0
- **Git**: Versiyon kontrolü için
- **Appwrite Hesabı**: [cloud.appwrite.io](https://cloud.appwrite.io) üzerinden ücretsiz oluşturabilirsiniz veya self-hosted kurabilirsiniz

## Hızlı Başlangıç

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/kafkasder-org/Kafkasportal.git
cd Kafkasportal
```

### 2. Node.js Sürümünü Kontrol Edin

Proje Node.js 20.x gerektirir. `.nvmrc` dosyası mevcutsa:

```bash
# nvm kullanıyorsanız
nvm use

# veya node sürümünü manuel kontrol edin
node --version
```

### 3. Bağımlılıkları Yükleyin

```bash
npm install
```

**Not**: Puppeteer Chromium indirme hatası alırsanız, bu normaldir. `.npmrc` dosyası Chromium indirmeyi otomatik olarak atlar (Playwright E2E testleri için kullanılır).

### 4. Environment Variables Ayarlayın

`.env.example` dosyasını `.env.local` olarak kopyalayın:

```bash
cp .env.example .env.local
```

Minimum gerekli ayarlar için `.env.local` dosyasını düzenleyin:

```env
# ZORUNLU - Appwrite Backend
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key

# ZORUNLU - Güvenlik (32+ karakter)
CSRF_SECRET=your-csrf-secret-min-32-chars-replace-me
SESSION_SECRET=your-session-secret-min-32-chars-replace-me

# ZORUNLU - İlk admin kullanıcı
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_PASSWORD=YourSecurePassword123!
```

#### Appwrite Kurulumu

1. [cloud.appwrite.io](https://cloud.appwrite.io) adresine gidin veya self-hosted kurulum yapın
2. Yeni bir proje oluşturun (ücretsiz)
3. "Settings" > "API Keys" bölümünden API key oluşturun
4. Database ve Collection'ları oluşturun (veya `npm run appwrite:setup` komutunu kullanın)
5. Bilgileri `.env.local` dosyasına yapıştırın

#### Güvenli Secret Oluşturma

```bash
# macOS/Linux
openssl rand -base64 32

# veya Node.js ile
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Appwrite Database Kurulumu

Appwrite database ve collection'larını otomatik olarak oluşturun:

```bash
npm run appwrite:setup
```

Bu komut:
1. Appwrite database'ini oluşturur
2. Gerekli collection'ları oluşturur
3. Index'leri ve permission'ları ayarlar

### 6. Next.js Development Server'ı Başlatın

Başka bir terminal açın ve Next.js'i başlatın:

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

### 7. İlk Giriş

Tarayıcınızda `http://localhost:3000/login` adresine gidin ve `.env.local` dosyasında belirlediğiniz admin bilgileriyle giriş yapın.

## Geliştirme İş Akışı

### Kod Kalitesi Kontrolleri

Değişiklik yapmadan önce mevcut durumu kontrol edin:

```bash
# TypeScript tip kontrolü
npm run typecheck

# ESLint kontrolü
npm run lint

# Prettier formatı kontrol
npm run format:check
```

### Test Çalıştırma

```bash
# Unit testler (watch mode)
npm run test

# Tüm testleri bir kez çalıştır
npm run test:run

# Coverage raporu
npm run test:coverage

# E2E testler (development server çalışmalı)
npm run test:e2e
```

### Kod Formatlama

```bash
# Prettier ile formatla
npm run format

# ESLint ile düzelt
npm run lint:fix
```

### Pre-commit Hook

Husky pre-commit hook otomatik olarak:

- Değiştirilen dosyaları lint ve format eder
- TypeScript tip kontrolü yapar

Commit yaparken otomatik çalışır:

```bash
git add .
git commit -m "feat: yeni özellik"
# Pre-commit hook otomatik çalışır
```

## Production Build

Değişikliklerinizi production'a almadan önce:

```bash
# Build testi
npm run build

# Build başarılıysa, başlat
npm start
```

## Sık Karşılaşılan Sorunlar

### 1. Port Çakışması

**Sorun**: "Port 3000 is already in use"

**Çözüm**:

```bash
# Portu öldür
kill -9 $(lsof -ti:3000)

# veya farklı port kullan
PORT=3001 npm run dev
```

### 2. Module Not Found

**Sorun**: "Cannot find module..."

**Çözüm**:

```bash
# Node modules'u sıfırla
rm -rf node_modules package-lock.json
npm install
```

### 3. TypeScript Hataları

**Sorun**: Type errors after git pull

**Çözüm**:

```bash
# Dependencies'i güncelle
npm install

# TypeScript cache'i temizle
rm -rf .next
npm run build
```

### 4. Puppeteer Chromium Download Error

**Sorun**: "Failed to download Chromium"

**Çözüm**: Bu normal ve beklenen bir davranıştır. `.npmrc` dosyası Chromium indirmeyi otomatik olarak atlar. E2E testler için Playwright kullanılır.

## Environment Variables Detayları

### Zorunlu (Development)

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=...   # Appwrite project ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=...  # Appwrite database ID
APPWRITE_API_KEY=...                  # Appwrite API key
CSRF_SECRET=...                      # 32+ karakter
SESSION_SECRET=...                   # 32+ karakter
FIRST_ADMIN_EMAIL=...               # İlk admin email
FIRST_ADMIN_PASSWORD=...            # İlk admin şifre
```

### Opsiyonel (Özellik Bazlı)

```env
# Email gönderimi için
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# SMS için (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# WhatsApp için
WHATSAPP_AUTO_INIT=false

# AI Chat için
OPENAI_API_KEY=...

# Monitoring için
SENTRY_DSN=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=...

# Google Maps için
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Tüm detaylar için `.env.example` dosyasına bakın.

## IDE Ayarları

### VS Code

Önerilen eklentiler (workspace'de tanımlı):

- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense

### Diğer IDE'ler

EditorConfig desteği olan IDE'ler `.editorconfig` dosyasını otomatik kullanır.

## Sonraki Adımlar

Artık geliştirmeye hazırsınız! Şunları okuyabilirsiniz:

- [API Patterns](./api-patterns.md) - API standartları
- [Testing Guide](./testing.md) - Test yazma rehberi
- [Deployment Guide](./deployment.md) - Production deployment
- [Contributing](../CONTRIBUTING.md) - Katkıda bulunma rehberi

## Yardım

Sorun mu yaşıyorsunuz?

1. [Issues](https://github.com/kafkasder-org/Kafkasportal/issues) sayfasına bakın
2. [Discussions](https://github.com/kafkasder-org/Kafkasportal/discussions) sayfasında soru sorun
3. [CLAUDE.md](../CLAUDE.md) - AI asistanlar için hızlı referans
