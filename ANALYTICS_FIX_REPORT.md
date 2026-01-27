# Analytics Tracking Fix Report

## Sorun Tespiti

### Ana Sorunlar

1. **Redirect Endpoint Eksikti**: `/r/[linkId]` redirect endpoint'i yoktu. Link'ler doğrudan external URL'lere gidiyordu ve tracking sadece client-side `onClick` handler'ına bağlıydı.

2. **Client-Side Tracking Güvenilir Değildi**: 
   - Kullanıcı link'e sağ tıklayıp "Yeni sekmede aç" dediğinde `onClick` çalışmayabilir
   - Sayfa hemen yönlendirildiğinde event kaydedilmeyebilir
   - Browser navigation ile tracking kaybolabilir

3. **Address Normalizasyonu Eksikti**: 
   - Bazı event'ler lowercase, bazıları uppercase address ile kaydediliyordu
   - `getEventsForProfile` case-sensitive karşılaştırma yapıyordu
   - Bu yüzden bazı event'ler Insights'ta görünmüyordu

## Yapılan Düzeltmeler

### 1. Redirect Endpoint Oluşturuldu

**Dosya**: `app/r/[linkId]/route.ts`
- Link ID'ye göre link'i database'den bulur
- Profile address ve category ID'yi alır
- Client-side tracking sayfasına redirect eder

**Dosya**: `app/r/[linkId]/track/page.tsx`
- Client-side tracking sayfası
- Event'i localStorage'a kaydeder
- Hemen external URL'e redirect eder
- Bu sayede tüm click türleri (sağ tık, orta tık, vb.) track edilir

### 2. Profile Page Link'leri Güncellendi

**Dosya**: `app/(public)/p/[id]/page.tsx`
- Link'ler artık `/r/[linkId]?source=profile` endpoint'ine yönlendiriliyor
- Eski `onClick` handler ve `trackLinkClick` import'u kaldırıldı
- Tüm click'ler artık redirect endpoint üzerinden geçiyor

### 3. Address Normalizasyonu Eklendi

**Dosya**: `lib/analytics.ts`
- `trackLinkClick`: profileId'yi lowercase'e normalize ediyor
- `trackProfileView`: profileId'yi lowercase'e normalize ediyor
- `getEventsForProfile`: case-insensitive karşılaştırma yapıyor

**Dosya**: `components/dashboard/insights-panel.tsx`
- Address'i lowercase'e normalize ediyor
- Tüm event sorguları normalized address kullanıyor

### 4. Debug Instrumentation Eklendi

**Geçici debug logları** (production'da kaldırılabilir):
- `lib/analytics.ts`: `trackLinkClick` ve `trackProfileView` console.log ekledi
- `components/dashboard/insights-panel.tsx`: Analytics data ve calculated results loglanıyor
- `app/r/[linkId]/track/page.tsx`: Click event recording loglanıyor

### 5. Dev-Only Test Harness Eklendi

**Dosya**: `app/api/dev/analytics/seed/route.ts`
- Development modunda test data seed etmek için endpoint
- Client-side fonksiyonlar kullanıldığı için sadece instruction döndürüyor

**Dosya**: `components/dashboard/insights-panel.tsx`
- Development modunda "Test Click" butonu eklendi
- İlk link için test click event'i oluşturuyor

## Event Kaynakları

### Profile View Events
- **Kaynak**: `app/(public)/p/[id]/page.tsx`
- **Fonksiyon**: `trackProfileView(stableProfileId, source)`
- **Çağrıldığı Yer**: `useEffect` hook'u içinde, profile yüklendikten sonra
- **Source Attribution**: URL query params'tan (`?source=profile|qr|copy`)

### Link Click Events
- **Kaynak**: `app/r/[linkId]/track/page.tsx`
- **Fonksiyon**: `trackLinkClick(profileId, linkId, source, categoryId)`
- **Çağrıldığı Yer**: Redirect tracking sayfasında, external URL'e yönlendirmeden önce
- **Source Attribution**: Redirect URL'den (`?source=profile|qr|copy`)

## Data Pipeline

### Event Storage
- **Konum**: Browser localStorage (`soci4l.events.v1`)
- **Format**: JSON array of `AnalyticsEvent[]`
- **Max Events**: 1000 (en eski event'ler silinir)

### Event Reading
- **Konum**: `lib/analytics.ts` → `getEventsForProfile(profileId)`
- **Filtreleme**: Case-insensitive address matching
- **Kullanım**: `components/dashboard/insights-panel.tsx` → `useMemo` hook'u içinde

### Insights Calculation
- **Konum**: `components/dashboard/insights-panel.tsx`
- **Time Range Filtering**: 24h, 7d, 30d, all
- **Metrics**:
  - Total Profile Views
  - Total Link Clicks
  - CTR (clicks / views)
  - Top Links (by clicks)
  - Category Breakdown
  - Recent Activity (last 10 events)
  - Source Breakdown

## Test Senaryoları

### 1. Profile View Tracking
1. Public profile sayfasını aç (incognito)
2. Console'da `localStorage.getItem('soci4l.events.v1')` kontrol et
3. `profile_view` event'i görünmeli

### 2. Link Click Tracking
1. Public profile sayfasında bir link'e tıkla
2. `/r/[linkId]` endpoint'ine redirect olmalı
3. `/r/[linkId]/track` sayfasına yönlendirilmeli
4. Console'da `[LinkTrack] Recording click event` log'u görünmeli
5. External URL'e redirect olmalı
6. Insights sayfasında click count artmalı

### 3. Address Normalization
1. Farklı case'lerde address ile event kaydet
2. Insights'ta tüm event'ler görünmeli

### 4. Time Range Filtering
1. Farklı time range'ler seç (24h, 7d, 30d, all)
2. Her range için doğru event sayısı görünmeli

## Notlar

- Debug logları production'da kaldırılabilir (console.log'lar)
- Test harness sadece development modunda çalışır
- Address normalizasyonu backward compatible (eski event'ler de çalışır)
- Redirect endpoint database query yapıyor, cache eklenebilir

## Sonraki Adımlar (Opsiyonel)

1. **Caching**: Redirect endpoint için link lookup cache ekle
2. **Error Handling**: Link bulunamazsa veya disabled ise daha iyi error sayfası
3. **Analytics Dashboard**: Real-time event monitoring
4. **Export**: Analytics data'yı export etme özelliği
5. **Server-Side Analytics**: localStorage yerine database'e kaydetme (gelecek)
