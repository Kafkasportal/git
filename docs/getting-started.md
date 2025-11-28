# 🚀 Hızlı Başlangıç

Bu döküman, Dernek Yönetim Sistemi'ni kurmak ve çalıştırmak için gereken adımları açıklar.

## 📋 Gereksinimler

| Araç | Minimum Sürüm | Önerilen |
|------|---------------|----------|
| Node.js | 20.x | 20.x LTS |
| npm | 9.x | 10.x |
| Git | 2.x | En güncel |

### Appwrite Backend

Appwrite sunucusuna ihtiyacınız var:
- **Cloud**: [cloud.appwrite.io](https://cloud.appwrite.io) (Ücretsiz plan mevcut)
- **Self-hosted**: Docker ile kendi sunucunuzda

---

## 📥 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/your-repo/dernek-nextjs.git
cd dernek-nextjs
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun:

```bash
cp .env.example .env.local
```

Aşağıdaki değerleri doldurun:

```env
# ===========================================
# APPWRITE KONFIGÜRASYONU
# ===========================================

# Appwrite Endpoint URL
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1

# Appwrite Project ID
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id

# Appwrite Database ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id

# Appwrite API Key (server-side - sadece backend'de kullanılır)
APPWRITE_API_KEY=your-api-key

# ===========================================
# STORAGE BUCKET ID'LERİ
# ===========================================

NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS=documents
NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS=avatars
NEXT_PUBLIC_APPWRITE_BUCKET_RECEIPTS=receipts

# ===========================================
# OPSİYONEL AYARLAR
# ===========================================

# Rate Limiting
RATE_LIMIT_DEFAULT_MAX=100
RATE_LIMIT_DEFAULT_WINDOW=900000

# Google Analytics (opsiyonel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Email (opsiyonel)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# WhatsApp (opsiyonel)
WHATSAPP_SESSION_PATH=./whatsapp-session

# Twilio SMS (opsiyonel)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Appwrite'ı Yapılandırın

#### Otomatik Kurulum (Önerilen)

```bash
npm run appwrite:setup
```

Bu script:
- Veritabanını oluşturur
- Collection'ları oluşturur
- İndeksleri oluşturur
- Storage bucket'larını oluşturur
- Test kullanıcısı oluşturur

#### Manuel Kurulum

Appwrite Console'dan:

1. **Yeni Proje Oluşturma**
   - Appwrite Console → New Project
   - Project Name: `Dernek Panel`

2. **Database Oluşturma**
   - Databases → Create Database
   - Name: `kafkasder_db`

3. **Collection'ları Oluşturma**
   
   Gerekli collection'lar:
   - `users`
   - `beneficiaries`
   - `donations`
   - `aid_applications`
   - `scholarships`
   - `meetings`
   - `tasks`
   - `messages`
   - `finance_records`
   - `partners`
   - `system_settings`
   - `audit_logs`
   - ... (diğerleri için `src/lib/appwrite/config.ts` dosyasına bakın)

4. **Storage Bucket'ları**
   - `documents` - Genel belgeler
   - `avatars` - Kullanıcı avatarları
   - `receipts` - Makbuz dosyaları

5. **API Key Oluşturma**
   - Settings → API Keys → Create API Key
   - Tüm izinleri verin (geliştirme için)

### 5. Uygulamayı Başlatın

```bash
# Geliştirme modu
npm run dev

# Production build
npm run build
npm run start
```

Uygulama `http://localhost:3000` adresinde çalışacak.

---

## 🔐 İlk Giriş

### Demo Kullanıcı

Appwrite setup script'i çalıştırıldıysa:

```
E-posta: admin@example.com
Şifre: Admin123!
```

### Yeni Kullanıcı Oluşturma

1. Appwrite Console → Auth → Users → Create User
2. Veya API üzerinden:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yeni Kullanıcı",
    "email": "yeni@example.com",
    "password": "SecurePass123!",
    "role": "Personel",
    "permissions": ["beneficiaries:access", "donations:access"]
  }'
```

---

## 📁 Proje Yapısı

```
dernek-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API endpoints
│   │   ├── login/             # Login page
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   └── [feature]/        # Feature components
│   │
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   │   ├── api/              # API client
│   │   ├── appwrite/         # Appwrite SDK
│   │   └── validations/      # Zod schemas
│   │
│   ├── stores/                # Zustand stores
│   ├── types/                 # TypeScript types
│   └── config/                # App configuration
│
├── public/                    # Static files
├── docs/                      # Documentation
└── scripts/                   # Setup scripts
```

---

## 🛠️ Geliştirme Komutları

```bash
# Geliştirme sunucusu
npm run dev

# TypeScript kontrolü
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testler
npm run test
npm run test:ui
npm run test:coverage

# Production build
npm run build

# Production sunucu
npm run start

# Bundle analizi
npm run analyze

# Temizlik
npm run clean
npm run clean:all
```

---

## 🔧 IDE Kurulumu

### VS Code

Önerilen eklentiler:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Cursor

Proje Cursor için optimize edilmiştir. Aşağıdaki ayarları kontrol edin:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## 🧪 Test Kurulumu

### Unit Testler

```bash
# Tüm testleri çalıştır
npm run test

# Watch modunda
npm run test -- --watch

# Belirli dosya
npm run test -- src/__tests__/api/beneficiaries.test.ts
```

### Coverage Raporu

```bash
npm run test:coverage
```

Coverage raporu `coverage/` klasöründe oluşturulur.

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health?detailed=true
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "storage": "connected"
}
```

### Rate Limit Durumu

```bash
curl http://localhost:3000/api/monitoring/rate-limit
```

---

## 🚀 Deployment

### Vercel (Önerilen)

1. GitHub'a push edin
2. Vercel'e bağlayın
3. Ortam değişkenlerini ekleyin
4. Deploy

### Docker

```bash
# Image oluştur
docker build -t dernek-panel .

# Container başlat
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APPWRITE_ENDPOINT=... \
  -e NEXT_PUBLIC_APPWRITE_PROJECT_ID=... \
  dernek-panel
```

### Self-hosted

```bash
# Build
npm run build

# PM2 ile çalıştır
pm2 start npm --name "dernek-panel" -- start
```

---

## 🐛 Sorun Giderme

### "Appwrite connection failed"

1. Endpoint URL'ini kontrol edin
2. Project ID'yi kontrol edin
3. API Key'in geçerli olduğundan emin olun
4. Firewall ayarlarını kontrol edin

### "CSRF token invalid"

1. Cookies'in aktif olduğundan emin olun
2. HTTPS kullanıyor olabilirsiniz - development için HTTP gerekebilir
3. Sayfayı yenileyin

### "Rate limit exceeded"

1. Varsayılan limitler: 100 istek / 15 dakika
2. `.env.local`'da `RATE_LIMIT_DEFAULT_MAX` değerini artırın
3. Development için IP'nizi whitelist'e ekleyin

### Build hataları

```bash
# Cache temizle
npm run clean

# Tüm bağımlılıkları yeniden yükle
npm run clean:all
```

---

## 📚 Sonraki Adımlar

1. **[Mimari Yapı](./architecture.md)** - Uygulama mimarisini öğrenin
2. **[API Referansı](./api-reference.md)** - API endpoint'lerini inceleyin
3. **[Bileşen Kütüphanesi](./components.md)** - UI bileşenlerini keşfedin
4. **[Form Yönetimi](./forms.md)** - Form yapısını anlayın
5. **[Güvenlik](./security.md)** - Güvenlik implementasyonlarını öğrenin

---

## 🆘 Yardım

Sorunlar için:
1. [Docs](./README.md) klasörünü kontrol edin
2. GitHub Issues açın
3. Geliştirici ekibiyle iletişime geçin

