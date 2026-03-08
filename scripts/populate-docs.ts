import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const AUTHOR_ID = 'cmmgt0hgc000012moc94jpwk6' // fther admin ID from backup

const articles = [
  {
    slug: 'overview',
    title: 'Genel Bakış',
    category: 'Getting Started',
    description: 'SOCI4L platformuna ve temel özelliklerine genel bir bakış.',
    content: `
# SOCI4L'e Hoş Geldiniz

SOCI4L, Web3 dünyası için tasarlanmış yeni nesil bir sosyal kimlik ve "link-in-bio" platformudur. Merkeziyetsiz dünyanın sunduğu imkanları, kullanıcı dostu bir arayüzle birleştirerek dijital varlığınızı, başarılarınızı ve bağlantılarınızı tek bir noktada toplamanıza olanak tanır.

## SOCI4L Nedir?

SOCI4L, sadece bir bağlantı listesi değil, aynı zamanda on-chain (zincir üstü) kimliğinizin vitrinidir. NFT koleksiyonlarınızı sergileyebilir, cüzdanınızdaki varlıkları doğrulanmış bir şekilde paylaşabilir ve yapay zeka ajanlarınızla etkileşime geçebilirsiniz.

## Temel Özellikler

- **On-Chain Kimlik:** Kullanıcı adınız bir akıllı kontrat üzerinde saklanır ve tamamen size aittir.
- **Varlık Sergileme:** NFT'lerinizi ve dijital koleksiyon parçalarınızı profilinizde şık bir şekilde sunun.
- **Yapay Zeka Entegrasyonu:** Profilinizi sizin yerinize yöneten veya ziyaretçilerle etkileşime giren AI ajanları.
- **Bağış ve Gelir Modelleri:** Takipçilerinizden doğrudan kripto para bağışları alın.
- **Gelişmiş Analitik:** Profilinizin performansını ve ziyaretçi istatistiklerini detaylıca takip edin.

## Neden SOCI4L?

Geleneksel platformların aksine SOCI4L, verilerinizin ve kimliğinizin kontrolünü size verir. Sansüre dirençli, şeffaf ve Web3 ekonomisiyle tam uyumlu bir deneyim sunar.

---

<div className="bg-primary/10 p-6 rounded-xl border border-primary/20 mt-8">
  **Hadi Başlayalım!**  
  Platformu kullanmaya başlamak için bir sonraki adıma geçin: [Cüzdanınızı Bağlayın](/docs/getting-started/connect-wallet)
</div>
`
  },
  {
    slug: 'getting-started/connect-wallet',
    title: 'Cüzdanınızı Bağlayın',
    category: 'Getting Started',
    description: 'SOCI4L hesabınızı oluşturmak için cüzdanınızı nasıl bağlayacağınızı öğrenin.',
    content: `
# Cüzdanınızı Bağlayın

SOCI4L dünyasına adım atmanın ilk adımı bir Web3 cüzdanı bağlamaktır. Bu işlem, platformda kimliğinizi doğrulamak ve on-chain işlemler gerçekleştirmek için gereklidir.

## Desteklenen Cüzdanlar

Privy altyapısı sayesinde SOCI4L, onlarca farklı cüzdan tipini ve giriş yöntemini destekler:
- **Popüler Cüzdanlar:** MetaMask, Coinbase Wallet, Phantom, Rainbow.
- **Sosyal Girişler:** Google, Apple, Discord veya E-posta (bu yöntemler arka planda sizin için güvenli bir cüzdan oluşturur).

## Bağlanma Adımları

1. Sağ üst köşedeki **"Connect Wallet"** (Cüzdan Bağla) butonuna tıklayın.
2. Açılan pencereden dilediğiniz cüzdanı veya giriş yöntemini seçin.
3. Cüzdan uygulamanızdan gelen imza isteğini onaylayın. Bu imza, cüzdanın size ait olduğunu doğrular ve herhangi bir gas ücreti (işlem ücreti) gerektirmez.

## Neden Cüzdan Bağlamalıyım?

- **Güvenlik:** Şifreler yerine kriptografik anahtarlar kullanılır.
- **Sahiplik:** Profiliniz ve kullanıcı adınız doğrudan cüzdan adresinize tanımlanır.
- **Varlık Erişimi:** Cüzdanınızdaki NFT'leri sergileyebilmeniz için bağlantı gereklidir.

---

> [!TIP]
> Eğer bir Web3 cüzdanınız yoksa, Google veya E-posta ile giriş yaparak SOCI4L'in sizin için otomatik olarak bir "Passkey" cüzdanı oluşturmasını sağlayabilirsiniz.
`
  },
  {
    slug: 'getting-started/claim-username',
    title: 'Kullanıcı Adı Alma',
    category: 'Getting Started',
    description: 'Benzersiz SOCI4L kullanıcı adınızı nasıl tescil edeceğinizi öğrenin.',
    content: `
# Kullanıcı Adı Alma (Claim Username)

SOCI4L'de kullanıcı adları sadece bir etiket değil, Avalanche blok zinciri üzerinde tescil edilen benzersiz dijital varlıklardır.

## Kullanıcı Adı Belirleme

Kullanıcı adınız, profilinizin URL'sini belirleyecektir (örn: \`soci4l.net/kullaniciadiniz\`). İdeal bir kullanıcı adı:
- En az 3 karakter olmalıdır.
- Sadece küçük harf, rakam ve tire (-) içerebilir.
- Topluluk kurallarına aykırı olmamalıdır.

## Tescil Süreci

1. **Sorgulama:** İstediğiniz adın müsait olup olmadığını Dashboard üzerinden kontrol edin.
2. **Talep (Claim):** Eğer ad müsaitse, "Claim" butonuna tıklayarak işlemi başlatın.
3. **Onay:** İşlem akıllı kontrat üzerinden gerçekleşeceği için cüzdanınızdan bir onay vermeniz gerekecektir.

## Ücretler ve Bekleme Süreleri

- **Kayıt Ücreti:** Bazı özel veya kısa isimler platformun sürdürülebilirliği için küçük bir ücret gerektirebilir.
- **Soğuma Süresi (Cooldown):** Bırakılan veya transfer edilen kullanıcı adları, başkası tarafından alınmadan önce belirli bir süre askıda kalabilir.

---

<div className="bg-amber-500/10 p-4 border border-amber-500/20 rounded-lg">
  **Dikkat:** Aldığınız kullanıcı adı cüzdan adresinize kalıcı olarak bağlanır. Bu adı daha sonra profil ayarlarınızdan değiştirebilirsiniz ancak eski adınızın boşa çıkacağını unutmayın.
</div>
`
  },
  {
    slug: 'getting-started/basic-profile-setup',
    title: 'Temel Profil Kurulumu',
    category: 'Getting Started',
    description: 'Profilinizi özelleştirmeye başlamak için temel ayarlar.',
    content: `
# Temel Profil Kurulumu

Kullanıcı adınızı aldıktan sonra, kendinizi Web3 dünyasına tanıtma zamanı!

## Profil Düzenleme

Profilinizi görsel olarak zenginleştirmek için şu adımları izleyin:

### 1. Profil Resmi (Avatar)
- **NFT Kullanın:** Cüzdanınızdaki herhangi bir NFT'yi profil fotoğrafı olarak seçebilirsiniz. Bu, "Verified NFT" rozeti ile birlikte görünür.
- **Dosya Yükleyin:** Bilgisayarınızdan standart bir .jpg veya .png dosyası yükleyebilirsiniz.

### 2. Görünen İsim ve Biyografi
- **Görünen İsim:** Kullanıcı adınızdan farklı olarak istediğiniz her karakteri içeren bir isim belirleyebilirsiniz.
- **Biyografi:** 160 karakterde kendinizi, projelerinizi veya uzmanlık alanlarınızı anlatın.

### 3. Kapak Görseli ve Renkler
Profilinizin üst kısmındaki banner alanını özelleştirin. Marka renklerinize veya zevkinize uygun bir renk paleti seçin.

## Görünürlük Ayarları
Profilinizin herkes tarafından mı yoksa sadece belirli kişilerce mi görülebileceğini "Settings" bölümünden ayarlayabilirsiniz.

---

[Stüdyo'ya Gidip Başla ->](/dashboard)
`
  },
  {
    slug: 'profile/general-informations',
    title: 'Genel Bilgiler',
    category: 'Profile',
    description: 'Profil kimliğinizi ve genel ayarlarınızı yönetin.',
    content: `
# Genel Bilgiler

SOCI4L profilinizdeki kimlik bilgilerini yönetmek oldukça basittir. Bu bölüm, ziyaretçilerin sizin hakkınızda gördüğü ilk bilgileri kapsar.

## Kimlik Detayları

Profil sayfanızda şu temel bilgileri güncelleyebilirsiniz:

- **Display Name (Görünen Ad):** Gerçek adınız, takma adınız veya marka adınız.
- **Professional Title:** "Blockchain Developer", "Digital Artist" veya "Web3 Investor" gibi unvanlar ekleyebilirsiniz.
- **Location:** Bulunduğunuz şehri veya "Metaverse" gibi eğlenceli konumlar ekleyin.

## Durum Mesajı

O an ne yaptığınızı veya neye açık olduğunuzu (örn: "Open to collabs", "Traveling") küçük bir emoji ile bildirebilirsiniz.

## Gizlilik Ayarları

Profilinizin arama motorlarında çıkıp çıkmayacağını veya belirli bölümlerin (örn: cüzdan bakiyesi, işlem geçmişi) gizli kalıp kalmayacağını buradan kontrol edebilirsiniz.
`
  },
  {
    slug: 'profile/links-socials',
    title: 'Bağlantılar ve Sosyala Medya',
    category: 'Profile',
    description: 'Sosyala medya hesaplarınızı ve özel bağlantılarınızı profilinize ekleyin.',
    content: `
# Bağlantılar ve Sosyal Medya

SOCI4L, tüm dijital varlığınızı tek bir merkezde toplamanıza yardımcı olur.

## Sosyal Medya Hesapları

Doğrulanmış sosyal medya hesaplarınızı profilinize ekleyerek güvenilirliğinizi artırın:
- **X (Twitter):** Hesabınızı bağlayın ve takipçi sayınızı gösterin.
- **GitHub:** Yazılımcılar için repolarını ve katkılarını sergileme imkanı.
- **Discord & Telegram:** Topluluğunuzla iletişim kurmanın en hızlı yolları.

## Özel Bağlantılar (Custom Links)

Kendi web sitenizi, makalelerinizi veya referans linklerinizi ekleyin:
1. **URL Ekle:** Gitmesini istediğiniz adresi yapıştırın.
2. **Başlık Belirle:** Butonun üzerinde yazacak metni girin.
3. **İkon Seçin:** Bağlantının ne olduğunu belirten bir ikon atayın.

## Gruplandırma ve Sıralama

Bağlantılarınızı kategorilere ayırarak (örn: "Portfolio", "Socials", "Investments") profilinizin daha düzenli durmasını sağlayabilirsiniz.
`
  },
  {
    slug: 'profile/presenting-possessions',
    title: 'Varlıkların Sergilenmesi',
    category: 'Profile',
    description: 'NFT ve diğer dijital varlıklarınızı profilinizde sergileyin.',
    content: `
# Varlıkların Sergilenmesi (Showcase)

Web3 dünyasında sahip olduğunuz varlıklar kimliğinizin bir parçasıdır. SOCI4L ile bu varlıkları en şık şekilde sergileyebilirsiniz.

## NFT Sergisi

Cüzdanınızdaki NFT'leri profilinize eklemek için:
1. "Showcase" bölümüne gidin.
2. Bağlı cüzdanınızdaki ağları seçin (Ethereum, Avalanche, Polygon vb.).
3. Sergilemek istediğiniz NFT'leri işaretleyin.
4. "Add to Profile" butonuna tıklayın.

## Koleksiyon Yönetimi

Sergilediğiniz ürünleri kategorize edebilir, en değerli parçalarınızı en üstte gösterebilirsiniz. Her NFT, orijinal koleksiyonuna ve kontrat adresine doğrulanmış bir link ile bağlanır.

## Diğer Dijital Varlıklar

Sadece NFT'ler değil, ilerleyen dönemlerde on-chain başarı sertifikaları (POAP'lar) ve özel token'lar da bu alanda sergilenebilecektir.
`
  },
  {
    slug: 'profile/transactions',
    title: 'İşlemler',
    category: 'Profile',
    description: 'On-chain geçmişinizi ve profiliniz üzerinden yapılan işlemleri takip edin.',
    content: `
# İşlemler (Transactions)

SOCI4L profilinizle ilişkilendirilmiş tüm on-chain aktiviteleri buradan takip edebilirsiniz.

## Profil Etkileşimleri

- **Bağışlar:** Size gelen veya sizin gönderdiğiniz kripto para bağışlarının kaydı.
- **Kullanıcı Adı İşlemleri:** Ad tescili, yenileme veya transfer geçmişi.
- **Premium Üyelik:** Abonelik ödemelerinizin dekontları.

## Şeffaflık ve Güvenlik

Tüm işlemler blok zinciri gezgini (örn: Snowtrace) üzerinden doğrulanabilir. SOCI4L, bu verileri sizin için daha okunabilir ve düzenli bir tablo haline getirir.

---

> [!NOTE]
> Bu bölümdeki bazı veriler sadece profil sahibi (siz) tarafından görülebilir. Gizlilik ayarlarınızdan hangi işlem türlerinin kamuya açık olacağını belirleyebilirsiniz.
`
  },
  {
    slug: 'dashboard/overview',
    title: 'Panel: Genel Bakış',
    category: 'Dashboard',
    description: 'Hesabınızın performansına ve aktivitelerine hızlıca göz atın.',
    content: `
# Dashboard: Genel Bakış

Dashboard, SOCI4L deneyiminizin kontrol merkezidir.

## Hızlı İstatistikler

Zirvede yer alan özet kartları ile şunları anında görün:
- **Profil Görüntülenme:** Son 30 gün içinde profilinizi kaç kişi ziyaret etti?
- **Bağlantı Tıklamaları:** Hangi linkleriniz daha çok ilgi görüyor?
- **Toplanan Bağışlar:** Toplam ne kadar destek topladınız?

## Son Aktiviteler

Hesabınızda gerçekleşen son olaylar (yeni bir takipçi, başarılı bir kullanıcı adı değişikliği veya bir rozet kazanımı) akış şeklinde sunulur.

## Önerilen Görevler

Profil puanınızı artırmak için yapabileceğiniz işlemler (örn: "Bir sosyal medya hesabı bağla", "Showcase'e ürün ekle") burada hatırlatılır.
`
  },
  {
    slug: 'dashboard/studio/builder',
    title: 'Stüdyo: Düzenleyici',
    category: 'Dashboard',
    description: 'Profilinizin görünümünü gerçek zamanlı olarak özelleştirin.',
    content: `
# Stüdyo: Düzenleyici (Builder)

**Studio Builder**, SOCI4L profilinizi özelleştirmek için kullandığınız ana araçtır. Sürükle-bırak arayüzü sayesinde kod yazmaya gerek kalmadan profesyonel bir profil oluşturabilirsiniz.

## Temel Özellikler

### 🧩 Sürükle & Bırak Organizasyon
Bağlantılarınızı, sosyal medya ikonlarınızı ve vitrin öğelerinizi kolayca yeniden sıralayın. Düzenleyici, ziyaretçilerin profilinizi nasıl göreceğinin canlı bir önizlemesini sunar.

### 🎨 Canlı Önizleme
Değişikliklerinizi anında görün. Renkleri, düzenleri ve tipografiyi değiştirdikçe önizleme paneli anlık olarak güncellenir.

### ⚡ Hızlı Ekleme Menüsü
Profilinize yeni bileşenleri hızla ekleyin:
- **Standart Linkler:** İkonlu özel URL'ler.
- **Sosyal Medya Gömme:** Tweetler, YouTube videoları ve Spotify çerçeveleri.
- **Web3 Varlıkları:** Bağlı cüzdanınızdaki NFT'ler ve token'lar.

## En İyi Pratikler

1. **Düzenli Tutun:** İlgili bağlantıları açık kategoriler altında gruplandırın.
2. **Önemli Olanı Vurgulayın:** En önemli bağlantılarınızı veya son projelerinizi vurgulamak için yerleşim ayarlarını kullanın.
3. **Mobil Görünümü Kontrol Edin:** Çoğu ziyaretçi profilinizi mobilde görecektir, bu yüzden önizlemeyi mobil modda kontrol ettiğinizden emin olun.
`
  },
  {
    slug: 'dashboard/studio/links',
    title: 'Stüdyo: Bağlantılar',
    category: 'Dashboard',
    description: 'Tüm profil bağlantılarınızı detaylıca yönetin.',
    content: `
# Stüdyo: Bağlantılar

Bağlantılarınızı sadece eklemekle kalmayın, onları optimize edin ve yönetin.

## Bağlantı Yönetimi

Her bir bağlantı için şu ayarları yapabilirsiniz:
- **Görünürlük:** Bir linki silmeden geçici olarak gizleyebilirsiniz.
- **Zamanlama:** (Premium) Belirli tarihler arasında aktif olacak linkler oluşturun.
- **Özel İkonlar:** Standart ikonlar yerine kendi görsellerinizi yükleyin.

## Kategoriler

Bağlantı yoğunluğunu azaltmak için klasörler veya başlıklar oluşturun. Örneğin; "Yazılarım", "Sosyal Medya", "Projelerim" gibi.
`
  },
  {
    slug: 'dashboard/studio/insights',
    title: 'Stüdyo: İstatistikler',
    category: 'Dashboard',
    description: 'Profilinizin trafiği hakkında derinlemesine analizler.',
    content: `
# Stüdyo: İstatistikler (Insights)

Profilinizin kimler tarafından, nereden ve nasıl ziyaret edildiğini anlamanıza yardımcı olur.

## Trafik Kaynakları

Ziyaretçileriniz size nereden ulaşıyor?
- Sosyal medya yönlendirmeleri.
- QR kod taramaları.
- Doğrudan URL girişleri.

## Cihaz ve Konum Bilgileri

Ziyaretçilerinizin hangi ülkelerden geldiğini ve hangi cihazları (Mobil/Masaüstü) kullandığını anonimleştirilmiş verilerle görün.

## Tıklama Oranları (CTR)

Hangi bağlantının ne kadar tıklandığını takip ederek, profilinizi kullanıcı davranışlarına göre optimize edin.
`
  },
  {
    slug: 'dashboard/account/safety',
    title: 'Hesap Güvenliği',
    category: 'Dashboard',
    description: 'SOCI4L hesabınızı ve dijital varlıklarınızı korumanın yolları.',
    content: `
# Hesap Güvenliği

Web3 dünyasında güvenlik her şeydir. SOCI4L, verilerinizi korumak için en modern standartları kullanır.

## Güvenlik Önlemleri

- **Cüzdan Bazlı Erişim:** Şifreler çalınabilir, ancak özel anahtarınız (private key) sizde olduğu sürece hesabınız güvendedir.
- **Passkey Desteği:** Biyometrik verilerinizle (FaceID, Parmak İzi) hızlı ve güvenli giriş yapın.
- **Yetkilendirme Kontrolü:** Hesabınıza bağlı olan üçüncü taraf uygulamaları dilediğiniz zaman "Settings" altından yönetebilirsiniz.

## Tavsiyeler

1. **Seed Phrase Paylaşmayın:** SOCI4L ekibi sizden asla cüzdan kelimelerinizi istemez.
2. **Resmi Kanalları Kullanın:** Sadece \`soci4l.net\` alan adını kullandığınızdan emin olun.
3. **Donanım Cüzdanı:** Daha fazla güvenlik için profilinizi bir Ledger veya Trezor gibi donanım cüzdanına bağlayın.
`
  },
  {
    slug: 'dashboard/account/settings',
    title: 'Hesap Ayarları',
    category: 'Dashboard',
    description: 'Platform tercihlerini ve bildirim ayarlarını yapılandırın.',
    content: `
# Hesap Ayarları

SOCI4L deneyiminizi kişiselleştirmek için genel ayarları buradan yapabilirsiniz.

## Tercihler

- **Bildirimler:** Yeni bir bağış aldığınızda veya yeni bir takipçi geldiğinde e-posta almak isteyip istemediğinizi seçin.
- **Dil:** Platform arayüzü dilini değiştirin.
- **Tema:** Karanlık (Dark Mode) veya Aydınlık mod tercihinizi yapın.

## Profil Verilerini Dışa Aktarma

Blok zinciri üzerindeki verileriniz zaten size aittir, ancak SOCI4L üzerindeki ayarlarınızı ve konfigürasyonlarınızı bir JSON dosyası olarak bilgisayarınıza indirebilirsiniz.
`
  },
  {
    slug: 'dashboard/account/billing',
    title: 'Fatura ve Ödemeler',
    category: 'Dashboard',
    description: 'Ödeme geçmişinizi ve abonelik durumunuzu yönetin.',
    content: `
# Fatura ve Ödemeler (Billing)

SOCI4L üzerindeki finansal işlemlerinizi tek bir yerden yönetin.

## İşlem Türleri

- **Premium Üyelik:** Aktif bir premium aboneliğiniz varsa, bitiş tarihini ve bir sonraki ödeme dönemini görün.
- **Username Claim:** Aldığınız kullanıcı adları için ödediğiniz on-chain harçların dökümü.

## Ödeme Yöntemleri

Ödemeler genellikle Avalanche ağındaki yerel tokenlar (AVAX) veya stabil coinler üzerinden yapılır. Ödeme yaparken işlem geçmişinizin blok zinciri üzerindeki TxID (işlem kimliği) bilgilerini burada bulabilirsiniz.
`
  },
  {
    slug: 'ai-agents',
    title: 'Yapay Zeka Ajanları',
    category: 'AI Agents',
    description: 'Profilinize güç katan akıllı asistanlar hakkında bilgi edinin.',
    content: `
# Yapay Zeka Ajanları (AI Agents)

SOCI4L, statik bir profilin ötesine geçerek size yaşayan, etkileşimli bir dijital ikiz sunar.

## AI Ajanı Nedir?

AI Ajanları, profilinizin verilerini (biyografi, linkler, NFT'ler) analiz ederek sizin yerinize ziyaretçilere yanıt verebilen veya içerik önerebilen yapay zeka modelleridir.

## Nasıl Kullanılır?

1. **Aktivasyon:** Dashboard üzerinden AI Ajanı özelliğini aktif edin.
2. **Eğitim:** Ajanınızın hangi tonla konuşacağını (Ciddi, Esprili, Teknik vb.) belirleyin.
3. **Yayınla:** Ajanınız profil sayfanızda küçük bir sohbet balonu veya asistan olarak yerini alır.

## Avantajları

- **7/24 Etkileşim:** Siz uyurken bile ziyaretçilerin sorularını yanıtlar.
- **Veri Analizi:** Profil trafiğini analiz ederek size iyileştirme önerileri sunar.
- **On-Chain Entegrasyon:** Yakında ajanlar, sizin belirlediğiniz sınırlar dahilinde on-chain işlemler bile gerçekleştirebilecek!
`
  },
  {
    slug: 'profile-scoring/ranks',
    title: 'Profil Puanı ve Rütbeler',
    category: 'Profile Scoring',
    description: 'Profilinizin puanlanma sistemi ve rütbelerin anlamı.',
    content: `
# Profil Puanı ve Rütbeler

SOCI4L, kullanıcıların platformdaki etkisini ve güvenilirliğini ölçen şeffaf bir puanlama sistemine sahiptir.

## Puan Nasıl Hesaplanır?

Algoritmamız şu kriterleri göz önünde bulundurur:
- **Profil Tamamlama:** Fotoğraf, biyografi ve sosyal linklerin doluluk oranı.
- **On-Chain Aktivite:** Cüzdan yaşı, tutulan değerli NFT'ler ve işlem sıklığı.
- **Sosyal Erişim:** Takipçi sayısı ve profilinizin aldığı etkileşim.

## Rütbeler (Ranks)

Puanınıza göre şu rütbelerden birine sahip olursunuz:
1. **Newbie:** Başlangıç seviyesi.
2. **Explorer:** Profilini doldurmuş ve Web3'ü keşfetmeye başlamış kullanıcılar.
3. **Elite:** Yüksek on-chain değere ve etkiye sahip profiller.
4. **Legend:** Topluluğun en saygın ve aktif üyeleri.

## Faydaları

Yüksek rütbeler size şu avantajları sağlar:
- Profil aramalarında üst sıralarda görünme.
- Özel temalara ve rozetlere erişim.
- Yeni özelliklere (Beta) öncelikli katılım hakkı.
`
  },
  {
    slug: 'donations/platform',
    title: 'Platform Üzerinden Bağış',
    category: 'Donations',
    description: 'Doğrudan profil sayfanız üzerinden nasıl bağış alabileceğinizi öğrenin.',
    content: `
# Platform Üzerinden Bağış

SOCI4L, içerik üreticileri ve Web3 kullanıcıları için sürtünmesiz bir gelir modeli sunar.

## Nasıl Çalışır?

Profilinizde bir "Donate" (Bağış Yap) butonu bulunur. Bir ziyaretçi size destek olmak istediğinde:
1. Butona tıklar ve göndermek istediği tutarı seçer.
2. Kendi cüzdanı üzerinden işlemi onaylar.
3. Tutar, SOCI4L havuzuna uğramadan **doğrudan sizin cüzdanınıza** geçer.

## Desteklenen Birimler

Başlangıçta Avalanche (AVAX) ve popüler stabil coinler desteklenmektedir.

## Komisyon Oranı

SOCI4L, platform üzerinden yapılan bağışlardan çok küçük bir platform geliştirme payı alabilir. Detaylar için "Premium" sayfasına göz atın.
`
  },
  {
    slug: 'donations/extension',
    title: 'Uzantı ile Bağış',
    category: 'Donations',
    description: 'SOCI4L tarayıcı uzantısını kullanarak internetin her yerinde bağış yapın.',
    content: `
# Uzantı ile Bağış (Extension)

SOCI4L tarayıcı uzantısı, interneti SOCI4L ekosistemiyle birleştirir.

## Özellikler

- **Hızlı Tanıma:** Uzantı, ziyaret ettiğiniz bir sitenin (örn: bir Twitter profili veya blog) bir SOCI4L hesabıyla ilişkili olup olmadığını algılar.
- **Anında İpucu (Tipping):** Profil sayfasına gitmeye gerek kalmadan, tarayıcınızın köşesinden hızlıca bağış gönderebilirsiniz.

## Kurulum

Uzantıyı Chrome Web Mağazası üzerinden indirin, cüzdanınızı bağlayın ve internette gezinirken favori içerik üreticilerinize destek olun.
`
  },
  {
    slug: 'premium',
    title: 'Premium Üyelik',
    category: 'Premium',
    description: 'SOCI4L Premium ile sınırsız özelliklerin tadını çıkarın.',
    content: `
# SOCI4L Premium

Profilinizi bir üst seviyeye taşımak isteyenler için tasarlanmış özel özellikler paketidir.

## Premium Avantajları

- **Özel Alan Adları:** \`soci4l.net/isim\` yerine kendi satın aldığınız \`isim.xyz\` gibi alan adlarını profilinize bağlayın.
- **Gelişmiş Temalar:** Standart kullanıcıların erişemediği dinamik arka planlar ve animasyonlu profil çerçeveleri.
- **Sıfır Komisyon:** Bağış alırken platform komisyonundan muaf olun.
- **AI Ajanı Önceliği:** Daha gelişmiş modelleri ajanlarınızda kullanın ve daha hızlı yanıt süreleri elde edin.

## Nasıl Satın Alınır?

"Billing" sekmesi altından aylık veya yıllık abonelik planlarımızı seçebilir, ödemeyi kripto para ile saniyeler içinde tamamlayabilirsiniz.
`
  }
]

async function main() {
  console.log('--- POPULATING DOCS ---')
  
  for (const article of articles) {
    console.log(`Upserting article: ${article.slug}...`)
    
    await prisma.docsArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        description: article.description,
        content: article.content,
        category: article.category,
        published: true,
      },
      create: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        content: article.content,
        category: article.category,
        published: true,
        authorId: AUTHOR_ID
      }
    })
  }
  
  console.log('--- POPULATE COMPLETE ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
