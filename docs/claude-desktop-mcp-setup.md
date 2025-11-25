# Claude Desktop MCP Kurulumu

Bu rehber, Claude Desktop uygulamasında MCP sunucularının nasıl yapılandırılacağını açıklar.

## Yapılandırma Dosyası Konumu

Claude Desktop yapılandırması işletim sistemine göre farklı konumlarda saklanır:

### macOS
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

### Linux
```bash
~/.config/Claude/claude_desktop_config.json
```

## Kurulum Adımları

### 1. Yapılandırma Dosyasını Açın

```bash
# macOS
open ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
nano ~/.config/Claude/claude_desktop_config.json

# Windows
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Dosya yoksa oluşturun:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
mkdir -p ~/.config/Claude
touch ~/.config/Claude/claude_desktop_config.json

# Windows (PowerShell)
New-Item -Path "$env:APPDATA\Claude" -ItemType Directory -Force
New-Item -Path "$env:APPDATA\Claude\claude_desktop_config.json" -ItemType File
```

### 2. MCP Sunucularını Ekleyin

Aşağıdaki yapılandırmayı dosyaya ekleyin:

```json
{
  "mcpServers": {
    "appwrite-docs": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp-for-docs.appwrite.io"],
      "env": {}
    },
    "appwrite": {
      "command": "uvx",
      "args": ["mcp-server-appwrite", "--users"],
      "env": {
        "APPWRITE_API_KEY": "your-appwrite-api-key-here",
        "APPWRITE_PROJECT_ID": "your-project-id-here",
        "APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

**Not**: Claude Desktop, URL tabanlı MCP sunucularını destekler ancak bazı yerel komutlar farklı şekilde yapılandırılmalıdır.

### 3. Credential'ları Güncelleyin

Yapılandırmadaki placeholder'ları gerçek değerlerle değiştirin:

- `your-appwrite-api-key-here` → Appwrite API anahtarınız
- `your-project-id-here` → Appwrite proje ID'niz
- `your-github-token-here` → GitHub personal access token'ınız

### 4. Claude Desktop'ı Yeniden Başlatın

Değişikliklerin etkinleşmesi için Claude Desktop'ı tamamen kapatıp yeniden açın.

## Credential Alma

### Appwrite API Key

1. [Appwrite Console](https://cloud.appwrite.io/)'a gidin
2. Projenizi seçin
3. **Overview** > **Integrations** > **API Keys**
4. **Create API Key** butonuna tıklayın
5. Gerekli izinleri seçin:
   - `users.read`
   - `users.write`
   - `sessions.read`
   - `sessions.write`
6. API anahtarını kopyalayın

### GitHub Token

1. [GitHub Settings](https://github.com/settings/tokens)'e gidin
2. **Developer settings** > **Personal access tokens** > **Tokens (classic)**
3. **Generate new token** butonuna tıklayın
4. Gerekli izinleri seçin:
   - `repo` - Tam repository erişimi
   - `read:org` - Organizasyon okuma
   - `workflow` - GitHub Actions
5. Token'ı oluşturun ve kopyalayın

**ÖNEMLİ**: Token'ı güvenli bir yerde saklayın, tekrar göremezsiniz!

## Yapılandırmayı Test Etme

Claude Desktop'ı açın ve aşağıdaki komutları deneyin:

### Appwrite Test

```
"Appwrite'da kaç kullanıcı var?"
```

Beklenen: Kullanıcı sayısı veya liste döner

### GitHub Test

```
"kafkasder-org/Kafkasportal repository'sindeki açık issue'ları göster"
```

Beklenen: Issue listesi

### Appwrite Docs Test

```
"Appwrite'da kullanıcı nasıl oluşturulur?"
```

Beklenen: Dokümantasyon ve örnek kod

## Sorun Giderme

### "MCP sunucusu bulunamadı" Hatası

**Neden**: Yapılandırma dosyası yanlış konumda veya format hatası var

**Çözüm**:
1. Dosya konumunu kontrol edin
2. JSON formatını doğrulayın ([JSONLint](https://jsonlint.com/) kullanabilirsiniz)
3. Claude Desktop'ı tamamen kapatıp açın

### "Authentication failed" Hatası

**Neden**: API key veya token geçersiz

**Çözüm**:
1. Credential'ların doğru kopyalandığından emin olun
2. API key/token'ın süresinin dolmadığını kontrol edin
3. Gerekli izinlerin verildiğinden emin olun
4. Yeni credential oluşturun ve tekrar deneyin

### "Command not found" Hatası

**Neden**: Gerekli araçlar yüklü değil

**Çözüm**:

#### Node.js (npx için)
```bash
# macOS (Homebrew)
brew install node

# Linux (Ubuntu/Debian)
sudo apt install nodejs npm

# Windows
# https://nodejs.org/en/download/ adresinden indirin
```

#### Python ve uv (Appwrite için)
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Ya da pip ile
pip install uv
```

### MCP Sunucusu Çalışmıyor

**Kontrol Listesi**:
- [ ] Claude Desktop tamamen kapatıldı ve yeniden açıldı
- [ ] JSON formatı doğru (virgül, tırnak işaretleri vb.)
- [ ] Credential'lar doğru ve geçerli
- [ ] Gerekli araçlar yüklü (node, python, uv)
- [ ] İnternet bağlantısı var
- [ ] Firewall MCP bağlantılarını engellemedi

## Gelişmiş Yapılandırma

### Environment Variables ile

Credential'ları doğrudan yapılandırma dosyasına yazmak yerine environment variable'ları kullanabilirsiniz:

```json
{
  "mcpServers": {
    "appwrite": {
      "command": "uvx",
      "args": ["mcp-server-appwrite", "--users"],
      "env": {
        "APPWRITE_API_KEY": "${APPWRITE_API_KEY}",
        "APPWRITE_PROJECT_ID": "${APPWRITE_PROJECT_ID}",
        "APPWRITE_ENDPOINT": "${APPWRITE_ENDPOINT}"
      }
    }
  }
}
```

Sonra sistem environment variable'larını ayarlayın:

```bash
# macOS/Linux (.bashrc veya .zshrc)
export APPWRITE_API_KEY="your-key"
export APPWRITE_PROJECT_ID="your-project-id"
export APPWRITE_ENDPOINT="https://fra.cloud.appwrite.io/v1"

# Windows (PowerShell)
$env:APPWRITE_API_KEY="your-key"
$env:APPWRITE_PROJECT_ID="your-project-id"
$env:APPWRITE_ENDPOINT="https://fra.cloud.appwrite.io/v1"
```

### Özel MCP Sunucuları

Kendi yerel MCP sunucunuzu eklemek için:

```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "node",
      "args": ["/path/to/your/server.js"],
      "env": {
        "CUSTOM_ENV_VAR": "value"
      }
    }
  }
}
```

## Güvenlik En İyi Uygulamaları

1. ✅ API key'leri sadece gerekli izinlerle oluşturun
2. ✅ Token'ları düzenli olarak rotate edin
3. ✅ Kullanılmayan sunucuları devre dışı bırakın
4. ✅ Yapılandırma dosyasını yedekleyin (credential'lar olmadan)
5. ⛔ Yapılandırma dosyasını asla paylaşmayın
6. ⛔ Screenshot alırken credential'ları göstermeyin

## Yardım ve Destek

### Dokümantasyon

- [MCP Kurulum Rehberi](./mcp-setup.md) - Genel MCP rehberi
- [Appwrite MCP Rehberi](./appwrite-mcp-guide.md) - Appwrite özellikleri
- [GitHub MCP Rehberi](./github-mcp-server.md) - GitHub özellikleri

### Topluluk Kaynakları

- [Claude Help Center](https://support.anthropic.com/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [GitHub Issues](https://github.com/kafkasder-org/Kafkasportal/issues)

### Hata Raporlama

MCP ile ilgili sorun yaşarsanız:

1. Claude Desktop loglarını kontrol edin:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

2. [GitHub Issue](https://github.com/kafkasder-org/Kafkasportal/issues/new) açın:
   - Sorun açıklaması
   - Hata mesajları (credential'lar olmadan!)
   - İşletim sistemi bilgisi
   - Claude Desktop versiyonu

## Sonraki Adımlar

1. ✅ Yapılandırmayı tamamlayın
2. ✅ Test komutlarıyla doğrulayın
3. ✅ [CLAUDE.md](../CLAUDE.md) rehberini okuyun
4. ✅ İlk AI komutlarınızı deneyin

---

**Başlamaya hazır mısınız?** Claude'a "Appwrite sunucusuna bağlan ve kullanıcıları listele" deyin!
