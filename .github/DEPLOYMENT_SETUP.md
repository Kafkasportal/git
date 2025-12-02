# GitHub Actions - Appwrite Deployment Setup

Bu dokümantasyon, GitHub Actions ile Appwrite Sites'a otomatik deployment kurulumunu açıklar.

## 📋 Gereksinimler

1. Appwrite Cloud hesabı
2. Appwrite projesi ve Site oluşturulmuş olmalı
3. GitHub repository'de Secrets yapılandırılmış olmalı

## 🔐 GitHub Secrets Ayarlama

GitHub repository'nizde aşağıdaki secrets'ları ekleyin:

### Settings > Secrets and variables > Actions > New repository secret

1. **APPWRITE_ENDPOINT**
   - Değer: `https://cloud.appwrite.io/v1` (veya self-hosted endpoint)
   - Örnek: `https://cloud.appwrite.io/v1`

2. **APPWRITE_PROJECT_ID**
   - Değer: Appwrite Console > Settings > Project ID
   - Örnek: `65a1b2c3d4e5f6g7h8i9j0`

3. **APPWRITE_API_KEY**
   - Değer: Appwrite Console > Settings > API Keys > Create API Key
   - **Önemli:** Server-side API key kullanın (scopes: sites.read, sites.write)
   - Örnek: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

4. **APPWRITE_DATABASE_ID**
   - Değer: Appwrite Console > Databases > Database ID
   - Örnek: `65a1b2c3d4e5f6g7h8i9j0`

5. **APPWRITE_SITE_ID**
   - Değer: Appwrite Console > Hosting > Sites > Site ID
   - Örnek: `65a1b2c3d4e5f6g7h8i9j0`

## 🚀 Deployment Workflow'ları

### Manuel Deployment (`deploy-appwrite-manual.yml`)

**Tetiklenme:**
- Sadece manuel olarak tetiklenir
- Environment seçimi (production/staging)
- Test atlama seçeneği

**Kullanım:**
1. GitHub Actions sekmesine git
2. "Deploy to Appwrite (Manual)" workflow'unu seç
3. "Run workflow" butonuna tıkla
4. Environment seç (production/staging)
5. Test atlamak istiyorsan "Skip tests" seçeneğini işaretle

## 📝 Adım Adım Kurulum

### 1. Appwrite Site Oluşturma

```bash
# Appwrite CLI ile
appwrite init project
appwrite deploy site
```

Veya Appwrite Console'dan:
1. Hosting > Sites > Add Site
2. Site adı girin
3. Site ID'yi kopyalayın (GitHub Secrets'a ekleyin)

### 2. GitHub Secrets Ekleme

1. Repository > Settings > Secrets and variables > Actions
2. "New repository secret" butonuna tıklayın
3. Yukarıdaki tüm secrets'ları ekleyin

### 3. Workflow Test Etme

Manuel deployment workflow'unu test etmek için:
1. GitHub Actions sekmesine gidin
2. "Deploy to Appwrite (Manual)" workflow'unu seçin
3. "Run workflow" butonuna tıklayın
4. İstediğiniz environment'ı seçin (production/staging)
5. Gerekirse "Skip tests" seçeneğini işaretleyin

## 🔧 Workflow Yapılandırması

### Build Ayarları

Workflow içinde build komutu:
```yaml
- name: Build application
  run: npm run build:fast
  env:
    SKIP_ENV_VALIDATION: 'true'
```

**Not:** Production'da `SKIP_ENV_VALIDATION` kullanmayın, gerçek environment variables kullanın.

### Deployment Ayarları

```yaml
- name: Setup Appwrite CLI
  uses: appwrite/setup-for-appwrite@v1

- name: Login to Appwrite
  run: |
    appwrite client \
      --endpoint ${{ secrets.APPWRITE_ENDPOINT }} \
      --project ${{ secrets.APPWRITE_PROJECT_ID }} \
      --key ${{ secrets.APPWRITE_API_KEY }}

- name: Deploy to Appwrite Sites
  run: |
    appwrite deploy site \
      --siteId ${{ secrets.APPWRITE_SITE_ID }} \
      --entrypoint .next
```

**Alternatif Yöntem (Local Test):**
```bash
# Local'de test için
npm install -g appwrite-cli
appwrite client --endpoint https://cloud.appwrite.io/v1 --project YOUR_PROJECT_ID --key YOUR_API_KEY
appwrite deploy site --siteId YOUR_SITE_ID --entrypoint .next
```

## 🐛 Troubleshooting

### Build Hatası

**Sorun:** Build başarısız oluyor
**Çözüm:**
- Environment variables kontrol edin
- `SKIP_ENV_VALIDATION` kullanıyorsanız, gerçek değerlerle değiştirin

### Deployment Hatası

**Sorun:** Appwrite CLI hatası
**Çözüm:**
- API Key'in doğru scope'lara sahip olduğundan emin olun
- Site ID'nin doğru olduğunu kontrol edin
- Appwrite endpoint'in erişilebilir olduğunu kontrol edin

### Secret Bulunamadı

**Sorun:** Secret not found hatası
**Çözüm:**
- GitHub Secrets'ların doğru isimlerle eklendiğini kontrol edin
- Secret isimlerinin büyük/küçük harf duyarlı olduğunu unutmayın

## 📊 Deployment Durumu

Deployment durumunu kontrol etmek için:
1. GitHub Actions sekmesine gidin
2. Son workflow run'ı kontrol edin
3. Her adımın loglarını inceleyin

## 🔒 Güvenlik Notları

1. **API Key Güvenliği:**
   - API Key'i asla commit etmeyin
   - Sadece GitHub Secrets kullanın
   - Production ve staging için farklı API key'ler kullanın

2. **Environment Variables:**
   - Production'da gerçek environment variables kullanın
   - Development secrets'ları production'da kullanmayın

3. **Site ID:**
   - Site ID'yi public repository'lerde expose etmeyin
   - Her environment için farklı Site ID kullanın

## 📚 Ek Kaynaklar

- [Appwrite CLI Documentation](https://appwrite.io/docs/command-line)
- [Appwrite Sites Documentation](https://appwrite.io/docs/products/hosting)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🆘 Destek

Sorunlar için:
- GitHub Issues açın
- Appwrite Discord topluluğuna katılın
- Appwrite dokümantasyonunu kontrol edin

