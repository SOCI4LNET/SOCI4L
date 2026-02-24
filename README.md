# SOCI4L .

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
- **Data Providers**: SnowTrace API (Assets), OpenSea API (NFTs), CoinGecko (Prices)
- **Veritabanı**: Prisma + SQLite / PostgreSQL

## Kurulum
...
### Adım 3: Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun:

```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
```

**⚠️ Önemli**: Development'ta SQLite kullanıyorsanız, schema PostgreSQL için ayarlıdır. Production (Vercel) deploy için PostgreSQL veritabanı gereklidir. Detaylar için `docs/VERCEL_SETUP.md` dosyasına bakın.

Opsiyonel değişkenler:
- `NEXT_PUBLIC_AVALANCHE_RPC`: Avalanche RPC endpoint (varsayılan: public RPC)
- `OPENSEA_API_KEY`: **Önerilen** - OpenSea API v2 anahtarı (NFT'leri profesyonel seviyede görüntülemek için)
  - OpenSea API v2 kullanarak Avalanche zincirindeki NFT'leri çeker
  - Ücretsiz API anahtarı almak için: https://opensea.io/api
  - API anahtarı olmadan NFT'ler RPC fallback ile gösterilir (sınırlı)
- `SNOWTRACE_API_KEY`: Snowtrace API anahtarı (opsiyonel - ücretsiz plan API key gerektirmez)
  - **ÜCRETSİZ PLAN**: 2 req/saniye, 10,000 çağrı/gün (API key olmadan çalışır!)
  - API key sadece daha yüksek limitler için gerekli
  - Ücretsiz API key almak için: https://snowtrace.io/apis
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect Project ID

...

## Notlar

- **Data Fetching**: Token ve NFT bakiyeleri SnowTrace API ve RPC fallback sistemi ile çekilir. Moralis veya benzeri ücretli middleware'lere ihtiyaç duyulmaz.
- API anahtarları opsiyoneldir. Anahtar olmadan da temel işlevler çalışır (ücretsiz limitlerle).

## Test Etme

### Assets Sayfasını Test Etme

1. Token bakiyesi olan bir cüzdan adresi ile test edin:
   ```
   /dashboard/0x.../assets
   ```

2. Console loglarını kontrol edin (F12 > Console):
   - `[Assets Panel]` - UI tarafı logları
   - `[Assets API]` - API route logları

3. Bilinen zengin cüzdanlar (test için):
   - Avalanche Foundation: `0x8eb8a3b98659C8f2725A7743C832d2bF852FDF20`
   - veya kendi cüzdanınızı kullanın

4. Hata durumlarını test edin:
   - Geçersiz adres: 400 hatası
   - Rate limit: 429 hatası (retry butonu ile tekrar deneyin)
- Veritabanı SQLite kullanır, production için PostgreSQL önerilir
- Cache mekanizması basit in-memory cache kullanır (production için Redis önerilir)

## Lisans

MIT
