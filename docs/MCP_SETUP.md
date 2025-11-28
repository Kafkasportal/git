# MCP (Model Context Protocol) Kurulum Kılavuzu

## MCP Nedir?

Model Context Protocol (MCP), AI asistanlarının harici kaynaklara ve araçlara güvenli bir şekilde erişmesini sağlayan bir protokoldür. Cursor IDE'de MCP sunucularını kullanarak, AI asistanınız proje dosyalarına, GitHub repository'lerine, Appwrite veritabanına ve diğer hizmetlere erişebilir.

## Kurulum Adımları

### 1. Environment Variable'ları Ayarlama

Proje kök dizininde `.env.local` dosyası oluşturun (veya mevcut dosyayı düzenleyin) ve aşağıdaki environment variable'ları ekleyin:

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6927aa95001c4c6b488b
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=kafkasportal
APPWRITE_API_KEY=your_appwrite_api_key_here
APPWRITE_DATABASE_ID=kafkasder_db

# GitHub Token (for MCP)
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

**Önemli Notlar:**
- `APPWRITE_API_KEY` ve `GITHUB_PERSONAL_ACCESS_TOKEN` değerlerini gerçek token'larınızla değiştirin
- `.env.local` dosyası git'e commit edilmez (`.gitignore` içinde)

### 2. MCP Konfigürasyon Dosyasını Oluşturma

`.cursor/mcp.json.example` dosyasını kopyalayarak `.cursor/mcp.json` dosyası oluşturun:

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

**Alternatif olarak:** Global MCP konfigürasyonu için `~/.cursor/mcp.json` dosyasını düzenleyebilirsiniz.

### 3. Environment Variable'ları Güncelleme

Oluşturduğunuz `.cursor/mcp.json` (veya `~/.cursor/mcp.json`) dosyasındaki environment variable referansları otomatik olarak sisteminizdeki environment variable'lardan okunur. 

Eğer environment variable'lar farklı bir konumda tanımlıysa, MCP konfigürasyon dosyasındaki `${VARIABLE_NAME}` formatındaki referanslar doğru şekilde çözümlenecektir.

### 4. Cursor'u Yeniden Başlatma

MCP konfigürasyon değişikliklerinin etkili olması için:

1. Cursor IDE'yi tamamen kapatın
2. Cursor'u yeniden açın

Bu adım, MCP sunucularının yeni konfigürasyonla başlatılmasını sağlar.

### 5. Test Etme

MCP sunucularının düzgün çalıştığını test etmek için:

1. Cursor'da yeni bir chat başlatın
2. AI asistanına şu komutları deneyin:
   - "Proje dosyalarını listele" (filesystem server testi)
   - "GitHub repository'deki son commit'leri göster" (github server testi)
   - "Appwrite veritabanındaki collection'ları listele" (appwrite server testi)

Eğer MCP sunucuları düzgün çalışıyorsa, AI asistanı bu istekleri yerine getirebilecektir.

## MCP Sunucuları

Bu projede yapılandırılmış MCP sunucuları:

1. **filesystem**: Proje dosyalarına erişim sağlar
2. **github**: GitHub repository, issue ve PR yönetimi
3. **appwrite**: Appwrite veritabanı, authentication ve storage yönetimi
4. **memory**: Oturum bazlı bilgi saklama
5. **sequential-thinking**: Karmaşık problemleri adım adım çözme
6. **fetch**: API istekleri yapma

## Sorun Giderme

### MCP Sunucuları Başlamıyor

- Environment variable'ların doğru tanımlandığından emin olun
- `.cursor/mcp.json` dosyasının JSON formatının geçerli olduğunu kontrol edin
- Cursor'u tamamen kapatıp yeniden açmayı deneyin

### GitHub Token Hatası

- GitHub Personal Access Token'ınızın geçerli olduğundan emin olun
- Token'ın gerekli izinlere sahip olduğunu kontrol edin (repo, read:org, vb.)

### Appwrite Bağlantı Hatası

- `APPWRITE_API_KEY` değerinin doğru olduğundan emin olun
- Appwrite endpoint URL'inin erişilebilir olduğunu kontrol edin
- Project ID'nin doğru olduğunu doğrulayın

## Ek Kaynaklar

- [Model Context Protocol Dokümantasyonu](https://modelcontextprotocol.io/)
- [Cursor MCP Dokümantasyonu](https://docs.cursor.com/mcp)


