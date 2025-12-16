# Google OAuth2 Setup Guide

Bu rehber, uygulamanızda Google OAuth2 kimlik doğrulamasını yapılandırmanız için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

- Google Cloud Console hesabı
- Appwrite projenizde Auth ayarlarına erişim
- Appwrite projenizin endpoint bilgisi

## 🔧 Adım 1: Google Cloud Console'da OAuth2 Credentials Oluşturma

### 1.1. Google Cloud Console'a Giriş

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Projenizi seçin veya yeni bir proje oluşturun

### 1.2. OAuth Consent Screen Yapılandırması

1. Sol menüden **APIs & Services** → **OAuth consent screen** seçin
2. User Type seçin:
   - **Internal**: Sadece kuruluşunuzdaki kullanıcılar için (Google Workspace)
   - **External**: Herkes için (genel kullanım)
3. Gerekli bilgileri doldurun:
   - **App name**: Uygulamanızın adı (örn: "Dernek Yönetim Sistemi")
   - **User support email**: Destek e-posta adresiniz
   - **Developer contact information**: Geliştirici iletişim bilgileri
4. **Save and Continue** butonuna tıklayın
5. Scopes ekleyin (varsayılan scopes genellikle yeterlidir)
6. Test users ekleyin (External kullanıcı tipi seçtiyseniz)
7. **Save and Continue** ile ilerleyin

### 1.3. OAuth2 Client ID Oluşturma

1. Sol menüden **APIs & Services** → **Credentials** seçin
2. Üstteki **+ CREATE CREDENTIALS** butonuna tıklayın
3. **OAuth client ID** seçin
4. **Application type** olarak **Web application** seçin
5. **Name** alanına bir isim verin (örn: "Dernek Yönetim Sistemi - Web")
6. **Authorized redirect URIs** bölümüne Appwrite'dan aldığınız redirect URI'yi ekleyin:
   ```
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/6927aa95001c4c6b488b
   ```
   **Not**: Bu URI, Appwrite konsolunuzdaki Google OAuth ayarlarında gösterilir. Kendi Appwrite endpoint'inize göre değişecektir.

7. **CREATE** butonuna tıklayın
8. Açılan pencerede **Client ID** ve **Client Secret** değerlerini kopyalayın
   - ⚠️ **Önemli**: Client Secret'ı güvenli bir yerde saklayın, bir daha gösterilmeyecek!

## 🔐 Adım 2: Appwrite'da Google OAuth2 Yapılandırması

### 2.1. Appwrite Console'a Giriş

1. [Appwrite Console](https://cloud.appwrite.io/) adresine gidin
2. Projenizi seçin
3. Sol menüden **Auth** → **Providers** seçin
4. **Google** provider'ını bulun ve tıklayın

### 2.2. Google OAuth Ayarlarını Doldurma

1. **Enabled** toggle'ını açın
2. **App ID** alanına Google Cloud Console'dan aldığınız **Client ID**'yi yapıştırın
   - ❌ **Yanlış**: `APPWRITE_ENDPOINT` veya endpoint URL'i
   - ✅ **Doğru**: `123456789-abcdefghijklmnop.apps.googleusercontent.com` formatında bir Client ID
3. **App Secret** alanına Google Cloud Console'dan aldığınız **Client Secret**'ı yapıştırın
   - Format: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`
4. **Save** butonuna tıklayın

### 2.3. Redirect URI'yi Kopyalama

1. Kaydettikten sonra, sayfada gösterilen **Redirect URI**'yi kopyalayın
2. Bu URI'yi Google Cloud Console'daki **Authorized redirect URIs** listesine eklediğinizden emin olun

## ✅ Adım 3: Doğrulama ve Test

### 3.1. Ayarları Kontrol Etme

1. Appwrite'da Google OAuth ayarlarının kaydedildiğini doğrulayın
2. Google Cloud Console'da redirect URI'nin eklendiğini kontrol edin
3. OAuth consent screen'in yayınlandığını kontrol edin (External kullanıcı tipi için)

### 3.2. Test Etme

1. Uygulamanızın login sayfasına gidin
2. **Google ile Giriş** butonuna tıklayın
3. Google hesabınızla giriş yapmayı deneyin
4. Başarılı bir şekilde yönlendirilip giriş yapabildiğinizi kontrol edin

## 🔍 Sorun Giderme

### Hata: "redirect_uri_mismatch"

**Sorun**: Google Cloud Console'daki redirect URI, Appwrite'daki redirect URI ile eşleşmiyor.

**Çözüm**:
1. Appwrite'daki Google OAuth ayarlarından redirect URI'yi kopyalayın
2. Google Cloud Console → Credentials → OAuth 2.0 Client ID'leriniz → Edit
3. Redirect URI'yi tam olarak eşleştiğinden emin olun (büyük/küçük harf, trailing slash, vb.)

### Hata: "invalid_client"

**Sorun**: Client ID veya Client Secret yanlış girilmiş.

**Çözüm**:
1. Google Cloud Console'dan Client ID ve Client Secret'ı yeniden kopyalayın
2. Appwrite'daki ayarları güncelleyin
3. Boşluk veya fazladan karakter olmadığından emin olun

### Hata: "access_denied"

**Sorun**: OAuth consent screen yayınlanmamış veya test kullanıcısı eklenmemiş.

**Çözüm**:
1. Google Cloud Console → OAuth consent screen
2. External kullanıcı tipi seçtiyseniz, test kullanıcıları ekleyin
3. Veya OAuth consent screen'i yayınlayın (production için)

### App ID Alanında "APPWRITE_ENDPOINT" Görünüyor

**Sorun**: App ID alanına yanlış değer girilmiş.

**Çözüm**:
1. App ID alanını temizleyin
2. Google Cloud Console'dan aldığınız **Client ID**'yi yapıştırın
3. Client ID formatı: `xxxxx-xxxxx.apps.googleusercontent.com`

## 📝 Önemli Notlar

1. **Client Secret Güvenliği**: Client Secret'ı asla public repository'lere commit etmeyin
2. **Redirect URI**: Her Appwrite projesi için farklı bir redirect URI kullanılır
3. **OAuth Consent Screen**: Production kullanımı için OAuth consent screen'in yayınlanması gerekir
4. **Rate Limits**: Google OAuth için rate limit'ler vardır, aşırı kullanımdan kaçının
5. **Test Users**: External kullanıcı tipi için test aşamasında test kullanıcıları eklemeniz gerekir

## 🔗 İlgili Dokümantasyon

- [Appwrite OAuth Documentation](https://appwrite.io/docs/authentication/oauth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🆘 Destek

Sorun yaşıyorsanız:
1. Appwrite Console'daki Auth logs'ları kontrol edin
2. Google Cloud Console'daki OAuth consent screen ve credentials ayarlarını gözden geçirin
3. Tarayıcı console'unda hata mesajlarını kontrol edin
