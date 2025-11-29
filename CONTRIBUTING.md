# Katkıda Bulunma Rehberi

Dernek Yönetim Sistemi'ne katkıda bulunmak istediğiniz için teşekkür ederiz! Bu döküman, projeye nasıl katkıda bulunabileceğinizi açıklar.

## 📋 İçindekiler

- [Davranış Kuralları](#davranış-kuralları)
- [Nasıl Katkıda Bulunabilirim?](#nasıl-katkıda-bulunabilirim)
- [Geliştirme Ortamı](#geliştirme-ortamı)
- [Kod Standartları](#kod-standartları)
- [Pull Request Süreci](#pull-request-süreci)
- [Issue Raporlama](#issue-raporlama)

## 📜 Davranış Kuralları

Bu projeye katkıda bulunan herkes [Davranış Kuralları](./CODE_OF_CONDUCT.md) belgesine uymakla yükümlüdür.

## 🤝 Nasıl Katkıda Bulunabilirim?

### Hata Bildirimi

1. [Issue'lar](https://github.com/Kafkasportal/git/issues) sayfasından mevcut hataları kontrol edin
2. Hatanız daha önce bildirilmediyse yeni bir issue açın
3. Hata şablonunu kullanarak detaylı bilgi verin

### Özellik Önerisi

1. Önerinizin daha önce önerilip önerilmediğini kontrol edin
2. Yeni bir feature request issue'su açın
3. Önerinizi detaylı bir şekilde açıklayın

### Kod Katkısı

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 🛠️ Geliştirme Ortamı

### Gereksinimler

- Node.js 20.x
- npm 9.x veya üzeri
- Git

### Kurulum

```bash
# Fork'u klonlayın
git clone https://github.com/YOUR_USERNAME/git.git
cd git

# Upstream remote ekleyin
git remote add upstream https://github.com/Kafkasportal/git.git

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenlerini ayarlayın
cp .env.example .env.local

# Geliştirme sunucusunu başlatın
npm run dev
```

## 📐 Kod Standartları

### Genel Kurallar

- **TypeScript** kullanın, JavaScript değil
- **ESLint** kurallarına uyun
- **Prettier** ile kod formatlayın
- Anlamlı commit mesajları yazın

### Commit Mesajları

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanın:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Türler:**
- `feat`: Yeni özellik
- `fix`: Hata düzeltmesi
- `docs`: Dokümantasyon değişikliği
- `style`: Kod formatı değişikliği
- `refactor`: Kod yeniden düzenlemesi
- `test`: Test ekleme/düzeltme
- `chore`: Bakım işleri

**Örnekler:**
```
feat(donations): add recurring donation support
fix(auth): resolve session timeout issue
docs: update API reference
```

### Kod Stili

```typescript
// ✅ Doğru
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Yanlış
export function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}
```

### Test Yazımı

- Her yeni özellik için test yazın
- Test dosyalarını `__tests__` klasörüne koyun
- `*.test.ts` veya `*.test.tsx` uzantısı kullanın

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotal } from './utils';

describe('calculateTotal', () => {
  it('should return sum of item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

## 🔄 Pull Request Süreci

### PR Açmadan Önce

1. `npm run lint` ile linting hatalarını kontrol edin
2. `npm run typecheck` ile TypeScript hatalarını kontrol edin
3. `npm run test` ile testlerin geçtiğinden emin olun
4. Değişikliklerinizi dokümante edin

### PR Şablonu

PR açarken şablonu doldurun:
- Değişikliklerin açıklaması
- İlgili issue numarası
- Test edilip edilmediği
- Breaking change olup olmadığı

### Review Süreci

1. En az bir reviewer onayı gereklidir
2. CI testlerinin geçmesi gerekir
3. Merge conflict'ler çözülmelidir

## 🐛 Issue Raporlama

### Hata Raporu İçin

- Hatanın detaylı açıklaması
- Tekrar etme adımları
- Beklenen davranış
- Gerçekleşen davranış
- Ekran görüntüleri (varsa)
- Ortam bilgileri (tarayıcı, OS, Node versiyonu)

### Özellik İsteği İçin

- Özelliğin detaylı açıklaması
- Kullanım senaryoları
- Alternatif çözümler (düşündüyseniz)
- Ek bağlam

## 🙏 Teşekkürler

Katkıda bulunan herkese teşekkür ederiz! 🎉
