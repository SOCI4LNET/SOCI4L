# Product Requirements Document (PRD)
## Avalanche Wallet Profile Hub

**Versiyon:** 1.0  
**Tarih:** 27 Ocak 2026  
**Durum:** Aktif Geliştirme  
**Proje Tipi:** Web3 Profil Yönetim Platformu

---

## 📋 İçindekiler

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Hedefler ve Amaçlar](#hedefler-ve-amaçlar)
4. [Hedef Kullanıcılar](#hedef-kullanıcılar)
5. [Kullanıcı Hikayeleri](#kullanıcı-hikayeleri)
6. [Özellikler ve Gereksinimler](#özellikler-ve-gereksinimler)
7. [Teknik Gereksinimler](#teknik-gereksinimler)
8. [Kullanıcı Akışları](#kullanıcı-akışları)
9. [Başarı Metrikleri](#başarı-metrikleri)
10. [Zaman Çizelgesi](#zaman-çizelgesi)
11. [Riskler ve Azaltma Stratejileri](#riskler-ve-azaltma-stratejileri)
12. [Gelecek Geliştirmeler](#gelecek-geliştirmeler)

---

## Executive Summary

**Avalanche Wallet Profile Hub**, Avalanche C-Chain blockchain'inde cüzdan adreslerine dayalı profil sistemi sunan modern bir Web3 platformudur. Kullanıcılar, cüzdan adreslerini arayabilir, cüzdan sahipliğini kanıtlayarak profil talep edebilir, profillerini özelleştirebilir ve cüzdan varlıklarını görüntüleyebilir.

### Temel Değer Önerisi

- **Web3 Native Authentication**: Geleneksel e-posta/şifre yerine cüzdan imzası ile kimlik doğrulama
- **Merkezi Olmayan Profil Yönetimi**: Kullanıcılar kendi verilerini kontrol eder
- **Blockchain Verileri Entegrasyonu**: Cüzdan bakiyeleri, NFT'ler ve işlem geçmişi tek platformda
- **Sosyal Özellikler**: Takip sistemi ve profil paylaşımı
- **Özelleştirilebilir Profiller**: Layout, görünüm ve içerik kontrolü

---

## Problem Statement

### Mevcut Durum

1. **Cüzdan Adresi Keşfi Zorluğu**: Avalanche blockchain'inde cüzdan adreslerini aramak ve görüntülemek için merkezi bir platform yoktur
2. **Profil Eksikliği**: Blockchain adresleri genellikle anonim ve tanımlanması zor hexadecimal string'lerdir
3. **Veri Dağınıklığı**: Cüzdan bakiyeleri, NFT'ler ve işlem geçmişi farklı platformlarda dağınık durumda
4. **Sosyal Bağlantı Eksikliği**: Web3 ekosisteminde kullanıcılar arasında sosyal bağlantı kurmak zordur
5. **Özelleştirme Sınırlamaları**: Mevcut blockchain explorer'lar statik ve özelleştirilemez

### Çözüm

Avalanche Wallet Profile Hub, bu sorunları çözmek için:

- **Merkezi Arama Platformu**: Herhangi bir Avalanche cüzdan adresini arayıp görüntüleme
- **Web3 Native Profil Sistemi**: Cüzdan sahipliğini kanıtlayarak profil oluşturma
- **Entegre Veri Görüntüleme**: Token bakiyeleri, NFT'ler ve işlem geçmişi tek yerde
- **Sosyal Özellikler**: Takip sistemi ve profil paylaşımı
- **Tam Özelleştirme**: Layout, görünüm ve içerik kontrolü

---

## Hedefler ve Amaçlar

### İş Hedefleri

1. **Kullanıcı Edinimi**: İlk 3 ay içinde 1,000 aktif profil
2. **Platform Kullanımı**: Aylık 10,000 profil görüntüleme
3. **Topluluk Büyümesi**: 500 aktif takip ilişkisi
4. **Teknik Mükemmellik**: %99.5 uptime, <2 saniye sayfa yükleme süresi

### Ürün Hedefleri

1. **Kullanılabilirlik**: Yeni kullanıcılar 5 dakika içinde profil oluşturabilmeli
2. **Performans**: Tüm sayfalar <2 saniye içinde yüklenmeli
3. **Güvenlik**: Web3 native authentication ile güvenli profil yönetimi
4. **Ölçeklenebilirlik**: 10,000+ profil desteği

### Teknik Hedefler

1. **Modern Stack**: Next.js 14, TypeScript, Prisma
2. **Blockchain Entegrasyonu**: wagmi v2, viem ile Avalanche C-Chain desteği
3. **Veritabanı**: SQLite (dev) → PostgreSQL (production)
4. **API Entegrasyonları**: Moralis, Snowtrace, CoinGecko (opsiyonel)

---

## Hedef Kullanıcılar

### 1. Kripto Yatırımcıları
- **Demografik**: 25-45 yaş, kripto deneyimi var
- **İhtiyaçlar**: Portfolio görüntüleme, profil oluşturma, sosyal bağlantı
- **Kullanım Senaryoları**: Cüzdan bakiyelerini görüntüleme, NFT koleksiyonunu sergileme

### 2. NFT Koleksiyoncuları
- **Demografik**: 20-40 yaş, NFT deneyimi var
- **İhtiyaçlar**: NFT vitrin, koleksiyon paylaşımı, takipçi kazanma
- **Kullanım Senaryoları**: NFT'leri sergileme, diğer koleksiyoncuları takip etme

### 3. DeFi Kullanıcıları
- **Demografik**: 25-50 yaş, DeFi protokolleri kullanıyor
- **İhtiyaçlar**: İşlem geçmişi görüntüleme, token bakiyeleri, aktivite takibi
- **Kullanım Senaryoları**: İşlem geçmişini inceleme, token portföyünü görüntüleme

### 4. Blockchain Geliştiricileri
- **Demografik**: 22-45 yaş, teknik bilgi yüksek
- **İhtiyaçlar**: API erişimi, teknik detaylar, entegrasyon
- **Kullanım Senaryoları**: Profil API'lerini kullanma, veri analizi

### 5. Genel Kullanıcılar
- **Demografik**: 18-60 yaş, kripto deneyimi sınırlı
- **İhtiyaçlar**: Basit profil oluşturma, cüzdan arama
- **Kullanım Senaryoları**: Cüzdan adresi arama, temel profil görüntüleme

---

## Kullanıcı Hikayeleri

### Epik 1: Cüzdan Arama ve Görüntüleme

**US-1.1**: Kullanıcı olarak, ana sayfada bir Avalanche cüzdan adresi arayabilmeliyim
- **Kabul Kriterleri**:
  - Adres input alanı mevcut
  - Adres validasyonu yapılıyor
  - Arama sonuçları gösteriliyor (bakiye, işlem sayısı, profil durumu)

**US-1.2**: Kullanıcı olarak, arama sonuçlarında cüzdan özet bilgilerini görebilmeliyim
- **Kabul Kriterleri**:
  - Native AVAX bakiyesi gösteriliyor
  - Toplam işlem sayısı gösteriliyor
  - Profil durumu (Claimed/Unclaimed) gösteriliyor
  - Profil sayfasına yönlendirme linki mevcut

### Epik 2: Profil Oluşturma ve Talep Etme

**US-2.1**: Kullanıcı olarak, cüzdan sahipliğimi kanıtlayarak profil talep edebilmeliyim
- **Kabul Kriterleri**:
  - Cüzdan bağlantısı yapılabiliyor
  - Nonce oluşturuluyor
  - Mesaj imzalama isteği gösteriliyor
  - İmza doğrulaması yapılıyor
  - Profil başarıyla oluşturuluyor

**US-2.2**: Kullanıcı olarak, talep ettiğim profili özelleştirebilmeliyim
- **Kabul Kriterleri**:
  - Display name eklenebiliyor (max 32 karakter)
  - Bio eklenebiliyor (max 160 karakter)
  - Sosyal medya linkleri eklenebiliyor (max 8 adet)
  - Custom slug belirlenebiliyor (3-24 karakter)
  - Gizlilik ayarı yapılabiliyor (PUBLIC/PRIVATE)

### Epik 3: Dashboard ve Profil Yönetimi

**US-3.1**: Kullanıcı olarak, dashboard'da profil durumumu görebilmeliyim
- **Kabul Kriterleri**:
  - Overview panelinde profil durumu gösteriliyor
  - Claim durumu net bir şekilde belirtiliyor
  - Profil bilgileri (display name, bio) gösteriliyor

**US-3.2**: Kullanıcı olarak, dashboard'da cüzdan varlıklarımı görüntüleyebilmeliyim
- **Kabul Kriterleri**:
  - Token bakiyeleri listeleniyor (AVAX + ERC-20)
  - NFT'ler listeleniyor
  - USD değerleri gösteriliyor
  - Arama ve filtreleme yapılabiliyor

**US-3.3**: Kullanıcı olarak, dashboard'da işlem geçmişimi görüntüleyebilmeliyim
- **Kabul Kriterleri**:
  - Son işlemler listeleniyor
  - Tarih aralığı filtresi mevcut
  - İşlem tipi filtresi mevcut
  - İşlem detayları gösteriliyor

### Epik 4: Public Profil Sayfası

**US-4.1**: Kullanıcı olarak, public profil sayfalarını görüntüleyebilmeliyim
- **Kabul Kriterleri**:
  - Profil bilgileri (display name, bio) gösteriliyor
  - Sosyal medya linkleri gösteriliyor
  - Cüzdan özeti gösteriliyor
  - NFT vitrin gösteriliyor (eğer seçilmişse)

**US-4.2**: Kullanıcı olarak, public profilleri takip edebilmeliyim
- **Kabul Kriterleri**:
  - Takip butonu mevcut
  - Takip durumu gösteriliyor
  - Takipçi/takip edilen sayıları gösteriliyor

**US-4.3**: Kullanıcı olarak, profil sayfalarını paylaşabilmeliyim
- **Kabul Kriterleri**:
  - Share menü mevcut
  - Twitter paylaşımı yapılabiliyor
  - Link kopyalama yapılabiliyor
  - QR kod oluşturulabiliyor

### Epik 5: Sosyal Özellikler

**US-5.1**: Kullanıcı olarak, diğer kullanıcıları takip edebilmeliyim
- **Kabul Kriterleri**:
  - Public profiller takip edilebiliyor
  - Private profiller sadece sahibi tarafından görülebiliyor
  - Takip durumu anında güncelleniyor

**US-5.2**: Kullanıcı olarak, takipçilerimi ve takip ettiklerimi görebilmeliyim
- **Kabul Kriterleri**:
  - Dashboard'da Social panel mevcut
  - Takipçi listesi gösteriliyor
  - Takip edilenler listesi gösteriliyor
  - Takip istatistikleri gösteriliyor

### Epik 6: Profil Özelleştirme

**US-6.1**: Kullanıcı olarak, profil layout'unu özelleştirebilmeliyim
- **Kabul Kriterleri**:
  - Layout blokları sürükle-bırak ile düzenlenebiliyor
  - Bloklar gizlenebiliyor/gösterilebiliyor
  - Layout kaydediliyor

**US-6.2**: Kullanıcı olarak, profil görünümünü özelleştirebilmeliyim
- **Kabul Kriterleri**:
  - Tema seçenekleri mevcut
  - Renk özelleştirmesi yapılabiliyor
  - Görünüm ayarları kaydediliyor

**US-6.3**: Kullanıcı olarak, profil linklerimi kategorilere ayırabilmeliyim
- **Kabul Kriterleri**:
  - Link kategorileri oluşturulabiliyor
  - Linkler kategorilere atanabiliyor
  - Kategori sıralaması yapılabiliyor

---

## Özellikler ve Gereksinimler

### Fonksiyonel Gereksinimler

#### 1. Cüzdan Arama
- **FR-1.1**: Kullanıcılar ana sayfada Avalanche C-Chain cüzdan adresi arayabilmeli
- **FR-1.2**: Adres validasyonu yapılmalı (0x ile başlayan, 42 karakter)
- **FR-1.3**: Arama sonuçlarında native AVAX bakiyesi gösterilmeli
- **FR-1.4**: Toplam işlem sayısı gösterilmeli
- **FR-1.5**: Profil durumu (Claimed/Unclaimed) gösterilmeli
- **FR-1.6**: Profil sayfasına yönlendirme linki sağlanmalı

#### 2. Profil Talep Etme
- **FR-2.1**: Kullanıcılar cüzdan bağlantısı yapabilmeli (WalletConnect, MetaMask, vb.)
- **FR-2.2**: Nonce-based authentication sistemi çalışmalı
- **FR-2.3**: Mesaj imzalama isteği gösterilmeli
- **FR-2.4**: İmza doğrulaması yapılmalı (viem verifyMessage)
- **FR-2.5**: Profil başarıyla oluşturulmalı veya güncellenmeli
- **FR-2.6**: Claim işlemi sonrası kullanıcı bilgilendirilmeli

#### 3. Profil Özelleştirme
- **FR-3.1**: Display name eklenebilmeli (max 32 karakter)
- **FR-3.2**: Bio eklenebilmeli (max 160 karakter)
- **FR-3.3**: Sosyal medya linkleri eklenebilmeli (max 8 adet)
  - Twitter/X
  - LinkedIn
  - GitHub
  - Website
  - Discord
  - Email
  - Custom links
- **FR-3.4**: Custom slug belirlenebilmeli (3-24 karakter, lowercase, alphanumeric + hyphen)
- **FR-3.5**: Gizlilik ayarı yapılabilmeli (PUBLIC/PRIVATE)
- **FR-3.6**: Profil görseli yüklenebilmeli (gelecek özellik)

#### 4. Dashboard
- **FR-4.1**: Dashboard'a sadece cüzdan sahibi erişebilmeli
- **FR-4.2**: Overview paneli gösterilmeli:
  - Profil durumu
  - Cüzdan özeti
  - Son aktivite
  - Varlık özeti
- **FR-4.3**: Assets paneli gösterilmeli:
  - Token bakiyeleri (AVAX + ERC-20)
  - NFT listesi
  - USD değerleri
  - Arama ve filtreleme
- **FR-4.4**: Activity paneli gösterilmeli:
  - İşlem geçmişi
  - Tarih aralığı filtresi
  - İşlem tipi filtresi
  - İşlem detayları
- **FR-4.5**: Social paneli gösterilmeli:
  - Takipçi listesi
  - Takip edilenler listesi
  - Takip istatistikleri
- **FR-4.6**: Settings paneli gösterilmeli:
  - Profil ayarları
  - Layout özelleştirme
  - Görünüm ayarları
  - Link yönetimi

#### 5. Public Profil Sayfası
- **FR-5.1**: Profil sayfası slug veya adres ile erişilebilir olmalı
- **FR-5.2**: Profil bilgileri gösterilmeli (display name, bio, sosyal linkler)
- **FR-5.3**: Cüzdan özeti gösterilmeli (bakiye, işlem sayısı)
- **FR-5.4**: NFT vitrin gösterilmeli (eğer seçilmişse)
- **FR-5.5**: Takip butonu mevcut olmalı
- **FR-5.6**: Share menü mevcut olmalı (Twitter, Copy link, QR code)
- **FR-5.7**: Private profiller sadece sahibi tarafından görülebilmeli

#### 6. Takip Sistemi
- **FR-6.1**: Public profiller takip edilebilmeli
- **FR-6.2**: Private profiller sadece sahibi tarafından görülebilmeli
- **FR-6.3**: Takip durumu anında güncellenmeli
- **FR-6.4**: Takipçi/takip edilen sayıları gösterilmeli
- **FR-6.5**: Takip listesi dashboard'da görüntülenebilmeli

#### 7. Varlık Görüntüleme
- **FR-7.1**: Native AVAX bakiyesi gösterilmeli
- **FR-7.2**: ERC-20 token bakiyeleri gösterilmeli
- **FR-7.3**: USD değerleri gösterilmeli (CoinGecko API)
- **FR-7.4**: Token logoları gösterilmeli
- **FR-7.5**: NFT listesi gösterilmeli
- **FR-7.6**: NFT görselleri gösterilmeli
- **FR-7.7**: NFT vitrin seçimi yapılabilmeli

#### 8. İşlem Geçmişi
- **FR-8.1**: Son işlemler listelenmeli
- **FR-8.2**: Tarih aralığı filtresi mevcut olmalı
- **FR-8.3**: İşlem tipi filtresi mevcut olmalı
- **FR-8.4**: İşlem yönü filtresi mevcut olmalı (incoming/outgoing)
- **FR-8.5**: İşlem detayları gösterilmeli
- **FR-8.6**: Explorer linkleri sağlanmalı

#### 9. Profil Layout Özelleştirme
- **FR-9.1**: Layout blokları sürükle-bırak ile düzenlenebilmeli
- **FR-9.2**: Bloklar gizlenebilmeli/gösterilebilmeli
- **FR-9.3**: Layout kaydedilmeli
- **FR-9.4**: Varsayılan layout mevcut olmalı

#### 10. Profil Görünüm Özelleştirme
- **FR-10.1**: Tema seçenekleri mevcut olmalı
- **FR-10.2**: Renk özelleştirmesi yapılabilmeli
- **FR-10.3**: Görünüm ayarları kaydedilmeli
- **FR-10.4**: Varsayılan görünüm mevcut olmalı

#### 11. Link Yönetimi
- **FR-11.1**: Link kategorileri oluşturulabilmeli
- **FR-11.2**: Linkler kategorilere atanabilmeli
- **FR-11.3**: Kategori sıralaması yapılabilmeli
- **FR-11.4**: Linkler sürükle-bırak ile sıralanabilmeli

### Fonksiyonel Olmayan Gereksinimler

#### 1. Performans
- **NFR-1.1**: Sayfa yükleme süresi <2 saniye olmalı
- **NFR-1.2**: API yanıt süresi <1 saniye olmalı
- **NFR-1.3**: Database sorguları optimize edilmeli
- **NFR-1.4**: Caching mekanizması kullanılmalı

#### 2. Güvenlik
- **NFR-2.1**: Web3 native authentication kullanılmalı
- **NFR-2.2**: Signature verification yapılmalı
- **NFR-2.3**: SQL injection koruması (Prisma ORM)
- **NFR-2.4**: XSS koruması (React automatic escaping)
- **NFR-2.5**: Rate limiting uygulanmalı
- **NFR-2.6**: Input validation yapılmalı

#### 3. Ölçeklenebilirlik
- **NFR-3.1**: 10,000+ profil desteği
- **NFR-3.2**: 100,000+ profil görüntüleme/gün
- **NFR-3.3**: Database indexing optimize edilmeli
- **NFR-3.4**: API rate limiting uygulanmalı

#### 4. Kullanılabilirlik
- **NFR-4.1**: Responsive design (mobile, tablet, desktop)
- **NFR-4.2**: Accessibility standartları (WCAG 2.1 AA)
- **NFR-4.3**: Loading states gösterilmeli
- **NFR-4.4**: Error handling ve kullanıcı bilgilendirmesi
- **NFR-4.5**: Intuitive navigation

#### 5. Güvenilirlik
- **NFR-5.1**: %99.5 uptime hedefi
- **NFR-5.2**: Error monitoring ve logging
- **NFR-5.3**: Graceful degradation (API hatalarında)
- **NFR-5.4**: Retry mekanizması

#### 6. Bakım Kolaylığı
- **NFR-6.1**: TypeScript strict mode
- **NFR-6.2**: Code documentation
- **NFR-6.3**: Modular architecture
- **NFR-6.4**: Test coverage (gelecek)

---

## Teknik Gereksinimler

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript 5.5+
- **UI Framework**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 3.4+
- **State Management**: React Query (TanStack Query) 5.56+
- **Icons**: lucide-react
- **Notifications**: Sonner
- **Drag & Drop**: @dnd-kit

### Blockchain Stack
- **Web3 Library**: wagmi v2.8+ + viem v2.21+
- **Chain**: Avalanche C-Chain (Chain ID: 43114)
- **Wallet Connection**: WalletConnect, MetaMask, EIP-1193 uyumlu cüzdanlar
- **Signature Verification**: viem `verifyMessage`

### Backend Stack
- **Runtime**: Node.js 18+ (Next.js API Routes)
- **Veritabanı**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma 5.19+
- **Authentication**: Nonce + Message Signature

### External APIs
- **Moralis API**: Token ve NFT bakiyeleri (opsiyonel)
- **Snowtrace API**: İşlem geçmişi (opsiyonel)
- **CoinGecko API**: Token fiyatları (opsiyonel)
- **Avalanche RPC**: Native AVAX bakiyesi ve temel blockchain verileri
- **OpenSea API**: NFT metadata (opsiyonel)

### Infrastructure
- **Hosting**: Vercel (önerilen) veya benzeri
- **Database**: SQLite (dev) → PostgreSQL (production)
- **Cache**: In-memory (dev) → Redis (production)
- **CDN**: Next.js automatic (Vercel)

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint (Next.js config)
- **Type Checking**: TypeScript strict mode
- **Database GUI**: Prisma Studio

---

## Kullanıcı Akışları

### Akış 1: Profil Oluşturma

```
1. Kullanıcı ana sayfaya gelir
   ↓
2. Cüzdan adresini arar
   ↓
3. "Claim Profile" butonuna tıklar
   ↓
4. Cüzdan bağlantısı yapar (WalletConnect/MetaMask)
   ↓
5. Nonce oluşturulur
   ↓
6. Mesaj imzalama isteği gösterilir
   ↓
7. Kullanıcı mesajı imzalar
   ↓
8. İmza doğrulanır
   ↓
9. Profil oluşturulur
   ↓
10. Dashboard'a yönlendirilir
```

### Akış 2: Profil Özelleştirme

```
1. Kullanıcı dashboard'a girer
   ↓
2. Settings panelini açar
   ↓
3. Display name ve bio ekler
   ↓
4. Sosyal medya linkleri ekler
   ↓
5. Custom slug belirler
   ↓
6. Gizlilik ayarını yapar (PUBLIC/PRIVATE)
   ↓
7. Ayarları kaydeder
   ↓
8. Public profil sayfasını görüntüler
```

### Akış 3: Profil Görüntüleme

```
1. Kullanıcı ana sayfada cüzdan adresi arar
   ↓
2. Arama sonuçlarını görüntüler
   ↓
3. "View Profile" butonuna tıklar
   ↓
4. Public profil sayfasına yönlendirilir
   ↓
5. Profil bilgilerini görüntüler
   ↓
6. NFT vitrini görüntüler (varsa)
   ↓
7. Takip butonuna tıklar (opsiyonel)
   ↓
8. Profili paylaşır (opsiyonel)
```

### Akış 4: Varlık Görüntüleme

```
1. Kullanıcı dashboard'a girer
   ↓
2. Assets panelini açar
   ↓
3. Token bakiyelerini görüntüler
   ↓
4. NFT listesini görüntüler
   ↓
5. NFT'leri filtreler/arar
   ↓
6. NFT vitrin seçimi yapar (Settings'te)
```

### Akış 5: İşlem Geçmişi Görüntüleme

```
1. Kullanıcı dashboard'a girer
   ↓
2. Activity panelini açar
   ↓
3. Son işlemleri görüntüler
   ↓
4. Tarih aralığı filtresi uygular
   ↓
5. İşlem tipi filtresi uygular
   ↓
6. İşlem detaylarını görüntüler
   ↓
7. Explorer linkine tıklar
```

### Akış 6: Takip Sistemi

```
1. Kullanıcı public profil sayfasını görüntüler
   ↓
2. "Follow" butonuna tıklar
   ↓
3. Cüzdan bağlantısı yapar (gerekirse)
   ↓
4. Takip işlemi tamamlanır
   ↓
5. Takip durumu güncellenir
   ↓
6. Dashboard'da Social panelinde görüntüler
```

---

## Başarı Metrikleri

### Kullanıcı Metrikleri

1. **Aktif Kullanıcı Sayısı (DAU/MAU)**
   - Hedef: 100 DAU, 1,000 MAU (ilk 3 ay)
   - Ölçüm: Günlük/aylık aktif kullanıcı sayısı

2. **Profil Oluşturma Oranı**
   - Hedef: %20 (arama yapan kullanıcıların %20'si profil oluşturur)
   - Ölçüm: Profil oluşturma sayısı / Toplam arama sayısı

3. **Profil Görüntüleme Sayısı**
   - Hedef: 10,000 profil görüntüleme/ay
   - Ölçüm: Public profil sayfası görüntüleme sayısı

4. **Takip İlişkisi Sayısı**
   - Hedef: 500 aktif takip ilişkisi
   - Ölçüm: Toplam follow kayıt sayısı

### Teknik Metrikler

1. **Sayfa Yükleme Süresi**
   - Hedef: <2 saniye
   - Ölçüm: Lighthouse Performance Score

2. **API Yanıt Süresi**
   - Hedef: <1 saniye
   - Ölçüm: API endpoint response time

3. **Uptime**
   - Hedef: %99.5
   - Ölçüm: Monitoring tool (Vercel Analytics)

4. **Error Rate**
   - Hedef: <0.1%
   - Ölçüm: Error tracking (Sentry veya benzeri)

### İş Metrikleri

1. **Kullanıcı Edinimi**
   - Hedef: 1,000 aktif profil (ilk 3 ay)
   - Ölçüm: Toplam profil sayısı

2. **Kullanıcı Etkileşimi**
   - Hedef: 5+ sayfa görüntüleme/kullanıcı
   - Ölçüm: Ortalama sayfa görüntüleme sayısı

3. **Retention Rate**
   - Hedef: %30 (30 günlük retention)
   - Ölçüm: Kullanıcıların geri dönüş oranı

---

## Zaman Çizelgesi

### Faz 1: Temel Özellikler (Tamamlandı ✅)
- ✅ Cüzdan arama
- ✅ Profil talep etme
- ✅ Dashboard temel yapısı
- ✅ Public profil sayfası
- ✅ Profil özelleştirme (display name, bio, sosyal linkler)
- ✅ Varlık görüntüleme (token, NFT)
- ✅ İşlem geçmişi

### Faz 2: Sosyal Özellikler (Tamamlandı ✅)
- ✅ Takip sistemi
- ✅ Profil paylaşımı (Twitter, Copy link, QR code)
- ✅ Takipçi/takip edilen listesi
- ✅ Gizlilik ayarları (PUBLIC/PRIVATE)

### Faz 3: Gelişmiş Özellikler (Tamamlandı ✅)
- ✅ Profil layout özelleştirme
- ✅ Profil görünüm özelleştirme
- ✅ Link kategorileri
- ✅ NFT vitrin seçimi

### Faz 4: Optimizasyon ve İyileştirmeler (Devam Ediyor 🔄)
- 🔄 Performans optimizasyonu
- 🔄 Error handling iyileştirmeleri
- 🔄 UI/UX iyileştirmeleri
- 🔄 Analytics entegrasyonu

### Faz 5: Gelecek Geliştirmeler (Planlanıyor 📋)
- 📋 Profil görseli yükleme
- 📋 Batch token/NFT görüntüleme
- 📋 İşlem detay sayfası
- 📋 Portfolio analizi
- 📋 Notification sistemi
- 📋 Multi-chain support
- 📋 API documentation
- 📋 Rate limiting
- 📋 Redis cache (production)
- 📋 PostgreSQL migration (production)

---

## Riskler ve Azaltma Stratejileri

### Teknik Riskler

#### Risk 1: Blockchain RPC Hataları
- **Açıklama**: Avalanche RPC endpoint'leri bazen yanıt vermeyebilir
- **Etki**: Yüksek - Kullanıcılar cüzdan verilerini göremez
- **Olasılık**: Orta
- **Azaltma Stratejisi**:
  - Fallback RPC endpoint'leri
  - Retry mekanizması
  - Graceful degradation (API hatalarında kullanıcı bilgilendirmesi)
  - Caching mekanizması

#### Risk 2: External API Rate Limiting
- **Açıklama**: Moralis, Snowtrace, CoinGecko API'leri rate limit uygulayabilir
- **Etki**: Orta - Bazı özellikler çalışmayabilir
- **Olasılık**: Yüksek
- **Azaltma Stratejisi**:
  - API key'lerin doğru yapılandırılması
  - Rate limiting monitoring
  - Fallback mekanizmaları
  - Caching mekanizması
  - Kullanıcı bilgilendirmesi

#### Risk 3: Database Performance
- **Açıklama**: SQLite production'da performans sorunları yaratabilir
- **Etki**: Yüksek - Yavaş sorgular kullanıcı deneyimini etkiler
- **Olasılık**: Orta
- **Azaltma Stratejisi**:
  - Database indexing optimizasyonu
  - Query optimization
  - PostgreSQL migration planı
  - Connection pooling

#### Risk 4: Security Vulnerabilities
- **Açıklama**: Web3 authentication ve signature verification hataları
- **Etki**: Çok Yüksek - Güvenlik açıkları
- **Olasılık**: Düşük
- **Azaltma Stratejisi**:
  - Code review
  - Security audit
  - Input validation
  - Signature verification best practices
  - Rate limiting

### İş Riskleri

#### Risk 5: Düşük Kullanıcı Edinimi
- **Açıklama**: Yeterli kullanıcı çekilemeyebilir
- **Etki**: Yüksek - Platform başarısız olabilir
- **Olasılık**: Orta
- **Azaltma Stratejisi**:
  - Marketing stratejisi
  - Community building
  - Social media presence
  - Partnership'ler
  - User feedback toplama

#### Risk 6: Kullanıcı Retention Sorunları
- **Açıklama**: Kullanıcılar platformu tekrar kullanmayabilir
- **Etki**: Yüksek - Platform büyüyemez
- **Olasılık**: Orta
- **Azaltma Stratejisi**:
  - Kullanıcı deneyimi iyileştirmeleri
  - Yeni özellikler ekleme
  - Notification sistemi
  - Email marketing
  - User feedback toplama

### Operasyonel Riskler

#### Risk 7: Hosting ve Infrastructure Sorunları
- **Açıklama**: Vercel veya diğer hosting servisleri sorun yaşayabilir
- **Etki**: Yüksek - Platform erişilemez olabilir
- **Olasılık**: Düşük
- **Azaltma Stratejisi**:
  - Monitoring ve alerting
  - Backup plan
  - Multi-region deployment (gelecek)
  - Uptime monitoring

#### Risk 8: Veri Kaybı
- **Açıklama**: Database corruption veya veri kaybı
- **Etki**: Çok Yüksek - Tüm kullanıcı verileri kaybolabilir
- **Olasılık**: Çok Düşük
- **Azaltma Stratejisi**:
  - Regular database backups
  - Disaster recovery plan
  - Database replication (production)
  - Monitoring

---

## Gelecek Geliştirmeler

### Kısa Vadeli (1-3 Ay)

1. **Profil Görseli Yükleme**
   - Kullanıcılar profil görseli yükleyebilir
   - Image optimization
   - CDN entegrasyonu

2. **Batch Token/NFT Görüntüleme**
   - Büyük koleksiyonlar için pagination
   - Virtual scrolling
   - Lazy loading

3. **İşlem Detay Sayfası**
   - Detaylı işlem bilgileri
   - Token transfer detayları
   - Contract interaction detayları

4. **Analytics Dashboard**
   - Profil görüntüleme istatistikleri
   - Takipçi büyüme grafikleri
   - En çok görüntülenen içerikler

### Orta Vadeli (3-6 Ay)

1. **Portfolio Analizi**
   - Portfolio değer grafikleri
   - Token dağılım analizi
   - Performans metrikleri

2. **Notification Sistemi**
   - Email notifications
   - In-app notifications
   - Takipçi bildirimleri

3. **API Documentation**
   - Public API endpoints
   - API key management
   - Rate limiting documentation

4. **Multi-chain Support**
   - Ethereum mainnet
   - Polygon
   - BSC
   - Diğer EVM uyumlu chain'ler

### Uzun Vadeli (6-12 Ay)

1. **Social Features**
   - Mesajlaşma sistemi
   - Yorum sistemi
   - Like/favorite sistemi

2. **Advanced Analytics**
   - Portfolio tracking
   - Performance benchmarking
   - Market analysis

3. **Mobile App**
   - React Native app
   - Push notifications
   - Mobile-optimized UI

4. **Enterprise Features**
   - Team profiles
   - Organization management
   - Advanced analytics

---

## Ekler

### A. API Endpoints Özeti

#### Authentication
- `POST /api/auth/nonce` - Nonce oluştur
- `POST /api/auth/verify` - İmza doğrula

#### Wallet
- `GET /api/wallet?address=...` - Cüzdan verileri
- `GET /api/wallet/[address]/summary` - Cüzdan özeti
- `GET /api/wallet/[address]/assets` - Token ve NFT'ler
- `GET /api/wallet/[address]/activity` - İşlem geçmişi

#### Profile
- `GET /api/profile?address=...` - Profil bilgileri
- `POST /api/profile/claim` - Profil talep et
- `POST /api/profile/social` - Sosyal medya linkleri güncelle
- `POST /api/profile/slug` - Custom slug ayarla
- `POST /api/profile/visibility` - Gizlilik ayarı
- `GET /api/profile/[address]/follow-status` - Takip durumu
- `POST /api/profile/[address]/follow` - Takip et/bırak
- `GET /api/profile/[address]/follow-stats` - Takip istatistikleri

#### Dashboard
- `GET /api/dashboard/[address]/follows?type=followers|following` - Takip listesi

### B. Veritabanı Şeması Özeti

#### Profile Model
- `id`: String (CUID)
- `address`: String (unique, lowercase)
- `slug`: String? (unique)
- `ownerAddress`: String?
- `status`: String (UNCLAIMED | CLAIMED)
- `visibility`: String (PUBLIC | PRIVATE)
- `displayName`: String? (max 32)
- `bio`: String? (max 160)
- `socialLinks`: String? (JSON)
- `layoutConfig`: String? (JSON)
- `appearanceConfig`: String? (JSON)

#### ShowcaseItem Model
- `id`: String (CUID)
- `profileId`: String
- `tokenId`: String
- `contractAddress`: String

#### Follow Model
- `id`: String (CUID)
- `followerAddress`: String
- `followingAddress`: String

#### LinkCategory Model
- `id`: String (CUID)
- `profileId`: String
- `name`: String
- `slug`: String
- `description`: String?
- `order`: Int
- `isVisible`: Boolean
- `isDefault`: Boolean

#### ProfileLink Model
- `id`: String (CUID)
- `profileId`: String
- `categoryId`: String?
- `title`: String
- `url`: String
- `enabled`: Boolean
- `order`: Int

### C. Teknoloji Stack Detayları

#### Frontend Dependencies
- `next@14.2.0`
- `react@18.3.0`
- `typescript@5.5.0`
- `@tanstack/react-query@5.56.0`
- `wagmi@2.8.0`
- `viem@2.21.0`
- `tailwindcss@3.4.7`
- `@radix-ui/*` (UI primitives)
- `lucide-react@0.427.0`
- `sonner@2.0.7`

#### Backend Dependencies
- `@prisma/client@5.19.0`
- `prisma@5.19.0`

#### Development Dependencies
- `@types/node@20.14.0`
- `@types/react@18.3.0`
- `eslint@8.57.0`
- `autoprefixer@10.4.20`
- `postcss@8.4.40`

### D. Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite (dev) veya PostgreSQL (production)

# Blockchain
NEXT_PUBLIC_AVALANCHE_RPC="https://api.avax.network/ext/bc/C/rpc"

# External APIs (opsiyonel)
MORALIS_API_KEY="..."
SNOWTRACE_API_KEY="..."
OPENSEA_API_KEY="..."

# Wallet Connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."
```

---

## Dokümantasyon Referansları

- **README.md**: Kurulum ve kullanım kılavuzu
- **PROJE_OZET.md**: Detaylı proje özeti
- **DESIGN_SYSTEM.md**: Tasarım sistemi dokümantasyonu
- **DASHBOARD_ACCESS_REPORT.md**: Dashboard erişim raporu
- **CLAIM_STATUS_FIX_REPORT.md**: Claim durumu düzeltme raporu
- **ANALYTICS_FIX_REPORT.md**: Analytics düzeltme raporu

---

**Son Güncelleme**: 27 Ocak 2026  
**Versiyon**: 1.0  
**Durum**: Aktif Geliştirme  
**Hazırlayan**: Product Team
