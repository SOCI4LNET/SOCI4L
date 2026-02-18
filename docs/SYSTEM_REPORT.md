# SOCI4L Sistem Raporu 🚀

**Tarih:** 10 Şubat 2026  
**Durum:** v1.2 (Sürekli Geliştirme)  
**Platform:** Avalanche C-Chain Profile Hub

---

## 1. SOCI4L Nedir? (Vizyon ve Amaç) 

SOCI4L bugün bireylerin kendilerini sunabildiği bir **consumer (tüketici) ürünü** olarak başlar. Temelde Web3 ekosistemi için bir **kimlik ve bağlantı katmanı**dır. Karmaşık, okunması zor cüzdan adreslerini (0x...); insan tarafından okunabilir, özelleştirilebilir ve ölçülebilir profillere dönüştürür.

### Temel Amaçlar:
*   **Bireysel Temsiliyet:** Kullanıcıların Web3 dünyasında kendilerini ifade edebilecekleri şık ve fonksiyonel bir alan sunmak.
*   **Kimlik Katmanına Dönüşüm:** Gelecekte üçüncü taraf uygulamaların, DAO'ların ve ekiplerin bağlanabileceği merkeziyetsiz bir kimlik katmanı olmak.
*   **Veri Konsolidasyonu:** Varlıklar, işlem geçmişi ve sosyal medya bağlantılarını tek bir çatı altında toplamak.
*   **Güven ve İtibar:** On-chain verilerle desteklenen doğrulanabilir kimlik sinyalleri oluşturmak.

### Kullanım Senaryoları:
SOCI4L, farklı bireysel kullanım senaryolarına uyum sağlayan bir kimlik ve profil ürünüdür:
*   **İçerik Üreticileri:** Topluluklarıyla tüm önemli bağlantılarını tek bir şık link üzerinden paylaşabilir.
*   **Etkinlik Düzenleyicileri:** Sunumlarına QR kod ekleyerek katılımcıların anında profillerine ve paylaştıkları bağlantılara erişmesini sağlayabilir.
*   **Geliştiriciler:** Cüzdan tabanlı kimliklerini, sertifikalarını ve çalışmalarını tek bir merkeziyetsiz noktada sunabilir.

---

## 2. SOCI4L Ne Sunuyor? (Mevcut Özellikler)

Platform şu an tam işlevsellik sunan bir Web3 Dashboard ve Profil sistemine sahiptir:

### 🛠️ Profil ve Kimlik Yönetimi
*   **Web3 Native Giriş:** E-posta veya şifre gerekmeden, sadece cüzdan imzasıyla güvenli giriş.
*   **Profil Talebi (Claiming):** Herhangi bir Avalanche adresini sahipliğini kanıtlayarak talep etme.
*   **Özelleştirme:** Display name, bio ve 8 adede kadar sosyal medya (X, GitHub, Discord, LinkedIn vb.) bağlantısı ekleme.
*   **Custom Slugs:** `soci4l.net/p/kullaniciadi` şeklinde kişiselleştirilmiş URL'ler.
*   **QR Kod Desteği:** Profilleri kolayca paylaşmak için dinamik QR kod üretimi.

### 💰 Varlık ve Aktivite Takibi
*   **Wealth Display:** AVAX ve ERC-20 token bakiyelerinin anlık takibi.
*   **NFT Koleksiyonları:** Cüzdandaki NFT'lerin listelenmesi ve detayları.
*   **İşlem Geçmişi:** Blockchain üzerindeki son hareketlerin düzenli ve filtrelenebilir dökümü.
*   **Portfolio Değeri:** CoinGecko entegrasyonu ile varlıkların USD değerlerinin gösterimi.

### 🤝 Sosyal ve Etkileşim
*   **Takip Sistemi:** Kullanıcıları takip etme/takipten çıkma ve takipçi listelerini yönetme.
*   **SOCI4L Score:** Profil doluluğu ve on-chain aktiviteye göre hesaplanan itibar skoru.
*   **Gizlilik:** Profili tamamen halka açık veya gizli (private) yapabilme seçeneği.
*   **Paylaşım Menüsü:** Profilin X (Twitter) üzerinden hızlıca paylaşılması ve bağlantı kopyalama.

### � Ölçülebilir Kimlik (Analitik)
*   **Gerçek Zamanlı Takip:** Profil görüntülenmesi ve link tıklamalarının sunucu tarafında (server-side) takip edilmesi.
*   **Etkileşim Analitiği:** Kullanıcının hangi bağlantısının daha çok ilgi gördüğünü ölçebilmesi.

### �🛡️ Admin ve Operasyon (Master Console)
*   **Premium İzleme:** Pro kullanıcıların abonelik durumları, ödeme tarihleri ve TX kayıtlarının detaylı takibi.
*   **User Management:** Kullanıcı detaylarına ve sistem loglarına admin erişimi.

---

## 3. Nasıl Çalışır? (Teknik Altyapı)

SOCI4L, tamamen Web3 yerel (native) teknolojiler ve **strict security (sıkı güvenlik)** kuralları üzerine kurulmuştur:

1.  **Güvenlik:** Kimlik doğrulama ve veri güncelleme (kategori değiştirme, sosyal link ekleme vb.) işlemleri sadece cüzdan imzasıyla (Message Signing) yapılır.
2.  **Doğrulanmış Veri:** Sosyal medya bağlantıları, cüzdan adresi ile Privy oturumu eşleştirilerek "cross-wallet" hatalarına karşı korunur. Her veri değişikliği blockchain seviyesinde imza doğrulamasına tabidir.
3.  **Veri Akışı:** Blockchain verileri doğrudan Avalanche RPC ve yedekleme için Snowtrace gibi servislerden çekilir.
4.  **Arayüz:** Next.js 14 App Router altyapısı ve Tailwind CSS ile ultra hızlı, premium bir deneyim sunulur.
5.  **Veritabanı:** Prisma ORM ve PostgreSQL (üretim ortamında) ile kullanıcı tercihleri ve sosyal ilişkiler yüksek performansla saklanır.

---

## 4. İleride Neler Yapacak? (Roadmap)

SOCI4L'un gelecek planları, platformu basit bir profil aracından öte, üçüncü taraf uygulamaların bağlanabileceği kapsamlı bir **kimlik katmanına** dönüştürmeyi hedefliyor:

### 🎯 Kısa Vadeli (Q1-Q2 2026)
*   **Luma Etkinlik Entegrasyonu:** Kullanıcının ev sahipliği yaptığı veya katıldığı Web3 etkinliklerinin profilde görünmesi.
*   **Topluluk Profilleri:** Ekipler ve DAO'lar için özel grup/topluluk sayfaları ve yönetim araçları.

### 🔮 Uzun Vadeli (Q3-Q4 2026)
*   **Kimlik Katmanı ve Gelişmiş API:** Dış projelerin, ekiplerin ve DAO'ların SOCI4L profil verilerini kullanabilmesi için API anahtarı sistemi.
*   **Doğrulanabilir Kimlik Sinyalleri:** Zincir üzerindeki veriler ve sosyal kanıtlarla desteklenen güvenli kimlik doğrulama.
*   **Gelişmiş Görünürlük Kontrolleri:** Verilerin kimler tarafından nasıl görüleceğine dair daha detaylı (granular) gizlilik ayarları.
*   **Premium Pro Planları:** Özel temalar ve detaylı analitikler.

---

## 5. Özet: SOCI4L Kimin İçin?

*   **Yatırımcılar:** Portföylerini profesyonel bir şekilde sergilemek isteyenler.
*   **Koleksiyoncular:** NFT ve başarılarını tek bir linkle (bio link) paylaşmak isteyenler.
*   **Topluluk Yöneticileri:** Projelerindeki kullanıcıların itibarını ve aktivitesini takip etmek isteyenler.
*   **Geliştiriciler:** Web3 kimliğini merkeziyetsiz bir şekilde inşa etmek isteyenler.

---
**SOCI4L: The Identity of Avalanche.**
