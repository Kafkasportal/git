# Environment Variables Setup Guide

## 🔧 Global Environment Variables Configuration

Bu dosya, projeniz için gerekli environment variable'ların doğru isimlerle nasıl ayarlanacağını gösterir.
Değerleri `.env.example` dosyasından kopyalayıp ilgili platformun gizli değişken yönetimine ekleyin; gerçek anahtarları asla versiyon kontrolüne eklemeyin.

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
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```
- **Tip:** Public (client-side accessible)
- **Açıklama:** Appwrite endpoint URL'i
- **Örnek Değer:** `https://cloud.appwrite.io/v1`

### 2. Appwrite API Key (Server-side only)
```bash
APPWRITE_API_KEY=your-appwrite-api-key
```
- **Tip:** Private (server-side only)
- **Açıklama:** Appwrite API key (server-side işlemler için)
- **ÖNEMLİ:** `NEXT_PUBLIC_` prefix'i kullanmayın! Bu güvenlik riski oluşturur.
- **Güvenlik Notu:** Örnek değeri kendi secret'ınızla değiştirin ve gerçek anahtarları hiçbir dokümana veya commit'e koymayın.

### 3. Appwrite Site ID (Server-side only)
```bash
APPWRITE_SITE_ID=your-appwrite-site-id
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
    NEXT_PUBLIC_APPWRITE_ENDPOINT = https://cloud.appwrite.io/v1
    APPWRITE_API_KEY = your-appwrite-api-key
    APPWRITE_SITE_ID = your-appwrite-site-id
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
    NEXT_PUBLIC_APPWRITE_ENDPOINT = https://cloud.appwrite.io/v1
    APPWRITE_API_KEY = your-appwrite-api-key
    APPWRITE_SITE_ID = your-appwrite-site-id
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

## 📝 Özet

| Variable Name | Type | Required | Example |
|--------------|------|----------|---------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Public | ✅ Yes | `https://cloud.appwrite.io/v1` |
| `APPWRITE_API_KEY` | Private | ✅ Yes | `your-appwrite-api-key` |
| `APPWRITE_SITE_ID` | Private | ⚠️ Optional | `your-appwrite-site-id` |

**Son Güncelleme:** 2025-03-08

