# Kafkasder Panel

Dernek Yonetim Sistemi - Next.js 16 + Appwrite

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/Vadalov/Kafkasder-panel?utm_source=oss&utm_medium=github&utm_campaign=Vadalov%2FKafkasder-panel&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Modern, guvenli ve olceklenebilir dernek yonetim platformu.

## Ozellikler

- **Ihtiyac Sahibi Yonetimi**: Kapsamli kategorizasyon ve takip
- **Bagis Takibi**: Kumbara sistemi ile tasarruf yonetimi
- **Burs Yonetimi**: Ogrenci ve burs basvuru takibi
- **Toplanti Yonetimi**: Kararlar ve aksiyon takibi
- **Gorev Otomasyonu**: Is akisi ve bildirimler
- **Coklu Kanal Iletisim**: WhatsApp, SMS, Email entegrasyonu
- **Finansal Dashboard**: Gelir-gider raporlama
- **Guvenlik**: 2FA, CSRF korumasi, rate limiting
- **📱 Offline-First PWA**: Queue mutations when offline, automatic background sync, manual sync controls
- **🎨 Theme Customization**: Full theme management system with preset themes and custom color palettes
  - Light/Dark/Auto theme modes with system preference detection
  - Pre-built theme presets for quick styling
  - Custom color palette creator with live preview
  - User-specific theme saving and management
  - Admin controls for organization-wide theme settings

## Hizli Baslangic

### Gereksinimler

- Node.js >= 20.9.0
- npm >= 9.0.0
- Appwrite hesabi (Cloud veya self-hosted)

### Kurulum

Detayli kurulum icin [docs/setup.md](./docs/setup.md) dosyasina bakin.

Hizli baslangic:

```bash
# Repo'yu klonla
git clone https://github.com/kafkasder-org/Kafkasportal.git
cd Kafkasportal

# Bagimliliklari yukle
npm install

# Environment variables ayarla
cp .env.example .env.local
# .env.local dosyasini duzenle (Appwrite endpoint, project ID, API key vb.)

# Appwrite database kurulumu (ilk kez)
npm run appwrite:setup

# Next.js'i baslat
npm run dev
```

Uygulama `http://localhost:3000` adresinde calisacaktir.

## Temel Komutlar

```bash
# Development
npm run dev              # Development server
npm run appwrite:setup   # Appwrite database kurulumu

# Kod Kalitesi
npm run typecheck        # TypeScript kontrolu
npm run lint             # ESLint kontrolu
npm run format           # Prettier formatlama

# Test
npm run test             # Unit testleri
npm run test:e2e         # E2E testleri
npm run test:backend     # Backend durum kontrolu

# Build & Deploy
npm run build            # Production build
```

## Proje Yapisi

```
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React componentleri
│   ├── lib/              # Utility fonksiyonlari
│   │   ├── appwrite/     # Appwrite backend clients
│   │   └── backend/      # Unified backend interface
│   ├── hooks/            # Custom hooks
│   ├── stores/           # State yonetimi
│   └── types/            # TypeScript types
├── scripts/              # Setup ve utility scripts
├── e2e/                  # E2E testleri
└── docs/                 # Teknik dokumantasyon
```

## Dokumantasyon

| Dosya                                                  | Icerik                       |
| ------------------------------------------------------ | ---------------------------- |
| [docs/](./docs/)                                       | Teknik dokumantasyon         |
| [docs/setup.md](./docs/setup.md)                       | Kurulum rehberi              |
| [docs/appwrite-guide.md](./docs/appwrite-guide.md)     | Appwrite kullanim rehberi    |
| [docs/offline-sync-guide.md](./docs/offline-sync-guide.md) | Offline sync rehberi      |
| [docs/mcp-setup.md](./docs/mcp-setup.md)               | MCP sunuculari kurulumu      |
| [docs/deployment.md](./docs/deployment.md)             | Deployment rehberi           |
| [docs/testing.md](./docs/testing.md)                   | Test rehberi                 |
| [docs/api-patterns.md](./docs/api-patterns.md)         | API standartlari             |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                   | Katki rehberi                |
| [CLAUDE.md](./CLAUDE.md)                               | AI asistanlari icin referans |

## Teknoloji Yigini

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Appwrite (self-hosted or cloud)
- **UI**: Radix UI + Tailwind CSS 4
- **State**: Zustand + TanStack Query
- **Testing**: Vitest + Playwright
- **Deployment**: Appwrite Cloud

## Teknik Detaylar

### Offline-First Mimari

Uygulama offline-first bir PWA mimarisi kullanır:

- **IndexedDB Queue**: Offline durumda yapılan değişiklikler IndexedDB'de kuyruğa eklenir
- **Service Worker**: Background sync ve cache yönetimi için Service Worker kullanılır
- **Otomatik Senkronizasyon**: İnternet bağlantısı kurulduğunda işlemler otomatik olarak senkronize edilir
- **Retry Mekanizması**: Exponential backoff ile başarısız senkronizasyonlar yeniden denenir (max 3 deneme)
- **Conflict Resolution**: Last-write-wins stratejisi ile çakışmalar çözülür

Offline sync özellikleri mutation hook'ları (`useAppwriteMutation`, `useFormMutation`) ile otomatik olarak çalışır. Detaylı bilgi için [Offline Sync Guide](./docs/offline-sync-guide.md) dokümantasyonuna bakın.

## Environment Variables

```env
# Zorunlu
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
CSRF_SECRET=your-32-char-secret
SESSION_SECRET=your-32-char-secret

# Opsiyonel
SENTRY_DSN=https://your-sentry-dsn
SMTP_HOST=smtp.example.com
TWILIO_ACCOUNT_SID=your-sid
```

Detaylar icin `.env.example` dosyasina bakin.

## Guvenlik

- CSRF Korumasi
- Rate Limiting
- Input Validation (Zod)
- XSS Korumasi
- 2FA Destegi

Guvenlik aciklarini bildirmek icin [SECURITY.md](./SECURITY.md) dosyasina bakin.

## Katki

1. Fork'layin
2. Feature branch olusturun (`git checkout -b feature/ozellik`)
3. Commit'leyin (`git commit -m 'feat: yeni ozellik'`)
4. Push'layin (`git push origin feature/ozellik`)
5. Pull Request acin

Detaylar icin [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasina bakin.

## Lisans

MIT License - [LICENSE](./LICENSE) dosyasina bakin.

## Linkler

- [GitHub Repository](https://github.com/Vadalov/Kafkasder-panel)
- [Issues](https://github.com/Vadalov/Kafkasder-panel/issues)
- [Security Advisories](https://github.com/Vadalov/Kafkasder-panel/security)
