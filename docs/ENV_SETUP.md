# Environment Variables Setup Guide

## 🔧 Global Environment Variables Configuration

Bu dosya, projeniz için gerekli environment variable'ların doğru isimlerle nasıl ayarlanacağını gösterir.

## ⚠️ ÖNEMLİ: Doğru Variable İsimleri

Kullanıcılar bazen yanlış isimler kullanabilir. Aşağıda doğru isimler listelenmiştir:

### ❌ YANLIŞ İsimler (Kullanmayın)
- `NEXT_APPWRITE_ENDPOINT` ❌
- `NEXT_APPWRITE_API_KEY` ❌
- `NEXT_APPWRITE_SITE_ID` ❌

### ✅ DOĞRU İsimler (Kullanın)
- `NEXT_PUBLIC_APPWRITE_ENDPOINT` ✅
- `APPWRITE_API_KEY` ✅ (NEXT_PUBLIC_ olmamalı, server-side only)
- `APPWRITE_SITE_ID` ✅ (NEXT_PUBLIC_ olmamalı, server-side only)

## 📋 Gerekli Environment Variables

### 1. Appwrite Endpoint (Client-side)
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
```
- **Tip:** Public (client-side accessible)
- **Açıklama:** Appwrite endpoint URL'i
- **Örnek Değer:** `https://fra.cloud.appwrite.io/v1`

### 2. Appwrite API Key (Server-side only)
```bash
APPWRITE_API_KEY=standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308
```
- **Tip:** Private (server-side only)
- **Açıklama:** Appwrite API key (server-side işlemler için)
- **ÖNEMLİ:** `NEXT_PUBLIC_` prefix'i kullanmayın! Bu güvenlik riski oluşturur.

### 3. Appwrite Site ID (Server-side only)
```bash
APPWRITE_SITE_ID=6929f70b003a359b2d64
```
- **Tip:** Private (server-side only)
- **Açıklama:** Appwrite Sites deployment için Site ID
- **ÖNEMLİ:** `NEXT_PUBLIC_` prefix'i kullanmayın!

## 🚀 Platform Bazında Kurulum

### Vercel

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - Projenizi seçin
   - Settings → Environment Variables

2. **Environment Variables ekleyin:**

   **Production, Preview, Development için:**
   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT = https://fra.cloud.appwrite.io/v1
   APPWRITE_API_KEY = standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308
   APPWRITE_SITE_ID = 6929f70b003a359b2d64
   ```

3. **Deploy edin:**
   - Deployments sekmesine gidin
   - "Redeploy" butonuna tıklayın

### Netlify

1. **Netlify Dashboard'a gidin:**
   - https://app.netlify.com
   - Projenizi seçin
   - Site settings → Environment variables

2. **Environment Variables ekleyin:**
   - "Add a variable" butonuna tıklayın
   - Yukarıdaki değişkenleri ekleyin

3. **Deploy edin:**
   - "Trigger deploy" → "Deploy site"

### Appwrite (GitHub Actions)

GitHub Secrets olarak ekleyin:

1. **GitHub Repository → Settings → Secrets and variables → Actions**

2. **New repository secret ekleyin:**

   ```
   APPWRITE_ENDPOINT = https://fra.cloud.appwrite.io/v1
   APPWRITE_API_KEY = standard_68e4323dcc1c339e02d9ab6c370dcda3e25663664525243e634350e8fb1d0e403f48003a8b9f3cab9c14ff093f7ec352757e54cbca45e34cdf307d2e72955d1af600758d0d13fe4b9b5e4c8cdcf80c866e677c004b405301b72bbf2cdb8897f03a4bd2d5a9931f9f68d357a08d5e67680778a001dfea6ca70251296e839ef308
   APPWRITE_SITE_ID = 6929f70b003a359b2d64
   ```

## 🔒 Güvenlik Notları

1. **API Key Güvenliği:**
   - `APPWRITE_API_KEY` asla `NEXT_PUBLIC_` prefix'i ile kullanmayın
   - Bu değişken sadece server-side'da kullanılmalı
   - Client-side'a expose edilmemeli

2. **Site ID Güvenliği:**
   - `APPWRITE_SITE_ID` da `NEXT_PUBLIC_` prefix'i ile kullanmayın
   - Bu bilgi deployment için kullanılır, client-side'a gerek yok

3. **Endpoint:**
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT` client-side'da kullanılır
   - Bu yüzden `NEXT_PUBLIC_` prefix'i gereklidir

## ✅ Doğrulama

Environment variable'ları ayarladıktan sonra:

1. **Build test edin:**
   ```bash
   npm run build
   ```

2. **Health check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Console'da kontrol:**
   - Browser console'da `NEXT_PUBLIC_APPWRITE_ENDPOINT` görünmeli
   - `APPWRITE_API_KEY` görünmemeli (güvenlik)

## 🐛 Sorun Giderme

### "Environment variable not found" hatası

1. Variable ismini kontrol edin (büyük/küçük harf duyarlı)
2. Platform'da doğru environment'a (Production/Preview/Development) eklendiğinden emin olun
3. Redeploy yapın

### "API Key is not set" hatası

1. `APPWRITE_API_KEY` (NEXT_PUBLIC_ olmadan) eklendiğinden emin olun
2. Server-side'da kullanıldığından emin olun
3. Build loglarını kontrol edin

### Global variable conflict uyarısı

1. `NODE_ENV` gibi platform variable'larını override etmeyin
2. Sadece proje-specific variable'ları ekleyin
3. `ENV_VARIABLES.md` dosyasına bakın

## 📝 Özet

| Variable Name | Type | Required | Example |
|--------------|------|----------|---------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Public | ✅ Yes | `https://fra.cloud.appwrite.io/v1` |
| `APPWRITE_API_KEY` | Private | ✅ Yes | `standard_...` |
| `APPWRITE_SITE_ID` | Private | ⚠️ Optional | `6929f70b003a359b2d64` |

**Son Güncelleme:** 2024-11-30

