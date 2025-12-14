# Dernek Yönetim Sistemi - Dağıtım Kılavuzu

## İçindekiler

- [Gereksinimler](#gereksinimler)
- [Vercel Dağıtımı](#vercel-dağıtımı)
- [Self-hosted Docker Dağıtımı](#self-hosted-docker-dağıtımı)
- [Appwrite Sites Dağıtımı](#appwrite-sites-dağıtımı)
- [Ortam Yapılandırması](#ortam-yapılandırması)
- [Veritabanı Kurulumu](#veritabanı-kurulumu)
- [Production Kontrol Listesi](#production-kontrol-listesi)
- [İzleme ve Logging](#izleme-ve-logging)
- [Yedekleme Stratejileri](#yedekleme-stratejileri)
- [Sorun Giderme](#sorun-giderme)

---

## Gereksinimler

### Minimum Sistem Gereksinimleri

| Bileşen | Gereksinim |
|---------|-----------|
| Node.js | v20.x veya daha yüksek |
| npm | v9.0.0 veya daha yüksek |
| RAM | 512 MB (geliştirme), 2 GB (production) |
| Disk | 1 GB (uygulama + bağımlılıklar) |
| CPU | 1 vCore (minimum), 2 vCore (önerilen) |

### Harici Hizmetler

- **Appwrite**: Cloud veya Self-hosted
- **Email (Opsiyonel)**: SMTP sunucusu
- **SMS (Opsiyonel)**: Twilio hesabı
- **Domain**: Production için DNS yapılandırması

---

## Vercel Dağıtımı

### Adım 1: Vercel Hesabı Oluşturma

```bash
# Vercel CLI yükle
npm install -g vercel

# Vercel'e giriş yap
vercel login
```

### Adım 2: Projeyi Dağıt

```bash
# Projenin root'unda çalıştır
vercel

# Prompts'a cevap ver:
# ? Set up and deploy? Yes
# ? Which scope? (your-account)
# ? Link to existing project? No (ilk kez) / Yes (existing)
# ? Project name? dernek-yonetim
# ? Production? (y/N) n (ilk test için)
```

### Adım 3: Ortam Değişkenlerini Yapılandır

#### Vercel Dashboard via Web UI

```
Project Settings > Environment Variables

NEXT_PUBLIC_APP_NAME=Dernek Yönetim Sistemi
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-appwrite-api-key
CSRF_SECRET=your-csrf-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```

#### CLI via Command Line

```bash
# Ortam değişkenlerini ayarla
vercel env add NEXT_PUBLIC_APPWRITE_ENDPOINT
vercel env add NEXT_PUBLIC_APPWRITE_PROJECT_ID
vercel env add APPWRITE_API_KEY
vercel env add CSRF_SECRET
vercel env add SESSION_SECRET
```

### Adım 4: Production Dağıtımı

```bash
# Production'a dağıt
vercel --prod

# Veya manual olarak:
# Vercel Dashboard > Deployments > Promote to Production
```

### Adım 5: Domain Yapılandırması

```bash
# Custom domain ekle
vercel domains add yourdomain.com

# DNS kayıtlarını güncelle:
# Type: CNAME
# Name: www (veya subdomain)
# Value: cname.vercel.com.

# Verification tamamla
vercel domains verify yourdomain.com
```

### Vercel Dağıtımı Özellikleri

- Otomatik HTTPS
- Global CDN
- Otomatik GZIP sıkıştırma
- Edge middleware desteği
- Serverless functions
- Preview deployments
- Otomatik rollback

---

## Self-hosted Docker Dağıtımı

### Dockerfile Oluşturma

```dockerfile
# Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıkları yükle
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Kaynak kodu kopyala
COPY . .

# Next.js uygulamasını build et
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Required tools
RUN apk add --no-cache dumb-init

# Production bağımlılıklarını kopyala
COPY --from=builder /app/node_modules ./node_modules

# Build output'u kopyala
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Non-root user oluştur
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Port expose
EXPOSE 3000

# Uygulamayı başlat
CMD ["dumb-init", "node_modules/.bin/next", "start"]
```

### Docker Compose Yapılandırması

```yaml
# docker-compose.yml

version: '3.9'

services:
  # Next.js Uygulaması
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_APP_NAME: Dernek Yönetim Sistemi
      NEXT_PUBLIC_APPWRITE_ENDPOINT: ${APPWRITE_ENDPOINT}
      NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${APPWRITE_PROJECT_ID}
      NEXT_PUBLIC_APPWRITE_DATABASE_ID: ${APPWRITE_DATABASE_ID}
      APPWRITE_API_KEY: ${APPWRITE_API_KEY}
      CSRF_SECRET: ${CSRF_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    depends_on:
      - appwrite
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Appwrite (Opsiyonel - Self-hosted)
  appwrite:
    image: appwrite/appwrite:latest
    ports:
      - '8080:80'
    environment:
      _APP_ENV: production
      _APP_DOMAIN: ${APPWRITE_DOMAIN}
      _APP_OPEN_RUNTIMES: enabled
    volumes:
      - appwrite_data:/storage/uploads
      - appwrite_cache:/storage/cache
      - appwrite_config:/storage/config
    restart: unless-stopped

  # Nginx Reverse Proxy (Opsiyonel)
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  appwrite_data:
  appwrite_cache:
  appwrite_config:
```

### Docker Dağıtım Adımları

```bash
# .env dosyası oluştur
cp .env.example .env
# .env dosyasını düzenle

# Kurulum ve başlatma
docker-compose up -d

# Logs'u kontrol et
docker-compose logs -f app

# Uygulamaya erişim
# http://localhost:3000

# Durumu kontrol et
docker-compose ps

# Servisleri durdur
docker-compose down

# Sistemi temizle (volumes sil)
docker-compose down -v
```

### Nginx Reverse Proxy Yapılandırması

```nginx
# nginx.conf

upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # HTTP'yi HTTPS'ye yönlendir
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Proxy Configuration
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files Cache
    location /_next/static/ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Appwrite Sites Dağıtımı

### Adım 1: Appwrite Hazırlığı

```bash
# Appwrite Console'da:
# 1. Settings > Functions > Settings
# 2. "Enable Runtime for Deployment" aktif et
# 3. Yeni Site oluştur

# veya CLI kullan:
appwrite login
appwrite sites create --name "dernek-yonetim"
```

### Adım 2: Production Build

```bash
# Build kodu üret
npm run build

# Build çıktısını kontrol et
ls -la .next/
```

### Adım 3: Ortam Yapılandırması

```bash
# Appwrite Console'da ayarla:
# Environment Variables:
# - APPWRITE_FUNCTION_ENDPOINT=https://your-appwrite.com/v1
# - APPWRITE_API_KEY=your-api-key
# - DATABASE_ID=your-database-id
```

### Adım 4: Deploy

```bash
# CLI ile dağıt
appwrite sites deploy --path=./.next --name=dernek-yonetim

# Veya Appwrite Console'da yükle
```

---

## Ortam Yapılandırması

### Production Ortam Değişkenleri

```bash
# Application
NEXT_PUBLIC_APP_NAME="Dernek Yönetim Sistemi"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_ENABLE_REALTIME="true"
NODE_ENV="production"

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="production-project-id"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="production-database-id"
APPWRITE_API_KEY="production-api-key"

# Security (Min 32 karakterli, güçlü ve rassal)
CSRF_SECRET="your-very-long-random-csrf-secret-min-32-chars"
SESSION_SECRET="your-very-long-random-session-secret-min-32-chars"

# Email
SMTP_HOST="smtp.mailserver.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@yourdomain.com"

# Optional: SMS
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"

# File Upload
MAX_FILE_SIZE="10485760"
MAX_FILES_PER_UPLOAD="5"
```

### Geliştirme vs Production

| Ayar | Geliştirme | Production |
|------|-----------|-----------|
| NODE_ENV | development | production |
| React Strict Mode | true | false (optional) |
| Source Maps | true | false |
| Console Logs | allowed | error/warn only |
| CORS | permissive | strict |
| SSL | optional | required |
| Rate Limiting | disabled | enabled |

---

## Veritabanı Kurulumu

### Appwrite Collection Oluşturma

```bash
# Appwrite Console > Databases > [Database] > Collections

# Koleksiyonlar:
# 1. beneficiaries - Yardımcılar
# 2. donations - Bağışlar
# 3. scholarships - Burslar
# 4. finance - Mali kayıtlar
# 5. users - Kullanıcılar (Appwrite Auth ile entegre)
# 6. messages - Mesajlar
# 7. meetings - Toplantılar
# 8. tasks - Görevler
# 9. settings - Sistem ayarları
```

### Beneficiaries Collection

```json
{
  "name": "beneficiaries",
  "attributes": [
    {"key": "name", "type": "string", "required": true},
    {"key": "tcNo", "type": "string", "required": true},
    {"key": "phone", "type": "string", "required": true},
    {"key": "email", "type": "email", "required": false},
    {"key": "address", "type": "string", "required": true},
    {"key": "city", "type": "string", "required": true},
    {"key": "status", "type": "string", "required": true},
    {"key": "familySize", "type": "integer", "required": false},
    {"key": "createdAt", "type": "datetime", "required": true},
    {"key": "updatedAt", "type": "datetime", "required": true}
  ],
  "indexes": [
    {"key": "name", "type": "key"},
    {"key": "status", "type": "key"},
    {"key": "city", "type": "key"}
  ]
}
```

### Veri Yükleme

```bash
# CSV'den import et
# Appwrite Console > Data Export/Import

# veya JSON'dan:
curl -X POST \
  https://your-appwrite.com/v1/databases/[database-id]/collections \
  -H "X-Appwrite-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d @collection.json
```

---

## Production Kontrol Listesi

### Pre-deployment

- [ ] `npm run lint:check` - Linting hata yok
- [ ] `npm run typecheck` - TypeScript hata yok
- [ ] `npm run test:run` - Tüm testler geçti
- [ ] `npm run build` - Production build başarılı
- [ ] `npm run build:fast` - Fast build kontrol
- [ ] Ortam değişkenlerini kontrol et
- [ ] Database bağlantısını test et
- [ ] SMTP ayarlarını test et
- [ ] SSL sertifikasını kontrol et
- [ ] API rate limiting kontrol et

### Database

- [ ] Tüm koleksiyonlar oluşturulmuş
- [ ] İndeksler oluşturulmuş
- [ ] Kısıtlamalar ayarlanmış (unique, required)
- [ ] Yedekleme stratejisi tanımlanmış
- [ ] Database backup alınmış

### Security

- [ ] HTTPS/SSL etkin
- [ ] CSRF token'ı test edilmiş
- [ ] Session security ayarları kontrol edilmiş
- [ ] Şifre strength requirements uygulanmış
- [ ] 2FA etkinleştirilmiş (admin için)
- [ ] Rate limiting etkin
- [ ] API keys rotated
- [ ] Security headers kontrol edilmiş

### Monitoring

- [ ] Error tracking (Sentry, vb.) kurulmuş
- [ ] Logging konfigürasyonu
- [ ] Performance monitoring (APM)
- [ ] Uptime monitoring
- [ ] Alert sistem kurulmuş
- [ ] Database backup alerts
- [ ] Disk space alerts

### Documentation

- [ ] README güncellenmiş
- [ ] API docs güncellenmiş
- [ ] Deployment docs güncellenmiş
- [ ] Runbook oluşturulmuş
- [ ] Disaster recovery plan
- [ ] Contact information updated

---

## İzleme ve Logging

### Server-side Logging

```typescript
// src/lib/logger.ts

import logger from '@/lib/logger';

// API route'ta
export async function GET(request: NextRequest) {
  logger.info('Beneficiaries list requested', {
    userId: user.id,
    filters: JSON.stringify(filters),
  });

  try {
    const beneficiaries = await fetchBeneficiaries(filters);
    logger.debug('Beneficiaries fetched', { count: beneficiaries.length });
    return Response.json({ success: true, data: beneficiaries });
  } catch (error) {
    logger.error('Failed to fetch beneficiaries', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### Client-side Error Tracking

```typescript
// src/lib/error-tracker.ts

import { captureException } from '@sentry/nextjs';

export function trackError(error: Error, context?: Record<string, any>) {
  captureException(error, {
    contexts: {
      custom: context,
    },
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Tracked error:', error, context);
  }
}
```

### Health Check

```typescript
// GET /api/health

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    appwrite: await checkAppwrite(),
    storage: await checkStorage(),
  };

  const allHealthy = Object.values(checks).every(c => c === true);

  return Response.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

---

## Yedekleme Stratejileri

### Appwrite Backup

```bash
# Appwrite Database Export
curl -X GET \
  "https://your-appwrite.com/v1/databases/[database-id]/export" \
  -H "X-Appwrite-Key: your-api-key" \
  -o database-backup-$(date +%Y%m%d).zip

# Scheduled Backup (Cron Job)
# 0 2 * * * /usr/local/bin/backup-appwrite.sh
```

### Backup Script

```bash
#!/bin/bash
# backup-appwrite.sh

BACKUP_DIR="/backups/appwrite"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.zip"

mkdir -p $BACKUP_DIR

# Appwrite backup
curl -X GET \
  "https://your-appwrite.com/v1/databases/[database-id]/export" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -o "$BACKUP_FILE"

# Old backups sil (30 günden eski)
find $BACKUP_DIR -name "backup_*.zip" -mtime +30 -delete

# S3'e upload (opsiyonel)
aws s3 cp "$BACKUP_FILE" "s3://your-backup-bucket/"

# Log
echo "Backup created: $BACKUP_FILE" >> /var/log/appwrite-backup.log
```

### Restore Procedure

```bash
# Backup'dan restore et
curl -X POST \
  "https://your-appwrite.com/v1/databases/[database-id]/import" \
  -H "X-Appwrite-Key: your-api-key" \
  -H "Content-Type: application/zip" \
  --data-binary @backup_file.zip
```

---

## Sorun Giderme

### Uygulama Başlayamıyor

```bash
# 1. Logs kontrol et
docker-compose logs app

# 2. Ortam değişkenlerini kontrol et
echo $APPWRITE_API_KEY
echo $DATABASE_ID

# 3. Build çıktısını kontrol et
npm run build

# 4. Port çakışmasını kontrol et
lsof -i :3000
```

### Veritabanı Bağlantı Hatası

```bash
# 1. Appwrite status kontrol et
docker-compose ps appwrite

# 2. Network bağlantısını kontrol et
curl $NEXT_PUBLIC_APPWRITE_ENDPOINT

# 3. API key'i doğrula
curl -X GET \
  "$APPWRITE_ENDPOINT/v1/account" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY"
```

### Bellek Sızıntısı

```bash
# Node process'ini monitör et
node --max-old-space-size=2048 server.js

# Memory profiling
# Chrome DevTools > Memory > Record heap profile
```

### Performance Sorunları

```bash
# Build time kontrol et
npm run build -- --debug

# Bundle size analizi
npm run analyze

# Lighthouse audit
# Chrome DevTools > Lighthouse
```

### SSL Sertifikası Sorunları

```bash
# Sertifikayı kontrol et
openssl x509 -in cert.pem -text -noout

# Expiry tarihi kontrol et
openssl x509 -in cert.pem -noout -dates

# Let's Encrypt kullan (otomatik renewal)
# certbot certonly --standalone -d yourdomain.com
```

---

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

- **Critical**: 1 saat
- **High**: 4 saat
- **Medium**: 24 saat

### Recovery Point Objective (RPO)

- Database: Günde 2 kez backup
- Dosyalar: Günde 1 kez backup

### Failover Procedure

1. Backup sistem başlat
2. DNS'yi güncelleştir
3. Verileri geri yükle
4. Sistem test et
5. Servisleri başlat
6. Monitoring'i etkinleştir

---

## Kaynaklar

- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org)

---

*Son güncelleme: 2025-12-14*
