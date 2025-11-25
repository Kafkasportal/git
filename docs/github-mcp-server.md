# GitHub MCP Server Kullanım Kılavuzu

Bu doküman, Kafkasder Panel projesi için GitHub MCP (Model Context Protocol) Server kullanımını açıklar.

## Genel Bakış

GitHub MCP Server, AI asistanlarının (Claude, GitHub Copilot vb.) GitHub ile doğrudan etkileşime girmesini sağlar. Bu, kod incelemesi, issue yönetimi, PR oluşturma ve daha fazlası için güçlü otomasyon imkanları sunar.

## Mevcut Yetenekler

### 1. Repository Yönetimi

- **Repository Oluşturma**: Yeni GitHub repository'leri oluşturabilir
- **Fork İşlemleri**: Repository'leri fork edebilir
- **Dosya İşlemleri**:
  - Dosya oluşturma/güncelleme
  - Dosya silme
  - Çoklu dosya push işlemleri

### 2. Issue Yönetimi

- **Issue Listeleme**: Repository'deki issue'ları filtreleyerek listeler
- **Issue Oluşturma**: Yeni issue açabilir
- **Copilot Atama**: Issue'lara GitHub Copilot'u atayabilir (otomatik çözüm için)
- **Issue Tipleri**: Organizasyon için desteklenen issue tiplerini listeler
- **Yorum Ekleme**: Issue'lara yorum ekleyebilir

### 3. Pull Request (PR) Yönetimi

- **PR Listeleme**: Açık PR'ları listeler ve arar
- **PR Oluşturma**: Yeni pull request oluşturabilir
- **PR İnceleme**:
  - Copilot review talep edebilir
  - Review yorumları ekleyebilir
  - Review oluşturma, gönderme ve silme
- **Branch Güncelleme**: PR branch'ini base branch ile güncelleyebilir

### 4. Branch ve Commit İşlemleri

- **Branch Listeleme**: Repository'deki tüm branch'leri listeler
- **Branch Oluşturma**: Yeni branch oluşturabilir
- **Commit Detayları**: Commit bilgilerini görüntüler
- **Commit Listesi**: Branch'teki commit'leri listeler

### 5. Dosya ve Dizin İşlemleri

- **İçerik Görüntüleme**: Dosya ve dizin içeriklerini okuyabilir
- **Dosya Detayları**: Belirli bir dosyanın detaylı bilgilerini alır
- **Dizin Listeleme**: Dizin yapısını görüntüler

### 6. Arama ve Keşif

- **Kod Arama**: Tüm repository'lerde kod arar
- **Repository Arama**: GitHub'da repository arar
- **Kullanıcı Arama**: GitHub kullanıcılarını bulur
- **Issue Arama**: Semantic ve gelişmiş arama

### 7. Release ve Tag Yönetimi

- **Release Listeleme**: Tüm release'leri listeler
- **Tag Listeleme**: Repository tag'lerini görüntüler
- **Belirli Release**: Tag ismiyle release alır

### 8. Takım ve Kullanıcı Yönetimi

- **Takım Bilgileri**: Kullanıcının üye olduğu takımları listeler
- **Kullanıcı Profili**: Kullanıcı detaylarını görüntüler
- **Label Yönetimi**: Repository label'larını yönetir

## Kullanım Örnekleri

### Issue Oluşturma ve Copilot Atama

```bash
# AI asistana şöyle sorabilirsiniz:
"Bu projede 'Kullanıcı profil sayfası eksik' başlıklı bir issue aç ve Copilot'a ata"
```

AI asistan:

1. Issue oluşturacak
2. GitHub Copilot'u issue'ya atayacak
3. Copilot otomatik olarak PR açacak

### PR Review İsteme

```bash
"#42 numaralı PR için Copilot review'u iste"
```

### Kod Arama

```bash
"Bu projede authentication logic nerede kullanılıyor?"
```

### Dosya Güncelleme

```bash
"README.md dosyasını güncelleyip PR aç"
```

## Workflow Örnekleri

### Otomatik Bug Fix Workflow

1. **Issue Aç**: Bug raporu için issue oluştur
2. **Copilot Ata**: `assign_copilot_to_issue` ile Copilot'a ata
3. **PR İzle**: Copilot'un açtığı PR'ı izle
4. **Review**: Otomatik Copilot review iste
5. **Merge**: Onaylandıktan sonra merge et

### Feature Geliştirme Workflow

1. **Branch Oluştur**: Yeni feature branch'i oluştur
2. **Dosyaları Değiştir**: `push_files` ile çoklu dosya değişikliği
3. **PR Aç**: Feature branch'inden PR oluştur
4. **Review Al**: Copilot review + insan review
5. **Update Branch**: Gerekirse base branch ile güncelle
6. **Merge**: Tamamlandığında merge et

## Güvenlik ve Best Practices

### Güvenlik

- MCP Server, GitHub token'larınızı güvenli şekilde kullanır
- Token'lar asla loglanmaz veya saklanmaz
- Tüm işlemler GitHub API üzerinden yapılır

### Best Practices

1. **Issue Önce**: Her zaman değişiklik yapmadan önce issue oluşturun
2. **Atomic Commits**: Küçük, anlamlı commit'ler yapın
3. **PR Template**: PR açarken template'i takip edin
4. **Review Zorunluluğu**: Copilot review + insan review
5. **Branch Protection**: Main branch'i koruyun

## Sınırlamalar

- **Rate Limiting**: GitHub API rate limit'lerine tabidir
- **Token Yetkileri**: Token'ın yetkileri operasyonları sınırlar
- **Dosya Boyutu**: Büyük dosyalar için özel işlem gerekebilir
- **Binary Dosyalar**: Binary dosyalarla sınırlı çalışır

## Hata Ayıklama

### Yaygın Sorunlar

**Problem**: "Insufficient permissions" hatası
**Çözüm**: GitHub token'ın gerekli yetkilere sahip olduğundan emin olun

**Problem**: "Rate limit exceeded"
**Çözüm**: Bir süre bekleyin veya authenticated kullanıcı için limit artırın

**Problem**: "Branch not found"
**Çözüm**: Branch ismini kontrol edin, varsayılan `main` veya `master` olabilir

## İleri Düzey Kullanım

### Toplu İşlemler

```bash
# Çoklu dosya güncellemesi
"src/components/*.tsx dosyalarındaki tüm console.log'ları kaldır ve PR aç"
```

### Semantic Issue Arama

```bash
# Doğal dil ile arama
"Authentication ile ilgili açık issue'ları bul"
```

### Copilot Coding Agent

```bash
# Büyük görevler için
"Kullanıcı yönetim sistemini iyileştir #github-pull-request_copilot-coding-agent"
```

Hashtag kullanımı, Copilot'un arka planda çalışarak branch, değişiklikler ve PR oluşturmasını sağlar.

## Entegrasyon

### CI/CD ile Entegrasyon

MCP Server, CI/CD pipeline'larınızla entegre edilebilir:

- Test başarısız olunca otomatik issue açma
- Deploy sonrası release oluşturma
- PR merge sonrası branch temizliği

### Slack/Discord Entegrasyonu

GitHub webhook'ları ile:

- PR açıldığında bildirim
- Issue atandığında uyarı
- Review istendiğinde ping

## Kaynaklar

- [GitHub MCP Server Docs](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Copilot Coding Agent](https://docs.github.com/en/copilot/using-github-copilot/using-copilot-coding-agent-to-work-on-tasks)

## Örnekler

### Örnek 1: Hızlı Bug Fix

```
Kullanıcı: "Login sayfasında email validation hatası var"
AI:
  1. Issue oluşturuyor: "Fix: Email validation on login page"
  2. Copilot'a atıyor
  3. 5 dakika içinde PR açılıyor
  4. Review sonrası merge
```

### Örnek 2: Feature Request

```
Kullanıcı: "Kullanıcı profil düzenleme özelliği ekle"
AI:
  1. Feature issue oluşturuyor
  2. Branch oluşturuyor: "feat/user-profile-edit"
  3. Gerekli dosyaları oluşturuyor
  4. PR açıyor
  5. Copilot review istiyor
```

### Örnek 3: Refactoring

```
Kullanıcı: "Auth sistemini refactor et ve daha güvenli yap"
AI:
  1. Mevcut auth kodunu analiz ediyor
  2. Refactoring planı hazırlıyor
  3. Issue oluşturuyor
  4. Copilot coding agent ile implement ediyor
  5. Test coverage artırıyor
  6. PR açıp review istiyor
```

---

**Not**: Bu özellikler aktif olarak kullanılabilir durumda. AI asistanınıza (Claude, Copilot) doğrudan komutlar vererek bu işlemleri gerçekleştirebilirsiniz.
