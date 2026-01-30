# Future Features & Roadmap (V2)

Bu dosya, SOCI4L projesinin sonraki aşamalarında (V2) eklenmesi planlanan özelliklerin ve mevcut kısıtlamaların teknik detaylarını içerir.

## 1. Top Interacted (Sosyal Etkileşim Analizi)

**Konum:** Dashboard > Social Sekmesi > KPI Kartları (En Sağdaki Kart)

### Mevcut Durum:
Şu an bu kartta "—" işareti ve tooltip üzerinde *"Privacy setting required"* uyarısı görülmektedir.

### Teknik Detay:
- **Dosya:** `components/dashboard/social-kpi-cards.tsx` ve `app/api/profile/[address]/social-stats/route.ts`
- **Açıklama:** Bu özellik, kullanıcının en çok etkileşime girdiği (tıklama, takip, ortak aktivite) profilleri saymayı hedefler.
- **Engel:** Bu veri kullanıcı gizliliği (privacy-sensitive) açısından hassas olduğu için MVP aşamasında API'den `null` dönmektedir.

### V2 Planı:
- Kullanıcıya özel bir "Gizlilik Onay" (Privacy Consent) mekanizması kurulacak.
- Kullanıcı onay verdiğinde, `AnalyticsEvent` tablosu üzerinden en çok etkileşim kurulan profil sayısı dinamik olarak hesaplanacak.

---

## 2. On-Chain Identity Verification (Daha Gelişmiş Roller)

**Konum:** Public Profile > Identity Header

### Planlanan Geliştirmeler:
- **Verified Builder Badge:** Sadece kod ile değil, cüzdan üzerinden belirli GitHub repolarına veya smart contract'lara sahip olma durumuna göre otomatik "Verified" statüsü verilmesi.

---

## 3. Dinamik Puanlama ve Sıralama (Leaderboard)

**Konum:** Insights / Dashboard

### Planlanan Geliştirmeler:
- Mevcut "SOCI4L Score" (Tier sistemi) tabanlı küresel bir sıralama sayfası.
- Belirli rütbelere (Elite, Legendary) ulaşan kullanıcılara özel on-chain ödüller veya ayrıcalıklar.
