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
   - **Prisma Postgres kullanıyorsanız (ÖNERİLEN)**:
     - Storage sekmesinde oluşturduğunuz Prisma Postgres veritabanına gidin (`soci4l-db`)
     - `.env.local` tab'ına gidin
     - `PRISMA_DATABASE_URL` veya `POSTGRES_URL` değerini kopyalayın
     - Bu değeri `DATABASE_URL` olarak Vercel environment variables'a ekleyin
     - ⚠️ **NOT**: `db.prisma.io` içeren URL'ler Prisma Postgres için geçerlidir - bu normaldir!
     - Detaylı adımlar için `docs/PRISMA_POSTGRES_SETUP.md` dosyasına bakın
   - **Vercel Postgres (standart) kullanıyorsanız**:
     - Storage sekmesinde oluşturduğunuz Postgres veritabanına gidin
     - `.env.local` veya Connection String bölümünden `POSTGRES_PRISMA_URL` değerini kopyalayın
     - Bu değeri `DATABASE_URL` olarak ekleyin (connection pooling dahil)
     - VEYA `POSTGRES_URL` değerini kopyalayıp `DATABASE_URL` olarak ekleyin
   - **Harici PostgreSQL kullanıyorsanız**:
     - Değer olarak PostgreSQL connection string'i kullanın:
       ```
       postgresql://user:password@host:5432/database?sslmode=require
       ```

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
- ⚙️ `SNOWTRACE_API_KEY` - Snowtrace API key (opsiyonel)

## Troubleshooting

### "Can't reach database server" Hatası

Bu hata genellikle şu nedenlerden kaynaklanır:

1. **DATABASE_URL yanlış yapılandırılmış**:
   - Vercel Dashboard > Settings > Environment Variables'a gidin
   - `DATABASE_URL` değerini kontrol edin
   - `db.prisma.io` veya placeholder değerler varsa, bunları silin ve doğru connection string'i ekleyin
   - Vercel Postgres kullanıyorsanız, Storage sekmesinden `POSTGRES_PRISMA_URL` değerini kopyalayıp `DATABASE_URL` olarak ayarlayın

2. **PostgreSQL veritabanı çalışmıyor**:
   - Vercel Dashboard > Storage sekmesine gidin
   - Postgres veritabanınızın durumunu kontrol edin
   - Veritabanı paused ise, resume edin

3. **Connection string formatı yanlış**:
   - Doğru format: `postgresql://user:password@host:5432/database?sslmode=require`
   - Vercel Postgres için: `POSTGRES_PRISMA_URL` değerini kullanın (pooling dahil)

4. **Environment variable production'da ayarlanmamış**:
   - Vercel'de environment variable'ları Production, Preview ve Development için ayrı ayrı ayarlanabilir
   - Production için de `DATABASE_URL`'in ayarlandığından emin olun

### Migration Hataları

- Vercel build loglarını kontrol edin
- Local'de `pnpm prisma migrate deploy` komutunu çalıştırarak test edin
- Migration dosyalarının git'e commit edildiğinden emin olun
