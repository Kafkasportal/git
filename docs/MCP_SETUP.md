# MCP (Model Context Protocol) Kurulum Rehberi

Bu dokümantasyon, Cursor IDE'de MCP sunucularının nasıl kurulacağını açıklamaktadır.

## MCP Nedir?

MCP (Model Context Protocol), AI asistanlarının (Cursor, Claude vb.) harici araçlar ve servislerle iletişim kurmasını sağlayan açık bir protokoldür. MCP sayesinde AI asistanınız:

- **Dosya Sistemi**: Proje dosyalarınıza erişebilir
- **GitHub**: Issue, PR ve repo yönetimi yapabilir
- **Appwrite**: Veritabanı, auth ve storage işlemlerini yönetebilir
- **Memory**: Oturum bazlı bilgi saklayabilir
- **Sequential Thinking**: Karmaşık problemleri adım adım çözebilir
- **Fetch**: API istekleri yapabilir

## Kurulum Adımları

### 1. Node.js Gereksinimi

MCP sunucuları `npx` ile çalıştığı için sisteminizde Node.js (v18+) kurulu olmalıdır.

```bash
node --version  # v18 veya üstü olmalı
```

### 2. MCP Yapılandırma Dosyasını Oluşturma

Proje kök dizininde `.cursor/mcp.json.example` dosyası bulunmaktadır. Bu dosyayı kopyalayarak kendi yapılandırmanızı oluşturun:

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

### 3. Environment Variable'ları Ayarlama

`.env.local` dosyanızda aşağıdaki değişkenlerin tanımlı olduğundan emin olun:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6927aa95001c4c6b488b
APPWRITE_API_KEY=your_appwrite_api_key_here

# GitHub Token
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

#### GitHub Token Oluşturma

1. GitHub'a giriş yapın
2. [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens) sayfasına gidin
3. "Generate new token (classic)" tıklayın
4. Aşağıdaki izinleri seçin:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org membership)
   - `read:user` (Read user profile data)
5. Token'ı oluşturun ve güvenli bir yere kaydedin

#### Appwrite API Key Oluşturma

1. [Appwrite Console](https://cloud.appwrite.io) adresine gidin
2. Projenizi seçin
3. Settings > API Keys bölümüne gidin
4. Yeni bir API Key oluşturun
5. Gerekli scope'ları seçin (databases.*, users.*, teams.*, storage.*)

### 4. Cursor'u Yeniden Başlatma

MCP yapılandırması değiştikten sonra Cursor'u tamamen kapatıp yeniden açın:

1. Cursor'u kapatın (Cmd+Q / Ctrl+Q)
2. Cursor'u tekrar açın
3. Projenizi açın

### 5. MCP Sunucularını Test Etme

Cursor'da MCP sunucularının çalıştığını doğrulamak için:

1. Cursor'da Chat panelini açın (Cmd+L / Ctrl+L)
2. Aşağıdaki komutları deneyin:

**Dosya Sistemi Testi:**
```
Proje kök dizinindeki dosyaları listele
```

**GitHub Testi:**
```
Bu reponun açık issue'larını listele
```

**Appwrite Testi:**
```
Appwrite veritabanındaki collection'ları listele
```

## Sorun Giderme

### MCP Sunucuları Görünmüyor

1. `.cursor/mcp.json` dosyasının doğru konumda olduğundan emin olun
2. JSON sözdiziminin geçerli olduğunu kontrol edin
3. Cursor'u yeniden başlatın

### "Command not found" Hatası

```bash
# npx'in çalıştığından emin olun
npx --version

# Node.js sürümünü kontrol edin
node --version
```

### GitHub Token Çalışmıyor

1. Token'ın süresinin dolmadığından emin olun
2. Gerekli izinlerin verildiğini kontrol edin
3. `.env.local` dosyasında token'ın doğru ayarlandığını doğrulayın

### Appwrite Bağlantı Hatası

1. `APPWRITE_ENDPOINT` değerinin doğru olduğunu kontrol edin
2. `APPWRITE_PROJECT_ID` değerinin proje ID'si ile eşleştiğini doğrulayın
3. API Key'in gerekli izinlere sahip olduğunu kontrol edin

## Güvenlik Notları

⚠️ **Önemli Uyarılar:**

- `.cursor/mcp.json` dosyası hassas bilgiler içerebilir, **asla commit etmeyin**
- `.env.local` dosyası da commit edilmemelidir
- API anahtarlarını ve token'ları güvenli bir şekilde saklayın
- Token'ları düzenli olarak rotate edin
- Minimum gerekli izinleri verin

## Mevcut MCP Sunucuları

| Sunucu | Açıklama |
|--------|----------|
| `filesystem` | Proje dosyalarına erişim |
| `github` | GitHub repo, issue, PR yönetimi |
| `appwrite` | Appwrite veritabanı, auth, storage yönetimi |
| `memory` | Oturum bazlı bilgi saklama |
| `sequential-thinking` | Karmaşık problemleri adım adım çözme |
| `fetch` | API istekleri |

## Kaynaklar

- [MCP Resmi Dokümantasyonu](https://modelcontextprotocol.io/)
- [Cursor MCP Dokümantasyonu](https://docs.cursor.com/advanced/mcp)
- [Appwrite Dokümantasyonu](https://appwrite.io/docs)
