# Dernek Yönetim Sistemi - Güvenlik Dokumentasyonu

## İçindekiler

- [Güvenlik Genel Bakış](#güvenlik-genel-bakış)
- [Kimlik Doğrulama Sistemi](#kimlik-doğrulama-sistemi)
- [CSRF Koruması](#csrf-koruması)
- [XSS Koruması](#xss-koruması)
- [Hız Sınırlandırması](#hız-sınırlandırması)
- [Oturum Yönetimi](#oturum-yönetimi)
- [Giriş Doğrulaması](#giriş-doğrulaması)
- [Güvenlik Header'ları](#güvenlik-headerları)
- [Güvenli Kodlama Uygulamaları](#güvenli-kodlama-uygulamaları)
- [Güvenlik Kontrolü Listesi](#güvenlik-kontrol-listesi)
- [Zafiyet Bildirimi](#zafiyet-bildirimi)

---

## Güvenlik Genel Bakış

Dernek Yönetim Sistemi, OWASP Top 10 güvenlik tehditlerine karşı koruma sağlamak üzere tasarlanmıştır.

### Güvenlik Katmanları

```
┌─────────────────────────────────┐
│      Browser / Client Layer     │
│  - XSS Protection               │
│  - CSP (Content Security Policy)│
├─────────────────────────────────┤
│     Network / Transport Layer    │
│  - HTTPS/TLS                    │
│  - HSTS Header                  │
├─────────────────────────────────┤
│    Application / Logic Layer     │
│  - CSRF Token Validation        │
│  - Input Validation (Zod)       │
│  - Session Management           │
├─────────────────────────────────┤
│   Data / Database Layer         │
│  - Prepared Statements          │
│  - Field Encryption             │
│  - Audit Logging                │
└─────────────────────────────────┘
```

---

## Kimlik Doğrulama Sistemi

### Şifre Gereksinimleri

```typescript
// src/lib/validations/user.ts

const passwordRequirements = z.string()
  .min(12, 'Şifre en az 12 karakter olmalıdır')
  .regex(/[A-Z]/, 'En az 1 büyük harf gereklidir')
  .regex(/[a-z]/, 'En az 1 küçük harf gereklidir')
  .regex(/[0-9]/, 'En az 1 rakam gereklidir')
  .regex(/[!@#$%^&*]/, 'En az 1 özel karakter (!@#$%^&*) gereklidir');
```

**Şifre Standartları:**
- Minimum 12 karakter
- Büyük harf (A-Z)
- Küçük harf (a-z)
- Rakam (0-9)
- Özel karakter (!@#$%^&*)
- Sık geçen şifreler/parolalar blacklist'inde değil

### Şifre Hashleme

```typescript
// src/lib/auth/password.ts

import bcryptjs from 'bcryptjs';

/**
 * Şifreyi hash'le
 * bcryptjs ile PBKDF2 kullan
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // 10-12 arası önerilen
  return bcryptjs.hash(password, saltRounds);
}

/**
 * Şifre karşılaştırması (timing-safe)
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}
```

**Hashlemel Gereksinimleri:**
- bcryptjs ile PBKDF2 algoritması
- Salt rounds: 12
- Production'da plaintext şifre depolanmaz

### İki Faktörlü Kimlik Doğrulama (2FA)

```typescript
// src/lib/auth/2fa.ts

import { authenticator } from 'otplib';
import QRCode from 'qrcode';

/**
 * 2FA kurulumu başlat
 */
export async function setup2FA(userId: string, userEmail: string) {
  const secret = authenticator.generateSecret();

  const otpauth = authenticator.keyuri(
    userEmail,
    'Dernek Yönetim Sistemi',
    secret
  );

  const qrCode = await QRCode.toDataURL(otpauth);

  return {
    secret,
    qrCode,
    backupCodes: generateBackupCodes(6),
  };
}

/**
 * TOTP token doğrula
 */
export function verify2FA(token: string, secret: string): boolean {
  return authenticator.check(token, secret);
}

/**
 * Backup kodları oluştur
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(
      Array(8)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('')
        .toUpperCase()
    );
  }
  return codes;
}
```

**2FA Özellikler:**
- TOTP (Time-based One-Time Password) - Google Authenticator uyumlu
- QR kodu ile kurulum
- Backup kodları
- Time window: ±1 dakika

### OAuth2 Entegrasyonu

```typescript
// src/lib/appwrite/auth-oauth.ts

/**
 * OAuth2 provider'ı başlat
 */
export function initiateOAuth(provider: 'google' | 'github'): string {
  // Appwrite OAuth2 endpoint'ine yönlendir
  const redirectUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/oauth2/authorize`;

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    scope: 'profile email',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback`,
    provider,
    state: generateRandomState(), // CSRF protection
  });

  return `${redirectUrl}?${params.toString()}`;
}

/**
 * OAuth2 callback işle
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<User> {
  // State parametresini doğrula (CSRF protection)
  if (!verifyState(state)) {
    throw new Error('Invalid state parameter');
  }

  // Code'u exchange et
  const token = await exchangeAuthorizationCode(code);

  // User oluştur veya güncelle
  return createOrUpdateUser(token);
}
```

---

## CSRF Koruması

### CSRF Token Üretimi

```typescript
// src/lib/csrf.ts

import { randomBytes, createHmac } from 'crypto';

/**
 * CSRF token oluştur
 */
export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex');
  const timestamp = Date.now();

  const signature = createHmac('sha256', process.env.CSRF_SECRET!)
    .update(`${token}${timestamp}`)
    .digest('hex');

  return `${token}.${timestamp}.${signature}`;
}

/**
 * CSRF token doğrula
 */
export function validateCsrfToken(
  headerToken: string,
  cookieToken: string
): boolean {
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Header token ile cookie token eşleş
  if (headerToken !== cookieToken) {
    return false;
  }

  const [token, timestamp, signature] = headerToken.split('.');

  // Imza doğrula
  const expectedSignature = createHmac('sha256', process.env.CSRF_SECRET!)
    .update(`${token}${timestamp}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    return false;
  }

  // Token yaşını kontrol et (30 dakika)
  const now = Date.now();
  const age = now - parseInt(timestamp);

  if (age > 30 * 60 * 1000) {
    return false;
  }

  return true;
}
```

### CSRF Token Kullanımı

**HTML Form:**

```html
<form method="POST" action="/api/beneficiaries">
  <input type="hidden" name="csrf_token" id="csrf_token" />
  <!-- Form fields -->
  <button type="submit">Gönder</button>
</form>

<script>
// CSRF token'ını al ve form'a ekle
fetch('/api/csrf')
  .then(r => r.json())
  .then(data => {
    document.getElementById('csrf_token').value = data.token;
  });
</script>
```

**API İstekleri:**

```typescript
// Fetch API
const csrfResponse = await fetch('/api/csrf');
const { token } = await csrfResponse.json();

const response = await fetch('/api/beneficiaries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
  },
  body: JSON.stringify(data),
  credentials: 'include', // Cookie'leri içer
});
```

**Middleware Doğrulaması:**

```typescript
// src/middleware.ts

if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
  const headerToken = request.headers.get('x-csrf-token') || '';
  const cookieToken = request.cookies.get('csrf-token')?.value || '';

  if (!validateCsrfTokenEdge(headerToken, cookieToken)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'CSRF doğrulaması başarısız' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## XSS Koruması

### DOMPurify ile HTML Sanitizasyonu

```typescript
// src/lib/sanitization.ts

import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML içeriğini sanitize et
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    KEEP_CONTENT: true,
  });
}

/**
 * Kullanıcı input'ını sanitize et
 */
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * URL'yi sanitize et
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    // Sadece http/https izin ver
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }

    return url;
  } catch {
    return '';
  }
}
```

### Content Security Policy (CSP)

```typescript
// next.config.ts

{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",                    // Default olarak sadece same-origin
    "base-uri 'self'",                       // Base URL same-origin
    "form-action 'self'",                    // Form submit same-origin
    "img-src 'self' data: blob: https:",     // Image'lar same-origin veya data URL
    "font-src 'self' data:",                 // Font'lar same-origin veya data URL
    "object-src 'none'",                     // Embedded object'ler engelle
    "frame-ancestors 'none'",                // Clickjacking koruması
    "script-src 'self' 'unsafe-inline'",     // Inline script'ler güvenli context'te
    "style-src 'self' 'unsafe-inline'",      // Inline style'lar güvenli
    "connect-src 'self'",                    // API çağrıları same-origin
  ].join('; ')
}
```

### Template Escaping

```typescript
// React'te otomatik escape
export function UserProfile({ user }: { user: User }) {
  // User.name otomatik olarak escape edilir
  return <h1>{user.name}</h1>; // ✓ Safe

  // dangerouslySetInnerHTML kullan SADECE sanitized content için
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(user.bio),
      }}
    />
  ); // ✓ Safe (sanitized)
}
```

---

## Hız Sınırlandırması

### Rate Limiting Implementasyonu

```typescript
// src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

/**
 * Rate limiter oluştur
 */
function createRateLimiter(maxRequests: number, windowMs: number) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    analytics: true,
  });
}

/**
 * Login rate limiter (5 requests / 15 minutes)
 */
export const authRateLimit = createRateLimiter(5, 15 * 60 * 1000);

/**
 * Genel API rate limiter (100 requests / 15 minutes)
 */
export const apiRateLimit = createRateLimiter(100, 15 * 60 * 1000);

/**
 * Dosya upload rate limiter (50 requests / 1 hour)
 */
export const uploadRateLimit = createRateLimiter(50, 60 * 60 * 1000);

/**
 * Rate limiter middleware
 */
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    remaining: result.remaining,
    resetTime: result.resetMs,
  };
}
```

### Rate Limit Header'ları

```typescript
// API route'ta
export async function GET(request: NextRequest) {
  const identifier = request.headers.get('x-forwarded-for') || 'anonymous';

  const { success, remaining, resetTime } = await applyRateLimit(
    apiRateLimit,
    identifier
  );

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      }),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil(resetTime / 1000).toString(),
        },
      }
    );
  }

  // Normal response
  return new Response(
    JSON.stringify({ /* data */ }),
    {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  );
}
```

### Account Lockout (Brute Force Koruması)

```typescript
// src/lib/auth/account-lockout.ts

const LOCKOUT_CONFIG = {
  maxAttempts: 5,           // 5 başarısız deneme
  lockoutDuration: 15 * 60, // 15 dakika
};

const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

/**
 * Başarısız giriş denemesini kayıt et
 */
export function recordLoginAttempt(email: string): void {
  const now = Date.now();
  const attempt = failedAttempts.get(email);

  if (attempt && now - attempt.lastAttempt < LOCKOUT_CONFIG.lockoutDuration * 1000) {
    attempt.count++;
    attempt.lastAttempt = now;
  } else {
    failedAttempts.set(email, { count: 1, lastAttempt: now });
  }
}

/**
 * Hesabın kilitli olup olmadığını kontrol et
 */
export function isAccountLocked(email: string): boolean {
  const attempt = failedAttempts.get(email);
  if (!attempt) return false;

  const now = Date.now();
  const timeSinceLastAttempt = now - attempt.lastAttempt;

  // Lockout süresi geçtiyse reset et
  if (timeSinceLastAttempt >= LOCKOUT_CONFIG.lockoutDuration * 1000) {
    failedAttempts.delete(email);
    return false;
  }

  return attempt.count >= LOCKOUT_CONFIG.maxAttempts;
}

/**
 * Kalan lockout süresini al (saniye cinsinden)
 */
export function getRemainingLockoutTime(email: string): number {
  const attempt = failedAttempts.get(email);
  if (!attempt) return 0;

  const elapsed = (Date.now() - attempt.lastAttempt) / 1000;
  return Math.max(0, LOCKOUT_CONFIG.lockoutDuration - Math.floor(elapsed));
}

/**
 * Başarılı girişte denemesi sıfırla
 */
export function clearLoginAttempts(email: string): void {
  failedAttempts.delete(email);
}
```

---

## Oturum Yönetimi

### Secure Session Storage

```typescript
// src/lib/auth/session.ts

import { createHmac } from 'node:crypto';

/**
 * Session'ı serialize ve sign et
 */
export const serializeSessionCookie = (session: AuthSession): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or too short');
  }

  // Payload'u base64url encode et
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');

  // HMAC imzası oluştur
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
};

/**
 * Session'ı parse ve doğrula
 */
export function parseAuthSession(cookieValue?: string): AuthSession | null {
  if (!cookieValue) return null;

  const [payload, signature] = cookieValue.split('.');
  if (!payload || !signature) return null;

  const secret = process.env.SESSION_SECRET;

  // Imzayı doğrula
  const expectedSig = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSig) {
    return null; // Tampered session
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as AuthSession;

    return session;
  } catch {
    return null;
  }
}
```

### Session Cookie Ayarları

```typescript
// API Route'ta session ayarla
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // ... Authentication logic ...

  const cookieStore = await cookies();

  cookieStore.set('auth-session', serializeSessionCookie(session), {
    // Security attributes
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,                                 // JavaScript erişim engelle
    sameSite: 'strict',                            // CSRF protection
    maxAge: 24 * 60 * 60,                          // 24 saat
    path: '/',                                      // Tüm path'lere erişilebilir
  });

  return Response.json({ success: true });
}
```

### Session Expiration

```typescript
/**
 * Session'ın expired olup olmadığını kontrol et
 */
export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session?.expire) {
    return false; // No expiration set
  }

  const expireDate = new Date(session.expire);
  if (Number.isNaN(expireDate.getTime())) {
    return false; // Invalid date
  }

  return expireDate.getTime() < Date.now();
}
```

---

## Giriş Doğrulaması

### Zod Schema Doğrulaması

```typescript
// src/lib/validations/beneficiary.ts

import { z } from 'zod';

/**
 * Yardımcı validasyonu schema'sı
 */
export const beneficiarySchema = z.object({
  name: z
    .string()
    .min(2, 'Ad soyad en az 2 karakter olmalıdır')
    .max(100, 'Ad soyad 100 karakterden fazla olamaz')
    .trim(),

  email: z
    .string()
    .email('Geçerli bir email adresi girin')
    .optional(),

  tcNo: z
    .string()
    .regex(/^\d{11}$/, 'TC Kimlik No 11 haneli olmalıdır'),

  phone: z
    .string()
    .regex(/^[0-9\s\-\+\(\)]{10,15}$/, 'Geçerli bir telefon numarası girin'),

  address: z
    .string()
    .min(10, 'Adres en az 10 karakter olmalıdır')
    .max(500, 'Adres 500 karakterden fazla olamaz'),

  status: z
    .enum(['AKTIF', 'PASIF', 'TASLAK'])
    .default('TASLAK'),
});

export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
```

### Server-side Doğrulama

```typescript
// API Route'ta
import { beneficiarySchema } from '@/lib/validations/beneficiary';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zod ile doğrula
    const validatedData = beneficiarySchema.parse(body);

    // Doğrulanan data kullan
    const beneficiary = await appwriteBeneficiaries.create(validatedData);

    return Response.json({ success: true, data: beneficiary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client-side Doğrulama

```typescript
// React Form Component
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { beneficiarySchema } from '@/lib/validations/beneficiary';

export function BeneficiaryForm() {
  const form = useForm({
    resolver: zodResolver(beneficiarySchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with automatic validation */}
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
    </form>
  );
}
```

---

## Güvenlik Header'ları

### Next.js'te Güvenlik Header'ları

```typescript
// next.config.ts

async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        // Clickjacking koruması
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },

        // MIME type sniffing koruması
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },

        // XSS koruması (legacy browsers)
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },

        // Referrer politikası
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },

        // Permissions policy
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },

        // HSTS (Production only)
        ...(process.env.NODE_ENV === 'production'
          ? [{
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            }]
          : []),
      ],
    },
  ];
}
```

### Header Açıklamaları

| Header | Değer | Anlamı |
|--------|-------|--------|
| X-Frame-Options | DENY | Clickjacking hücumlarından koru |
| X-Content-Type-Options | nosniff | MIME sniffing engelle |
| X-XSS-Protection | 1; mode=block | XSS filter'ını etkinleştir |
| Strict-Transport-Security | max-age=63072000 | HTTPS zorunlu kıl (2 yıl) |
| Content-Security-Policy | ... | Script/Resource yüklemeyi kontrol et |

---

## Güvenli Kodlama Uygulamaları

### 1. Sensitive Data Redaction

```typescript
// Logs'ta sensitive data'yı gösterme
logger.info('Login attempt', {
  email: email.substring(0, 3) + '***',  // Email'ı kısalt
  timestamp: new Date(),
});

// Errors'da sensitive bilgi açıkla
return Response.json(
  { error: 'Invalid email or password' }, // Genel hata mesajı
  { status: 401 }
);
```

### 2. Input Length Limits

```typescript
// File upload size check
const MAX_FILE_SIZE = 10485760; // 10MB
const MAX_FILES = 5;

export async function handleFileUpload(formData: FormData) {
  const files = formData.getAll('files') as File[];

  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} files allowed`);
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE}`);
    }
  }
}
```

### 3. Dependency Security

```bash
# npm audit ile güvenlik hatalarını kontrol et
npm audit

# Vulnerabilities'i düzelt
npm audit fix

# Strict audit (breaking changes kabul etmez)
npm audit --audit-level=moderate

# Regular updates
npm update
npm outdated
```

### 4. Secrets Management

```bash
# .env.local dosyasını ASLA commit etme
echo ".env.local" >> .gitignore

# Production secrets'ler environment provider'ında tutul
# Vercel: Vercel Dashboard
# Docker: Docker secrets veya env file (gitignore)
# AWS: Secrets Manager / Parameter Store

# Secret rotation schedule
# - API Keys: Her 90 gün
# - Database passwords: Her 6 ay
# - Certificates: Otomatik (Let's Encrypt)
```

---

## Güvenlik Kontrol Listesi

### Development

- [ ] Tüm user input'ları doğrula (Zod schemas)
- [ ] Sensitive data logla (redacted)
- [ ] SQL injection tehditlerinden koru (prepared statements)
- [ ] XSS tehditlerinden koru (DOMPurify, CSP)
- [ ] CSRF koruması etkin
- [ ] HTTPS/TLS enforced (production)
- [ ] Güvenlik headers'ları konfigüre et
- [ ] Rate limiting yapılandır
- [ ] Error handling uygun (sensitive data açılmasın)

### Code Review

- [ ] Hardcoded secrets yok
- [ ] Injection vulnerabilities yok
- [ ] Authentication/Authorization doğru
- [ ] Error handling comprehensive
- [ ] Logging sensitive data içermiyor
- [ ] Dependencies güvenli ve updated
- [ ] Test coverage yeterli (80%+)

### Pre-deployment

- [ ] Security scanning tools çalıştırıldı (npm audit)
- [ ] Dependency vulnerabilities çözüldü
- [ ] Secrets properly configured (env provider)
- [ ] SSL sertifikası valid
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Monitoring/alerting setup
- [ ] Disaster recovery plan exists

### Production

- [ ] HTTPS only
- [ ] Security headers enabled
- [ ] Rate limiting enforced
- [ ] Access logs enabled
- [ ] Error tracking enabled
- [ ] Backup automation enabled
- [ ] Security monitoring active
- [ ] Incident response plan ready

---

## Zafiyet Bildirimi

### Zafiyet Bulduysanız

Lütfen bilirsiniz sorununu **halka açık olarak bildirmeyin**. Bunun yerine:

1. **security@yourorganization.com** adresine gizli bir email gönder
2. Zafiyetin detaylı bir açıklamasını yaz
3. Etkilenen bileşenleri belirt
4. Çalışan bir PoC (Proof of Concept) sağla (opsiyonel)

### Response Timeline

- **24 saat**: İlk yanıt
- **7 gün**: Değerlendirme tamamlanması
- **30 gün**: Patch sürümü
- **60 gün**: Sonraki stabil sürümde

### Sorumlu Disclosure Policy

Responsibly reported zafiyetlerin ilgili taraflardan maksimal alış verilişten sonra **public disclosure** yapılabilir.

---

## Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Zod Documentation](https://zod.dev/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

*Son güncelleme: 2025-12-14*
