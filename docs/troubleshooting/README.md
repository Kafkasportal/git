# Sorun Giderme Rehberleri

Bu klasör, proje geliştirme sürecinde karşılaşılan sorunların çözüm rehberlerini içerir.

## Vitest Test Sistemi

Test sistemi ile ilgili sorun giderme dokümanları:

| Dosya | Açıklama |
|-------|----------|
| [VITEST_ISSUE_RESOLVED.md](./VITEST_ISSUE_RESOLVED.md) | Vitest sorunlarının çözüm özeti |
| [VITEST_DIAGNOSTICS.md](./VITEST_DIAGNOSTICS.md) | Test tanılama araçları ve yöntemleri |
| [VITEST_ENVIRONMENT_FIX_GUIDE.md](./VITEST_ENVIRONMENT_FIX_GUIDE.md) | Test ortamı düzeltme rehberi |
| [VITEST_RECOVERY_GUIDE.md](./VITEST_RECOVERY_GUIDE.md) | Test sistemi kurtarma rehberi |
| [VITEST_ROOT_CAUSE_FOUND.md](./VITEST_ROOT_CAUSE_FOUND.md) | Temel neden analizi |
| [VITEST_V4_MIGRATION_NEEDED.md](./VITEST_V4_MIGRATION_NEEDED.md) | Vitest v4 geçiş notları |

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
