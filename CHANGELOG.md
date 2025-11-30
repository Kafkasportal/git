# Changelog

Tüm önemli değişiklikler bu dosyada dokümante edilecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygundur,
ve bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanır.

## [Unreleased]

### Added
- README.md dokümantasyonu
- CONTRIBUTING.md katkı rehberi
- .env.example environment variables örneği
- Appwrite client/server konfigürasyon ayrımı
- Comprehensive test suite (618 tests)

### Fixed
- ESLint require() import hataları
- TypeScript type errors
- Test timezone sorunları
- Appwrite konfigürasyon mantık hatası
- Build modül hataları

### Changed
- Appwrite konfigürasyon fonksiyonları ayrıldı (`isClientConfigured`, `isServerConfigured`)
- Security.ts dosyası modern import kullanımına geçirildi

### Security
- CSRF koruması aktif
- Rate limiting implementasyonu
- Input sanitization
- XSS koruması
- Security headers eklendi

## [0.1.0] - 2024-11-30

### Added
- Initial project setup
- Next.js 16 + React 19 stack
- Appwrite backend integration
- User management system
- Beneficiary management
- Donation management
- Scholarship management
- Financial tracking
- Meeting management
- Messaging system
- PWA support
- Real-time notifications
- Comprehensive test coverage

[Unreleased]: https://github.com/your-repo/git-2/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-repo/git-2/releases/tag/v0.1.0

