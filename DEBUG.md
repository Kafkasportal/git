# Debug Kılavuzu

## VS Code ile Debug

### 1. Login Route'unu Debug Etmek

1. **Breakpoint Koyun:**
   - `src/app/api/auth/login/route.ts` dosyasını açın
   - İstediğiniz satırın soluna tıklayarak breakpoint koyun (kırmızı nokta görünecek)
   - Veya satıra `debugger;` yazın (// işaretini kaldırarak)

2. **Debug'i Başlatın:**
   - VS Code'da `F5` tuşuna basın
   - Veya Debug panelini açın (`Ctrl+Shift+D`)
   - Üstten "Next.js: debug full stack" seçin
   - ▶️ (Start Debugging) butonuna tıklayın

3. **Login Test Edin:**
   - Browser açılacak (Chrome)
   - `http://localhost:3000/login` adresine gidin
   - Email ve şifre girin
   - Login butonuna tıklayın
   - Kod breakpoint'te duracak

4. **Debug Kontrolleri:**
   - **Step Over (F10):** Bir sonraki satıra geç
   - **Step Into (F11):** Fonksiyon içine gir
   - **Step Out (Shift+F11):** Fonksiyondan çık
   - **Continue (F5):** Devam et

5. **Variables Panel:**
   - Sol panelde değişkenleri görün
   - `email`, `password`, `sessionResponse` gibi değişkenleri kontrol edin
   - Hover ile değerleri görebilirsiniz

### 2. Önemli Breakpoint Noktaları

Login route'unda şu noktalara breakpoint koyabilirsiniz:

```typescript
// Satır ~27: CSRF token kontrolü
const headerToken = request.headers.get("x-csrf-token") || "";

// Satır ~39: Request body alınıyor
const body = await request.json();

// Satır ~135: Session oluşturma API çağrısı öncesi
const sessionResponse = await fetch(`${endpoint}/account/sessions/email`, {

// Satır ~171: Session oluşturma sonrası
const sessionData = await sessionResponse.json();

// Satır ~234: Başarılı login sonrası
recordLoginAttempt(email, true);
```

### 3. Watch Expressions

Debug sırasında önemli değişkenleri izlemek için:

1. Debug panelinde "Watch" bölümüne tıklayın
2. `+` işaretine tıklayın
3. İzlemek istediğiniz ifadeyi yazın:
   - `email`
   - `password.length`
   - `sessionResponse.status`
   - `appwriteUser?.$id`

### 4. Console'da Değer Yazdırma

Breakpoint'te dururken Console'da komut çalıştırabilirsiniz:

```javascript
// Console'da şunları yazabilirsiniz:
email
password
sessionResponse.status
appwriteUser
```

### 5. Debug Konfigürasyonları

- **Next.js: debug server-side** - Sadece API routes
- **Next.js: debug client-side** - Sadece browser kodları
- **Next.js: debug full stack** - Hem server hem client (ÖNERİLEN)

### 6. Chrome DevTools ile Debug

1. Terminal'de: `npm run dev -- --inspect`
2. Chrome'da: `chrome://inspect` adresine gidin
3. "inspect" linkine tıklayın
4. Sources tab'inde kodunuzu bulun

### 7. Sorun Giderme

**Breakpoint çalışmıyor:**
- Dosyayı kaydettiğinizden emin olun
- Debug'in çalıştığından emin olun (F5)
- Hot reload sonrası breakpoint'leri yeniden koyun

**Kod durmuyor:**
- `debugger;` statement kullanın
- Breakpoint'in aktif olduğundan emin olun (kırmızı dolu nokta)

**Port değişti:**
- `.vscode/launch.json` dosyasında `3000` yerine `3001` yazın
- Veya mevcut server'ı durdurun

## Örnek Debug Senaryosu

Login başarısız oluyorsa:

1. Breakpoint koyun: Satır 147 (`if (!sessionResponse.ok)`)
2. Login yapın
3. `sessionResponse.status` değerini kontrol edin
4. `errorData` içeriğini inceleyin
5. Hata mesajını görün

Bu sayede login sorununu hızlıca bulabilirsiniz!

