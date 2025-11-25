# Kafkasder Panel - Teknik Dokumantasyon

Bu klasor projenin tum teknik dokumantasyonunu icerir.

## Icerik

| Dosya                                                        | Aciklama                                       |
| ------------------------------------------------------------ | ---------------------------------------------- |
| [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)                 | Kapsamli proje analizi ve mimari dokumantasyonu |
| [setup.md](./setup.md)                                       | Yerel ortam kurulum rehberi                    |
| [mcp-setup.md](./mcp-setup.md)                               | MCP sunuculari kurulum ve kullanim rehberi     |
| [claude-desktop-mcp-setup.md](./claude-desktop-mcp-setup.md) | Claude Desktop MCP yapilandirmasi              |
| [cursor-mcp-windows.md](./cursor-mcp-windows.md)             | Windows'ta Cursor IDE MCP yapilandirmasi      |
| [appwrite-mcp.md](./appwrite-mcp.md)                         | Appwrite MCP kullanim kilavuzu                 |
| [appwrite-guide.md](./appwrite-guide.md)                     | Appwrite kullanim rehberi ve ornekler          |
| [github-mcp-server.md](./github-mcp-server.md)               | GitHub MCP sunucusu kullanim kilavuzu          |
| [docker-mcp-setup.md](./docker-mcp-setup.md)                 | Docker MCP Toolkit kurulum rehberi             |
| [docker-mcp-registry-contribution.md](./docker-mcp-registry-contribution.md) | Docker MCP Registry'ye katki rehberi |
| [docker-ci-setup.md](./docker-ci-setup.md)                  | Docker CI/CD GitHub Actions kurulum rehberi    |
| [playwright-mcp-browser.md](./playwright-mcp-browser.md)    | Browser MCP (Playwright) kullanim rehberi      |
| [browser-mcp-examples.md](./browser-mcp-examples.md)         | Browser MCP ornekleri                          |
| [testing.md](./testing.md)                                   | Test altyapisi ve yazim rehberi                |
| [test-coverage-report.md](./test-coverage-report.md)         | Test coverage analizi ve raporu               |
| [api-patterns.md](./api-patterns.md)                         | API route standartlari ve middleware kullanimi |
| [appwrite-schema-reference.md](./appwrite-schema-reference.md) | Appwrite veritabani schema referansi         |
| [api-routes-reference.md](./api-routes-reference.md)         | API route'lar referans dokumantasyonu        |
| [component-library-reference.md](./component-library-reference.md) | UI component kutuphanesi referansi           |
| [ISSUES.md](./ISSUES.md)                                     | Acik issue'lar ve ozellik istekleri            |
| [TODO.md](./TODO.md)                                         | Yapilmasi gerekenler listesi ve oncelik sirasi |

## Hizli Erisim

### Proje Yapisi

```
Kafkasder-panel/
├── src/
│   ├── app/                 # Next.js App Router sayfalari
│   │   ├── (dashboard)/     # Dashboard layout grubu
│   │   ├── api/             # API route'lari (Appwrite proxy)
│   │   └── login/           # Giris sayfasi
│   ├── components/          # React componentleri
│   │   └── ui/              # Radix UI temel componentleri
│   ├── lib/                 # Utility fonksiyonlariSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDpers
│   │   └── validations/     # Zod validation semalari
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand state yonetimi
│   └── types/               # TypeScript type tanimlari
├── src/lib/appwrite/        # Appwrite backend
│   ├── config.ts            # Yapilandirma
│   └── client.ts            # Client/Server SDK
├── e2e/                     # Playwright E2E testleri
└── docs/                    # Teknik dokumantasyon
```

### Temel Komutlar

```bash
# Development
npm run dev              # Next.js dev server (localhost:3000)

# Kod Kalitesi
npm run typecheck        # TypeScript tip kontrolu
npm run lint             # ESLint kontrolu
npm run lint:fix         # ESLint hatalari duzelt
npm run format           # Prettier ile formatla

# Test
npm run test             # Unit testleri (watch mode)
npm run test:run         # Testleri bir kez calistir
npm run test:coverage    # Coverage raporu
npm run test:e2e         # E2E testleri

# Build & Deploy
npm run build            # Production build
```

### Teknoloji Yigini

| Kategori       | Teknoloji                                 |
| -------------- | ----------------------------------------- |
| **Frontend**   | Next.js 16, React 19, TypeScript          |
| **Backend**    | Appwrite (serverless database)            |
| **Styling**    | Tailwind CSS 4, Radix UI                  |
| **State**      | Zustand (client), TanStack Query (server) |
| **Forms**      | React Hook Form + Zod                     |
| **Testing**    | Vitest (unit), Playwright (E2E)           |
| **Deployment** | Appwrite Cloud                     |

### Mimari Prensipler

#### 1. Appwrite-First Backend

Appwrite birincil backend'dir. Next.js API route'lari sadece proxy gorevindedir:

- Tum veritabani islemleri `src/lib/appwrite/` klasorunde
- API route'lari rate limiting, CSRF ve auth middleware saglar
- Real-time updates Appwrite tarafindan yonetilir

#### 2. Type-Safe Her Sey

- TypeScript strict mode aktif
- Zod ile runtime validation
- Appwrite schema validators zorunlu

#### 3. Guvenlik Oncelikli

- CSRF korumasi tum mutation endpoint'lerinde
- Rate limiting endpoint bazinda yapilandirilir
- Input sanitization (DOMPurify)
- Audit logging tum kritik islemlerde

## Detayli Rehberler

### Yeni Ozellik Ekleme

1. **Appwrite Collection** - Appwrite Console'da collection olustur
2. **Config** - `src/lib/appwrite/config.ts`'e collection ID ekle
3. **API Route** - `src/app/api/[resource]/route.ts` ekle
4. **Validation** - `src/lib/validations/` altina Zod semasi ekle
5. **UI** - Component ve sayfa olustur

### Form Olusturma

```typescript
import { useStandardForm } from '@/hooks/useStandardForm';
import { beneficiarySchema } from '@/lib/validations/beneficiary';

function MyForm({ onSuccess }) {
  const form = useStandardForm({
    defaultValues: { name: '', status: 'active' },
    schema: beneficiarySchema,
    mutationFn: (data) => api.create(data),
    onSuccess,
  });

  return <form onSubmit={form.handleSubmit}>...</form>;
}
```

### API Client Kullanimi

```typescript
import { beneficiaries } from '@/lib/api/crud-factory';

// CRUD islemleri
const list = await beneficiaries.list({ status: 'active' });
const item = await beneficiaries.get(id);
const created = await beneficiaries.create(data);
await beneficiaries.update(id, updates);
await beneficiaries.delete(id);
```

## Onemli Kurallar

1. **console.log YASAK** - `src/lib/logger.ts` kullan
2. **Zod validation** - Tum inputlar validate edilmeli
3. **Prettier/ESLint** - Commit oncesi kontrol edilir

## MCP (Model Context Protocol) Dokümantasyonu

### Hızlı Başlangıç
- [MCP Setup Guide](./mcp-setup.md) - Genel MCP kurulum rehberi
- [Cursor IDE MCP (Windows)](./cursor-mcp-windows.md) - Windows özel yapılandırma
- [Claude Desktop MCP](./claude-desktop-mcp-setup.md) - Claude Desktop yapılandırması

### MCP Sunucuları
- [Appwrite MCP](./appwrite-mcp.md) - Appwrite kullanıcı yönetimi
- [GitHub MCP](./github-mcp-server.md) - GitHub repository yönetimi
- [Docker MCP](./docker-mcp-setup.md) - Docker MCP Toolkit
- [Browser MCP](./playwright-mcp-browser.md) - Web tarayıcı otomasyonu

### Docker & CI/CD
- [Docker CI/CD Setup](./docker-ci-setup.md) - GitHub Actions Docker build
- [Docker MCP Registry](./docker-mcp-registry-contribution.md) - Registry'ye katkı

## Daha Fazla Bilgi

- [Appwrite Rehberi](./appwrite-guide.md)
- [Appwrite Schema Reference](./appwrite-schema-reference.md)
- [API Routes Reference](./api-routes-reference.md)
- [Component Library Reference](./component-library-reference.md)
- [Test Rehberi](./testing.md)
- [Test Coverage Report](./test-coverage-report.md)
- [API Patterns](./api-patterns.md)
- [Contributing](../CONTRIBUTING.md)
- [Security Policy](../SECURITY.md)
