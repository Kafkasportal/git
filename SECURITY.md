# Güvenlik Politikası

## 🛡️ Desteklenen Sürümler

Aşağıdaki sürümler güvenlik güncellemeleri almaktadır:

| Sürüm | Destekleniyor |
| ----- | ------------- |
| 0.1.x | ✅ Aktif |

## 🔐 Güvenlik Açığı Bildirimi

Güvenlik açığı bulduğunuzda, lütfen aşağıdaki adımları izleyin:

### ⚠️ Önemli

**Güvenlik açıklarını GitHub Issues üzerinden bildirmeyin.** Bu, açığın kötüye kullanılmasına yol açabilir.

### 📧 Bildirme Yöntemi

1. Güvenlik açığını e-posta ile bildirin
2. Aşağıdaki bilgileri ekleyin:
   - Açığın türü (XSS, SQL Injection, CSRF, vb.)
   - Etkilenen bileşenler
   - Tekrar etme adımları
   - Potansiyel etki

### ⏱️ Yanıt Süresi

- İlk yanıt: 48 saat içinde
- Değerlendirme: 7 gün içinde
- Düzeltme: Ciddiyete göre 30-90 gün

### 🏆 Teşekkür

Sorumlu açıklama yapan güvenlik araştırmacılarına teşekkür ederiz. Onay vermeniz halinde, README'de adınızı listeleyebiliriz.

## 🔒 Güvenlik Önlemleri

Bu projede uygulanan güvenlik önlemleri:

- ✅ CSRF token koruması
- ✅ Rate limiting
- ✅ HttpOnly cookie oturumları
- ✅ Rol tabanlı erişim kontrolü (RBAC)
- ✅ Input sanitizasyonu
- ✅ SQL injection koruması
- ✅ XSS koruması
- ✅ Güvenli dosya yükleme
- ✅ Audit logging

## 📋 Güvenlik Kontrol Listesi

Katkıda bulunanlar için güvenlik kontrol listesi:

- [ ] Kullanıcı girdileri sanitize edildi mi?
- [ ] Hassas veriler loglarda görünmüyor mu?
- [ ] API endpoint'leri yetkilendirme gerektiriyor mu?
- [ ] Rate limiting uygulandı mı?
- [ ] CSRF koruması var mı?
- [ ] Dosya yüklemeleri doğrulandı mı?
