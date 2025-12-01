# Appwrite MCP Server Kurulumu

Bu rehber, Appwrite Model Context Protocol (MCP) sunucusunu yerel geliştirme ortamında kurmanız için gerekli adımları içerir.

## Gereksinimler

- Python 3.8+
- `uv` paket yöneticisi (`pip install uv`)
- Appwrite hesabı ve API anahtarı

## Kurulum Adımları

### 1. Appwrite Kimlik Bilgilerini Hazırlayın

`.mcp.json` dosyasını oluşturun `.mcp.json.example`'den:

```bash
cp .mcp.json.example .mcp.json
```

### 2. Kimlik Bilgilerini Doldurun

`.mcp.json` dosyasını açın ve aşağıdaki değerleri güncelleyin:

```json
{
  "mcpServers": {
    "appwrite": {
      "env": {
        "APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1",
        "APPWRITE_PROJECT_ID": "your_project_id_here",
        "APPWRITE_API_KEY": "your_api_key_here",
        "APPWRITE_DATABASE_ID": "your_database_id_here"
      }
    }
  }
}
```

### 3. MCP Sunucusunu Başlatın

PowerShell terminalinde:

```powershell
# Ortam değişkenlerini ayarla
$env:APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1"
$env:APPWRITE_PROJECT_ID = "your_project_id"
$env:APPWRITE_API_KEY = "your_api_key"
$env:APPWRITE_DATABASE_ID = "your_database_id"

# Sunucuyu başlat
uvx mcp-server-appwrite --all
```

Veya helper script'i kullanın:

```powershell
.\start-mcp.ps1
```

### 4. VS Code'u Yapılandırın

VS Code ayarlarında MCP otomatik olarak yapılandırılmıştır. Sunucu başladığında:
- Copilot, Appwrite API'sine erişebilecektir
- Veritabanını sorgulamak ve yönetmek için tüm araçlar aktif olacaktır

## Kullanım

Sunucu çalışırken Copilot'u aşağıdaki işlemler için kullanabilirsiniz:

- Appwrite koleksiyonlarını listeleme
- Belgeleri sorgulama ve filtreleme
- Yeni belgeler oluşturma
- Belgeleri güncelleme
- Belgeleri silme
- Veritabanı şemasını görüntüleme

## Örnek Komutlar

```
Appwrite'da kafkas_users koleksiyonundaki tüm belgeleri listele
Appwrite veritabanında yeni bir kategori oluştur
Parametreler koleksiyonundan "sistem_ayarlari" kategorisini getir
```

## Sorun Giderme

### "APPWRITE_PROJECT_ID ve APPWRITE_API_KEY ortam değişkenleri ayarlanmalı"

Ortam değişkenlerinin doğru şekilde ayarlandığından emin olun:
```powershell
$env:APPWRITE_PROJECT_ID
$env:APPWRITE_API_KEY
```

### Bağlantı hatası

- Appwrite endpoint'inin doğru olduğunu kontrol edin
- API anahtarının geçerli olduğunu doğrulayın
- İnternet bağlantınızı kontrol edin

## Güvenlik

- **Asla** `.mcp.json`'u version control'e commit etmeyin
- API anahtarlarını çevre değişkenleri veya `.env` dosyasında saklayın
- `.gitignore` dosyası `.mcp.json` dosyasını otomatik olarak yoksayar

## Kaynaklar

- [Appwrite MCP Server](https://github.com/mcp-servers/appwrite)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Appwrite Documentation](https://appwrite.io/docs)
