# Figma MCP Araçları - Kullanım Örnekleri

Bu doküman, SOCI4L projesinde Figma MCP araçlarının nasıl kullanılacağını pratik örneklerle gösterir.

## Mevcut Figma MCP Araçları

### 1. `get_design_context` - Design Context Alma

**Ne işe yarar:** Figma'daki bir node'un (frame, component, vb.) design context'ini alır. UI kodunu, asset URL'lerini ve tasarım bilgilerini döndürür.

**Kullanım Senaryosu:**
- Figma'daki bir component'i kod olarak almak
- Tasarımı inceleyip implementasyon için referans almak
- Asset'leri (resimler, iconlar) indirmek

**Örnek:**

```typescript
// Figma file'dan bir component'in design context'ini al
// File URL: https://www.figma.com/design/wLkuqYmrXwXqhKyxPdzcLY/Untitled?node-id=1:3

// MCP Tool Call:
get_design_context(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:3"  // Component ID
)

// Dönen bilgiler:
// - UI kodu (React, HTML, CSS)
// - Asset download URL'leri
// - Component yapısı
// - Styling bilgileri
```

**Pratik Kullanım:**
- Figma'daki bir button component'ini kod olarak alıp `components/ui/button.tsx`'e eklemek
- Icon'ları indirip `public/icons/` klasörüne kaydetmek

---

### 2. `get_screenshot` - Screenshot Alma

**Ne işe yarar:** Figma'daki bir node'un screenshot'ını alır.

**Kullanım Senaryosu:**
- Component görselini dokümantasyon için almak
- Design review için görsel paylaşmak
- README'ye eklemek için görsel almak

**Örnek:**

```typescript
// Figma'daki bir frame'in screenshot'ını al
get_screenshot(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:3"  // Frame ID
)

// Dönen: Screenshot image (PNG/JPG)
```

**Pratik Kullanım:**
- Dashboard sayfasının screenshot'ını alıp `docs/screenshots/` klasörüne kaydetmek
- Component library dokümantasyonu için görseller almak

---

### 3. `get_metadata` - Metadata Alma

**Ne işe yarar:** Figma'daki bir node'un veya page'in yapısal metadata'sını alır (XML formatında).

**Kullanım Senaryosu:**
- File yapısını anlamak
- Node ID'lerini bulmak
- Hiyerarşiyi görmek

**Örnek:**

```typescript
// File'ın tüm yapısını gör
get_metadata(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "0:1"  // Page ID (0:1 = root page)
)

// Dönen: XML formatında node yapısı
// - Frame ID'leri
// - Component ID'leri
// - Layer isimleri
// - Pozisyon ve boyutlar
```

**Pratik Kullanım:**
- File'daki tüm component'leri listelemek
- Belirli bir component'in ID'sini bulmak
- Design system yapısını analiz etmek

---

### 4. `get_variable_defs` - Variables Okuma

**Ne işe yarar:** Figma'daki variables'ları okur.

**Kullanım Senaryosu:**
- Mevcut variables'ları kontrol etmek
- Variables'ları kod ile senkronize etmek
- Design token'ları export etmek

**Örnek:**

```typescript
// Variables'ları oku
get_variable_defs(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:3"  // Herhangi bir node (variables file-level'dır)
)

// Dönen: Variables dictionary
// {
//   "brand/500": "#2845D6",
//   "spacing/6": 24,
//   "radius/md": 6
// }
```

**Pratik Kullanım:**
- Figma'daki variables'ları `app/globals.css` ile karşılaştırmak
- Variables'ları JSON olarak export edip kod ile senkronize etmek

**Not:** Variables **eklemek** için MCP tool yok, sadece **okumak** için var.

---

### 5. `generate_diagram` - Diagram Oluşturma

**Ne işe yarar:** Mermaid.js syntax kullanarak FigJam'da diagram oluşturur.

**Kullanım Senaryosu:**
- Flowchart oluşturmak
- Sequence diagram çizmek
- State diagram yapmak
- Gantt chart hazırlamak

**Örnek:**

```typescript
// Flowchart oluştur
generate_diagram(
  name: "SOCI4L User Flow",
  mermaidSyntax: `
    flowchart TD
      A[User Opens App] --> B{Wallet Connected?}
      B -->|No| C[Connect Wallet]
      B -->|Yes| D[View Dashboard]
      C --> D
      D --> E[Edit Profile]
      E --> F[Save Changes]
  `
)

// Dönen: FigJam diagram URL'i
```

**Pratik Kullanım:**
- User flow diagram'ları oluşturmak
- System architecture diagram'ları çizmek
- Process flow'ları görselleştirmek

---

### 6. `add_code_connect_map` - Code Connect Mapping

**Ne işe yarar:** Figma component'ini kod tabanındaki bir component ile eşleştirir.

**Kullanım Senaryosu:**
- Figma'daki Button component'ini `components/ui/button.tsx` ile bağlamak
- Design-code senkronizasyonu sağlamak

**Örnek:**

```typescript
// Button component'ini kod ile eşleştir
add_code_connect_map(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:123",  // Figma Button component ID
  source: "components/ui/button.tsx",
  componentName: "Button",
  label: "React"
)

// Artık Figma'da bu component'e tıklayınca
// Kod tabanındaki ilgili dosya açılır
```

**Pratik Kullanım:**
- Design system component'lerini kod ile bağlamak
- Developer'ların Figma'dan direkt koda gitmesini sağlamak

---

### 7. `get_code_connect_map` - Code Connect Mapping Okuma

**Ne işe yarar:** Mevcut Code Connect mapping'lerini okur.

**Kullanım Senaryosu:**
- Hangi component'lerin kod ile bağlı olduğunu görmek
- Mapping'leri kontrol etmek

**Örnek:**

```typescript
// Mapping'leri oku
get_code_connect_map(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:123"
)

// Dönen:
// {
//   "1:123": {
//     "codeConnectSrc": "components/ui/button.tsx",
//     "codeConnectName": "Button"
//   }
// }
```

---

### 8. `get_code_connect_suggestions` - Code Connect Önerileri

**Ne işe yarar:** Bir Figma component'i için Code Connect önerileri alır.

**Kullanım Senaryosu:**
- Hangi kod dosyasının bu component ile eşleşebileceğini bulmak
- Otomatik mapping önerileri almak

**Örnek:**

```typescript
// Önerileri al
get_code_connect_suggestions(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:123"
)

// Dönen: Önerilen mapping'ler
```

---

### 9. `send_code_connect_mappings` - Toplu Mapping Gönderme

**Ne işe yarar:** Birden fazla Code Connect mapping'ini toplu olarak gönderir.

**Kullanım Senaryosu:**
- Tüm design system component'lerini bir seferde bağlamak
- Bulk mapping yapmak

**Örnek:**

```typescript
// Toplu mapping
send_code_connect_mappings(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:3",  // Parent frame
  mappings: [
    {
      nodeId: "1:123",
      componentName: "Button",
      source: "components/ui/button.tsx",
      label: "React"
    },
    {
      nodeId: "1:456",
      componentName: "Input",
      source: "components/ui/input.tsx",
      label: "React"
    }
  ]
)
```

---

### 10. `create_design_system_rules` - Design System Rules

**Ne işe yarar:** Design system kuralları için bir prompt üretir.

**Kullanım Senaryosu:**
- Design system dokümantasyonu oluşturmak
- Figma için design token kuralları belirlemek

**Örnek:**

```typescript
// Design system rules prompt'u al
create_design_system_rules(
  clientLanguages: "typescript,html,css",
  clientFrameworks: "react,next.js"
)

// Dönen: Design system kuralları prompt'u
// (Bu prompt'u kullanarak design system dokümantasyonu oluşturabilirsiniz)
```

**Pratik Kullanım:**
- `docs/FIGMA_DESIGN_SYSTEM_RULES.md` dosyasını oluşturmak için kullanıldı

---

### 11. `get_figjam` - FigJam Content

**Ne işe yarar:** FigJam file'ındaki içeriği alır.

**Kullanım Senaryosu:**
- FigJam board'larını okumak
- Workshop sonuçlarını export etmek

**Örnek:**

```typescript
// FigJam content al
get_figjam(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:3"
)

// Dönen: FigJam content (sticky notes, shapes, vb.)
```

---

### 12. `whoami` - User Bilgisi

**Ne işe yarar:** Figma'ya bağlı kullanıcı bilgisini alır.

**Kullanım Senaryosu:**
- Authentication kontrolü
- Team bilgilerini görmek

**Örnek:**

```typescript
// User bilgisi
whoami()

// Dönen:
// {
//   "email": "merickalkan7@gmail.com",
//   "handle": "Meric Kalkan - Floyka Design Studio",
//   "plans": [...]
// }
```

---

## Pratik Kullanım Senaryoları

### Senaryo 1: Figma Component'ini Koda Çevirmek

```typescript
// 1. Component'in design context'ini al
const context = await get_design_context(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:123"  // Button component
)

// 2. UI kodunu al
const uiCode = context.code  // React/HTML kodu

// 3. Asset'leri indir
const assets = context.assets  // Icon, image URL'leri

// 4. Kodu dosyaya yaz
// components/ui/button.tsx
```

### Senaryo 2: Design System Variables'ları Senkronize Etmek

```typescript
// 1. Figma'daki variables'ları oku
const figmaVars = await get_variable_defs(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "1:3"
)

// 2. Kod tabanındaki variables'ları oku
// app/globals.css

// 3. Karşılaştır ve farkları bul
// 4. Senkronize et (manuel olarak)
```

### Senaryo 3: Component Library Dokümantasyonu

```typescript
// 1. Tüm component'leri listele (metadata)
const metadata = await get_metadata(
  fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
  nodeId: "0:1"
)

// 2. Her component için screenshot al
for (const component of components) {
  const screenshot = await get_screenshot(
    fileKey: "wLkuqYmrXwXqhKyxPdzcLY",
    nodeId: component.id
  )
  // Screenshot'ı kaydet
}

// 3. Code Connect mapping ekle
await add_code_connect_map(...)

// 4. Dokümantasyon oluştur
```

### Senaryo 4: User Flow Diagram'ı Oluşturmak

```typescript
// FigJam'da flowchart oluştur
const diagram = await generate_diagram(
  name: "SOCI4L Profile Claim Flow",
  mermaidSyntax: `
    flowchart TD
      A[User Visits Profile] --> B{Profile Claimed?}
      B -->|No| C[Show Claim Button]
      B -->|Yes| D[Show Profile]
      C --> E[User Clicks Claim]
      E --> F[Sign Message]
      F --> G[Profile Claimed]
      G --> D
  `
)

// Diagram URL'i: diagram.url
```

---

## Önemli Notlar

1. **Variables Ekleme:** Figma MCP ile variables **ekleyemezsiniz**, sadece **okuyabilirsiniz**. Variables eklemek için Figma Desktop'ta manuel setup gerekiyor.

2. **File Key:** Figma file URL'sinden file key'i çıkarın:
   - URL: `https://www.figma.com/design/wLkuqYmrXwXqhKyxPdzcLY/Untitled`
   - File Key: `wLkuqYmrXwXqhKyxPdzcLY`

3. **Node ID:** Figma'da bir element seçip URL'den node ID'yi alın:
   - URL: `...?node-id=1:123`
   - Node ID: `1:123` veya `1-123` (ikisi de çalışır)

4. **Authentication:** Figma MCP otomatik olarak bağlanır (Cursor IDE içinde).

---

## Hızlı Referans

| Tool | Okuma | Yazma | Kullanım |
|------|-------|-------|----------|
| `get_design_context` | ✅ | ❌ | Component kodunu al |
| `get_screenshot` | ✅ | ❌ | Screenshot al |
| `get_metadata` | ✅ | ❌ | File yapısını gör |
| `get_variable_defs` | ✅ | ❌ | Variables oku |
| `generate_diagram` | ❌ | ✅ | Diagram oluştur |
| `add_code_connect_map` | ❌ | ✅ | Code mapping ekle |
| `get_code_connect_map` | ✅ | ❌ | Mapping oku |
| `create_design_system_rules` | ✅ | ❌ | Rules prompt al |

---

## Sonuç

Figma MCP araçları **okuma** ve **Code Connect mapping** için güçlü, ancak **variables ekleme** gibi yazma işlemleri için sınırlı. Variables eklemek için manuel setup veya Figma Plugin API kullanmanız gerekiyor.
