# API Client Migration Plan

## 📋 Durum

`src/lib/api/api-client.ts` dosyası deprecated olarak işaretlenmiş ancak **28 dosyada aktif kullanılıyor**.

## 🎯 Hedef

Tüm kullanımları `src/lib/api/crud-factory.ts`'ye migrate etmek.

## 📊 Kullanım Analizi

### Kullanım Sayısı: 28 dosya

#### Components (8 dosya):
1. `src/components/forms/MessageForm.tsx`
2. `src/components/forms/BeneficiaryFormWizard.tsx`
3. `src/components/forms/AdvancedBeneficiaryForm.tsx`
4. `src/components/forms/TaskForm.tsx`
5. `src/components/forms/MeetingForm.tsx`
6. `src/components/forms/BeneficiaryQuickAddModal.tsx`
7. `src/components/forms/BeneficiaryForm.tsx`
8. `src/components/forms/AidApplicationForm.tsx`

#### Pages (15 dosya):
1. `src/app/(dashboard)/bagis/raporlar/page.tsx`
2. `src/app/(dashboard)/yardim/ihtiyac-sahipleri/[id]/page.tsx`
3. `src/app/(dashboard)/yardim/basvurular/page.tsx`
4. `src/app/(dashboard)/yardim/basvurular/[id]/page.tsx`
5. `src/app/(dashboard)/partner/liste/page.tsx`
6. `src/app/(dashboard)/mesaj/kurum-ici/page.tsx`
7. `src/app/(dashboard)/kullanici/yeni/page.tsx`
8. `src/app/(dashboard)/kullanici/page.tsx`
9. `src/app/(dashboard)/kullanici/[id]/duzenle/page.tsx`
10. `src/app/(dashboard)/is/yonetim/page.tsx`
11. `src/app/(dashboard)/is/toplantilar/page.tsx`
12. `src/app/(dashboard)/is/gorevler/page.tsx`
13. `src/components/notifications/NotificationCenter.tsx`
14. `src/components/messages/RecipientSelector.tsx`
15. `src/components/beneficiary-analytics/AidHistoryChart.tsx`

#### Libraries (5 dosya):
1. `src/lib/backend/index.ts`
2. `src/lib/api/index.ts`
3. `src/lib/appwrite/index.ts`
4. `src/lib/appwrite/index.ts` (duplicate entry)

## 🔄 Migration Stratejisi

### Adım 1: Mevcut API Client Kullanımlarını Analiz Et

Her dosyada `apiClient` kullanımını kontrol et:
```typescript
// Eski kullanım
import { apiClient as api } from '@/lib/api/api-client';
const data = await api.beneficiaries.getAll();
```

### Adım 2: CRUD Factory Kullanımına Geç

```typescript
// Yeni kullanım
import { beneficiaries } from '@/lib/api/crud-factory';
const data = await beneficiaries.list();
```

### Adım 3: API Mapping

| Eski API Client | Yeni CRUD Factory |
|----------------|-------------------|
| `api.beneficiaries.getAll()` | `beneficiaries.list()` |
| `api.beneficiaries.get(id)` | `beneficiaries.get(id)` |
| `api.beneficiaries.create(data)` | `beneficiaries.create(data)` |
| `api.beneficiaries.update(id, data)` | `beneficiaries.update(id, data)` |
| `api.beneficiaries.delete(id)` | `beneficiaries.delete(id)` |

### Adım 4: Response Format Değişiklikleri

**Eski Format:**
```typescript
{
  data: T[],
  error: string | null,
  total?: number
}
```

**Yeni Format:**
```typescript
{
  data: T[],
  error: string | null,
  total?: number
}
```

Format aynı, sadece import değişecek.

## 📝 Migration Checklist

- [ ] Component dosyalarını migrate et (8 dosya)
- [ ] Page dosyalarını migrate et (15 dosya)
- [ ] Library dosyalarını migrate et (5 dosya)
- [ ] Test dosyalarını güncelle
- [ ] `api-client.ts` dosyasını kaldır
- [ ] Import'ları temizle

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Breaking Changes:** Bazı metod isimleri değişmiş olabilir
2. **Error Handling:** Error handling mekanizması aynı kalmalı
3. **Type Safety:** TypeScript tipleri korunmalı
4. **Testing:** Her migration sonrası test edilmeli

## 🚀 Migration Önceliği

1. **Yüksek Öncelik:** Component dosyaları (kullanıcı arayüzü)
2. **Orta Öncelik:** Page dosyaları
3. **Düşük Öncelik:** Library dosyaları (internal)

## 📚 Referanslar

- `src/lib/api/crud-factory.ts` - Yeni CRUD factory
- `src/lib/api/api-client.ts` - Eski API client (deprecated)
- `src/lib/api/types.ts` - Type definitions

---

**Not:** Bu migration planı referans amaçlıdır. Migration işlemi adım adım yapılmalı ve her adım test edilmelidir.

