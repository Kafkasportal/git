# Sorun Giderme Rehberi

Bu doküman, proje geliştirme sürecinde karşılaşılabilecek yaygın sorunlar ve çözümlerini içerir.

## Yaygın Sorunlar

### Next.js Cache Sorunları

Kod değişiklikleri yansımıyorsa veya beklenmedik hatalar alıyorsanız:

```bash
# Development server'ı durdurun (Ctrl+C)

# .next klasörünü temizleyin
rm -rf .next

# Node modules cache'ini temizleyin (opsiyonel)
npm run clean

# Development server'ı yeniden başlatın
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

### Test Sorunları

**Test'ler çalışmıyor:**
```bash
# Cache temizle ve yeniden dene
rm -rf .next node_modules/.vitest
npm run test:run
```

**Coverage raporları oluşmuyor:**
```bash
npm run test:coverage
```

### Build Sorunları

**Build hataları:**
```bash
# Tam temizlik yap
npm run clean:all
npm install
npm run build
```

**TypeScript hataları:**
```bash
npm run typecheck
```

### API & Authentication Sorunları

**401 Unauthorized hataları:**
- Session cookie'lerini temizleyin
- Yeniden giriş yapın
- `.env.local` dosyasındaki environment variables'ları kontrol edin

**API route'ları çalışmıyor:**
- `.next` klasörünü temizleyip server'ı yeniden başlatın
- Appwrite bağlantı ayarlarını kontrol edin

### Dependency Sorunları

**npm install hataları:**
```bash
# package-lock.json'u sil ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

## İlgili Dokümanlar

- [Test Rehberi](/docs/guides/testing.md)
- [Geliştirici Rehberi](/docs/guides/development.md)
- [Deployment Rehberi](/docs/guides/deployment.md)

## Destek

Sorun devam ediyorsa:
1. [GitHub Issues](https://github.com/your-repo/issues) sayfasına bakın
2. Yeni bir issue açın
3. Geliştirici rehberini inceleyin
