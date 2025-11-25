# Docker MCP Setup Guide

Bu rehber, Docker MCP Toolkit'i Claude Code ve Cursor IDE ile yapılandırmak için gereken adımları açıklar.

## Önemli Not

⚠️ **Docker MCP Toolkit, Docker Desktop gerektirir** (sürüm 4.40+). Docker Engine (Linux'ta yaygın olan) ile çalışmaz.

## Gereksinimler

- **Docker Desktop**: Sürüm 4.40 veya üzeri
- **Claude Code**: Sürüm 2.0.5 veya üzeri (Claude Code için)
- **Cursor IDE**: Herhangi bir sürüm (Cursor IDE için)

## Claude Code Kurulumu

### 1. Claude Code'u Yükleyin

```bash
curl -fsSL https://claude.ai/install.sh | sh
```

Kurulumu doğrulayın:

```bash
claude --version
```

Sürüm 2.0.5 veya üzeri olmalıdır.

### 2. Docker Desktop'ta MCP Toolkit'i Etkinleştirin

1. Docker Desktop'u açın
2. **Settings** > **Beta features** bölümüne gidin
3. **MCP Toolkit** seçeneğini etkinleştirin
4. **Apply & Restart** butonuna tıklayın

### 3. Claude Code'u Docker MCP Toolkit'e Bağlayın

#### Yöntem 1: Docker Desktop GUI (Önerilen)

1. Docker Desktop'ta **MCP Toolkit** sekmesine gidin
2. **Clients** sekmesini seçin
3. **Claude Code**'u bulun ve **Connect** butonuna tıklayın

Bu yöntem otomatik olarak yapılandırmayı oluşturur.

#### Yöntem 2: Komut Satırı

Proje dizininizde şu komutu çalıştırın:

```bash
docker mcp client connect claude-code
```

Bu komut proje dizininde `.mcp.json` dosyası oluşturur.

### 4. Claude Code'u Yeniden Başlatın

```bash
claude code
```

### 5. Bağlantıyı Doğrulayın

Claude Code içinde `/mcp` komutunu çalıştırın. `MCP_DOCKER` sunucusunun listede olduğunu görmelisiniz.

## Cursor IDE Kurulumu

Cursor IDE için Docker MCP Toolkit yapılandırması:

### 1. Docker Desktop'ta MCP Toolkit'i Etkinleştirin

Yukarıdaki adımları takip edin.

### 2. MCP Settings Dosyasını Güncelleyin

`.cursor/mcp_settings.json` dosyasına Docker MCP'yi ekleyin:

```json
{
  "mcpServers": {
    "Chrome DevTools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {}
    },
    "Docker MCP": {
      "command": "docker",
      "args": ["mcp", "gateway", "stdio"],
      "env": {}
    }
  }
}
```

**Not**: Bu yapılandırma Docker Desktop gerektirir. Docker Engine ile çalışmaz.

### 3. Cursor IDE'yi Yeniden Başlatın

MCP ayarlarının uygulanması için Cursor IDE'yi yeniden başlatın.

## Linux'ta Docker Engine Kullanıyorsanız

Linux'ta Docker Engine (Docker Desktop olmadan) kullanıyorsanız:

### Seçenek 1: Docker Desktop'u Yükleyin

Docker Desktop Linux sürümünü yükleyin:
- [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux-install/)

### Seçenek 2: Alternatif Docker MCP Sunucusu

Şu anda Docker CLI için standalone bir MCP sunucusu bulunmamaktadır. Docker MCP Toolkit özelliği sadece Docker Desktop'ta mevcuttur.

### Seçenek 3: Manuel Docker Komutları

Docker MCP olmadan, Docker komutlarını doğrudan terminal üzerinden kullanabilirsiniz:

```bash
# Container listesi
docker ps

# Image listesi
docker images

# Container çalıştırma
docker run -d -p 3000:3000 your-image:latest
```

## Sorun Giderme

### "docker mcp: command not found" Hatası

**Neden**: Docker Desktop yüklü değil veya MCP Toolkit etkinleştirilmemiş.

**Çözüm**:
1. Docker Desktop'u yükleyin (sürüm 4.40+)
2. Settings > Beta features > MCP Toolkit'i etkinleştirin
3. Docker Desktop'u yeniden başlatın

### Claude Code'da MCP_DOCKER Görünmüyor

**Neden**: Bağlantı yapılandırılmamış veya Claude Code yeniden başlatılmamış.

**Çözüm**:
1. `.mcp.json` dosyasının proje dizininde olduğundan emin olun
2. Claude Code'u tamamen kapatıp yeniden başlatın
3. `/mcp` komutu ile sunucuları kontrol edin

### Cursor IDE'de Docker MCP Çalışmıyor

**Neden**: Docker Desktop yüklü değil veya yapılandırma hatalı.

**Çözüm**:
1. Docker Desktop'un çalıştığından emin olun
2. `.cursor/mcp_settings.json` dosyasını kontrol edin
3. Cursor IDE'yi yeniden başlatın

## Docker MCP Toolkit Özellikleri

Docker MCP Toolkit bağlandığında şu özelliklere erişebilirsiniz:

- Container yönetimi (listeleme, başlatma, durdurma)
- Image yönetimi (build, push, pull)
- Network yönetimi
- Volume yönetimi
- Docker Compose desteği
- Log görüntüleme
- Container içinde komut çalıştırma

## İlgili Dosyalar

- `.mcp.json` - Claude Code için MCP yapılandırması
- `.cursor/mcp_settings.json` - Cursor IDE için MCP yapılandırması
- `docs/mcp-setup.md` - Genel MCP kurulum rehberi

## Kaynaklar

- [Docker MCP Toolkit Blog Post](https://www.docker.com/blog/add-mcp-servers-to-claude-code-with-mcp-toolkit/)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)

