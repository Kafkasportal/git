# Appwrite Global Environment Variables

Bu dokümantasyon, Appwrite Console'da oluşturulması gereken global environment variable'ları listeler.

## Appwrite Console'da Oluşturma

1. Appwrite Console'a giriş yapın
2. Projenizi seçin
3. **Settings** > **Environment Variables** bölümüne gidin
4. **Create Variable** butonuna tıklayın
5. Aşağıdaki variable'ları tek tek oluşturun

## Zorunlu Environment Variables

### Appwrite Configuration

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Public | Appwrite endpoint URL | `https://cloud.appwrite.io/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Public | Appwrite Project ID | `6927aa95001c4c6b488b` |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | Public | Appwrite Database ID | `kafkasder_db` |
| `APPWRITE_API_KEY` | Secret | Appwrite Server API Key | `your-api-key-here` |

**Not:** `NEXT_PUBLIC_` prefix'li variable'lar client-side'da kullanılabilir (public). `APPWRITE_API_KEY` secret olarak işaretlenmelidir.

## Opsiyonel Environment Variables

### Security & Session

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `CSRF_SECRET` | Secret | CSRF token secret (min 32 karakter) | `your-32-char-csrf-secret-key-here` |
| `SESSION_SECRET` | Secret | Session secret (min 32 karakter) | `your-32-char-session-secret-key-here` |

### Email Configuration (SMTP)

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `SMTP_HOST` | Secret | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Secret | SMTP server port | `587` |
| `SMTP_USER` | Secret | SMTP username/email | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Secret | SMTP password/app password | `your-app-password` |
| `SMTP_FROM` | Secret | Default sender email | `noreply@kafkasder.com` |

### SMS Configuration (Twilio)

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `TWILIO_ACCOUNT_SID` | Secret | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Secret | Twilio Auth Token | `your-auth-token` |
| `TWILIO_PHONE_NUMBER` | Secret | Twilio phone number | `+905551234567` |

### Rate Limiting

| Variable Name | Type | Description | Default Value |
|--------------|------|-------------|---------------|
| `RATE_LIMIT_MAX_REQUESTS` | Public | Maximum requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Public | Rate limit window in milliseconds | `900000` (15 dakika) |

### File Upload Limits

| Variable Name | Type | Description | Default Value |
|--------------|------|-------------|---------------|
| `MAX_FILE_SIZE` | Public | Maximum file size in bytes | `10485760` (10 MB) |
| `MAX_FILES_PER_UPLOAD` | Public | Maximum files per upload | `5` |

### Application Settings

| Variable Name | Type | Description | Default Value |
|--------------|------|-------------|---------------|
| `NEXT_PUBLIC_APP_NAME` | Public | Application name | `Dernek Yönetim Sistemi` |
| `NEXT_PUBLIC_APP_VERSION` | Public | Application version | `1.0.0` |
| `NEXT_PUBLIC_ENABLE_REALTIME` | Public | Enable real-time features | `true` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Public | Enable analytics | `false` |

## Variable Types

- **Public**: Client-side'da kullanılabilir (browser'da görülebilir)
- **Secret**: Sadece server-side'da kullanılır, client'a expose edilmez

## Önemli Notlar

1. **Secret Variables**: Hassas bilgiler (API keys, passwords) mutlaka **Secret** olarak işaretlenmelidir
2. **NEXT_PUBLIC_ Prefix**: Bu prefix'li variable'lar client-side'da kullanılabilir, dikkatli olun
3. **Production vs Development**: Production'da tüm secret variable'lar doldurulmalıdır
4. **Variable Names**: Variable isimleri büyük/küçük harf duyarlıdır, tam olarak yazılmalıdır

## Appwrite Console'da Oluşturma Adımları

1. **Appwrite Console** > **Settings** > **Environment Variables**
2. **Create Variable** butonuna tıklayın
3. **Key**: Variable adını girin (örn: `NEXT_PUBLIC_APPWRITE_ENDPOINT`)
4. **Value**: Variable değerini girin
5. **Type**: 
   - Public variable'lar için: **Public** seçin
   - Secret variable'lar için: **Secret** seçin
6. **Save** butonuna tıklayın

## Deploy Sonrası Kontrol

Deploy sonrası environment variable'ların yüklendiğini kontrol etmek için:

```bash
# Health check endpoint'i ile kontrol edin
curl https://your-appwrite-site-url/api/health
```

## Sorun Giderme

### Variable Bulunamadı Hatası

- Variable isimlerinin tam olarak eşleştiğinden emin olun
- Public/Secret type'ının doğru seçildiğinden emin olun
- Deploy sonrası site'in yeniden başlatıldığından emin olun

### Secret Variable'lar Client'da Görünüyor

- `NEXT_PUBLIC_` prefix'i olmayan variable'lar secret olarak işaretlenmelidir
- Secret variable'lar client-side kodda kullanılmamalıdır

