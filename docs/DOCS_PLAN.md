# SOCI4L Platform Documentation Plan

Bu döküman, projenin ileride oluşturulacak resmi dokümantasyonu (Docs) için bir taslak ve not defteri görevi görevi görür.

## 🧠 Optimizasyon Motoru (Optimization Engine)
Platformun kullanıcılara sunduğu "Optimization Suggestions" bölümünün mantığı:

- **Mevcut Durum:** Deterministik algoritmalar (Rule-based) ile çalışır. 
    - *CTR Analizi:* Tıklanma oranı düşükse "Minimal" tasarım önerilir.
    - *Kategori Analizi:* Bir kategori %60+ tıklanma alıyorsa en üste taşınması önerilir.
    - *Etkisiz Linkler:* Hiç tıklanmayan ancak aktif olan linklerin temizlenmesi önerilir.
- **Gelecek Vizyonu:** LLM (AI) entegrasyonu ile kullanıcı davranışlarına göre kişiselleştirilmiş metinler ve büyüme stratejileri sunacak.

---

## 📚 Önerilen Dokümantasyon Başlıkları

Dökümantasyon (GitBook, Docusaurus veya Mintlify benzeri bir yapıda) şu ana başlıkları içerebilir:

### 1. Başlangıç (Getting Started)
- **Cüzdan Bağlantısı:** Avalanche ağında cüzdan bağlama süreci.
- **Profil Oluşturma:** İlk adımlar ve slug (URL) seçimi. (Detaylar: `docs/USER_GUIDE.md`)

### 2. Profil Kişiselleştirme (Customization)
- **Presets & Layouts:** Tek tıkla değişen görünüm şablonları (Links Only, Social Focus, Portfolio vb.).
- **Görünüm Ayarları:** Renk paletleri, fontlar ve cam (glassmorphism) efektleri.
- **Dynamic Header:** Rollerin, durum mesajının ve avatarın yönetimi.

### 3. İçerik Yönetimi (Content & Links)
- **Kategori Sistemi:** Linklerin hiyerarşik olarak düzenlenmesi.
- **Sosyal İkonlar:** Sosyal medya hesaplarının profile entegrasyonu.
- **NFT Vitrini:** (Varsa) NFT koleksiyonlarının sergilenmesi.

### 4. Analitik ve Veri (Analytics & Privacy)
- **KPI Tanımları:** Profile View, Link Click ve CTR metriklerinin ne anlama geldiği.
- **Gizlilik Politikası:** Verilerin anonim olarak nasıl tutulduğu (Privacy-first).
- **Insights Sayfası:** İstatistikleri dışarıyla paylaşma özelliği.

### 5. Sosyal Etkileşim (Social Layer)
- **Takip Sistemi:** Kullanıcılar arası etkileşim.
- **Repütasyon:** Puanlama, ranklar ve badge (rozet) sistemi.

### 6. Teknik Mimari (For Developers)
- **Teknoloji Yığını:** Next.js, Prisma, Tailwind ve Avalanche entegrasyonu.
- **API Dökümantasyonu:** Verilere programatik erişim (ileride).

### 7. Moderasyon ve Güvenlik (Admin)
- **Admin View:** İçerik moderasyonu ve log izleme.
- **Spam Koruması:** Topluluk kuralları.
