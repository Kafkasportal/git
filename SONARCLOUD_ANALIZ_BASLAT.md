# SonarCloud Analiz Başlatma Rehberi

## Durum
SonarCloud'da otomatik analiz açıkken manuel analiz çalıştırılamıyor. Analizi başlatmak için önce otomatik analizi kapatmanız gerekiyor.

## Otomatik Analizi Kapatma (Gerekli)

1. **SonarCloud'a gidin**: https://sonarcloud.io
2. **Projenizi seçin**: `Kafkasportal_git`
3. **Administration** sekmesine gidin
4. **Analysis Method** bölümüne gidin
5. **"Enabled for this project"** seçeneğini **kapatın** (uncheck)
6. **Kaydedin**

## Analizi Başlatma

Otomatik analizi kapattıktan sonra, aşağıdaki komutu çalıştırın:

```bash
export SONAR_TOKEN=7205df72974ead23c7e3402daa2080630e8d5b72
npx --yes sonarqube-scanner -Dsonar.host.url=https://sonarcloud.io
```

Veya hazır script'i kullanın:

```bash
export SONAR_TOKEN=7205df72974ead23c7e3402daa2080630e8d5b72
./run-sonar-analysis.sh
```

## Alternatif: GitHub Actions ile Analiz

GitHub Actions workflow'una manuel tetikleme eklendi. GitHub web arayüzünden:
1. **Actions** sekmesine gidin
2. **CI/CD Pipeline** workflow'unu seçin
3. **Run workflow** butonuna tıklayın
4. Branch seçin ve **Run workflow** butonuna tıklayın

## Proje Bilgileri

- **Proje Key**: `Kafkasportal_git`
- **Organizasyon**: `kafkasportal`
- **Token**: MCP yapılandırmasından alındı
- **SonarCloud URL**: https://sonarcloud.io

## Notlar

- Coverage raporu oluşturuldu: `coverage/lcov.info`
- `sonar-project.properties` dosyası güncellendi
- GitHub Actions workflow'una `workflow_dispatch` eklendi
