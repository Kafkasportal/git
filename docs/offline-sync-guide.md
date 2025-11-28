# Offline Sync Rehberi

Bu dokuman, Kafkasportal projesindeki offline-first mimarisi ve çevrimdışı senkronizasyon özelliklerini açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari](#mimari)
3. [Kullanım](#kullanım)
4. [Yapılandırma](#yapılandırma)
5. [API Entegrasyonu](#api-entegrasyonu)
6. [İzleme ve Yönetim](#izleme-ve-yönetim)
7. [Test Etme](#test-etme)
8. [Sorun Giderme](#sorun-giderme)
9. [Tarayıcı Desteği](#tarayıcı-desteği)

---

## Genel Bakış

Kafkasportal, offline-first bir Progressive Web App (PWA) mimarisi kullanır. Bu mimari sayesinde:

- **Offline Mutation Queue**: İnternet bağlantısı olmadığında yapılan değişiklikler IndexedDB'de kuyruğa eklenir
- **Background Sync**: Bağlantı kurulduğunda işlemler otomatik olarak arka planda senkronize edilir
- **Manuel Senkronizasyon**: Kullanıcılar offline ayarlar sayfasından manuel olarak senkronizasyon başlatabilir
- **Retry Logic**: Başarısız senkronizasyonlar exponential backoff ile yeniden denenir
- **Conflict Resolution**: Çakışmalar last-write-wins stratejisi ile çözülür

### Temel Bileşenler

- **IndexedDB**: Offline mutation queue için kalıcı depolama
- **Service Worker**: Background sync ve cache yönetimi
- **React Hooks**: `useAppwriteMutation` ve `useFormMutation` offline desteği ile
- **API Middleware**: `X-Force-Overwrite` header desteği ile conflict resolution

---

## Mimari

### Akış Diyagramı

```
Kullanıcı → Form Submit
    ↓
useAppwriteMutation / useFormMutation
    ↓
useOnlineStatus kontrolü
    ↓
┌─────────────────┬─────────────────┐
│   Online        │   Offline       │
│   ↓             │   ↓             │
│ API Route       │ IndexedDB Queue │
│   ↓             │   ↓             │
│ Success Toast   │ Queued Toast    │
└─────────────────┴─────────────────┘
                    ↓
            Network Online Event
                    ↓
            Service Worker
                    ↓
            syncPendingMutations()
                    ↓
            API Routes (with retry)
                    ↓
            Success / Failed
```

### Bileşenler

1. **useOnlineStatus Hook**: Online/offline durumunu yönetir
2. **offline-sync.ts**: IndexedDB queue ve sync logic
3. **Service Worker (sw.js)**: Background sync tetikleyicisi
4. **API Middleware**: Conflict resolution desteği
5. **OfflineSyncPanel**: Manuel sync UI bileşeni

---

## Kullanım

### Mutation Hook'ları ile Offline Desteği

#### useAppwriteMutation

```typescript
import { useAppwriteMutation } from '@/hooks/useAppwriteMutation';

function MyComponent() {
  const mutation = useAppwriteMutation({
    mutationFn: async (data) => {
      return fetch('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(res => res.json());
    },
    queryKey: ['beneficiaries'],
    collection: 'beneficiaries', // Offline sync için gerekli
    enableOfflineQueue: true, // Varsayılan: true
    successMessage: 'Başarıyla oluşturuldu',
  });

  const handleSubmit = () => {
    mutation.mutate({ name: 'Test', tc_no: '12345678901' });
  };

  return <button onClick={handleSubmit}>Kaydet</button>;
}
```

#### useFormMutation

```typescript
import { useFormMutation } from '@/hooks/useFormMutation';

function BeneficiaryForm() {
  const mutation = useFormMutation({
    queryKey: ['beneficiaries'],
    collection: 'beneficiaries', // Zorunlu
    mutationType: 'create', // 'create' | 'update' | 'delete'
    mutationFn: async (data) => {
      return fetch('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(res => res.json());
    },
    successMessage: 'Başarıyla kaydedildi',
    errorMessage: 'Kayıt başarısız',
    enableOfflineQueue: true, // Varsayılan: true
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate(formData);
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### Offline Durumunu Kontrol Etme

```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function MyComponent() {
  const { isOnline, isOffline } = useOnlineStatus();

  if (isOffline) {
    return <div>Offline modunda çalışıyorsunuz</div>;
  }

  return <div>Online</div>;
}
```

### Manuel Senkronizasyon

```typescript
import { useOfflineSync } from '@/lib/offline-sync';

function SyncButton() {
  const { sync, getStats } = useOfflineSync();
  const { isOnline } = useOnlineStatus();

  const handleSync = async () => {
    if (!isOnline) {
      alert('İnternet bağlantısı yok');
      return;
    }

    const result = await sync();
    console.log(`Synced: ${result.success}, Failed: ${result.failed}`);
  };

  return <button onClick={handleSync}>Senkronize Et</button>;
}
```

---

## Yapılandırma

### enableOfflineQueue Seçeneği

Mutation hook'larında offline queue'yu devre dışı bırakabilirsiniz:

```typescript
const mutation = useAppwriteMutation({
  // ...
  enableOfflineQueue: false, // Offline queue devre dışı
});
```

### Collection Mapping

API endpoint'leri otomatik olarak collection isimlerinden türetilir. Özel mapping için `src/lib/offline-sync.ts` dosyasındaki `COLLECTION_ENDPOINT_MAP` objesini güncelleyin:

```typescript
const COLLECTION_ENDPOINT_MAP: Record<string, string> = {
  beneficiaries: '/api/beneficiaries',
  donations: '/api/donations',
  // Yeni collection ekleyin
  customCollection: '/api/custom-endpoint',
};
```

### Retry Limitleri

Varsayılan retry limiti 3'tür. Exponential backoff formülü: `2^retryCount * 1000ms`

- 1. deneme: 2 saniye bekleme
- 2. deneme: 4 saniye bekleme
- 3. deneme: 8 saniye bekleme
- 4. deneme: Başarısız olarak işaretlenir

---

## API Entegrasyonu

### X-Force-Overwrite Header

Conflict resolution için API route'larınızda `X-Force-Overwrite` header'ını kontrol edin:

```typescript
// src/app/api/beneficiaries/route.ts
export async function PUT(request: NextRequest) {
  const forceOverwrite = request.headers.get('X-Force-Overwrite') === 'true';

  if (forceOverwrite) {
    // Last-write-wins stratejisi: Yeni veriyi kaydet
    await updateBeneficiary(id, data);
  } else {
    // Normal update logic
    const existing = await getBeneficiary(id);
    if (existing.updatedAt > data.updatedAt) {
      return new Response('Conflict', { status: 409 });
    }
    await updateBeneficiary(id, data);
  }
}
```

### buildApiRoute ile Offline Sync Desteği

```typescript
import { buildApiRoute } from '@/lib/api/middleware';

export const POST = buildApiRoute({
  requireModule: 'beneficiaries',
  allowedMethods: ['POST'],
  supportOfflineSync: true, // Offline sync middleware'i ekle
})(async (request) => {
  // Handler logic
});
```

---

## İzleme ve Yönetim

### Offline Ayarlar Sayfası

`/ayarlar/offline` sayfasından:

- Bekleyen işlemleri görüntüleme
- Başarısız işlemleri görüntüleme
- Manuel senkronizasyon başlatma
- Başarısız işlemleri yeniden deneme
- Tüm offline işlemleri temizleme

### Offline İstatistikleri

```typescript
import { getOfflineStats } from '@/lib/offline-sync';

const stats = await getOfflineStats();
console.log({
  pendingCount: stats.pendingCount, // Bekleyen işlem sayısı
  failedCount: stats.failedCount, // Başarısız işlem sayısı
  oldestMutation: stats.oldestMutation, // En eski mutation tarihi
  totalSize: stats.totalSize, // Toplam queue boyutu (bytes)
});
```

### Network Status Indicator

Ağ durumu göstergesi otomatik olarak bekleyen işlem sayısını gösterir:

- Online: "Bağlantı yeniden kuruldu"
- Offline: "İnternet bağlantısı yok (X işlem bekliyor)"

---

## Test Etme

### Unit Testler

```bash
# Offline sync testleri
npm test src/__tests__/lib/offline-sync.test.ts

# useOnlineStatus testleri
npm test src/__tests__/hooks/useOnlineStatus.test.ts
```

### E2E Testler

```bash
# Playwright ile offline sync testleri
npm run test:e2e e2e/offline-sync.spec.ts
```

### Manuel Test Senaryoları

1. **Offline Create Test**:
   - Tarayıcı DevTools → Network → Offline modunu açın
   - Yeni bir kayıt oluşturun
   - "offline kuyruğuna eklendi" mesajını doğrulayın
   - Network'ü tekrar açın
   - Otomatik sync'i doğrulayın

2. **Conflict Resolution Test**:
   - Aynı kaydı hem online hem offline'da düzenleyin
   - Offline değişikliği sync edin
   - Last-write-wins stratejisini doğrulayın

3. **Retry Logic Test**:
   - API'yi geçici olarak 500 hatası döndürecek şekilde mock edin
   - Offline mutation oluşturun ve sync edin
   - Retry count'un arttığını doğrulayın

---

## Sorun Giderme

### Background Sync Desteklenmiyor

Bazı tarayıcılar background sync API'sini desteklemez. Bu durumda:

- Service Worker otomatik olarak periodic sync fallback'i kullanır (5 dakikada bir)
- Manuel sync butonu her zaman kullanılabilir

### Mutations Stuck (Takılı Kalan İşlemler)

1. Offline ayarlar sayfasına gidin (`/ayarlar/offline`)
2. Başarısız işlemleri kontrol edin
3. "Başarısızları Yeniden Dene" butonunu kullanın
4. Hala başarısız olursa, işlemi manuel olarak kontrol edin

### Çakışmalar (Conflicts)

409 Conflict hatası alıyorsanız:

- `X-Force-Overwrite` header'ı otomatik olarak gönderilir
- Last-write-wins stratejisi uygulanır
- Eğer hala sorun varsa, API route'unuzun header'ı doğru işlediğinden emin olun

### IndexedDB Erişim Hatası

- Tarayıcının IndexedDB desteğini kontrol edin
- Private/Incognito modda IndexedDB kısıtlamaları olabilir
- Tarayıcı depolama izinlerini kontrol edin

---

## Tarayıcı Desteği

### Tam Destek

- Chrome/Edge 80+
- Firefox 78+
- Safari 16.4+ (iOS 16.4+)

### Kısmi Destek (Fallback ile)

- Safari 15+ (Periodic sync fallback)
- Opera 67+

### Desteklenmeyen

- Internet Explorer
- Eski mobil tarayıcılar

### Fallback Mekanizmaları

1. **Background Sync API yoksa**: Periodic sync (5 dakikada bir)
2. **IndexedDB yoksa**: Offline queue devre dışı, normal online-only davranış
3. **Service Worker yoksa**: Offline queue çalışır ama otomatik sync yok

---

## Best Practices

1. **Collection İsimlerini Doğru Kullanın**: Mutation hook'larında `collection` parametresini her zaman belirtin
2. **Mutation Type'ı Belirtin**: `useFormMutation` için `mutationType` parametresini kullanın
3. **Error Handling**: Offline queue hatalarını kullanıcıya bildirin
4. **Retry Limits**: Çok fazla retry yapmayın, kullanıcıya manuel müdahale fırsatı verin
5. **Conflict Resolution**: Last-write-wins stratejisinin uygun olduğundan emin olun

---

## Kaynaklar

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

---

## Sorular ve Destek

Sorularınız için:
- GitHub Issues: [Proje Issues](https://github.com/your-repo/issues)
- Dokümantasyon: `docs/ISSUES.md`
- Offline Sync Guide: Bu dokuman

