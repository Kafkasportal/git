# CLAUDE.md

AI asistanlar (Claude Code, GitHub Copilot vb.) icin proje rehberi.

## Proje Ozeti

**Kafkasder Panel** - Next.js 16, React 19 ve Appwrite ile gelistirilmis dernek yonetim sistemi.

**Ozellikler**: Ihtiyac sahibi yonetimi, bagis takibi, burs yonetimi, toplanti yonetimi, gorev otomasyonu, WhatsApp/SMS/Email entegrasyonu, finansal raporlama, guvenlik denetimi.

## Temel Komutlar

```bash
# Development
npm run dev                    # Next.js dev server (localhost:3000)

# Kod Kalitesi
npm run typecheck              # TypeScript tip kontrolu
npm run lint                   # ESLint kontrolu
npm run lint:fix               # ESLint duzeltme
npm run format                 # Prettier formatlama

# Test
npm run test                   # Unit testleri (watch mode)
npm run test:run               # Testleri bir kez calistir
npm run test:e2e               # E2E testleri

# Build & Deploy
npm run build                  # Production build

# Appwrite
npm run appwrite:setup         # Appwrite database kurulumu
npm run test:backend           # Backend durum kontrolu
```

## Mimari

### Appwrite Backend

Appwrite birincil backend'dir:

- **Client SDK**: `src/lib/appwrite/client.ts` - Browser islemleri
- **Server SDK**: `src/lib/appwrite/server.ts` - API routes icin
- **Config**: `src/lib/appwrite/config.ts` - Collection ve bucket mapping
- **API Client**: `src/lib/appwrite/api-client.ts` - Generic CRUD operations

**Appwrite kullanim ornegi:**

```typescript
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';

const documents = await databases.listDocuments(
  appwriteConfig.databaseId,
  appwriteConfig.collections.beneficiaries,
  [Query.equal('status', 'active'), Query.limit(10)]
);
```

### API Routes

`src/app/api/` - Appwrite'a ince proxy katmani. Sorumluluklar:

- HTTP routing ve method validation
- Auth middleware
- Rate limiting ve CSRF korumasi

### Frontend

```
src/app/
├── (dashboard)/           # Dashboard layout grubu
│   ├── genel/             # Ana sayfa
│   ├── bagis/             # Bagislar
│   ├── yardim/            # Yardim yonetimi
│   ├── burs/              # Burslar
│   ├── fon/               # Finans
│   ├── partner/           # Partnerler
│   ├── kullanici/         # Kullanicilar
│   ├── is/                # Gorevler/Toplantilar
│   ├── mesaj/             # Mesajlar
│   └── ayarlar/           # Ayarlar
├── api/                   # API routes
└── login/                 # Giris sayfasi
```

### Path Aliases

```typescript
@/*              → ./src/*
@/components/*   → ./src/components/*
@/lib/*          → ./src/lib/*
@/hooks/*        → ./src/hooks/*
@/stores/*       → ./src/stores/*
@/types/*        → ./src/types/*
```

## Kod Kurallari

### ZORUNLU

1. **console.log YASAK** - `src/lib/logger.ts` kullan:

   ```typescript
   import { logger } from '@/lib/logger';
   logger.info('User logged in', { userId });
   logger.error('Failed to save', error);
   ```

2. **TypeScript strict mode** - `any` tipi kullanma

3. **Zod validation** - Tum inputlar validate edilmeli:

   ```typescript
   import { beneficiarySchema } from '@/lib/validations/beneficiary';
   const result = beneficiarySchema.safeParse(data);
   ```

### Tercihler

- `const` > `let`, `var` hicbir zaman
- Object shorthand: `{ name }` > `{ name: name }`
- Unused variables: `_` prefix ile isaretle

## Yeni Kaynak Ekleme

1. **Appwrite Collection** - Appwrite Console'da collection olustur

2. **Config** - `src/lib/appwrite/config.ts`'e collection ID ekle

3. **API Route** - `src/app/api/[resource]/route.ts`

4. **API Client** - `src/lib/api/crud-factory.ts`

   ```typescript
   export const myResource = createApiClient<MyResource>('myResource');
   ```

5. **Validation** - `src/lib/validations/[resource].ts`

## Form Pattern

```typescript
import { useStandardForm } from '@/hooks/useStandardForm';
import { beneficiarySchema } from '@/lib/validations/beneficiary';
import { beneficiaries } from '@/lib/api/crud-factory';

function MyForm({ initialData, onSuccess }) {
  const form = useStandardForm({
    defaultValues: initialData || { name: '', status: 'active' },
    schema: beneficiarySchema,
    mutationFn: initialData
      ? (data) => beneficiaries.update(initialData._id, data)
      : beneficiaries.create,
    onSuccess,
    resetOnSuccess: !initialData,
  });

  return <form onSubmit={form.handleSubmit}>...</form>;
}
```

## API Client Kullanimi

```typescript
import { beneficiaries } from '@/lib/api/api-client';

const data = await beneficiaries.list({ status: 'active' });
const item = await beneficiaries.get(id);
const newItem = await beneficiaries.create(data);
await beneficiaries.update(id, updates);
await beneficiaries.delete(id);
```


## Theme System

Theme presets are stored in Appwrite `theme_presets` collection. Each preset contains: name, description, colors, typography, layout, isDefault, isCustom flags. Theme data is serialized as JSON in the `theme_config` database field. Settings context (`SettingsProvider`) manages theme state globally. Theme mode (light/dark/auto) is stored in localStorage and synced with system preferences.

### Theme Presets API

**Endpoints:**

- `GET /api/settings/theme-presets` - List all theme presets (requires `settings:manage` permission)
- `POST /api/settings/theme-presets` - Create new theme preset (requires `settings:manage` permission, CSRF token)
- `PUT /api/settings/theme-presets` - Update theme preset (requires `settings:manage` permission, CSRF token)
- `DELETE /api/settings/theme-presets?id={id}` - Delete theme preset (requires `settings:manage` permission, CSRF token)
- `GET /api/settings/theme-presets/default` - Get default theme preset (requires authentication)

**Usage Example:**

```typescript
import { useTheme } from '@/contexts/settings-context';

function MyComponent() {
  const { currentTheme, themePresets, setTheme } = useTheme();

  // Apply a theme
  await setTheme('My Custom Theme');

  // Access current theme colors
  const primaryColor = currentTheme?.colors.primary;
}
```

**Creating Custom Themes:**

```typescript
import { fetchWithCsrf } from '@/lib/csrf';

const themeData = {
  name: 'My Custom Theme',
  description: 'User-created custom theme',
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    // ... other colors
  },
  isCustom: true,
  isDefault: false,
};

const response = await fetchWithCsrf('/api/settings/theme-presets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(themeData),
});
```

**Validation Schema:**

Theme presets are validated using `themePresetSchema` from `src/lib/validations/theme.ts`. The schema validates:
- `name`: string, min 2 chars, max 100 chars
- `description`: optional, max 500 chars
- `colors`: object with required `primary` (hex color) and optional color fields
- `typography`: optional object with font settings
- `layout`: optional object with spacing and layout settings
- `isDefault`: boolean, optional
- `isCustom`: boolean, optional

## Validation Patterns

### Phone Number Validation

**Standard Format:** `5XXXXXXXXX` (10 digits, starts with 5)

**Usage:**

```typescript
import { phoneSchema, requiredPhoneSchema } from '@/lib/validations/shared-validators';
import { sanitizePhone } from '@/lib/sanitization';

// In Zod schemas
const mySchema = z.object({
  phone: phoneSchema, // optional
  mobile: requiredPhoneSchema, // required
});

// In API routes (sanitize before validate)
const sanitized = sanitizePhone(inputPhone); // Accepts +90, 0, 5XX formats
if (!sanitized || !phoneSchema.safeParse(sanitized).success) {
  throw new Error('Invalid phone number');
}
```

**Accepted Input Formats (via sanitization):**
- `+905551234567` → normalized to `5551234567`
- `05551234567` → normalized to `5551234567`
- `5551234567` → no change

**Validation Rules:**
- Must be exactly 10 digits
- Must start with 5 (Turkish mobile prefix)
- No spaces, dashes, or special characters in validated format

## Guvenlik

- **CSRF Korumasi**: `src/lib/csrf.ts`
- **Rate Limiting**: `src/lib/rate-limit.ts`, `rate-limit-config.ts`
- **Input Sanitization**: `src/lib/sanitization.ts` (DOMPurify)
- **Audit Logging**: `audit_logs`, `security_audit` collections
- **Auth**: Custom bcrypt-based (`src/app/api/auth/`, `src/stores/authStore.ts`)

## Test

```bash
# Belirli dosya
npm run test -- path/to/file.test.ts

# Pattern ile
npm run test -- -t "test name"

# E2E belirli test
npm run test:e2e -- tests/auth.spec.ts
```

Test dosyalari: `src/__tests__/`, E2E: `e2e/`

## Onemli Dosyalar

| Dosya                            | Aciklama                  |
| -------------------------------- | ------------------------- |
| `src/lib/appwrite/config.ts`     | Appwrite yapilandirmasi   |
| `src/lib/appwrite/client.ts`     | Client-side SDK           |
| `src/lib/appwrite/server.ts`     | Server-side SDK           |
| `next.config.ts`                 | Next.js config            |
| `src/lib/api/crud-factory.ts`    | API client factory        |
| `src/lib/validations/`           | Zod validation semalari   |
| `src/hooks/useStandardForm.ts`   | Form hook                 |
| `src/stores/authStore.ts`        | Auth state                |

## Debugging

**Appwrite baglanti sorunu:**

```bash
# Environment variables kontrol et
npm run test:backend
```

**Build hatalari:**

```bash
npm run clean:all
npm install
npm run build
```

**Type hatalari:**

```bash
npm run typecheck
```

## MCP Sunuculari

Bu proje, AI asistanlarin (Claude, GitHub Copilot vb.) harici sistemlerle etkileşim kurmasini saglayan MCP (Model Context Protocol) sunucularini destekler.

### Kurulum

MCP sunucularini yapılandırmak için:

```bash
# Cursor IDE icin
cp .cursor/mcp_settings.example.json .cursor/mcp_settings.json
# Sonra credential'lari duzenleyin

# Claude Desktop icin
# docs/claude-desktop-mcp-setup.md rehberini takip edin
```

### Kullanilabilir MCP Sunuculari

- **Appwrite**: Kullanici yonetimi ve authentication
- **GitHub**: Repository, issue/PR yonetimi
- **Browser Use**: Web tarayici otomasyonu
- **Chrome DevTools**: Chrome geliştirici araçları

### Ornek Kullanim

```
"Appwrite'da yeni kullanici olustur"
"Bu repository'deki acik issue'lari goster"
"Login sayfasini test et ve screenshot al"
```

Detaylı bilgi için: [docs/mcp-setup.md](./docs/mcp-setup.md)

## Detayli Dokumantasyon

- [docs/appwrite-guide.md](./docs/appwrite-guide.md) - Appwrite kullanim rehberi
- [docs/mcp-setup.md](./docs/mcp-setup.md) - MCP kurulum rehberi
- [docs/deployment.md](./docs/deployment.md) - Deployment rehberi
- [docs/testing.md](./docs/testing.md) - Test rehberi
- [docs/api-patterns.md](./docs/api-patterns.md) - API standartlari
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Katki rehberi
- [SECURITY.md](./SECURITY.md) - Guvenlik politikasi
