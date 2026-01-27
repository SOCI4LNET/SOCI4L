# Vercel Deployment Kurulum Rehberi

## Veritabanı Kurulumu

Bu proje Vercel'de PostgreSQL kullanır. Development'ta SQLite kullanmak için özel bir yapılandırma gereklidir.

### Vercel'de PostgreSQL Kurulumu

1. **Vercel Dashboard'a git**: https://vercel.com/dashboard
2. **Projenizi seçin**
3. **Settings > Environment Variables** bölümüne gidin
4. **PostgreSQL veritabanı ekleyin**:
   - Vercel Dashboard'da **Storage** sekmesine gidin
   - **Create Database** > **Postgres** seçin
   - Veritabanınızı oluşturun
   - Vercel otomatik olarak `POSTGRES_URL` environment variable'ını ekler

5. **DATABASE_URL environment variable'ını ayarlayın**:
   - Vercel Dashboard > Settings > Environment Variables
   - `DATABASE_URL` adında yeni bir variable ekleyin
   - Değer olarak PostgreSQL connection string'i kullanın:
     ```
     postgresql://user:password@host:5432/database?sslmode=require
     ```
   - Vercel Postgres kullanıyorsanız, `POSTGRES_URL` değerini `DATABASE_URL` olarak kopyalayabilirsiniz

### Development'ta SQLite Kullanımı (Opsiyonel)

Development'ta SQLite kullanmak istiyorsanız:

1. **Local `.env` dosyanızda**:
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

2. **Prisma schema'yı geçici olarak SQLite'a çevirin**:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Prisma client'ı yeniden generate edin**:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

**Not**: Production'a deploy etmeden önce schema'yı tekrar PostgreSQL'e çevirmeyi unutmayın!

### Otomatik Migration

Vercel'de deploy ederken migrations otomatik çalışır:
- `package.json`'daki `build` script'i `prisma migrate deploy` komutunu içerir
- Vercel build sırasında migrations otomatik uygulanır

### Connection Pooling (Önerilen)

Vercel serverless ortamında connection pooling önemlidir. PostgreSQL connection string'inize pooling parametreleri ekleyin:

```
postgresql://user:password@host:5432/database?sslmode=require&connection_limit=1&pool_timeout=20
```

Veya Vercel Postgres kullanıyorsanız, `POSTGRES_PRISMA_URL` environment variable'ını kullanın (pooling dahil).

## Environment Variables Checklist

Vercel'de şu environment variable'ları ayarlayın:

- ✅ `DATABASE_URL` - PostgreSQL connection string (production)
- ✅ `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect Project ID
- ✅ `NEXT_PUBLIC_ADMIN_ADDRESSES` - Admin wallet adresleri (virgülle ayrılmış)
- ⚙️ `OPENSEA_API_KEY` - OpenSea API key (opsiyonel)
- ⚙️ `MORALIS_API_KEY` - Moralis API key (opsiyonel)
- ⚙️ `SNOWTRACE_API_KEY` - Snowtrace API key (opsiyonel)

## Troubleshooting

### "Can't reach database server" Hatası

- Vercel'de `DATABASE_URL` environment variable'ının doğru ayarlandığından emin olun
- PostgreSQL veritabanının çalıştığından emin olun
- Connection string formatını kontrol edin

### Migration Hataları

- Vercel build loglarını kontrol edin
- Local'de `pnpm prisma migrate deploy` komutunu çalıştırarak test edin
- Migration dosyalarının git'e commit edildiğinden emin olun
