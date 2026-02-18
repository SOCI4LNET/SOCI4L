# SOCI4L Figma Plugin - Variables Setup

Bu guide, Figma Plugin kullanarak SOCI4L design system variables'larını otomatik olarak eklemenizi sağlar.

## Yöntem 1: Figma Plugin Olarak Çalıştırma

### Adım 1: Plugin Dosyalarını Hazırlama

1. Figma Desktop'ta: **Plugins → Development → New Plugin**
2. Plugin adı: `SOCI4L Variables Setup`
3. `manifest.json` dosyasını oluşturun (içeriği `scripts/figma-plugin-manifest.json`'dan kopyalayın)
4. `code.ts` dosyasını oluşturun ve `scripts/figma-plugin-setup-variables.js` içeriğini TypeScript'e çevirin

### Adım 2: Plugin'i Çalıştırma

1. Figma Desktop'ta file'ınızı açın: `https://www.figma.com/design/wLkuqYmrXwXqhKyxPdzcLY/Untitled`
2. **Plugins → Development → SOCI4L Variables Setup** seçin
3. Plugin variables'ları otomatik olarak ekleyecek

## Yöntem 2: Manuel Setup (Önerilen - Daha Kolay)

Figma Variables API henüz beta aşamasında olduğu için, **manuel setup** daha güvenilir:

1. **Figma Desktop**'ı açın
2. File'ınızı açın: `https://www.figma.com/design/wLkuqYmrXwXqhKyxPdzcLY/Untitled`
3. **Right sidebar → Variables** sekmesine gidin
4. `docs/FIGMA_VARIABLES_SETUP.md` dosyasındaki adımları takip edin
5. `scripts/export-figma-variables.json` dosyasındaki değerleri kullanarak variables'ları ekleyin

## Hızlı Referans: Variable Değerleri

Tüm variable değerleri `scripts/export-figma-variables.json` dosyasında JSON formatında hazır.

### Brand Colors
- `brand/500` (Main): `#2845D6`
- `brand/50` - `brand/950`: Full scale

### Semantic Colors
- Light mode: `background: #F0F0F0`, `foreground: #0A0A0A`, vb.
- Dark mode: `background: #0A0A0A`, `foreground: #FAFAFA`, vb.

### Spacing
- `spacing/6`: `24px` (default card padding)
- `spacing/4`: `16px` (default gap)

### Radius
- `radius/md`: `6px` (default)

---

**Not**: Figma Variables API tam olarak public olmadığı için, manuel setup şu an için en güvenilir yöntemdir.
