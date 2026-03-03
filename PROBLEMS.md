Öncelikli Güvenlik Bulguları (Backend)

Kritik: Oturum cookie’si imzasız, kolayca sahte üretilebilir (hesap ele geçirme riski)
Kanıt: lib/auth.ts:7 sadece aph_session değerini okuyup doğrulanmış kabul ediyor; imza/JWT/session lookup yok.
Kanıt: app/api/auth/verify/route.ts:98 aph_session içine düz adres yazıyor.
Etki: Cookie header’ını manipüle edebilen bir saldırgan, herhangi bir adres gibi davranabilir; bu durum admin endpointlerine kadar zincirlenebilir.
Öneri: İmzalı/şifreli session (JWT + server-side verify) veya DB-backed opaque session ID kullanın. getSessionAddress() asla ham cookie değerine güvenmemeli.
Kritik: Docs admin oturumu da imzasız JSON cookie (admin panel bypass)
Kanıt: lib/docs-auth.ts:22 cookie JSON’unu parse edip doğrudan session kabul ediyor.
Kanıt: app/api/docs-admin/auth/route.ts:41 cookie’ye {id,address,role} düz JSON yazıyor.
Ek zafiyet: middleware.ts:43 /docs-admin için cookie’nin varlığını kontrol ediyor, geçerliliğini değil.
Etki: Sahte cookie ile docs admin API/UI erişimi mümkün.
Öneri: İmzalı token + server doğrulama, middleware’de “cookie var mı” değil “session valid mi” kontrolü.
Kritik: Admin server action yetkilendirmesi istemciden gelen adminAddress parametresine dayanıyor
Kanıt: actions/admin.ts:22 vb. fonksiyonlar adminAddress argümanını isAdmin() ile doğruluyor.
Kanıt: components/admin/admin-user-actions.tsx:31 adminAddress client wallet’tan alınıp action’a gönderiliyor.
Etki: Yetki kaynağı server-side session yerine client input; tasarım gereği bypass yüzeyi çok yüksek.
Öneri: Action içinde parametreyle admin doğrulama kaldırın; server-side requireAdmin() ile oturumdan kimliği alın.
Yüksek: State değiştiren cron/indexer endpointleri public
Kanıt: app/api/cron/sync-premium/route.ts:21 auth kontrolü yok.
Kanıt: app/api/cron/sync-slugs/route.ts:22 auth kontrolü yok.
Kanıt: app/api/cron/score-snapshots/route.ts:24 secret yalnızca varsa kontrol ediliyor (opsiyonel).
Etki: Herkes ağır index/sync işleri tetikleyip kaynak tüketimi/DoS yaratabilir.
Öneri: Tüm cron endpointlerinde zorunlu secret + method hardening (POST) + IP allowlist + queue.
Yüksek: Nonce/replay koruması bazı kritik endpointlerde eksik
Kanıt: app/api/auth/verify/route.ts:30 nonce yalnız cookie’den okunuyor; nonce-store doğrulaması/used işaretleme yok.
Benzer desen: app/api/profile/save-all/route.ts:32, app/api/profile/social/route.ts:131, app/api/profile/slug/route.ts:59.
Etki: İmza+nonce tekrar oynatma riski artar; “cookie silme” tek başına güvenli replay koruması değildir.
Öneri: Tüm imza endpointlerinde tek standart: nonce store + TTL + address binding + atomic “mark used”.
Yüksek: Legacy claim endpoint zayıf ownership/nonce modeli
Kanıt: app/api/claim/route.ts:25 sadece existing.owner kontrol ediyor (ownerAddress yok sayılıyor).
Kanıt: app/api/claim/nonce/route.ts:16 nonce saklanmıyor; app/api/claim/route.ts:8 nonce doğrudan body’den alınıyor.
Etki: Eski endpoint üzerinden claim akışı güvenlik seviyesini düşürüyor.
Öneri: /api/claim* legacy yollarını kaldırın veya /api/profile/claim ile aynı güvenlik modeline yükseltin.