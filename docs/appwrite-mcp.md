# Appwrite MCP Dokümantasyonu

Bu dokümantasyon, Appwrite MCP (Model Context Protocol) server'ının kullanımını ve yapılandırmasını detaylı olarak açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kurulum](#kurulum)
3. [Yapılandırma](#yapılandırma)
4. [Kullanılabilir Araçlar](#kullanılabilir-araçlar)
5. [Kullanım Örnekleri](#kullanım-örnekleri)
6. [Güvenlik](#güvenlik)
7. [Sorun Giderme](#sorun-giderme)

---

## Genel Bakış

Appwrite MCP, Appwrite'un kullanıcı yönetimi ve kimlik doğrulama özelliklerine doğrudan erişim sağlar. Bu, Cursor IDE'den Appwrite backend'inizle doğrudan etkileşim kurmanıza olanak tanır.

### Avantajlar

- ✅ **Doğrudan CLI Erişimi**: Kod yazmadan kullanıcı yönetimi işlemleri
- ✅ **Hızlı Test**: Kullanıcı işlemlerini hızlıca test etme
- ✅ **Yönetimsel Görevler**: Toplu kullanıcı işlemleri
- ✅ **Hata Ayıklama**: Kimlik doğrulama sorunlarını çözme

---

## Kurulum

### 1. Gereksinimler

- Python 3.8 veya üzeri
- `uv` paket yöneticisi
- Appwrite Cloud hesabı
- Cursor IDE

### 2. Python ve uv Kurulumu

#### Linux/macOS

```bash
# uv kurulumu
curl -LsSf https://astral.sh/uv/install.sh | sh

# veya pip ile
pip install uv
```

#### Windows

```powershell
# PowerShell ile
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# veya pip ile
pip install uv
```

### 3. Appwrite Credentials'ları Al

#### Appwrite API Key Oluştur

1. [Appwrite Cloud Console](https://cloud.appwrite.io/)'a gidin
2. Projenizi seçin (veya yeni proje oluşturun)
3. **Settings** > **API Keys** bölümüne gidin
4. **Create API Key** butonuna tıklayın
5. İzinler:
   - ✅ `users.read`
   - ✅ `users.write`
   - ✅ `sessions.read`
   - ✅ `sessions.write`
   - ✅ `databases.read` (opsiyonel)
   - ✅ `databases.write` (opsiyonel)
6. API Key'i kopyalayın ve güvenli bir yerde saklayın

#### Project ID ve Endpoint

1. **Settings** > **General** bölümüne gidin
2. **Project ID**'yi kopyalayın
3. **Endpoint** URL'ini not edin (örn: `https://cloud.appwrite.io/v1`)

---

## Yapılandırma

### 1. Environment Variables

`.env.local` dosyasına ekleyin:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id-here
APPWRITE_API_KEY=your-api-key-here
```

**ÖNEMLİ**: `.env.local` dosyası zaten `.gitignore`'da, bu yüzden güvenlidir.

### 2. MCP Settings

`.cursor/mcp_settings.json` dosyası şu şekilde yapılandırılmalı:

```json
{
  "mcpServers": {
    "appwrite": {
      "command": "uvx",
      "args": ["mcp-server-appwrite", "--users"],
      "env": {
        "APPWRITE_API_KEY": "${APPWRITE_API_KEY}",
        "APPWRITE_PROJECT_ID": "${NEXT_PUBLIC_APPWRITE_PROJECT_ID}",
        "APPWRITE_ENDPOINT": "${NEXT_PUBLIC_APPWRITE_ENDPOINT}"
      },
      "description": "Appwrite user management and authentication MCP server"
    }
  }
}
```

### 3. Cursor IDE'yi Yeniden Başlat

MCP settings değişikliklerinin uygulanması için Cursor IDE'yi yeniden başlatın.

---

## Kullanılabilir Araçlar

### 👥 Kullanıcı Yönetimi

#### Kullanıcı Oluşturma

- **`mcp_appwrite_users_create`**: Düz metin şifre ile kullanıcı oluştur
- **`mcp_appwrite_users_create_argon2_user`**: Argon2 hash ile kullanıcı oluştur
- **`mcp_appwrite_users_create_bcrypt_user`**: Bcrypt hash ile kullanıcı oluştur
- **`mcp_appwrite_users_create_md5_user`**: MD5 hash ile kullanıcı oluştur
- **`mcp_appwrite_users_create_sha_user`**: SHA hash ile kullanıcı oluştur
- **`mcp_appwrite_users_create_scrypt_user`**: Scrypt hash ile kullanıcı oluştur
- **`mcp_appwrite_users_create_ph_pass_user`**: PHPass hash ile kullanıcı oluştur
- **`mcp_appwrite_users_create_scrypt_modified_user`**: Scrypt Modified hash ile kullanıcı oluştur

#### Kullanıcı Bilgileri

- **`mcp_appwrite_users_get`**: Kullanıcı bilgilerini ID ile getir
- **`mcp_appwrite_users_list`**: Kullanıcıları listele ve filtrele

#### Kullanıcı Güncelleme

- **`mcp_appwrite_users_update_email`**: E-posta güncelle
- **`mcp_appwrite_users_update_name`**: İsim güncelle
- **`mcp_appwrite_users_update_phone`**: Telefon güncelle
- **`mcp_appwrite_users_update_password`**: Şifre güncelle
- **`mcp_appwrite_users_update_status`**: Durum güncelle (aktif/pasif)
- **`mcp_appwrite_users_update_prefs`**: Kullanıcı tercihlerini güncelle
- **`mcp_appwrite_users_update_labels`**: Etiketleri güncelle
- **`mcp_appwrite_users_update_email_verification`**: E-posta doğrulama durumunu güncelle
- **`mcp_appwrite_users_update_phone_verification`**: Telefon doğrulama durumunu güncelle

#### Kullanıcı Silme

- **`mcp_appwrite_users_delete`**: Kullanıcıyı sil

### 🔐 Kimlik Doğrulama ve Oturumlar

#### Oturum Yönetimi

- **`mcp_appwrite_users_create_session`**: Kullanıcı için oturum oluştur
- **`mcp_appwrite_users_list_sessions`**: Kullanıcının tüm oturumlarını listele
- **`mcp_appwrite_users_delete_session`**: Belirli bir oturumu sil
- **`mcp_appwrite_users_delete_sessions`**: Kullanıcının tüm oturumlarını sil

#### Token Yönetimi

- **`mcp_appwrite_users_create_jwt`**: Kullanıcı için JWT oluştur
- **`mcp_appwrite_users_create_token`**: Oturum oluşturma için gizli token oluştur

### 🔒 Çok Faktörlü Kimlik Doğrulama (MFA)

- **`mcp_appwrite_users_list_mfa_factors`**: MFA faktörlerini listele
- **`mcp_appwrite_users_create_mfa_recovery_codes`**: MFA kurtarma kodları oluştur
- **`mcp_appwrite_users_get_mfa_recovery_codes`**: MFA kurtarma kodlarını getir
- **`mcp_appwrite_users_update_mfa`**: MFA'yı etkinleştir/devre dışı bırak
- **`mcp_appwrite_users_update_mfa_recovery_codes`**: MFA kurtarma kodlarını yeniden oluştur
- **`mcp_appwrite_users_delete_mfa_authenticator`**: Authenticator uygulamasını sil

### 📱 Push Bildirimleri (Targets)

- **`mcp_appwrite_users_create_target`**: Mesajlaşma hedefi oluştur (email, SMS, push)
- **`mcp_appwrite_users_get_target`**: Hedef bilgilerini getir
- **`mcp_appwrite_users_list_targets`**: Tüm hedefleri listele
- **`mcp_appwrite_users_update_target`**: Hedef ayarlarını güncelle
- **`mcp_appwrite_users_delete_target`**: Hedefi sil

### 🆔 Kimlikler

- **`mcp_appwrite_users_list_identities`**: Tüm kullanıcı kimliklerini listele
- **`mcp_appwrite_users_delete_identity`**: Kimliği sil

### 📊 Kullanıcı Metadata

- **`mcp_appwrite_users_get_prefs`**: Kullanıcı tercihlerini getir
- **`mcp_appwrite_users_list_memberships`**: Takım üyeliklerini listele
- **`mcp_appwrite_users_list_logs`**: Kullanıcı aktivite loglarını getir

---

## Kullanım Örnekleri

### 1. Kullanıcı Oluşturma

#### Düz Metin Şifre ile

```typescript
mcp_appwrite_users_create({
  user_id: "unique-user-id",
  email: "user@example.com",
  password: "secure-password-123",
  name: "John Doe"
})
```

#### Argon2 Hash ile (Migration için)

```typescript
mcp_appwrite_users_create_argon2_user({
  user_id: "unique-user-id",
  email: "user@example.com",
  password: "$argon2id$v=19$m=65536,t=3,p=4$...",
  name: "John Doe"
})
```

### 2. Kullanıcıları Listeleme

#### Tüm Kullanıcılar

```typescript
mcp_appwrite_users_list({})
```

#### Arama ve Filtreleme

```typescript
mcp_appwrite_users_list({
  search: "john",
  queries: ["limit(10)", "offset(0)"],
  total: true
})
```

#### Durum Filtreleme

```typescript
mcp_appwrite_users_list({
  queries: [
    "equal(\"status\", true)",
    "limit(20)"
  ]
})
```

### 3. Oturum Oluşturma

```typescript
mcp_appwrite_users_create_session({
  user_id: "unique-user-id"
})
```

### 4. MFA Yönetimi

#### MFA'yı Etkinleştirme

```typescript
// 1. MFA'yı etkinleştir
mcp_appwrite_users_update_mfa({
  user_id: "unique-user-id",
  mfa: true
})

// 2. Kurtarma kodları oluştur
mcp_appwrite_users_create_mfa_recovery_codes({
  user_id: "unique-user-id"
})
```

#### MFA Faktörlerini Listeleme

```typescript
mcp_appwrite_users_list_mfa_factors({
  user_id: "unique-user-id"
})
```

### 5. Push Bildirimi Hedefi Oluşturma

```typescript
mcp_appwrite_users_create_target({
  user_id: "unique-user-id",
  target_id: "unique-target-id",
  provider_type: "push",
  identifier: "device-token-here",
  name: "iPhone 15 Pro"
})
```

### 6. Kullanıcı Güncelleme

```typescript
// E-posta güncelle
mcp_appwrite_users_update_email({
  user_id: "unique-user-id",
  email: "newemail@example.com"
})

// İsim güncelle
mcp_appwrite_users_update_name({
  user_id: "unique-user-id",
  name: "Jane Doe"
})

// Şifre güncelle
mcp_appwrite_users_update_password({
  user_id: "unique-user-id",
  password: "new-secure-password"
})
```

### 7. Kullanıcı Tercihleri

```typescript
// Tercihleri getir
mcp_appwrite_users_get_prefs({
  user_id: "unique-user-id"
})

// Tercihleri güncelle
mcp_appwrite_users_update_prefs({
  user_id: "unique-user-id",
  prefs: {
    theme: "dark",
    language: "tr",
    notifications: true
  }
})
```

### 8. Kullanıcı Silme

```typescript
mcp_appwrite_users_delete({
  user_id: "unique-user-id"
})
```

---

## Güvenlik

### ⚠️ Önemli Notlar

1. **API Key Güvenliği**
   - API key'leri asla git repository'sine commit etmeyin
   - `.env.local` dosyası zaten `.gitignore`'da
   - API key'leri güvenli bir yerde saklayın

2. **Şifre Yönetimi**
   - Düz metin şifreler minimum 8 karakter olmalı
   - Production'da hash'lenmiş şifreler kullanın
   - Migration senaryolarında uygun hash algoritmasını seçin

3. **Oturum Yönetimi**
   - Düzenli olarak aktif olmayan oturumları temizleyin
   - JWT token'ları güvenli bir şekilde saklayın

4. **MFA**
   - MFA'yı etkinleştirdiğinizde mutlaka kurtarma kodları oluşturun
   - Kurtarma kodlarını güvenli bir yerde saklayın

### Best Practices

1. **User ID Formatı**
   - `ID.unique()` kullanarak otomatik ID oluşturun
   - Veya özel ID'ler için: a-z, A-Z, 0-9, nokta, tire, alt çizgi
   - Özel karakter ile başlamamalı
   - Maksimum 36 karakter

2. **Tercihler**
   - Tercihler maksimum 64kB olabilir
   - Büyük veriler için database kullanın

3. **Sorgular**
   - Maksimum 100 sorgu
   - Her sorgu maksimum 4096 karakter
   - Limit ve offset kullanarak sayfalama yapın

---

## Sorun Giderme

### "uvx command not found"

**Neden**: `uv` paket yöneticisi kurulu değil

**Çözüm**:
```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### "Authentication failed"

**Neden**: API key veya project ID yanlış

**Çözüm**:
1. `.env.local` dosyasını kontrol edin
2. API key'in doğru izinlere sahip olduğundan emin olun
3. Project ID'nin doğru olduğundan emin olun
4. Endpoint URL'sinin doğru olduğundan emin olun

### "MCP server başlatılamadı"

**Neden**: Python veya uv sorunu

**Çözüm**:
```bash
# Python versiyonunu kontrol et
python3 --version  # Python 3.8+ olmalı

# uv versiyonunu kontrol et
uv --version

# Manuel test
uvx mcp-server-appwrite --help
```

### "No MCP Resources Found"

**Neden**: Bu normal bir durum

**Açıklama**: MCP resources ve MCP tools farklı şeylerdir. Tools kullanılabilir durumda olsa bile resources listelenmeyebilir.

### "User creation fails"

**Neden**: User ID formatı veya şifre gereksinimleri

**Çözüm**:
- User ID formatını kontrol edin (özel karakter ile başlamamalı, max 36 karakter)
- E-posta formatının geçerli olduğundan emin olun
- Şifrenin minimum gereksinimleri karşıladığından emin olun (8 karakter)

### Environment Variables Okunmuyor

**Neden**: Cursor IDE environment variables'ı okumuyor

**Çözüm**:
1. `.env.local` dosyasının proje kök dizininde olduğundan emin olun
2. Cursor IDE'yi yeniden başlatın
3. Environment variables'ları doğrudan `mcp_settings.json`'a ekleyebilirsiniz (güvenlik riski)

---

## Proje Entegrasyonu

Bu projede Appwrite zaten yapılandırılmış:

- ✅ `src/lib/appwrite/config.ts` - Yapılandırma
- ✅ `src/lib/appwrite/client.ts` - Client-side SDK
- ✅ `src/lib/appwrite/server.ts` - Server-side SDK
- ✅ `src/lib/appwrite/api-client.ts` - API client
- ✅ `src/lib/appwrite/api.ts` - API helpers

MCP araçları bu SDK client'larını tamamlar:
1. **Doğrudan CLI erişimi** kullanıcı yönetimi işlemleri için
2. **Hızlı test** kod yazmadan kullanıcı işlemlerini test etme
3. **Yönetimsel görevler** toplu kullanıcı işlemleri için
4. **Hata ayıklama** kimlik doğrulama sorunlarını çözme

---

## İlgili Dokümantasyon

- [Appwrite MCP Guide (English)](./appwrite-mcp-guide.md)
- [Appwrite Migration Plan](./appwrite-migration-plan.md)
- [Appwrite Migration Guide](./appwrite-migration.md)
- [MCP Setup Guide](../.cursor/MCP_SETUP.md)
- [Appwrite Official Docs](https://appwrite.io/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

## Hızlı Referans

### Cursor'da Kullanım

Cursor'da şu komutları deneyin:

```
"Appwrite'da kaç kullanıcı var?"
"Appwrite'da yeni kullanıcı oluştur: test@example.com"
"Appwrite kullanıcılarını listele"
"test@example.com kullanıcısı için oturum oluştur"
"Appwrite'da aktif kullanıcıları göster"
```

### Test Etme

MCP server'ın çalıştığını test etmek için:

1. Cursor IDE'yi yeniden başlatın
2. Chat'te şu komutu deneyin: "Appwrite kullanıcılarını listele"
3. Eğer hata alırsanız, yukarıdaki sorun giderme bölümüne bakın

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0.0

