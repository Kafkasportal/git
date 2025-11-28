# Kafkasportal - Acik Issue'lar

Bu dosya, projedeki TODO yorumlarindan cikarilan ve implement edilmesi gereken ozellikleri icerir.

---

## Issue #1: AI Agent API Endpoints

**Oncelik:** Dusuk
**Kategori:** AI Features
**Aciklama:** AI Agent chat icin backend API endpoint'leri olustur.

**Gereksinimler:**
- `/api/agent/threads` (GET, POST)
- `/api/agent/threads/[id]/messages` (GET, POST)
- `/api/agent/threads/[id]/archive` (POST)
- `/api/agent/usage` (GET)
- OpenAI/Anthropic API integration
- Appwrite'da `agent_threads` ve `agent_messages` collection'lari

**Ilgili Dosyalar:**
- `src/components/ai/AgentChat.tsx`

---

## Issue #2: Appwrite Realtime Migration

**Oncelik:** Yuksek
**Kategori:** Infrastructure
**Aciklama:** Appwrite Realtime migration tamamlandı.

**Gereksinimler:**
- `useRealtimeQuery` hook'unu Appwrite Realtime ile implement et
- `useRealtimeList` hook'unu implement et
- `usePresence` hook'unu implement et
- Appwrite client.subscribe() kullanarak realtime channels olustur
- Conflict resolution stratejisi belirle

**Migration Plani:**
1. Appwrite Realtime subscriptions using client.subscribe()
2. Replace useQuery with Appwrite realtime channels
3. Add presence tracking using Appwrite Realtime

**Ilgili Dosyalar:**
- `src/hooks/useRealtimeQuery.ts`
- `src/lib/appwrite/client.ts`
- `src/hooks/useAppwriteRealtime.ts`

---

## Issue #3: Financial Dashboard API Endpoints

**Oncelik:** Orta
**Kategori:** Finance
**Aciklama:** Financial dashboard icin optimize edilmis API endpoint'leri olustur.

**Gereksinimler:**
- `/api/finance/metrics` (GET) - Aggregated metrics
- `/api/finance/monthly` (GET) - Monthly breakdown
- Query optimization (buyuk veri setleri icin)
- Caching stratejisi

**Ilgili Dosyalar:**
- `src/app/(dashboard)/financial-dashboard/page.tsx`

---

## Issue #4: Financial Reports Export

**Oncelik:** Orta
**Kategori:** Finance
**Aciklama:** PDF ve Excel export ozelligi ekle.

**Gereksinimler:**
- jsPDF ve jspdf-autotable kullanarak PDF export
- xlsx library kullanarak Excel export
- Custom report templates
- Logo ve branding destegi

**Ilgili Dosyalar:**
- `src/app/(dashboard)/financial-dashboard/page.tsx`
- `src/lib/utils/pdf-export.ts` (olusturulacak)

---

## Issue #5: Transaction Edit Dialog

**Oncelik:** Dusuk
**Kategori:** Finance
**Aciklama:** Gelir-gider kayitlari icin edit dialog ekle.

**Gereksinimler:**
- TransactionEditDialog component olustur
- TransactionForm component'ini re-use et
- Edit API endpoint'i zaten mevcut

**Ilgili Dosyalar:**
- `src/app/(dashboard)/fon/gelir-gider/page.tsx`

---

## Issue #6: Meeting Delete Functionality

**Oncelik:** Dusuk
**Kategori:** Meetings
**Aciklama:** Toplanti silme ozelligi ekle.

**Gereksinimler:**
- Delete confirmation dialog
- API integration (endpoint zaten mevcut)
- Cascade delete (action items, decisions)

**Ilgili Dosyalar:**
- `src/app/(dashboard)/is/toplantilar/page.tsx`

---

## Tamamlanan Ozellikler

### Phone Number Validation Standardization

**Durum:** Tamamlandi ✅
**Aciklama:** Telefon numarasi validasyonu ve sanitizasyonu tum projede standardize edildi.

**Implementation Summary:**
- Standardized phone validation across all schemas using `shared-validators.ts`
- Updated `sanitizePhone()` to normalize all formats to `5XXXXXXXXX`
- Replaced inline regex validations in API routes with sanitization + schema validation
- Added comprehensive test suite for phone validation and sanitization (`phone-validation.test.ts`)
- Resolved TODO in `messages/[id]/route.ts` (phone field exists in database schema)
- Updated forms to use standard phone format (5XXXXXXXXX)

**Breaking Changes:** None (backward compatible via sanitization layer)

**Standard Format:** `5XXXXXXXXX` (10 digits, starts with 5)

**Ilgili Dosyalar:**
- `src/lib/validations/shared-validators.ts` - Standard phone schemas
- `src/lib/sanitization.ts` - Phone sanitization to 5XXXXXXXXX
- `src/lib/validations/kumbara.ts` - Uses shared schema
- `src/lib/validations/message.ts` - Uses shared schema
- `src/lib/validations/forms.ts` - Uses shared schema
- `src/lib/validations/beneficiary.ts` - Uses shared schema (duplicate removed)
- `src/app/api/donations/route.ts` - Sanitization + validation
- `src/app/api/donations/[id]/route.ts` - Sanitization + validation
- `src/app/api/messages/[id]/route.ts` - TODO resolved
- `src/components/forms/BeneficiaryForm.tsx` - Updated phone handling
- `src/__tests__/lib/validations/phone-validation.test.ts` - Test suite

---

### Theme Presets API

**Durum:** Tamamlandi ✅
**Aciklama:** Theme presets ve default theme icin API endpoint'leri olusturuldu.

**Tamamlanan Ozellikler:**
- `/api/settings/theme-presets` endpoint (GET, POST, PUT, DELETE)
- `/api/settings/theme-presets/default` endpoint (GET)
- Appwrite `theme_presets` collection kullanimi
- Validation schema ile veri dogrulama (`src/lib/validations/theme.ts`)
- Settings context entegrasyonu
- Theme data serialization/deserialization (JSON in `theme_config` field)
- Default theme management (only one default at a time)
- Permission-based access control (`settings:manage`)

**Ilgili Dosyalar:**
- `src/app/api/settings/theme-presets/route.ts`
- `src/app/api/settings/theme-presets/default/route.ts`
- `src/contexts/settings-context.tsx`
- `src/lib/validations/theme.ts`

---

### Custom Theme Colors API

**Durum:** Tamamlandi ✅
**Aciklama:** Kullanicilarin ozel renk paletlerini kaydetmesi saglandi.

**Tamamlanan Ozellikler:**
- Custom color save fonksiyonu implement edildi (`applyCustomColors`)
- User-specific theme presets destegi eklendi
- Custom theme silme ozelligi eklendi
- Theme name input ve validation
- CSRF token protection
- Query invalidation ve otomatik refetch
- Loading states ve error handling

**Ilgili Dosyalar:**
- `src/app/(dashboard)/ayarlar/tema/page.tsx`

---

### Offline Sync Implementation

**Durum:** Tamamlandi ✅
**Tamamlanma Tarihi:** 2024
**Aciklama:** Offline-first PWA mimarisi ile tam entegre offline sync implementasyonu.

**Tamamlanan Ozellikler:**
- Service Worker background sync ve periodic sync fallback
- IndexedDB offline mutation queue
- Last-write-wins conflict resolution
- Retry mechanism with exponential backoff (max 3 retries)
- Collection-specific API endpoint routing
- Manual sync UI (OfflineSyncPanel component)
- Offline settings page (`/ayarlar/offline`)
- Network status indicator with pending count
- Integration with `useAppwriteMutation` and `useFormMutation` hooks
- API middleware support for `X-Force-Overwrite` header
- Comprehensive unit and E2E tests

**Ilgili Dosyalar:**
- `public/sw.js` - Service Worker implementation
- `src/lib/offline-sync.ts` - Core offline sync logic
- `src/hooks/useOnlineStatus.ts` - Online/offline status hook
- `src/hooks/useAppwriteMutation.ts` - Mutation hook with offline support
- `src/hooks/useFormMutation.ts` - Form mutation hook with offline support
- `src/components/pwa/OfflineSyncPanel.tsx` - Manual sync UI
- `src/app/(dashboard)/ayarlar/offline/page.tsx` - Offline settings page
- `src/lib/api/middleware.ts` - API middleware with offline sync support

**Dokumantasyon:**
- [Offline Sync Guide](./offline-sync-guide.md) - Comprehensive offline sync documentation

**Notlar:**
- Basic offline sync infrastructure is now fully functional
- Advanced conflict resolution UI and offline analytics remain as potential future enhancements

---

## Notlar

### Oncelik Seviyeleri

- **Yuksek:** Production icin kritik, en kisa surede tamamlanmali
- **Orta:** Onemli ozellik, planlanan release'e dahil edilmeli
- **Dusuk:** Nice-to-have, zaman kalirsa tamamlanabilir

### Issue Olusturma

Bu dosyadaki issue'lar GitHub Issues'a tasinabilir:

```bash
# Ornek GitHub CLI komutu
gh issue create --title "Issue #1: Theme Presets API" --body "$(cat docs/ISSUES.md | sed -n '/## Issue #1/,/---/p')"
```

### Ilgili Dokumantasyon

- [Appwrite Guide](./appwrite-guide.md) - Appwrite kullanim rehberi
- [API Patterns](./api-patterns.md) - API route standartlari
- [Testing](./testing.md) - Test rehberi
