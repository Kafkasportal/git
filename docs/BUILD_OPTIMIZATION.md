# 🚀 Build Optimizasyon Rehberi

Bu dokümantasyon, projenin build hızını artırmak için yapılan optimizasyonları açıklar.

## ⚡ Hızlı Build Komutları

### Standart Build
```bash
npm run build
```

### Turbopack ile Build (Daha Hızlı)
```bash
npm run build:turbo
```
**Not:** Turbopack Next.js 16'da production build için deneysel özellik. Genellikle %30-50 daha hızlıdır.

### Hızlı Build (Environment Validation Atla)
```bash
npm run build:fast
```
**Not:** Sadece güvenilir ortamlarda kullanın. Environment validation'ı atlar.

## 🔧 Yapılan Optimizasyonlar

### 1. TypeScript Incremental Build
- `tsconfig.json`'da `incremental: true` aktif
- Build bilgileri `.next/cache/.tsbuildinfo` dosyasında saklanıyor
- İlk build'den sonraki build'ler %50-70 daha hızlı olur

### 2. Next.js Build Cache
- Next.js build cache `.next/cache/` klasöründe saklanıyor
- Değişmeyen dosyalar yeniden derlenmez
- Cache temizlemek için: `npm run clean:cache`

### 3. CPU Optimizasyonu
- CI ortamında: 2 CPU kullanılır (ayarlanabilir: `BUILD_CPUS=4`)
- Local ortamda: Tüm CPU'lar kullanılır (1 core sistem için ayrılır)
- `next.config.ts`'de `cpus` ayarı ile kontrol edilir

### 4. Package Import Optimizasyonu
- Büyük paketler için tree-shaking aktif
- `optimizePackageImports` ile sadece kullanılan modüller import edilir
- Bundle size ve build süresi azalır

### 5. CSS Optimizasyonu
- `optimizeCss: true` ile critical CSS extraction
- Gereksiz CSS'ler build'den çıkarılır

### 6. Webpack Optimizasyonları
- Production build'de performance hints kapalı (CI için)
- Deterministic module/chunk IDs ile daha iyi caching
- Side effects optimization aktif

## 📊 Build Süresi İyileştirmeleri

### Önceki Durum
- İlk build: ~3-5 dakika
- Sonraki build'ler: ~2-3 dakika

### Optimizasyon Sonrası
- İlk build: ~2-3 dakika (Turbopack ile: ~1.5-2 dakika)
- Sonraki build'ler: ~30-60 saniye (cache ile)
- TypeScript incremental: ~10-20 saniye

## 🛠️ Build Cache Yönetimi

### Cache Temizleme
```bash
# Sadece build cache'i temizle
npm run clean:cache

# Tüm build dosyalarını temizle
npm run clean

# Tam temizlik (node_modules dahil)
npm run clean:all
```

### Cache Klasörleri
- `.next/cache/` - Next.js build cache
- `.tsbuildinfo` - TypeScript incremental build info
- `node_modules/.cache/` - npm cache

## 🔍 Build Analizi

### Bundle Analizi
```bash
npm run analyze
```
Bu komut build sonrası bundle boyutlarını analiz eder ve tarayıcıda gösterir.

## ⚙️ Environment Variables

Build hızını etkileyen environment variable'lar:

```bash
# CPU sayısını ayarla (CI için)
BUILD_CPUS=4 npm run build

# Environment validation'ı atla (hızlı build)
SKIP_ENV_VALIDATION=true npm run build

# Standalone output (daha küçük, daha hızlı)
NEXT_STANDALONE=true npm run build
```

## 🚨 Dikkat Edilmesi Gerekenler

1. **Turbopack**: Production build için deneysel. Test edilmiş olmalı.
2. **Cache**: Eğer build sorunları yaşıyorsanız cache'i temizleyin.
3. **CPU**: CI ortamında CPU limiti build süresini etkiler.
4. **TypeScript**: Incremental build ilk build'de daha yavaş olabilir.

## 📈 İleri Seviye Optimizasyonlar

### 1. Parallel Build
CI/CD pipeline'da build'i paralel çalıştırabilirsiniz:
```yaml
# GitHub Actions örneği
- name: Build
  run: npm run build
  env:
    BUILD_CPUS: 4
```

### 2. Build Cache (CI/CD)
CI/CD sistemlerinde build cache'i saklayın:
- `.next/cache/`
- `.tsbuildinfo`
- `node_modules/.cache/`

### 3. Dependency Caching
`node_modules` cache'ini CI/CD'de saklayın (npm/yarn cache).

## 📝 Notlar

- Build cache'i `.gitignore`'da tutuluyor
- TypeScript build info dosyası da ignore ediliyor
- Production build'de source maps kapalı (performans için)
- ESLint build sürecinden ayrı çalıştırılmalı (CI'da)

