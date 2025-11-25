# Docker MCP Registry Contribution Guide

Bu rehber, Docker MCP Registry'ye MCP sunucusu eklemek için gereken adımları özetler.

## Genel Bakış

Docker MCP Registry'ye iki tür MCP sunucusu eklenebilir:

### 🏠 Local Servers (Containerized)
- Dockerfile gerektirir
- Docker container'larında çalışır
- Docker Hub'da `mcp` namespace'inde barındırılır
- Güvenlik özellikleri: imzalar, provenance, SBOM, otomatik güncellemeler

### 🌐 Remote Servers (Hosted)
- Harici olarak barındırılır
- HTTP(S) üzerinden erişilir
- `streamable-http` veya `sse` transport protokolleri
- OAuth authentication destekler
- Dinamik tool discovery

## Gereksinimler

- Go v1.24+
- Docker Desktop
- Task (build tool)

## Local MCP Server Ekleme

### 1. Repository Fork ve Clone

```bash
# Repository'yi fork edin ve clone edin
git clone https://github.com/your-username/docker-mcp-registry.git
cd docker-mcp-registry
```

### 2. Server Yapılandırması Oluşturma

#### Yöntem 1: Wizard Kullanarak (Önerilen)

```bash
task wizard
```

Wizard şunları yapar:
- GitHub repo URL'sini analiz eder
- Dockerfile'dan varsayılan değerleri çıkarır
- Environment variables, secrets ve volumes eklemenize izin verir

#### Yöntem 2: Task Create Komutu

```bash
task create -- --category database https://github.com/myorg/my-orgdb-mcp -e API_TOKEN=test
```

**Parametreler:**
- `--category`: Server kategorisi (zorunlu)
- GitHub URL: Server repository URL'si
- `-e KEY=value`: Environment variables

**Örnek:**
```bash
task create -- --category database https://github.com/myorg/my-orgdb-mcp -e API_TOKEN=test -e MY_ORG=my-org
```

**Özel Docker Image:**
```bash
task create -- --category database --image myorg/my-mcp https://github.com/myorg/my-orgdb-mcp -e API_TOKEN=test
```

### 3. Oluşturulan Dosya Yapısı

```
servers/my-orgdb-mcp/
└── server.yaml
```

**Örnek server.yaml:**
```yaml
name: my-orgdb-mcp
image: mcp/my-orgdb-mcp
type: server
meta:
  category: database
  tags:
    - database
about:
  title: My OrgDB MCP (TODO)
  description: TODO
  icon: https://avatars.githubusercontent.com/u/182288589?s=200&v=4
source:
  project: https://github.com/myorg/my-orgdb-mcp
  commit: 0123456789abcdef0123456789abcdef01234567
config:
  description: Configure the connection to TODO
  secrets:
    - name: my-orgdb-mcp.api_token
      env: API_TOKEN
      example: <API_TOKEN>
```

### 4. Config Block Yapılandırması

**Secrets ve Env Vars:**
```yaml
config:
  description: Configure the connection to AWS
  secrets:
    - name: tigris.aws_secret_access_key
      env: AWS_SECRET_ACCESS_KEY
      example: YOUR_SECRET_ACCESS_KEY_HERE
  env:
    - name: AWS_ACCESS_KEY_ID
      example: YOUR_ACCESS_KEY_HERE
      value: '{{tigris.aws_access_key_id}}'
    - name: AWS_ENDPOINT_URL_S3
      example: https://fly.storage.tigris.dev
      value: '{{tigris.aws_endpoint_url_s3}}'
  parameters:
    type: object
    properties:
      aws_access_key_id:
        type: string
    required:
      - aws_access_key_id
```

### 5. Tools.json (Opsiyonel)

Eğer MCP server tool'ları listelemek için yapılandırma gerektiriyorsa, `tools.json` dosyası oluşturun:

```json
[
  {
    "name": "tools_name",
    "description": "description of what you tool does",
    "arguments": [
      {
        "name": "name_of_the_argument",
        "type": "string",
        "desc": ""
      }
    ]
  },
  {
    "name": "another_tool",
    "description": "description of what another tool",
    "arguments": [
      {
        "name": "name_of_the_argument",
        "type": "string",
        "desc": ""
      }
    ]
  }
]
```

Bu dosya `server.yaml` yanına yerleştirilir ve build sürecinde tool'ları listelemek için kullanılır.

### 6. Test Etme

```bash
# Image build (kendi image'ınızı kullanmıyorsanız)
task build -- --tools my-orgdb-mcp

# Catalog oluştur
task catalog -- my-orgdb-mcp

# Docker Desktop'a import et
docker mcp catalog import $PWD/catalogs/my-orgdb-mcp/catalog.yaml
```

Docker Desktop'ta MCP Toolkit'te yeni server'ınızı görebilirsiniz.

**Test sonrası temizlik:**
```bash
docker mcp catalog reset
```

## Remote MCP Server Ekleme

### 1. Wizard Kullanarak

```bash
task remote-wizard
```

Wizard şunları sorar:
- Server name ve category
- Title, description, icon URL, documentation URL
- Transport type (streamable-http veya sse)
- Server URL
- OAuth gereksinimi (evet/hayır)

### 2. Oluşturulan Dosya Yapısı

```
servers/my-remote-server/
├── server.yaml      # Server configuration
├── tools.json       # Always [] for remote servers
└── readme.md        # Documentation link
```

### 3. Remote Server Örnekleri

**OAuth ile (servers/linear örneği):**
```yaml
name: linear
type: remote
dynamic:
  tools: true
meta:
  category: productivity
  tags:
    - productivity
    - project-management
    - remote
about:
  title: Linear
  description: Track issues and plan sprints
  icon: https://www.google.com/s2/favicons?domain=linear.app&sz=64
remote:
  transport_type: streamable-http
  url: https://mcp.linear.app/mcp
oauth:
  - provider: linear
    secret: linear.personal_access_token
    env: LINEAR_PERSONAL_ACCESS_TOKEN
```

**OAuth olmadan (servers/cloudflare-docs örneği):**
```yaml
name: cloudflare-docs
type: remote
meta:
  category: documentation
  tags:
    - documentation
    - cloudflare
    - remote
about:
  title: Cloudflare Docs
  description: Access the latest documentation on Cloudflare products
  icon: https://www.cloudflare.com/favicon.ico
remote:
  transport_type: sse
  url: https://docs.mcp.cloudflare.com/sse
```

### 4. Remote Server Test Etme

```bash
# Catalog oluştur
task catalog -- my-remote-server

# Docker Desktop'a import et
docker mcp catalog import $PWD/catalogs/my-remote-server/catalog.yaml

# Server'ı etkinleştir
docker mcp server enable my-remote-server

# OAuth ile authorize et (gerekirse)
docker mcp oauth authorize my-remote-server

# Gateway'i başlat ve test et
docker mcp gateway run
```

**Test sonrası temizlik:**
```bash
docker mcp catalog reset
```

## Pull Request Süreci

### Checklist

- [ ] License uyumlu (MIT veya Apache 2 önerilir, GPL değil)
- [ ] Repository fork edildi ve clone edildi
- [ ] `servers/` klasöründe yeni klasör ve `server.yaml` eklendi
- [ ] PR başlığı ve açıklaması içeriği yansıtıyor
- [ ] CI testleri geçiyor
- [ ] Test credentials paylaşıldı (form ile)
- [ ] Docker team review'ı bekleniyor

### PR Onayı Sonrası

Onaylandıktan sonra:
- Tüm commit'ler tek bir commit'e squash edilir
- 24 saat içinde şu yerlerde kullanılabilir olur:
  - MCP catalog
  - Docker Desktop MCP Toolkit
  - Docker Hub `mcp` namespace (Docker tarafından build edilenler için)

## Önemli Notlar

### Local Servers

- **Docker Image**: Eğer kendi image'ınızı sağlamazsanız, Docker sizin için build eder ve `mcp` namespace'inde barındırır
- **Güvenlik**: Docker tarafından build edilen image'lar şunları içerir:
  - Cryptographic signatures
  - Provenance tracking
  - SBOMs (Software Bill of Materials)
  - Automatic security updates
- **Self-built images**: Container isolation sağlar ancak yukarıdaki güvenlik özelliklerini içermez

### Remote Servers

- **Tools.json**: Her zaman boş array `[]` olmalı (dinamik tool discovery kullanır)
- **Readme.md**: Documentation link içermelidir (zorunlu)
- **OAuth**: Gerekirse wizard otomatik olarak yapılandırır

### Build Hatalarını Önleme

Eğer MCP server tool'ları listelemek için yapılandırma gerektiriyorsa, `tools.json` dosyası oluşturun. Bu, build sürecinin server'ı çalıştırmaya çalışmasını önler.

## Kaynaklar

- [Docker MCP Registry Repository](https://github.com/docker/mcp-registry)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Docker Desktop MCP Toolkit](https://docs.docker.com/desktop/mcp/)

## Sorun Giderme

### Build --tools Hatası

**Sorun**: Server tool'ları listelemek için yapılandırma gerektiriyor

**Çözüm**: `tools.json` dosyası oluşturun (yukarıdaki örneğe bakın)

### CI Testleri Başarısız

**Sorun**: CI pipeline'da hatalar var

**Çözüm**:
1. Local'de test edin: `task build -- --tools your-server`
2. Catalog oluşturun: `task catalog -- your-server`
3. Docker Desktop'ta test edin
4. Hataları düzeltin ve tekrar commit edin

### OAuth Yapılandırması

**Sorun**: Remote server için OAuth nasıl yapılandırılır?

**Çözüm**: Wizard kullanın (`task remote-wizard`), OAuth gereksinimini belirtin ve wizard otomatik yapılandırır.

