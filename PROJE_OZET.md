# Avalanche Wallet Profile Hub - Proje Özeti

## 📋 Genel Bakış

**Avalanche Wallet Profile Hub**, Avalanche C-Chain cüzdan adreslerini arayıp görüntüleyebileceğiniz, profil oluşturup yönetebileceğiniz modern bir web uygulamasıdır. Kullanıcılar cüzdan adreslerini arayabilir, profil talep edebilir, sosyal medya bağlantıları ekleyebilir ve cüzdan varlıklarını görüntüleyebilir.

---

## 🎯 Proje Amacı

Avalanche blockchain'inde cüzdan adreslerine dayalı profil sistemi oluşturmak. Kullanıcılar:
- Herhangi bir Avalanche cüzdan adresini arayabilir
- Cüzdan sahipliğini kanıtlayarak profil talep edebilir
- Profillerini özelleştirebilir (display name, bio, sosyal medya linkleri)
- Cüzdan varlıklarını (token, NFT) görüntüleyebilir
- İşlem geçmişini inceleyebilir
- Diğer kullanıcıları takip edebilir

---

## 🏗️ Mimari ve Teknoloji Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript
- **UI Framework**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Icons**: lucide-react
- **Notifications**: Sonner (toast notifications)

### Blockchain Entegrasyonu
- **Web3 Library**: wagmi v2 + viem
- **Chain**: Avalanche C-Chain (Chain ID: 43114)
- **Wallet Connection**: WalletConnect, MetaMask, ve diğer EIP-1193 uyumlu cüzdanlar
- **Signature Verification**: viem `verifyMessage`

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Veritabanı**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: Prisma
- **Authentication**: Nonce + Message Signature (Web3 native)

### External APIs
- **Moralis API**: Token ve NFT bakiyeleri (opsiyonel)
- **Snowtrace API**: İşlem geçmişi ve blockchain verileri (opsiyonel)
- **CoinGecko API**: Token fiyatları (opsiyonel)
- **Avalanche RPC**: Native AVAX bakiyesi ve temel blockchain verileri

---

## 📁 Proje Yapısı

```
AvalancheProject/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public route group
│   │   ├── page.tsx             # Ana sayfa (cüzdan arama)
│   │   ├── layout.tsx           # Public layout wrapper
│   │   └── p/[id]/              # Public profil sayfası
│   │       └── page.tsx
│   ├── dashboard/                # Dashboard route'ları
│   │   ├── page.tsx             # Dashboard ana sayfa
│   │   └── [address]/           # Adres bazlı dashboard
│   │       ├── page.tsx         # Dashboard içerik sayfası
│   │       └── layout.tsx       # Dashboard layout (AppShell)
│   ├── api/                      # API Routes
│   │   ├── auth/                # Authentication endpoints
│   │   │   ├── nonce/           # Nonce oluşturma
│   │   │   └── verify/          # İmza doğrulama
│   │   ├── wallet/              # Cüzdan verileri
│   │   │   ├── route.ts         # Genel cüzdan verisi
│   │   │   └── [address]/       # Adres bazlı endpoints
│   │   │       ├── assets/      # Token ve NFT'ler
│   │   │       ├── activity/    # İşlem geçmişi
│   │   │       └── summary/     # Özet bilgiler
│   │   ├── profile/             # Profil yönetimi
│   │   │   ├── claim/           # Profil talep etme
│   │   │   ├── social/          # Sosyal medya linkleri
│   │   │   ├── slug/            # Custom URL (slug)
│   │   │   ├── visibility/     # Gizlilik ayarları
│   │   │   └── [address]/      # Adres bazlı profil işlemleri
│   │   │       ├── follow/      # Takip sistemi
│   │   │       ├── follow-stats/ # Takip istatistikleri
│   │   │       └── follow-status/ # Takip durumu
│   │   └── dashboard/          # Dashboard API'leri
│   │       └── [address]/
│   │           └── follows/     # Takip listesi
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx             # React Query, Wagmi providers
│   └── globals.css              # Global CSS (Tailwind)
│
├── components/                   # React Components
│   ├── ui/                      # shadcn/ui bileşenleri
│   ├── dashboard/               # Dashboard panelleri
│   │   ├── overview-panel.tsx   # Genel bakış
│   │   ├── assets-panel.tsx     # Varlıklar (token/NFT)
│   │   ├── activity-panel.tsx   # İşlem geçmişi
│   │   ├── settings-panel.tsx   # Ayarlar
│   │   └── social-panel.tsx     # Takip sistemi
│   ├── app-shell/               # Dashboard shell
│   │   ├── app-shell.tsx        # Ana shell component
│   │   ├── app-sidebar.tsx      # Sol sidebar
│   │   ├── app-topbar.tsx       # Üst bar
│   │   └── page-shell.tsx       # Sayfa wrapper
│   ├── activity/               # Aktivite bileşenleri
│   ├── assets/                  # Varlık bileşenleri
│   ├── public-layout/           # Public sayfa layout
│   └── qr/                      # QR kod modal
│
├── lib/                          # Utility ve helper fonksiyonlar
│   ├── profile/
│   │   └── isProfileClaimed.ts  # Claim durumu helper (single source of truth)
│   ├── avalanche.ts             # Avalanche RPC client
│   ├── rpc-assets.ts            # RPC üzerinden varlık çekme
│   ├── activity/
│   │   └── fetchActivity.ts    # İşlem geçmişi çekme
│   ├── auth.ts                  # Authentication helpers
│   ├── db.ts                    # Database helpers
│   ├── prisma.ts                # Prisma client
│   ├── utils.ts                 # Genel utility fonksiyonlar
│   └── routing.ts               # Routing helpers
│
├── prisma/
│   ├── schema.prisma            # Veritabanı şeması
│   └── migrations/              # Migration dosyaları
│
└── public/                      # Static assets
    └── tokens/                   # Token logoları
```

---

## 🗄️ Veritabanı Şeması

### Profile Model
```prisma
model Profile {
  id           String   @id @default(cuid())
  address      String   @unique          // Cüzdan adresi (lowercase)
  slug         String?  @unique         // Custom URL slug
  ownerAddress String?                   // Profil sahibi cüzdan adresi
  status       String   @default("UNCLAIMED")  // UNCLAIMED | CLAIMED
  visibility   String   @default("PUBLIC")      // PUBLIC | PRIVATE
  claimedAt    DateTime?                      // Talep edilme tarihi
  displayName  String?                         // Maksimum 32 karakter
  bio          String?                         // Maksimum 160 karakter
  socialLinks  String?                         // JSON array
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  showcase ShowcaseItem[]  // NFT vitrin
}
```

### ShowcaseItem Model
```prisma
model ShowcaseItem {
  id              String   @id @default(cuid())
  profileId       String
  tokenId         String   // NFT token ID
  contractAddress String   // NFT contract address
  createdAt       DateTime @default(now())
}
```

### Follow Model
```prisma
model Follow {
  id              String   @id @default(cuid())
  followerAddress String   // Takip eden cüzdan
  followingAddress String  // Takip edilen cüzdan
  createdAt       DateTime @default(now())
  
  @@unique([followerAddress, followingAddress])
}
```

---

## 🔐 Authentication & Authorization

### Web3 Native Authentication
- **Nonce-based**: Her istek için unique nonce oluşturulur
- **Message Signing**: Kullanıcı cüzdanı ile mesaj imzalar
- **Signature Verification**: viem ile imza doğrulanır
- **Session Management**: Cookie-based session (aph_session)

### Authorization Rules
1. **Dashboard Erişimi**: 
   - Wallet connection gerekli
   - Dashboard address == connected wallet address
   - **NOT**: Profile claimed olması gerekmez

2. **Profile Claim**:
   - Wallet connection gerekli
   - Address eşleşmesi gerekli
   - Signature verification gerekli

3. **Settings Erişimi**:
   - Wallet connection gerekli
   - Address eşleşmesi gerekli
   - Profile claimed olması gerekmez (herkes kendi dashboard'una erişebilir)

4. **Follow System**:
   - Public profiller takip edilebilir
   - Private profiller sadece sahibi tarafından görülebilir

---

## 🎨 UI/UX Özellikleri

### Design System
- **Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Theme**: Dark mode (default)
- **Icons**: lucide-react
- **Design Principles**:
  - Dense, not bulky
  - Single responsibility UI
  - No visual noise
  - shadcn-first approach

### Layout Types
1. **Public Layout**: 
   - Basit header + content
   - Cüzdan arama sayfası
   - Public profil sayfaları

2. **Dashboard Layout**:
   - Sidebar navigation (collapsible)
   - Topbar (wallet connection, account menu)
   - Main content area
   - Responsive (mobile: offcanvas sidebar)

### Component Patterns
- **PageShell**: Sayfa wrapper (title, subtitle, mode)
- **Card**: İçerik kartları (border, shadow, padding)
- **Panel**: Dashboard panelleri (Overview, Assets, Activity, Settings, Social)
- **Button**: Consistent sizing (sm, icon, xs)
- **Skeleton**: Loading states
- **Toast**: Sonner notifications

---

## 📊 Ana Özellikler

### 1. Cüzdan Arama
- **Route**: `/` (ana sayfa)
- **Özellikler**:
  - Avalanche C-Chain cüzdan adresi arama
  - Native AVAX bakiyesi gösterimi
  - İşlem sayısı
  - Profil durumu (Claimed/Unclaimed)
  - Hızlı özet kartları

### 2. Public Profil Sayfası
- **Route**: `/p/[id]` (slug veya address)
- **Özellikler**:
  - Profil bilgileri (display name, bio, sosyal linkler)
  - Cüzdan özeti (balance, transactions)
  - NFT vitrin (eğer seçilmişse)
  - Takip butonu
  - Share menü (Twitter, Copy link, QR code)
  - Visibility kontrolü (Private profiller sadece sahibi tarafından görülebilir)

### 3. Dashboard
- **Route**: `/dashboard/[address]`
- **Erişim**: Wallet connection + address eşleşmesi
- **Paneller**:
  - **Overview**: Genel bakış, profil durumu, son aktivite, varlık özeti
  - **Assets**: Token ve NFT listesi (tabs, search, sort)
  - **Activity**: İşlem geçmişi (filters: date range, type, direction)
  - **Social**: Takipçiler ve takip edilenler listesi
  - **Settings**: Profil ayarları (display name, bio, sosyal linkler, slug, visibility)

### 4. Profil Yönetimi
- **Claim Process**:
  1. Nonce oluştur (`/api/auth/nonce`)
  2. Mesaj imzala (cüzdan)
  3. Claim gönder (`/api/profile/claim`)
  4. Signature verification
  5. Profile oluştur/güncelle

- **Customization**:
  - Display name (max 32 karakter)
  - Bio (max 160 karakter)
  - Social links (max 8 adet)
  - Custom slug (3-24 karakter, lowercase, alphanumeric + hyphen)
  - Visibility (PUBLIC/PRIVATE)

### 5. Takip Sistemi
- **Features**:
  - Public profilleri takip etme
  - Takipçi/takip edilen listesi
  - Dashboard'da takip yönetimi
  - Follow stats API

### 6. Varlık Görüntüleme
- **Token Balances**:
  - Native AVAX
  - ERC-20 tokens
  - USD değerleri (CoinGecko)
  - Token logoları

- **NFT Collection**:
  - NFT listesi
  - NFT görselleri
  - Contract address + token ID
  - Vitrin seçimi (Settings'te)

### 7. İşlem Geçmişi
- **Features**:
  - Son işlemler
  - Filtreleme (tarih aralığı, tip, yön)
  - Arama
  - Detaylı işlem bilgileri
  - Explorer linkleri

---

## 🔧 Teknik Detaylar

### State Management
- **React Query**: Server state (API calls, caching)
- **React State**: Local component state
- **Wagmi**: Wallet connection state

### Caching Strategy
- **React Query**: Automatic caching (staleTime, cacheTime)
- **API Routes**: In-memory cache (1 dakika TTL)
- **Browser Cache**: Next.js automatic caching

### Error Handling
- **API Errors**: Try-catch blocks, error responses
- **UI Errors**: Error states, retry buttons
- **Loading States**: Skeleton loaders, loading indicators
- **Timeout Safeguards**: 12 saniye timeout (Overview panel)

### Data Fetching Patterns
- **Server Components**: Static data, initial load
- **Client Components**: Interactive data, real-time updates
- **API Routes**: Server-side data fetching, database queries

### Security
- **Signature Verification**: viem `verifyMessage`
- **Nonce System**: One-time use nonces
- **Input Validation**: Address validation, slug validation
- **SQL Injection**: Prisma ORM (parameterized queries)
- **XSS Protection**: React automatic escaping

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/nonce` - Nonce oluştur
- `POST /api/auth/verify` - İmza doğrula

### Wallet
- `GET /api/wallet?address=...` - Cüzdan verileri (profile + wallet data)
- `GET /api/wallet/[address]/summary` - Cüzdan özeti
- `GET /api/wallet/[address]/assets` - Token ve NFT'ler
- `GET /api/wallet/[address]/activity` - İşlem geçmişi

### Profile
- `GET /api/profile?address=...` - Profil bilgileri
- `POST /api/profile/claim` - Profil talep et
- `POST /api/profile/social` - Sosyal medya linkleri güncelle
- `POST /api/profile/slug` - Custom slug ayarla
- `POST /api/profile/visibility` - Gizlilik ayarı
- `GET /api/profile/[address]/follow-status` - Takip durumu
- `POST /api/profile/[address]/follow` - Takip et/bırak
- `GET /api/profile/[address]/follow-stats` - Takip istatistikleri

### Dashboard
- `GET /api/dashboard/[address]/follows?type=followers|following` - Takip listesi

---

## 🎯 Önemli Kararlar ve Patterns

### 1. Claim Status Single Source of Truth
- **Helper**: `lib/profile/isProfileClaimed.ts`
- **Kullanım**: Tüm panellerde aynı helper kullanılır
- **Kriterler**: `status === 'CLAIMED'` || `claimedAt` || `slug` || `displayName`

### 2. Dashboard Erişim Kuralı
- **Kural**: Wallet connection + address eşleşmesi
- **NOT**: Profile claimed olması gerekmez
- **Sebep**: Kullanıcılar claim işlemini dashboard'dan yapabilmeli

### 3. Profile State Management
- **Claim Sonrası**: API response'dan state anında güncellenir
- **State Preservation**: Eğer state claimed ise, eski data ile override edilmez
- **Delayed Reload**: 2 saniye sonra tam data yüklenir (DB propagation için)

### 4. Error Handling
- **Overview Panel**: Timeout safeguard (12s), error state, retry button
- **API Routes**: Try-catch, detailed error messages
- **UI Components**: Error boundaries, fallback UI

### 5. Loading States
- **Skeleton Loaders**: Consistent loading UI
- **Loading Indicators**: Spinner icons
- **Disabled States**: Buttons disabled during operations

---

## 📦 Bağımlılıklar

### Core Dependencies
- `next@14.2.0` - React framework
- `react@18.3.0` - UI library
- `typescript@5.5.0` - Type safety
- `prisma@5.19.0` - ORM
- `@prisma/client@5.19.0` - Database client

### UI Dependencies
- `@radix-ui/*` - UI primitives
- `tailwindcss@3.4.7` - CSS framework
- `lucide-react@0.427.0` - Icons
- `sonner@2.0.7` - Toast notifications
- `class-variance-authority@0.7.0` - Component variants
- `clsx@2.1.1` - Class name utilities
- `tailwind-merge@2.6.0` - Tailwind class merging

### Blockchain Dependencies
- `wagmi@2.8.0` - React hooks for Ethereum
- `viem@2.21.0` - TypeScript Ethereum library
- `@wagmi/connectors@2.0.0` - Wallet connectors

### Data Fetching
- `@tanstack/react-query@5.56.0` - Server state management

### Utilities
- `qr-code-styling@1.9.2` - QR code generation
- `date-fns` - Date formatting

---

## 🔄 Data Flow

### Claim Process Flow
```
1. User clicks "Claim Profile"
   ↓
2. ClaimProfileButton component
   ↓
3. GET /api/auth/nonce (nonce oluştur)
   ↓
4. User signs message (wallet)
   ↓
5. POST /api/profile/claim (signature + address)
   ↓
6. Server verifies signature
   ↓
7. Server creates/updates profile (Prisma)
   ↓
8. Returns profile data
   ↓
9. handleClaimSuccess callback
   ↓
10. State updated immediately (from API response)
   ↓
11. UI updates (Claim button → View Public Profile)
   ↓
12. Delayed loadData() call (2s) for complete data
```

### Dashboard Data Flow
```
1. User navigates to /dashboard/[address]
   ↓
2. DashboardLayout checks wallet connection
   ↓
3. DashboardAddressPage loads
   ↓
4. loadData() fetches /api/wallet?address=...
   ↓
5. Profile + WalletData state updated
   ↓
6. renderPanel() renders active tab
   ↓
7. Panel components fetch additional data (React Query)
   - Overview: Activity, Assets (preview)
   - Assets: Full token/NFT list
   - Activity: Full transaction list
   - Social: Followers/Following
```

---

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. Claim Sonrası UI Güncellenmiyor
**Sorun**: Claim sonrası "Claim Profile" butonu hala görünüyor
**Çözüm**: 
- `onClaimSuccess` callback ile profile data geçiriliyor
- State anında güncelleniyor (API response'dan)
- State preservation logic eklendi

### 2. Overview Panel Skeleton'da Takılı Kalıyor
**Sorun**: Overview panel sürekli loading state'inde
**Çözüm**:
- Timeout safeguard (12 saniye)
- Error state ve retry button
- Proper loading/error/data state separation

### 3. Profile Claim Status Tutarsızlığı
**Sorun**: Farklı paneller farklı claim durumu gösteriyor
**Çözüm**:
- `isProfileClaimed` helper oluşturuldu (single source of truth)
- Tüm paneller aynı helper'ı kullanıyor
- Profile prop'una `status` ve `claimedAt` eklendi

---

## 🚧 Geliştirme Notları

### Environment Variables
```bash
DATABASE_URL="file:./dev.db"                    # SQLite database
NEXT_PUBLIC_AVALANCHE_RPC="..."                # Avalanche RPC (optional)
MORALIS_API_KEY="..."                          # Moralis API (optional)
SNOWTRACE_API_KEY="..."                        # Snowtrace API (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."     # WalletConnect (optional)
```

### Development Commands
```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm start            # Production server
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Prisma Studio (DB GUI)
```

### Code Style
- TypeScript strict mode
- ESLint (Next.js config)
- Prettier (implicit)
- shadcn/ui component patterns
- Tailwind CSS utility classes

---

## 📈 Gelecek Geliştirmeler

### Potansiyel Özellikler
- [ ] NFT vitrin seçimi (Settings'te)
- [ ] Profil görseli yükleme
- [ ] Batch token/NFT görüntüleme
- [ ] İşlem detay sayfası
- [ ] Portfolio analizi
- [ ] Notification sistemi
- [ ] Multi-chain support

### Teknik İyileştirmeler
- [ ] PostgreSQL migration (production)
- [ ] Redis cache (production)
- [ ] Rate limiting
- [ ] API response caching
- [ ] Image optimization
- [ ] SEO optimization
- [ ] Analytics integration

---

## 📝 Önemli Dosyalar

### Core Files
- `app/layout.tsx` - Root layout, global CSS import
- `app/providers.tsx` - React Query, Wagmi providers
- `lib/profile/isProfileClaimed.ts` - Claim status helper (single source of truth)
- `prisma/schema.prisma` - Database schema

### Key Components
- `components/dashboard/overview-panel.tsx` - Overview panel
- `components/dashboard/settings-panel.tsx` - Settings panel
- `components/claim-profile-button.tsx` - Claim button component
- `app/dashboard/[address]/page.tsx` - Dashboard main page

### API Routes
- `app/api/profile/claim/route.ts` - Profile claim endpoint
- `app/api/wallet/route.ts` - Wallet data endpoint
- `app/api/dashboard/[address]/follows/route.ts` - Follow list endpoint

---

## 🎓 Öğrenilen Dersler

1. **State Consistency**: Tek bir source of truth kullanmak kritik
2. **Error Handling**: Her seviyede proper error handling gerekli
3. **Loading States**: User experience için loading states önemli
4. **Cache Management**: API cache ve state cache dikkatli yönetilmeli
5. **Type Safety**: TypeScript strict mode hataları erken yakalar

---

## 📞 Destek ve Dokümantasyon

- **Design System**: `DESIGN_SYSTEM.md`
- **Dashboard Access Report**: `DASHBOARD_ACCESS_REPORT.md`
- **Claim Status Fix Report**: `CLAIM_STATUS_FIX_REPORT.md`
- **README**: `README.md`

---

**Son Güncelleme**: 23 Ocak 2026
**Versiyon**: 0.1.0
**Durum**: Aktif Geliştirme
