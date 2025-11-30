# Deployment Guide

Bu dokümantasyon, Dernek Yönetim Sistemi'ni production ortamına deploy etme sürecini açıklar.

## 📋 Ön Gereksinimler

- Node.js >= 20.x
- Appwrite hesabı ve projesi
- Environment variables hazır
- Domain name (opsiyonel)

## 🚀 Deployment Seçenekleri

### Vercel (Önerilen)

Vercel, Next.js için optimize edilmiş bir platformdur.

#### Adımlar:

1. **Vercel hesabı oluşturun**
   - [vercel.com](https://vercel.com) adresinden kayıt olun

2. **Projeyi import edin**
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Environment Variables ekleyin**
   - Vercel Dashboard > Project > Settings > Environment Variables
   - `.env.example` dosyasındaki tüm değişkenleri ekleyin

4. **Deploy**
   ```bash
   vercel --prod
   ```

#### Vercel Özellikleri:
- Otomatik HTTPS
- Global CDN
- Preview deployments
- Analytics
- Serverless functions

### Appwrite Sites

Appwrite'un kendi hosting çözümü.

#### Adımlar:

1. **Appwrite Console'da Site oluşturun**
   - Appwrite Console > Hosting > Add Site

2. **Build komutu**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   appwrite deploy
   ```

### Docker

Self-hosted deployment için Docker kullanabilirsiniz.

#### Dockerfile:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

#### Docker Compose:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
```

## 🔐 Environment Variables

Production için gerekli environment variables:

### Zorunlu:

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
CSRF_SECRET=your-32-char-secret
SESSION_SECRET=your-32-char-secret
NODE_ENV=production
```

### Opsiyonel:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

## 📦 Build

### Production Build:

```bash
npm run build
```

### Build Optimizasyonları:

- Tree-shaking aktif
- Code splitting
- Image optimization
- CSS optimization
- Bundle size optimization

## 🔒 Güvenlik Checklist

- [ ] Environment variables güvenli şekilde saklanıyor
- [ ] CSRF_SECRET ve SESSION_SECRET güçlü (32+ karakter)
- [ ] HTTPS aktif
- [ ] Security headers yapılandırılmış
- [ ] Rate limiting aktif
- [ ] API keys production'da doğru ayarlanmış
- [ ] CORS ayarları kontrol edildi

## 📊 Monitoring

### Health Check:

```bash
curl https://your-domain.com/api/health
```

### Performance Monitoring:

- Web Vitals tracking aktif
- Error tracking (Appwrite Errors collection)
- Analytics (opsiyonel)

## 🔄 CI/CD

GitHub Actions workflow'u kullanarak otomatik deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🐛 Troubleshooting

### Build Hataları:

```bash
# Cache temizle
npm run clean:all

# Yeniden build
npm run build
```

### Runtime Hataları:

1. Environment variables kontrol edin
2. Appwrite bağlantısını kontrol edin
3. Logları inceleyin

### Performance Sorunları:

1. Bundle analyzer çalıştırın:
   ```bash
   npm run analyze
   ```
2. Image optimization kontrol edin
3. Database query'leri optimize edin

## 📚 Ek Kaynaklar

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Appwrite Documentation](https://appwrite.io/docs)

