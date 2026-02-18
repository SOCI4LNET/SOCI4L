# SOCI4L — Design System Rules (for Figma MCP)

Bu doküman, SOCI4L tasarımlarını Figma (FigJam/Figma) tarafında üretirken **kod tabanındaki design system ile birebir uyum** sağlamak için “kurallar”ı ve **tekil kaynakları (single source of truth)** listeler.

## Token Definitions (Source of Truth)

### CSS Variables (ana kaynak)
- **Dosya**: `app/globals.css`
- **Yapı**: `:root` (light) ve `.dark` (dark) altında CSS variables.
- **Kural**: Renk token’ları **HSL triplet** olarak tutulur ve Tailwind’de `hsl(var(--token))` ile kullanılır.

Örnek:

```6:57:app/globals.css
:root {
  --background: 0 0% 94%;
  --foreground: 0 0% 4%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* SOCI4L New Brand System */
  --brand-main: 230 69% 50%;
  --brand-500: 230 69% 50%;
  --accent-primary: 230 69% 50%;
}
```

Dark mode aynı token isimleriyle override edilir:

```59:107:app/globals.css
.dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --brand-main: 230 69% 50%;
  --accent-primary: 230 69% 60%;
}
```

### Tailwind Token Mapping
- **Dosya**: `tailwind.config.ts`
- **Kural**: UI’da renkler `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground` gibi semantic isimlerle kullanılır; bunlar CSS variables’a map’lenir.

```21:92:tailwind.config.ts
extend: {
  colors: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))'
    },
    muted: {
      DEFAULT: 'hsl(var(--muted))',
      foreground: 'hsl(var(--muted-foreground))'
    },
    brand: {
      DEFAULT: 'hsl(var(--brand-main))',
      500: 'hsl(var(--brand-500))'
    }
  },
  borderRadius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)'
  }
}
```

### Radius
- **Token**: `--radius` (`app/globals.css`)
- **Tailwind**: `rounded-lg|md|sm` bu token’a bağlıdır.
- **Figma kuralı**: Corner radius için “md” default tercih edin; “sm” daha sıkı input/mini UI; “lg” kart/container.

## Typography

### Font Family
- **Dosya**: `tailwind.config.ts`
- **Kural**: `font-sans`, `font-serif`, `font-heading` Tailwind font aileleri kullanılmalı.

```21:25:tailwind.config.ts
fontFamily: {
  sans: ["var(--font-geist-sans)", "sans-serif"],
  serif: ["var(--font-playfair)", "serif"],
  heading: ["var(--font-outfit)", "sans-serif"],
},
```

### Type scale (pratik kural)
- `text-sm` (13–14px hissi) yoğun UI (tables, labels)
- `text-base` genel içerik
- `text-2xl` başlıklar (CardTitle vb.)

## Component Library

### shadcn/ui tabanı
- **Konum**: `components/ui/*`
- **Kural**: Yeni UI üretirken mümkün olduğunca bu primitive’leri kullanın; Figma bileşen isimleri de buna paralel gitsin (Button, Input, Card, Dialog, DropdownMenu, Tabs...).

Örnek Button variants:

```7:33:components/ui/button.tsx
variants: {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
}
```

Örnek Input:

```11:20:components/ui/input.tsx
className={cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ... placeholder:text-muted-foreground ... focus-visible:border-primary/50 ...",
  className
)}
```

### Spacing
- Tailwind spacing skalası (4px grid) esas.
- Sık kullanılanlar: `p-6` (Card padding), `px-4 py-2` (Button default), `h-10` (Input/Button default).

## Styling Approach

### Dark mode
- **Kural**: `darkMode: ["class"]` (`tailwind.config.ts`)
- **Figma kuralı**: Light + Dark theme token set’i (aynı isimler) oluşturun. Kodda `.dark` override var.

### Global rules
- **Dosya**: `app/globals.css`
- Focus ring devre dışı bırakılmış: `:focus-visible { outline: none !important; }`
- Modal overlay blur özel kuralı var (Radix Dialog overlay).

## Icon System

- **Kütüphane**: `lucide-react`
- **Kural**: İkonlar React component olarak kullanılıyor; Figma’da icon set için Lucide ile uyumlu isimlendirme önerilir.

## Asset Management

- Next.js + App Router.
- Görsel kaynaklar genelde component içinde import/URL ile; repo genelinde “asset pipeline” kuralı yoksa Figma export’ları `public/` altında konumlandırmak tercih edilir.

## Project Structure (UI açısından)

- **Pages**: `app/*` (Next.js 14 App Router)
- **Reusable UI**: `components/*` (özellikle `components/ui/*` shadcn)
- **Utilities**: `lib/*`

## Figma ↔ Code Alignment Rules (pratik)

1. **Renkleri semantic token olarak adlandırın**: `background`, `foreground`, `primary`, `muted`, `border`, `brand/*`.
2. **Light/Dark aynı token isimleri**: Figma’da mode’lar ile eşleyin.
3. **Radius**: `--radius` tabanlı 3 seviye (`sm/md/lg`) kullanın.
4. **Bileşen isimleri shadcn ile aynı**: Button/Input/Card/Dialog/Tabs/DropdownMenu/Sidebar.
5. **Spacing**: 4px grid; Card padding default `24px` (Tailwind `p-6`) kabul edin.

