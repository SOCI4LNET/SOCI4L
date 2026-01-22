# Avalanche Wallet Profile Hub

Avalanche C-Chain cüzdan adreslerini arayıp profil sayfalarını görüntüleyebileceğiniz bir Next.js web uygulaması.

## Özellikler

- 🔍 **Cüzdan Arama**: Herhangi bir Avalanche cüzdan adresini arayın
- 📊 **Profil Sayfaları**: UNCLAIMED, CLAIMED+PUBLIC, veya CLAIMED+PRIVATE durumları
- 🎨 **Profil Talep Etme**: Nonce + imza ile cüzdan sahipliğini kanıtlayın
- ⚙️ **Dashboard**: Profil sahipleri için tam kontrol paneli
- 🖼️ **NFT Vitrin**: Seçilen NFT'leri profil sayfasında sergileyin
- 🔒 **Gizlilik Kontrolü**: Profilleri halka açık veya özel yapın

## Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript
- **Stil**: Tailwind CSS + shadcn/ui
- **Blockchain**: wagmi + viem (Avalanche C-Chain)
- **Veritabanı**: Prisma + SQLite
- **API**: Snowtrace API (opsiyonel)

## Kurulum

### Ön Gereksinimler

Node.js ve pnpm kurulu olmalıdır. Kurulu değilse:

**macOS için (Homebrew ile):**
```bash
# Node.js kurulumu
brew install node

# pnpm kurulumu
npm install -g pnpm
```

**veya nvm ile:**
```bash
# nvm kurulumu (eğer yoksa)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.js kurulumu
nvm install --lts
nvm use --lts

# pnpm kurulumu
npm install -g pnpm
```

**Kurulumu kontrol edin:**
```bash
node --version  # v18.x.x veya üzeri olmalı
npm --version   # v9.x.x veya üzeri olmalı
pnpm --version  # v8.x.x veya üzeri olmalı
```

### Adım 1: Proje Bağımlılıklarını Yükleyin

```bash
corepack enable
pnpm install
```

**Not:** Eğer `corepack enable` çalışmazsa, pnpm zaten global olarak kuruluysa direkt `pnpm install` komutunu kullanabilirsiniz.

### Adım 2: shadcn/ui Yapılandırması

Proje zaten shadcn/ui ile yapılandırılmıştır. Yeni bileşen eklemek için:

```bash
pnpm dlx shadcn@latest add [component-name]
```

### Adım 3: Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun:

```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
```

Opsiyonel değişkenler:
- `NEXT_PUBLIC_AVALANCHE_RPC`: Avalanche RPC endpoint (varsayılan: public RPC)
- `SNOWTRACE_API_KEY`: Snowtrace API anahtarı (opsiyonel, gelişmiş veri için)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect Project ID (opsiyonel)

### Adım 4: Veritabanını Hazırlayın

```bash
pnpm db:generate
pnpm db:push
```

### Adım 5: Geliştirme Sunucusunu Başlatın

```bash
pnpm dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) açılıyorsa → tamamdır! ✅

## Kullanım

### Cüzdan Arama

Ana sayfada herhangi bir Avalanche C-Chain cüzdan adresini arayabilirsiniz. Sistem otomatik olarak:
- Native AVAX bakiyesini
- Token bakiyelerini
- NFT'leri
- İşlem geçmişini
- Profil durumunu gösterir

### Profil Talep Etme

1. Dashboard sayfasına gidin (`/dashboard`)
2. Cüzdanınızı bağlayın
3. "Profili Talep Et" butonuna tıklayın
4. İmza isteğini onaylayın

### Profil Yönetimi

Talep edilen profiller için dashboard'da şunları yapabilirsiniz:
- **Genel Bakış**: Cüzdan özeti ve profil bilgileri
- **Varlıklar**: Token bakiyeleri ve NFT'ler
- **Aktivite**: Son işlemler
- **Ayarlar**: 
  - Özel slug belirleme
  - Gizlilik ayarları (halka açık/özel)
  - NFT vitrin seçimi

## Proje Yapısı

```
/app
  /api          # API routes
  /dashboard     # Dashboard sayfası
  /p/[id]        # Profil sayfası
  page.tsx       # Ana sayfa (arama)
/components
  /ui            # shadcn/ui bileşenleri
/lib
  avalanche.ts   # Avalanche API entegrasyonu
  prisma.ts      # Prisma client
  utils.ts       # Yardımcı fonksiyonlar
/prisma
  schema.prisma  # Veritabanı şeması
```

## API Endpoints

- `GET /api/wallet?address=...` - Cüzdan verilerini getir
- `GET /api/profile?address=...` - Profil bilgilerini getir
- `POST /api/claim/nonce` - Claim için nonce oluştur
- `POST /api/claim` - Profil talep et
- `POST /api/profile/update` - Profil ayarlarını güncelle

## Notlar

- API anahtarları opsiyoneldir. Anahtar olmadan da temel işlevler çalışır
- Veritabanı SQLite kullanır, production için PostgreSQL önerilir
- Cache mekanizması basit in-memory cache kullanır (production için Redis önerilir)

## Lisans

MIT
