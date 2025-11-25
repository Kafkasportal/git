# MCP Sunucuları Kurulum Rehberi

Model Context Protocol (MCP) sunucuları, AI asistanlarının (Claude, GitHub Copilot vb.) harici sistemlerle etkileşim kurmasını sağlar. Bu rehber, Kafkasder Panel projesi için MCP sunucularının nasıl kurulacağını açıklar.

## Genel Bakış

MCP sunucuları, AI asistanlarınızın şu yeteneklere erişmesini sağlar:

- **Appwrite**: Kullanıcı yönetimi ve authentication
- **GitHub**: Repository yönetimi, issue/PR işlemleri
- **Browser Use**: Web tarayıcı otomasyonu
- **Chrome DevTools**: Chrome geliştirici araçları erişimi

## Kurulum

### 1. IDE Yapılandırması

MCP sunucuları IDE'nize göre farklı konumlarda yapılandırılır:

#### Cursor IDE

Cursor IDE, iki farklı konumda MCP yapılandırmasını destekler:

**Proje Düzeyi** (Önerilen): `.cursor/mcp_settings.json` (proje kök dizininde)

```bash
mkdir -p .cursor
```

**Kullanıcı Düzeyi** (Windows): `%USERPROFILE%\.cursor\mcp.json`

Windows'ta kullanıcı düzeyi yapılandırma için:
- PowerShell: `New-Item -Path "$env:USERPROFILE\.cursor" -ItemType Directory -Force`
- Tam yol: `C:\Users\YourUsername\.cursor\mcp.json`

**Not**: Proje düzeyi yapılandırma, kullanıcı düzeyi yapılandırmadan önceliklidir.

Daha fazla bilgi için: [docs/cursor-mcp-windows.md](./cursor-mcp-windows.md)

#### Claude Desktop

Yapılandırma dosyası konumu:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. Yapılandırma Dosyası

Aşağıdaki yapılandırmayı ilgili konuma ekleyin:

```json
{
  "mcpServers": {
    "appwrite-docs": {
      "command": "npx mcp-remote https://mcp-for-docs.appwrite.io",
      "env": {},
      "args": []
    },
    "appwrite": {
      "command": "uvx mcp-server-appwrite --users",
      "env": {
        "APPWRITE_API_KEY": "your-appwrite-api-key",
        "APPWRITE_PROJECT_ID": "your-project-id",
        "APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1"
      },
      "args": []
    },
    "Browser Use": {
      "url": "https://docs.browser-use.com/mcp",
      "headers": {}
    },
    "Chrome DevTools": {
      "command": "npx chrome-devtools-mcp@latest",
      "env": {},
      "args": []
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token"
      }
    }
  }
}
```

## Sunucu Detayları

### 1. Appwrite Documentation

**Amaç**: Appwrite dokümantasyonuna hızlı erişim

**Kullanım**:
```
"Appwrite'da kullanıcı nasıl oluşturulur?"
"Authentication flow örnekleri göster"
```

**Gereksinimler**: Yok (herkese açık)

### 2. Appwrite MCP Server

**Amaç**: Appwrite kullanıcı yönetimi ve authentication işlemleri

**Kullanım**:
```
"Yeni kullanıcı oluştur: email@example.com"
"Tüm kullanıcıları listele"
"User ID: xyz için session oluştur"
```

**Kurulum**:
1. Python ve `uv` paket yöneticisini kurun:
   ```bash
   pip install uv
   ```

2. Environment variables ayarlayın:
   - `APPWRITE_API_KEY`: Appwrite Console > API Keys'den alın
   - `APPWRITE_PROJECT_ID`: Appwrite Console > Settings'den alın
   - `APPWRITE_ENDPOINT`: Cloud endpoint (örn: `https://fra.cloud.appwrite.io/v1`)

**Güvenlik**: API key'i güvenli bir şekilde saklayın, asla kodda saklamayın.

**Daha fazla bilgi**: [docs/appwrite-mcp-guide.md](./appwrite-mcp-guide.md)

### 3. Browser Use / Cursor IDE Browser

**Amaç**: Web tarayıcı otomasyonu ve test

**Kullanım**:
```
"example.com sayfasını aç ve screenshot al"
"Form doldur ve gönder"
"Web scraping yap"
```

**Kurulum**: Otomatik (Cursor IDE'de built-in olarak gelir)

**Gereksinimler**: İnternet bağlantısı

**Daha fazla bilgi**: 
- [Browser MCP Guide](./playwright-mcp-browser.md) - Comprehensive guide
- [Browser MCP Examples](./browser-mcp-examples.md) - Practical examples

### 4. Chrome DevTools

**Amaç**: Chrome geliştirici araçlarına programatik erişim

**Kullanım**:
```
"Console loglarını göster"
"Network isteklerini analiz et"
"Performance metrics al"
```

**Kurulum**: Node.js paketleri otomatik indirilir

**Gereksinimler**: Node.js >= 18

### 5. GitHub MCP Server

**Amaç**: GitHub repository yönetimi, issue/PR işlemleri

**Kullanım**:
```
"Açık issue'ları listele"
"Yeni PR aç"
"Issue #42'ye Copilot ata"
```

**Kurulum**:
1. GitHub Personal Access Token oluşturun:
   - GitHub Settings > Developer settings > Personal access tokens
   - Gerekli izinler: `repo`, `read:org`, `workflow`

2. Environment variable olarak ayarlayın:
   ```bash
   GITHUB_PERSONAL_ACCESS_TOKEN=your-token-here
   ```

3. MCP yapılandırmasına ekleyin

**Gereksinimler**: Node.js >= 18 (npx için)

**Güvenlik**: Token'ı asla commit etmeyin

**Daha fazla bilgi**: [docs/github-mcp-server.md](./github-mcp-server.md)

## Credential Yönetimi

### Güvenli Saklama

**ÖNEMLİ**: API key'leri ve token'ları asla:
- Git repository'sine commit etmeyin
- Kod içinde hardcode etmeyin
- Public yerlerde paylaşmayın

### Önerilen Yöntemler

1. **Environment Variables** (Önerilen):
   ```bash
   # .env.local (Git'e eklenmemiş)
   APPWRITE_API_KEY=your-key
   GITHUB_TOKEN=your-token
   ```

2. **IDE Secret Storage**:
   - Cursor ve Claude Desktop, credential'ları güvenli şekilde saklar
   - Yapılandırma dosyasında doğrudan kullanılabilir

3. **System Keychain**:
   - macOS Keychain
   - Windows Credential Manager
   - Linux Secret Service

### Credential'ları Alma

#### Appwrite API Key

1. [Appwrite Console](https://cloud.appwrite.io/)'a gidin
2. Projenizi seçin
3. Overview > Integrations > API Keys
4. "Create API Key" tıklayın
5. İzinler:
   - `users.read`
   - `users.write`
   - `sessions.read`
   - `sessions.write`

#### GitHub Token

1. [GitHub Settings](https://github.com/settings/tokens)'e gidin
2. Developer settings > Personal access tokens > Tokens (classic)
3. "Generate new token" tıklayın
4. İzinler:
   - `repo` (tüm repository işlemleri)
   - `read:org` (organizasyon bilgileri)
   - `workflow` (GitHub Actions)

## Test ve Doğrulama

### MCP Sunucularını Test Etme

#### Appwrite
```
"Appwrite'da kaç kullanıcı var?"
```
Beklenen: Kullanıcı sayısı veya liste

#### GitHub
```
"Bu repository'deki açık issue'ları göster"
```
Beklenen: Issue listesi

#### Browser Use
```
"google.com'u ziyaret et"
```
Beklenen: Başarılı navigasyon raporu

#### Chrome DevTools
```
"Chrome DevTools bağlan"
```
Beklenen: Bağlantı onayı

### Sorun Giderme

#### "MCP sunucusu başlatılamadı"

**Neden**: Paket eksik veya command yanlış

**Çözüm**:
```bash
# Node.js paketleri için
npm install -g chrome-devtools-mcp

# Python paketleri için
pip install uv
uvx mcp-server-appwrite --help
```

#### "Authentication failed"

**Neden**: API key veya token geçersiz

**Çözüm**:
1. Credential'ları yeniden oluşturun
2. Doğru izinlere sahip olduğundan emin olun
3. Token süresinin dolmadığını kontrol edin

#### "Network error"

**Neden**: İnternet bağlantısı veya endpoint sorunu

**Çözüm**:
1. İnternet bağlantınızı kontrol edin
2. Endpoint URL'sini doğrulayın
3. Firewall ayarlarını kontrol edin

## Gelişmiş Kullanım

### Özel MCP Sunucuları

Kendi MCP sunucunuzu oluşturabilirsiniz:

```typescript
// my-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk';

const server = new Server({
  name: 'my-custom-server',
  version: '1.0.0',
});

// Tool'ları tanımlayın
server.tool('my_tool', async (params) => {
  // İşleminiz
  return { result: 'success' };
});

server.start();
```

### MCP Proxy Kurulumu

Birden fazla sunucuyu tek bir proxy üzerinden yönetebilirsiniz:

```json
{
  "mcpServers": {
    "proxy": {
      "command": "mcp-proxy",
      "env": {
        "PROXY_CONFIG": "./mcp-proxy.json"
      }
    }
  }
}
```

## En İyi Uygulamalar

### Güvenlik

1. ✅ Credential'ları environment variable'larda saklayın
2. ✅ Minimum gerekli izinleri verin
3. ✅ Token'ları düzenli olarak rotate edin
4. ✅ `.gitignore`'da credential dosyalarını listeleyin
5. ⛔ API key'leri asla commit etmeyin

### Performans

1. ✅ Sadece ihtiyaç duyduğunuz sunucuları etkinleştirin
2. ✅ Rate limiting ayarlarını yapın
3. ✅ Cache kullanın (mümkün olduğunda)
4. ⛔ Gereksiz API çağrıları yapmayın

### Geliştirme

1. ✅ MCP sunucularını test ortamında test edin
2. ✅ Hata yönetimi implementasyonu yapın
3. ✅ Logging ekleyin (debug için)
4. ⛔ Production credential'larını development'ta kullanmayın

## Örnek Workflow'lar

### Kullanıcı Oluşturma ve Issue Açma

```bash
# 1. Appwrite'da kullanıcı oluştur
"email: user@example.com için yeni Appwrite kullanıcısı oluştur"

# 2. GitHub'da issue aç
"'New user onboarding process' başlıklı issue aç"

# 3. Copilot'a ata
"Son issue'ya Copilot'u ata"
```

### Otomatik Test ve Deploy

```bash
# 1. Browser ile test et
"Login flow'unu test et ve screenshot al"

# 2. Test başarılıysa PR aç
"Test sonuçlarıyla birlikte PR aç"

# 3. Chrome DevTools ile performance check
"Performance metrics al ve PR'a ekle"
```

## Docker MCP Registry'ye Katkıda Bulunma

Kendi MCP sunucunuzu Docker MCP Registry'ye eklemek istiyorsanız:

- [Docker MCP Registry Contribution Guide](./docker-mcp-registry-contribution.md) - Detaylı katkı rehberi
- Local (containerized) veya Remote (hosted) server ekleme
- Wizard ve task komutları ile kolay kurulum
- Pull request süreci ve onay adımları

## Kaynaklar

### Dokümantasyon

- [Model Context Protocol Spesifikasyonu](https://modelcontextprotocol.io/)
- [Appwrite MCP Kullanım Kılavuzu](./appwrite-mcp-guide.md)
- [GitHub MCP Kullanım Kılavuzu](./github-mcp-server.md)
- [GitHub MCP Demo Örnekleri](./github-mcp-server-demo.md)
- [Browser MCP Guide](./playwright-mcp-browser.md) - Browser automation guide
- [Browser MCP Examples](./browser-mcp-examples.md) - Practical examples

### MCP Sunucu Kaynak Kodları

- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Appwrite MCP Server](https://github.com/appwrite/mcp-server-appwrite)
- [Browser Use MCP](https://docs.browser-use.com/mcp)
- [Chrome DevTools MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools)

### Topluluk

- [MCP Discord](https://discord.gg/modelcontextprotocol)
- [GitHub Discussions](https://github.com/modelcontextprotocol/specification/discussions)

## Sonraki Adımlar

1. ✅ MCP sunucularını yapılandırın
2. ✅ Credential'ları güvenli şekilde ayarlayın
3. ✅ Test komutlarıyla doğrulayın
4. ✅ [CLAUDE.md](../CLAUDE.md) rehberini inceleyin
5. ✅ İlk workflow'unuzu deneyin

## Yardım ve Destek

Sorunla karşılaşırsanız:

1. Bu dokümandaki [Sorun Giderme](#sorun-giderme) bölümüne bakın
2. [GitHub Issues](https://github.com/kafkasder-org/Kafkasportal/issues) açın
3. [CONTRIBUTING.md](../CONTRIBUTING.md) rehberini inceleyin

---

**Hazır mısınız?** AI asistanınıza "Appwrite sunucusuna bağlan ve kullanıcıları listele" diyerek başlayın!
