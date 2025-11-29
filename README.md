# Dernek Yönetim Sistemi

[![Lint and Type Check](https://github.com/Kafkasportal/git/actions/workflows/lint.yml/badge.svg)](https://github.com/Kafkasportal/git/actions/workflows/lint.yml)
[![Node.js CI](https://github.com/Kafkasportal/git/actions/workflows/test.yml/badge.svg)](https://github.com/Kafkasportal/git/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern sivil toplum kuruluşları için geliştirilmiş kapsamlı bir yönetim platformu. Bağış takibi, ihtiyaç sahibi yönetimi, burs programları, finansal operasyonlar ve iletişim süreçlerini tek bir çatı altında toplar.

## 🔧 Teknoloji Yığını

| Kategori | Teknoloji |
|----------|-----------|
| **Framework** | Next.js 16 |
| **Dil** | TypeScript 5 |
| **Backend** | Appwrite 21 |
| **State Yönetimi** | Zustand |
| **Veri Çekme** | TanStack React Query |
| **Form Yönetimi** | React Hook Form + Zod |
| **UI Bileşenleri** | Radix UI + Tailwind CSS |

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 20.x
- npm 9.x veya üzeri
- Appwrite sunucusu

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.example .env.local

# Appwrite kurulumu
npm run appwrite:setup

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 📦 Ana Modüller

| Modül | Açıklama |
|-------|----------|
| **Bağış Yönetimi** | Bağış kayıtları, raporlar, kumbara sistemi |
| **Yardım Programları** | İhtiyaç sahipleri, başvurular, nakit yardım |
| **Burs Sistemi** | Öğrenci bursları, başvurular, yetim destek |
| **Finansal Yönetim** | Gelir-gider takibi, mali raporlar |
| **İletişim** | SMS, e-posta, toplu mesaj, WhatsApp |
| **İş Yönetimi** | Görevler, toplantılar, karar takibi |
| **Kullanıcı Yönetimi** | Roller, yetkiler, denetim kayıtları |

## 🛠️ Geliştirme Komutları

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run lint         # Linting
npm run typecheck    # TypeScript kontrolü
npm run test         # Testler
npm run test:coverage # Test coverage raporu
```

## 📚 Dokümantasyon

Detaylı dokümantasyon için [docs/](./docs/) klasörüne bakın:

- [Hızlı Başlangıç](./docs/getting-started.md)
- [Mimari Yapı](./docs/architecture.md)
- [API Referansı](./docs/api-reference.md)
- [Bileşen Kütüphanesi](./docs/components.md)
- [Veritabanı Şeması](./docs/database-schema.md)
- [Yetkilendirme](./docs/authorization.md)
- [Form Yönetimi](./docs/forms.md)
- [Test Yazımı](./docs/testing.md)

## 🤝 Katkıda Bulunma

Katkıda bulunmak için [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasını okuyun.

## 🔐 Güvenlik

Güvenlik açıkları için [SECURITY.md](./SECURITY.md) dosyasını okuyun.

## 📝 Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.
