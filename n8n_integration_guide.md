# N8N Bağış Yönetimi Sistemi Entegrasyon Kılavuzu

## Genel Bakış

Bu kılavuz, oluşturulan n8n workflow'larının mevcut sistemle nasıl entegre edileceğini açıklar.

## Sistem Entegrasyon Adımları

### 1. Appwrite Veritabanı Bağlantısı

```typescript
// src/lib/appwrite/n8n-integration.ts
import { Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

export const getN8nDatabaseClient = () => {
  return databases;
};
```

### 2. Webhook Entegrasyonu

```typescript
// src/app/api/n8n/webhook/route.ts
import { NextResponse } from 'next/server';
import { verifyCsrfToken } from '@/lib/api/auth-utils';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // CSRF doğrulama
    const csrfResult = await verifyCsrfToken(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: 'Geçersiz CSRF token' },
        { status: 403 }
      );
    }

    const data = await request.json();
    logger.info('N8N webhook verisi alındı', { data });

    // Veriyi işle ve yanıt döndür
    return NextResponse.json(
      { success: true, message: 'Webhook verisi başarıyla alındı' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('N8N webhook hatası', { error });
    return NextResponse.json(
      { error: 'Webhook işleme hatası' },
      { status: 500 }
    );
  }
}
```

### 3. E-posta Servisi Entegrasyonu

```typescript
// src/lib/services/n8n-email.ts
import { sendEmail } from '@/lib/email-service';

export const sendN8nEmail = async (to: string, subject: string, body: string) => {
  try {
    const result = await sendEmail({
      to,
      subject,
      text: body,
      from: 'n8n@kafkasder.com'
    });

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('N8N e-posta gönderim hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 4. SMS Servisi Entegrasyonu

```typescript
// src/lib/services/n8n-sms.ts
import { sendSMS } from '@/lib/sms-service';

export const sendN8nSMS = async (to: string, message: string) => {
  try {
    // Telefon numarasını formatla
    const formattedPhone = formatPhoneNumber(to);

    const result = await sendSMS({
      to: formattedPhone,
      message
    });

    return {
      success: true,
      smsId: result.smsId
    };
  } catch (error) {
    console.error('N8N SMS gönderim hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## API Bağlantı Noktaları

### 1. Bağış API'si

```typescript
// src/app/api/n8n/donations/route.ts
import { NextResponse } from 'next/server';
import { donations } from '@/lib/api/crud-factory';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Veri doğrulama
    const validation = validateDonationData(data);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Geçersiz bağış verisi', details: validation.errors },
        { status: 400 }
      );
    }

    // Yeni bağış kaydı oluştur
    const result = await donations.create(data);

    return NextResponse.json({
      success: true,
      donationId: result.data?.$id,
      data: result.data
    });
  } catch (error) {
    logger.error('N8N bağış API hatası', { error });
    return NextResponse.json(
      { error: 'Bağış işleme hatası' },
      { status: 500 }
    );
  }
}
```

### 2. Raporlama API'si

```typescript
// src/app/api/n8n/reports/route.ts
import { NextResponse } from 'next/server';
import { reports } from '@/lib/api/crud-factory';
import logger from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');

    // Rapor verilerini getir
    const reportData = await getReportData(type, date);

    // Yeni rapor kaydı oluştur
    const report = await reports.create({
      type: `n8n_${type}_report`,
      data: reportData,
      generated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      reportId: report.data?.$id,
      data: reportData
    });
  } catch (error) {
    logger.error('N8N raporlama API hatası', { error });
    return NextResponse.json(
      { error: 'Raporlama işleme hatası' },
      { status: 500 }
    );
  }
}
```

## Güvenlik Önlemleri

### 1. API Anahtarları Yönetimi

```typescript
// src/lib/api/n8n-auth.ts
import { verifyApiKey } from '@/lib/api/auth-utils';

export const verifyN8nApiKey = async (request: Request) => {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return { valid: false, error: 'API anahtarı eksik' };
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const result = await verifyApiKey(apiKey, 'n8n_integration');

  return {
    valid: result.valid,
    error: result.error,
    user: result.user
  };
};
```

### 2. Veri Doğrulama

```typescript
// src/lib/validations/n8n.ts
import { z } from 'zod';

export const n8nDonationSchema = z.object({
  amount: z.number().positive('Tutar pozitif olmalı'),
  currency: z.string().min(1, 'Para birimi gereklidir'),
  donor_id: z.string().min(1, 'Bağışçı ID gereklidir'),
  donor_name: z.string().min(1, 'Bağışçı adı gereklidir'),
  donor_email: z.string().email('Geçerli e-posta gereklidir'),
  payment_method: z.string().min(1, 'Ödeme yöntemi gereklidir'),
  receipt_number: z.string().optional()
});

export const validateN8nDonation = (data: unknown) => {
  try {
    const result = n8nDonationSchema.parse(data);
    return { valid: true, data: result };
  } catch (error) {
    return {
      valid: false,
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    };
  }
};
```

## Test ve Doğrulama

### 1. Entegrasyon Testleri

```typescript
// src/__tests__/api/n8n-integration.test.ts
import { test, expect, describe } from 'vitest';
import { POST as donationWebhook } from '@/app/api/n8n/donations/route';
import { POST as webhookHandler } from '@/app/api/n8n/webhook/route';

describe('N8N Entegrasyon Testleri', () => {
  test('Bağış webhook'u başarıyla çalışmalı', async () => {
    const mockRequest = new Request('http://localhost/api/n8n/donations', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        currency: 'TL',
        donor_id: 'donor_123',
        donor_name: 'Test Donor',
        donor_email: 'test@example.com',
        payment_method: 'credit_card'
      })
    });

    const response = await donationWebhook(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.donationId).toBeDefined();
  });

  test('Webhook doğrulama başarıyla çalışmalı', async () => {
    const mockRequest = new Request('http://localhost/api/n8n/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'donation.created',
        data: {
          donation_id: 'donation_123',
          amount: 100
        }
      })
    });

    const response = await webhookHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

## Dağıtım ve Konfigürasyon

### 1. Ortam Değişkenleri

```env
# .env
N8N_WEBHOOK_SECRET=your_secure_secret_here
N8N_API_KEY=your_n8n_api_key
N8N_WEBHOOK_URL=https://your-domain.com/api/n8n/webhook
```

### 2. N8N Konfigürasyonu

```json
{
  "workflows": {
    "donation_workflow": {
      "active": true,
      "webhookUrl": "https://your-domain.com/api/n8n/webhook",
      "webhookMethod": "POST"
    },
    "reporting_workflow": {
      "active": true,
      "cronExpression": "0 9 * * *"
    }
  }
}
```

## Sorun Giderme

### 1. Yaygın Sorunlar ve Çözümleri

```markdown
### Webhook Bağlantı Sorunları
- **Sorun**: Webhook çağrısı başarısız
- **Çözüm**: CSRF token'ını doğrulayın ve ağ bağlantısını kontrol edin

### Veri Doğrulama Hataları
- **Sorun**: Geçersiz veri formatı
- **Çözüm**: Gelen veriyi n8nDonationSchema ile doğrulayın

### API Yetkilendirme Hataları
- **Sorun**: API anahtarı reddedildi
- **Çözüm**: API anahtarını yenileyin ve yetkilendirme başlıklarını kontrol edin
```

## Performans Optimizasyonu

### 1. Önbellekleme Stratejileri

```typescript
// src/lib/api/n8n-cache.ts
import { getCache } from '@/lib/api-cache';

export const getCachedDonationData = async (donationId: string) => {
  const cacheKey = `n8n_donation_${donationId}`;
  const cache = getCache();

  // Önbellekten veriyi getir
  const cachedData = await cache.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // Veritabanından veriyi getir
  const freshData = await getDonationFromDatabase(donationId);

  // Önbelleğe kaydet (1 saat)
  await cache.set(cacheKey, JSON.stringify(freshData), 3600);

  return freshData;
};
```

Bu entegrasyon kılavuzu, n8n workflow'larının mevcut sistemle sorunsuz bir şekilde entegre edilmesini sağlar ve otomatik bağış yönetimi sisteminin etkin bir şekilde çalışmasını mümkün kılar.