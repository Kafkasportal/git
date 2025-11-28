# Performans Optimizasyonu

## Mevcut Optimizasyonlar

### Bundle Optimizasyonu
- ✅ Package import optimization (tree-shaking)
- ✅ Code splitting (webpack splitChunks)
- ✅ Dynamic imports (lazy loading)
- ✅ Image optimization (AVIF, WebP)
- ✅ Font optimization

### Caching
- ✅ API response caching (TTL-based)
- ✅ Static asset caching (1 year)
- ✅ Image caching (1 year)
- ✅ Browser caching headers

### Query Optimizasyonu
- ✅ Pagination support
- ✅ Search filtering
- ✅ Normalized query params

## Önerilen İyileştirmeler

### 1. Appwrite Index Kullanımı
Appwrite dashboard'da aşağıdaki index'leri oluşturun:

```javascript
// Beneficiaries collection
- Index: tc_no (unique)
- Index: status
- Index: city
- Index: created_at (descending)

// Donations collection
- Index: donor_email
- Index: status
- Index: created_at (descending)

// Tasks collection
- Index: assigned_to
- Index: status
- Index: priority
- Index: created_at (descending)
```

### 2. Dynamic Imports
Ağır component'ler için dynamic import kullanın:

```typescript
// Örnek: Heavy chart component
const ChartComponent = dynamic(() => import('@/components/charts/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### 3. Response Caching
API route'larda response caching kullanın:

```typescript
export const revalidate = 60; // 60 seconds
```

### 4. Database Query Optimization
- Limit default page size (20-50 items)
- Use select() to fetch only needed fields
- Implement cursor-based pagination for large datasets

## Monitoring

### Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)

### Tools
- Next.js Analytics
- Web Vitals
- Lighthouse CI

