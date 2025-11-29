# WhatsApp Web ve Puppeteer Deployment Rehberi

Bu doküman, WhatsApp Web.js ve Puppeteer kullanımı ile ilgili build ve deployment sorunlarının çözümlerini içerir.

## 🚨 Sorunlar ve Çözümler

### 1. Puppeteer Chrome Download Hatası (403 Error)

**Sorun:**
```
npm error ERROR: Failed to set up chrome v131.0.6778.204!
npm error Error: Got status code 403
```

**Çözüm:**
Artık Puppeteer'ın Chrome'u otomatik indirmesini atlıyoruz ve sistem Chrome kullanıyoruz.

`.env.local` dosyasında:
```bash
PUPPETEER_SKIP_DOWNLOAD=true
```

### 2. Google Fonts 403 Hatası

**Sorun:**
```
Error: Failed to fetch `Inter` from Google Fonts.
Received response with status 403
```

**Çözüm:**
`next.config.ts` dosyasında font optimizasyonu devre dışı bırakıldı:
```typescript
optimizeFonts: false
```

### 3. Unzipper AWS SDK Bağımlılık Hatası

**Sorun:**
```
Module not found: Can't resolve '@aws-sdk/client-s3'
```

**Çözüm:**
`package.json` dosyasına `@aws-sdk/client-s3` eklendi.

## 📦 Kurulum

### Yerel Geliştirme

```bash
# Bağımlılıkları yükle (Puppeteer Chrome indirmesini atla)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Development server başlat
npm run dev

# Build al
npm run build
```

### Docker ile Deployment

#### 1. Docker Image Oluştur

```bash
# Image oluştur (Chromium dahil)
docker build -t kafkasder-panel .

# Image'ı çalıştır
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APPWRITE_ENDPOINT=your_endpoint \
  -e NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id \
  -e APPWRITE_API_KEY=your_api_key \
  -e PUPPETEER_SKIP_DOWNLOAD=true \
  -e WHATSAPP_AUTO_INIT=false \
  kafkasder-panel
```

#### 2. Docker Compose ile Deployment

`docker-compose.yml` örneği:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PUPPETEER_SKIP_DOWNLOAD=true
      - WHATSAPP_AUTO_INIT=false
      - NEXT_PUBLIC_APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT}
      - NEXT_PUBLIC_APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID}
      - APPWRITE_API_KEY=${APPWRITE_API_KEY}
    volumes:
      - whatsapp-session:/app/.whatsapp-session
    restart: unless-stopped

volumes:
  whatsapp-session:
```

Çalıştırma:
```bash
docker-compose up -d
```

## 🌐 Vercel/Netlify Deployment

Vercel veya Netlify gibi platformlarda:

1. **Environment Variables** ayarla:
   ```
   PUPPETEER_SKIP_DOWNLOAD=true
   WHATSAPP_AUTO_INIT=false
   ```

2. **Build Command:**
   ```bash
   npm run build
   ```

3. **⚠️ Önemli:** Vercel/Netlify gibi serverless platformlarda WhatsApp Web.js **çalışmaz** çünkü:
   - Puppeteer/Chrome gerektiriyor
   - Persistent session depolama gerekiyor
   - Serverless functions kısa ömürlü

   WhatsApp özelliğini kullanmak için **Docker** veya **VPS** kullanın.

## 🖥️ VPS Deployment (Ubuntu/Debian)

### 1. Sistem Gereksinimlerini Yükle

```bash
# Chromium ve bağımlılıkları
sudo apt update
sudo apt install -y \
  chromium-browser \
  fonts-liberation \
  libnss3 \
  libxss1 \
  libappindicator3-1 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libasound2 \
  xdg-utils

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (Process Manager)
sudo npm install -g pm2
```

### 2. Projeyi Deploy Et

```bash
# Kodu klonla
git clone <your-repo-url>
cd dernek-nextjs

# Environment variables ayarla
cp .env.example .env.local
nano .env.local  # Değerleri düzenle

# Bağımlılıkları yükle
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Build al
npm run build

# PM2 ile başlat
pm2 start npm --name "kafkasder-panel" -- start
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy (Opsiyonel)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📱 WhatsApp Özelliğini Kullanma

### 1. WhatsApp'ı Başlat

```bash
# .env.local dosyasında
WHATSAPP_AUTO_INIT=false  # İlk kurulumda false
PUPPETEER_SKIP_DOWNLOAD=true
```

### 2. QR Kod Tarama

1. Uygulamayı başlat
2. `/api/whatsapp/initialize` endpoint'ine POST request at
3. `/api/whatsapp/qr` endpoint'inden QR kodu al
4. WhatsApp uygulaması ile QR kodu tara

### 3. Session Kalıcılığı

QR kod taradıktan sonra:
```bash
# .env.local dosyasında
WHATSAPP_AUTO_INIT=true  # Otomatik başlatmayı etkinleştir
```

## 🛠️ Troubleshooting

### Chrome/Chromium Bulunamıyor Hatası

```
Error: Chrome/Chromium not found
```

**Çözüm:**
```bash
# Chromium yükle
sudo apt install chromium-browser

# Veya Chrome yükle
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```

### Build Sırasında Memory Hatası

**Çözüm:**
```bash
# Build sırasında CPU ve memory limitlerini düşür
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### WhatsApp Session Kaybolması

**Çözüm:**
```bash
# Session klasörünü backup al
tar -czf whatsapp-session-backup.tar.gz .whatsapp-session

# Volume kullan (Docker)
docker run -v whatsapp-session:/app/.whatsapp-session ...
```

## 📊 Performance İpuçları

1. **Production Build:**
   ```bash
   NODE_ENV=production npm run build
   ```

2. **CPU/Memory Optimizasyonu:**
   - `next.config.ts` dosyasında CPU limitleri ayarlandı
   - Puppeteer `--single-process` modunda çalışıyor

3. **Caching:**
   - Next.js static asset'ler 1 yıl cache'leniyor
   - Font ve image'lar agresif cache ile optimize edildi

## 🔒 Güvenlik

1. **Environment Variables:**
   - `.env.local` dosyasını asla commit etmeyin
   - Production'da güçlü secret'lar kullanın

2. **Puppeteer Güvenliği:**
   - `--no-sandbox` flag'i sadece Docker'da kullanılıyor
   - Sistem Chrome kullanarak güvenliği artırdık

3. **CSP Headers:**
   - Content Security Policy `next.config.ts`'de yapılandırıldı
   - HSTS, X-Frame-Options vb. güvenlik header'ları aktif

## 📞 Destek

Sorun yaşıyorsanız:
1. Bu dokümanı kontrol edin
2. GitHub Issues'da sorun açın
3. Logları kontrol edin: `pm2 logs` veya `docker logs`

## 🎯 Önerilen Deploy Stratejisi

1. **Geliştirme:** Lokal geliştirme için WhatsApp'ı kapalı tutun
2. **Staging:** Docker ile test edin
3. **Production:** VPS + Docker + PM2 kullanın

---

**Not:** WhatsApp Web.js resmi olmayan bir kütüphanedir. WhatsApp politikalarına uygun kullanın.
