# Cursor IDE MCP Configuration - Windows

Bu rehber, Windows'ta Cursor IDE için MCP (Model Context Protocol) yapılandırmasını açıklar.

## MCP Yapılandırma Dosya Konumları

Cursor IDE, Windows'ta iki farklı konumda MCP yapılandırmasını destekler:

### 1. Proje Düzeyi Yapılandırma (Önerilen)

**Konum**: Proje kök dizininde `.cursor/mcp_settings.json`

```
C:\Users\YourUsername\Projects\Kafkasportal-1\.cursor\mcp_settings.json
```

**Avantajları**:
- Proje bazlı yapılandırma
- Git ile versiyon kontrolüne eklenebilir
- Takım üyeleriyle paylaşılabilir

### 2. Kullanıcı Düzeyi Yapılandırma (Global)

**Konum**: Kullanıcı profil dizininde `.cursor\mcp.json`

```
%USERPROFILE%\.cursor\mcp.json
```

Veya tam yol:
```
C:\Users\YourUsername\.cursor\mcp.json
```

**Avantajları**:
- Tüm projeler için geçerli
- Kişisel ayarlar için uygun
- Proje bazlı yapılandırmayı override edebilir

## Yapılandırma Dosyası Oluşturma

### Proje Düzeyi (`.cursor/mcp_settings.json`)

Proje dizininizde:

```powershell
# PowerShell'de
New-Item -Path ".cursor" -ItemType Directory -Force
New-Item -Path ".cursor\mcp_settings.json" -ItemType File
```

Veya manuel olarak:
1. Proje kök dizininde `.cursor` klasörü oluşturun
2. `mcp_settings.json` dosyası oluşturun

### Kullanıcı Düzeyi (`%USERPROFILE%\.cursor\mcp.json`)

PowerShell'de:

```powershell
# Klasör oluştur
New-Item -Path "$env:USERPROFILE\.cursor" -ItemType Directory -Force

# Dosya oluştur
New-Item -Path "$env:USERPROFILE\.cursor\mcp.json" -ItemType File
```

Veya Windows Explorer'da:
1. `%USERPROFILE%` dizinine gidin (genellikle `C:\Users\YourUsername`)
2. `.cursor` klasörü oluşturun (gizli klasör olabilir)
3. `mcp.json` dosyası oluşturun

## Yapılandırma Örneği

### Proje Düzeyi (`.cursor/mcp_settings.json`)

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
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Kullanıcı Düzeyi (`%USERPROFILE%\.cursor\mcp.json`)

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "stdio"],
      "env": {}
    }
  }
}
```

## Dosya Yolu Kontrolü

PowerShell'de dosya yolunu kontrol etmek için:

```powershell
# Kullanıcı profil dizinini göster
$env:USERPROFILE

# Kullanıcı düzeyi MCP dosyasını kontrol et
Test-Path "$env:USERPROFILE\.cursor\mcp.json"

# Proje düzeyi MCP dosyasını kontrol et
Test-Path ".\.cursor\mcp_settings.json"
```

## Öncelik Sırası

Cursor IDE, MCP yapılandırmasını şu sırayla yükler:

1. **Proje düzeyi** (`.cursor/mcp_settings.json`) - En yüksek öncelik
2. **Kullanıcı düzeyi** (`%USERPROFILE%\.cursor\mcp.json`) - Varsayılan/fallback

Proje düzeyi yapılandırma varsa, kullanıcı düzeyi yapılandırma göz ardı edilir.

## Windows-Specific Notlar

### Gizli Klasörler

Windows'ta `.cursor` klasörü gizli olabilir. Görmek için:

1. File Explorer'da **View** > **Show** > **Hidden items** seçeneğini etkinleştirin
2. Veya PowerShell'de: `Get-ChildItem -Force`

### Path Ayırıcıları

Windows'ta path ayırıcısı `\` (backslash) kullanır, ancak JSON dosyalarında `/` (forward slash) da çalışır:

```json
{
  "command": "C:\\Program Files\\Node.js\\node.exe",
  // veya
  "command": "C:/Program Files/Node.js/node.exe"
}
```

### Environment Variables

Windows'ta environment variable'ları kullanmak için:

```json
{
  "env": {
    "PATH": "%PATH%;C:\\CustomPath",
    "NODE_ENV": "production"
  }
}
```

## Sorun Giderme

### Dosya Bulunamıyor

**Sorun**: Cursor IDE MCP yapılandırmasını bulamıyor

**Çözüm**:
1. Dosya yolunun doğru olduğundan emin olun
2. Dosya adının doğru olduğundan emin olun:
   - Proje: `mcp_settings.json`
   - Kullanıcı: `mcp.json`
3. JSON formatının geçerli olduğundan emin olun
4. Cursor IDE'yi yeniden başlatın

### JSON Syntax Hatası

**Sorun**: JSON format hatası

**Çözüm**:
1. JSON validator kullanın: [jsonlint.com](https://jsonlint.com)
2. Tırnak işaretlerinin doğru olduğundan emin olun
3. Virgüllerin doğru yerleştirildiğinden emin olun

### MCP Sunucuları Çalışmıyor

**Sorun**: MCP sunucuları başlatılamıyor

**Çözüm**:
1. Komut yolunun doğru olduğundan emin olun
2. Gerekli araçların yüklü olduğundan emin olun (Node.js, Docker, vb.)
3. Environment variable'ların doğru ayarlandığından emin olun
4. Cursor IDE'yi yönetici olarak çalıştırmayı deneyin

## Örnek: Tam Kurulum

### Adım 1: Kullanıcı Düzeyi Yapılandırma

```powershell
# PowerShell'de çalıştırın
$mcpPath = "$env:USERPROFILE\.cursor"
New-Item -Path $mcpPath -ItemType Directory -Force

$mcpConfig = @{
  mcpServers = @{
    MCP_DOCKER = @{
      command = "docker"
      args = @("mcp", "gateway", "stdio")
      env = @{}
    }
  }
} | ConvertTo-Json -Depth 10

$mcpConfig | Out-File -FilePath "$mcpPath\mcp.json" -Encoding UTF8
```

### Adım 2: Proje Düzeyi Yapılandırma

Proje dizininizde `.cursor/mcp_settings.json` dosyasını oluşturun (yukarıdaki örneğe bakın).

### Adım 3: Cursor IDE'yi Yeniden Başlatın

Değişikliklerin uygulanması için Cursor IDE'yi tamamen kapatıp yeniden açın.

## İlgili Dosyalar

- `.cursor/mcp_settings.json` - Proje düzeyi yapılandırma
- `%USERPROFILE%\.cursor\mcp.json` - Kullanıcı düzeyi yapılandırma
- `docs/mcp-setup.md` - Genel MCP kurulum rehberi
- `docs/docker-mcp-setup.md` - Docker MCP özel rehberi

