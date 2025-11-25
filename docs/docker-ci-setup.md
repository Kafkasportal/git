# Docker CI/CD Setup Guide

Bu rehber, GitHub Actions ile Docker image build ve push işlemlerini yapılandırmak için gereken adımları açıklar.

## Gereksinimler

- GitHub repository'si
- Docker Hub hesabı
- Docker Hub Personal Access Token (PAT)

## Docker Hub Credentials

### 1. Docker Hub Personal Access Token Oluşturma

1. [Docker Hub](https://hub.docker.com/) hesabınıza giriş yapın
2. **Account Settings** > **Security** bölümüne gidin
3. **New Access Token** butonuna tıklayın
4. Token için bir isim verin (örn: `github-actions`)
5. **Read & Write** izinlerini seçin
6. Token'ı kopyalayın ve güvenli bir yere kaydedin

**ÖNEMLİ**: Token'ı sadece bir kez görebilirsiniz. Kaybetmeniz durumunda yeni bir token oluşturmanız gerekir.

### 2. GitHub Repository Secrets ve Variables Ayarlama

GitHub repository'nizde secrets ve variables ayarlayın:

#### Adım 1: Repository'ye Git

1. GitHub repository'nize gidin
2. **Settings** sayfasına gidin

#### Adım 2: Secret Oluşturma (DOCKER_PAT)

1. **Security** > **Secrets and variables** > **Actions** bölümüne gidin
2. **New repository secret** butonuna tıklayın
3. Aşağıdaki bilgileri girin:
   - **Name**: `DOCKER_PAT`
   - **Secret**: Docker Hub Personal Access Token'ınız
     - Örnek format: `dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. **Add secret** butonuna tıklayın

#### Adım 3: Variable Oluşturma (DOCKER_USER)

1. **Secrets and variables** > **Actions** > **Variables** sekmesine gidin
2. **New repository variable** butonuna tıklayın
3. Aşağıdaki bilgileri girin:
   - **Name**: `DOCKER_USER`
   - **Value**: `kafkasder97`
4. **Add variable** butonuna tıklayın

## Workflow Yapılandırması

Workflow dosyası `.github/workflows/ci.yml` içinde yapılandırılmıştır ve Docker Build Cloud kullanır:

```yaml
name: ci

on:
  push:
    branches:
      - "main"

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ vars.DOCKER_USER }}
          password: ${{ secrets.DOCKER_PAT }}
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
          driver: cloud
          endpoint: "kafkasder97/asdasd"
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          tags: "${{ vars.DOCKER_USER }}/docker-build-cloud-demo:latest"
          # For pull requests, export results to the build cache.
          # Otherwise, push to a registry.
          outputs: ${{ github.event_name == 'pull_request' && 'type=cacheonly' || 'type=registry' }}
```

### Workflow Adımları

1. **Checkout**: Repository kodunu checkout eder
2. **Docker Hub Login**: Docker Hub'a `DOCKER_USER` ve `DOCKER_PAT` ile giriş yapar
3. **Docker Buildx Setup**: Cloud driver kullanarak Docker Buildx'i yapılandırır
4. **Build and Push**: Docker image'ı build eder ve Docker Hub'a push eder

## Image Tag Yapılandırması

Workflow, image'ı şu formatta tag'ler:
- `${{ vars.DOCKER_USER }}/docker-build-cloud-demo:latest`

Örnek: `kafkasder97/docker-build-cloud-demo:latest`

Tag'i değiştirmek için `.github/workflows/ci.yml` dosyasındaki `tags` satırını düzenleyin:

```yaml
tags: "${{ vars.DOCKER_USER }}/your-image-name:latest"
```

## Docker Buildx Cloud Driver

Workflow, Docker Buildx cloud driver kullanır:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
  with:
    driver: cloud
    endpoint: "kafkasder97/asdasd"
```

**Not**: `endpoint` değerini kendi Docker Buildx cloud endpoint'inizle değiştirmeniz gerekebilir.

## Workflow Çalıştırma

Workflow, `main` branch'e push yapıldığında otomatik olarak çalışır:

1. Kodu checkout eder
2. Docker Hub'a login olur
3. Docker image'ı build eder (cache kullanarak)
4. Docker Hub'a push eder

## Pull Request'lerde

Pull request'lerde workflow çalışır ancak image push edilmez. Bunun yerine build cache'e kaydedilir:

```yaml
push: ${{ github.event_name != 'pull_request' }}
```

## Yerel Test

Workflow'u test etmek için yerel olarak Docker build yapabilirsiniz:

```bash
# Docker login
docker login -u kafkasder97
# Password prompt'ta Personal Access Token'ı girin

# Image build
docker build -t kafkasder97/docker-build-cloud-demo:latest .

# Image'ı test et
docker run -p 3000:3000 kafkasder97/docker-build-cloud-demo:latest

# Image'ı push et (isteğe bağlı)
docker push kafkasder97/docker-build-cloud-demo:latest
```

## Güvenlik Notları

⚠️ **ÖNEMLİ**: 

- Docker Hub Personal Access Token'ı **asla** kod içinde hardcode etmeyin
- Token'ı **asla** Git repository'sine commit etmeyin
- Token'ı sadece GitHub Secrets'da saklayın
- Token'ı düzenli olarak rotate edin (yenileyin)
- Token'ı sadece gerekli izinlerle oluşturun (Read & Write)

## Sorun Giderme

### "Authentication failed" Hatası

- Docker Hub username ve PAT'in doğru olduğundan emin olun
- PAT'in süresinin dolmadığını kontrol edin
- GitHub Secrets'da `DOCKER_PAT` ve Variables'da `DOCKER_USER` tanımlı olduğundan emin olun

### "Build failed" Hatası

- Dockerfile'ın doğru yapılandırıldığından emin olun
- `.dockerignore` dosyasının gereksiz dosyaları hariç tuttuğundan emin olun
- Build loglarını kontrol edin

### "Push failed" Hatası

- Docker Hub'da repository'nin oluşturulduğundan emin olun
- PAT'in **Write** iznine sahip olduğundan emin olun
- Image tag'inin doğru format olduğundan emin olun

## İlgili Dosyalar

- `.github/workflows/ci.yml` - GitHub Actions workflow
- `Dockerfile` - Docker image build yapılandırması
- `.dockerignore` - Docker build'de hariç tutulacak dosyalar

