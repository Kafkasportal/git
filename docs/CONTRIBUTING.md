# Katkıda Bulunma Rehberi

Bu projeye katkıda bulunmak istediğiniz için teşekkürler! Bu dokümantasyon, katkı sürecini kolaylaştırmak için hazırlanmıştır.

## 🚀 Başlangıç

1. Projeyi fork edin
2. Repository'yi klonlayın:
   ```bash
   git clone https://github.com/your-username/git-2.git
   cd git-2
   ```
3. Branch oluşturun:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 📝 Geliştirme Süreci

### Gereksinimler

- Node.js >= 20.x
- npm >= 9.0.0

### Kurulum

```bash
npm install
cp .env.example .env.local
# .env.local dosyasını düzenleyin
```

### Development

```bash
npm run dev
```

### Test

```bash
# Tüm testleri çalıştır
npm run test

# Test coverage
npm run test:coverage

# Belirli bir test dosyası
npm run test src/__tests__/lib/utils.test.ts
```

### Code Quality

```bash
# Lint kontrolü
npm run lint

# Lint düzeltme
npm run lint:fix

# TypeScript kontrolü
npm run typecheck
```

## 📋 Pull Request Süreci

1. **Branch oluşturun**: `feature/feature-name` veya `fix/bug-name`
2. **Değişikliklerinizi yapın**
3. **Testleri çalıştırın**: `npm run test`
4. **Lint kontrolü**: `npm run lint`
5. **TypeScript kontrolü**: `npm run typecheck`
6. **Commit edin**: Anlamlı commit mesajları kullanın
7. **Push edin**: `git push origin feature/feature-name`
8. **Pull Request açın**

### Commit Mesajları

Semantic commit mesajları kullanın:

- `feat:` Yeni özellik
- `fix:` Bug düzeltmesi
- `docs:` Dokümantasyon değişikliği
- `style:` Kod formatı (formatting, missing semi colons, etc)
- `refactor:` Kod refactoring
- `test:` Test ekleme/düzeltme
- `chore:` Build process veya yardımcı araçlar

Örnek:
```
feat: add beneficiary search functionality
fix: resolve date filter timezone issue
docs: update API documentation
```

## 🧪 Test Yazma

### Test Dosyası Konumu

- Component testleri: `src/__tests__/components/`
- Hook testleri: `src/__tests__/hooks/`
- Utility testleri: `src/__tests__/lib/`
- API testleri: `src/__tests__/api/`

### Test Yazma Örnekleri

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 📐 Kod Standartları

### TypeScript

- Strict mode aktif
- `any` kullanımından kaçının
- Type tanımlarını `types/` klasöründe tutun

### React

- Functional components kullanın
- Hooks için custom hooks oluşturun
- Props için TypeScript interface kullanın

### Styling

- Tailwind CSS kullanın
- Utility-first yaklaşım
- Responsive design

### Naming Conventions

- Components: PascalCase (`MyComponent.tsx`)
- Hooks: camelCase with `use` prefix (`useMyHook.ts`)
- Utilities: camelCase (`myUtility.ts`)
- Types: PascalCase (`MyType.ts`)

## 🔍 Code Review Checklist

- [ ] Kod lint kurallarına uyuyor mu?
- [ ] TypeScript hataları var mı?
- [ ] Testler yazıldı mı ve geçiyor mu?
- [ ] Dokümantasyon güncellendi mi?
- [ ] Breaking changes varsa dokümante edildi mi?
- [ ] Performance etkisi değerlendirildi mi?

## 🐛 Bug Report

Bug bulduysanız:

1. Issue açın
2. Aşağıdaki bilgileri ekleyin:
   - Açıklama
   - Adımlar (reproduce)
   - Beklenen davranış
   - Gerçek davranış
   - Environment (OS, browser, Node version)
   - Screenshots (varsa)

## 💡 Feature Request

Yeni özellik önerisi için:

1. Issue açın
2. Özelliği detaylı açıklayın
3. Kullanım senaryosunu belirtin
4. Alternatif çözümleri değerlendirin

## 📚 Dokümantasyon

- README.md: Genel bilgiler
- CONTRIBUTING.md: Bu dosya
- Code comments: Kod içi açıklamalar

## ❓ Sorular

Sorularınız için:
- Issue açın
- Discussion başlatın

## 🙏 Teşekkürler

Katkılarınız için teşekkürler! 🎉

