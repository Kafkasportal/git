# Sorun Giderme Rehberleri

Bu klasör, proje geliştirme sürecinde karşılaşılan sorunların çözüm rehberlerini içerir.

## Hızlı Başvuru

### Yaygın Sorunlar

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

**TypeScript hataları:**
```bash
npm run typecheck
```

### İlgili Dokümanlar

- [Test Rehberi](/docs/guides/testing.md)
- [Geliştirici Rehberi](/docs/guides/development.md)
