# Prisma Postgres Kurulum Rehberi (Vercel)

Bu rehber, Vercel'de Prisma Postgres kullanırken `DATABASE_URL` environment variable'ını nasıl ayarlayacağınızı açıklar.

## Sorun

Vercel'de Prisma Postgres kullanırken, Vercel otomatik olarak şu environment variable'ları ekler:
- `PRISMA_DATABASE_URL` - Prisma Accelerate ile connection pooling
- `POSTGRES_URL` - Standart PostgreSQL connection string
- `POSTGRES_PRISMA_URL` - Prisma için optimize edilmiş connection string

Ancak Prisma schema dosyanız `DATABASE_URL` environment variable'ını bekler. Bu yüzden Vercel'de `DATABASE_URL`'i manuel olarak ayarlamanız gerekir.

## Çözüm: Vercel'de DATABASE_URL Ayarlama

### Adım 1: Prisma Postgres Veritabanınızı Bulun

1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Sol menüden **Storage** sekmesine tıklayın
3. `soci4l-db` (veya veritabanınızın adı) veritabanınızı bulun ve tıklayın

### Adım 2: Connection String'i Kopyalayın

Veritabanı sayfasında şu seçeneklerden birini kullanın:

**Seçenek A: PRISMA_DATABASE_URL (Önerilen - Connection Pooling Dahil)**
- `.env.local` tab'ına gidin
- `PRISMA_DATABASE_URL` değerini bulun
- "Copy Snippet" butonuna tıklayın veya değeri kopyalayın
- Bu değer şuna benzer olacak:
  ```
  postgres://user:password@db.prisma.io:5432/postgres?sslmode=require
  ```

**Seçenek B: POSTGRES_URL (Alternatif)**
- `.env.local` tab'ına gidin
- `POSTGRES_URL` değerini bulun
- "Copy Snippet" butonuna tıklayın veya değeri kopyalayın

**Seçenek C: Prisma Accelerate (En İyi Performans)**
- Eğer Prisma Accelerate kullanıyorsanız, `prisma+postgres://accelerate.prisma-data.net/...` formatındaki URL'yi kullanın

### Adım 3: Vercel Projenizde DATABASE_URL Ayarlayın

1. Vercel Dashboard'da projenize gidin (Storage değil, ana proje sayfası)
2. **Settings** sekmesine tıklayın
3. Sol menüden **Environment Variables** seçeneğine tıklayın
4. **Add New** butonuna tıklayın
5. Şu bilgileri girin:
   - **Key**: `DATABASE_URL`
   - **Value**: Adım 2'de kopyaladığınız connection string'i yapıştırın
   - **Environment**: Tüm ortamlar için seçin (Production, Preview, Development) veya sadece Production
6. **Save** butonuna tıklayın

### Adım 4: Deploy Edin

1. Vercel Dashboard'da projenize gidin
2. **Deployments** sekmesine tıklayın
3. En son deployment'ın yanındaki **...** menüsüne tıklayın
4. **Redeploy** seçeneğini seçin
5. Veya yeni bir commit push edin - otomatik deploy olacak

## Doğrulama

Deploy sonrası, uygulamanızın çalıştığını kontrol edin:
- Veritabanı bağlantı hataları olmamalı
- Profil sayfaları yüklenmeli
- Follow butonu çalışmalı

## Troubleshooting

### "Can't reach database server at db.prisma.io:5432" Hatası

Bu hata genellikle şu nedenlerden kaynaklanır:

1. **DATABASE_URL ayarlanmamış**: Vercel'de `DATABASE_URL` environment variable'ının ayarlandığından emin olun
2. **Yanlış environment**: Environment variable'ın Production için ayarlandığından emin olun
3. **Deploy edilmemiş**: Environment variable ekledikten sonra yeniden deploy etmeniz gerekir

### Connection String Formatı

Doğru format örnekleri:
- ✅ `postgres://user:password@db.prisma.io:5432/postgres?sslmode=require`
- ✅ `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
- ❌ `db.prisma.io:5432` (eksik protokol ve credentials)
- ❌ `placeholder` (placeholder değer)

## Önemli Notlar

- `db.prisma.io` geçerli bir Prisma hosting URL'sidir - bu normaldir
- Local development için `.env` dosyanızda `DATABASE_URL="file:./dev.db"` kullanabilirsiniz (SQLite)
- Production'da mutlaka PostgreSQL connection string kullanmalısınız
- Connection string'ler hassas bilgiler içerir - asla git'e commit etmeyin
