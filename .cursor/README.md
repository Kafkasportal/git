# Cursor IDE MCP Configuration

Bu dizin Cursor IDE için MCP (Model Context Protocol) yapılandırma dosyalarını içerir.

## Kurulum

1. Örnek dosyayı kopyalayın:

   ```bash
   cp mcp_settings.example.json mcp_settings.json
   ```

2. `mcp_settings.json` dosyasını düzenleyerek gerçek credential'larınızı ekleyin:
   - Appwrite: Project ID, API Key
   - GitHub: Personal Access Token
   - Diğer servislerin credential'ları

## Dosyalar

- `environment.json` - Cursor IDE ortam ayarları
- `mcp_settings.example.json` - MCP yapılandırma şablonu (git'e commit edilir)
- `mcp_settings.json` - Gerçek MCP yapılandırması (git'e commit EDİLMEZ)

## Güvenlik

⚠️ **ÖNEMLİ**: `mcp_settings.json` dosyası hassas bilgiler içerdiğinden `.gitignore`'a eklenmiştir. Bu dosyayı asla commit etmeyin!

## Kullanılabilir MCP Sunucuları

| Sunucu                | Açıklama                             |
| --------------------- | ------------------------------------ |
| `appwrite`            | Kullanıcı yönetimi ve authentication |
| `github`              | Repository, issue/PR yönetimi        |
| `puppeteer`           | Web tarayıcı otomasyonu              |
| `sequential-thinking` | Karmaşık problem çözümü              |

## Daha Fazla Bilgi

- [MCP Kurulum Rehberi](../docs/mcp-setup.md)
- [Appwrite MCP Rehberi](../docs/appwrite-mcp-setup.md)
