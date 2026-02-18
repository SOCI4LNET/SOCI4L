# SOCI4L — Figma Variables Setup Guide

Bu doküman, SOCI4L design system'ini Figma Variables olarak kurmak için adım adım rehberdir. `/brand` sayfasındaki tüm bilgiler ve `app/globals.css`'deki token'lar burada toplanmıştır.

## Ön Gereksinimler

1. **Figma Desktop App** (Variables özelliği için gerekli)
2. **Figma File** (yeni veya mevcut bir design file)
3. **Figma Team** erişimi (SOCI4L team'inizde)

## Adım 1: Figma File Hazırlığı

1. Figma Desktop'ta yeni bir file oluşturun veya mevcut bir file'ı açın
2. **Local Variables** panelini açın (Design panel → Variables sekmesi)
3. Veya: **Right sidebar → Variables** (Figma'nın yeni UI'sında)

## Adım 2: Color Variables (Brand Page'e göre)

### 2.1 Brand Colors (Primary Scale)

Brand sayfasındaki Primary Scale'i oluşturun:

| Variable Name | Mode | Type | Value (Hex) | HSL | Usage |
|--------------|------|------|-------------|-----|-------|
| `brand/50` | Light | Color | `#EEF2FF` | `230 69% 98%` | Lightest tint |
| `brand/100` | Light | Color | `#E0E7FF` | `230 69% 95%` | Very light |
| `brand/200` | Light | Color | `#C7D2FE` | `230 69% 90%` | Light |
| `brand/300` | Light | Color | `#A5B4FC` | `230 69% 82%` | Medium-light |
| `brand/400` | Light | Color | `#818CF8` | `230 69% 65%` | Medium |
| `brand/500` | Light | Color | `#2845D6` | `230 69% 50%` | **Main (Primary)** |
| `brand/600` | Light | Color | `#4F46E5` | `230 69% 40%` | Medium-dark |
| `brand/700` | Light | Color | `#4338CA` | `230 69% 30%` | Dark |
| `brand/800` | Light | Color | `#3730A3` | `230 69% 20%` | Very dark |
| `brand/900` | Light | Color | `#312E81` | `230 69% 10%` | Darkest |
| `brand/950` | Light | Color | `#1E1B4B` | `230 69% 5%` | Almost black |

**Not**: Dark mode için aynı değerleri kullanın (brand renkleri mode'a göre değişmez).

### 2.2 Core Identity Colors

Brand sayfasındaki "Core Identity" bölümünden:

| Variable Name | Mode | Type | Value (Hex) | Usage |
|--------------|------|------|-------------|-------|
| `brand/main` | Both | Color | `#2845D6` | Brand Blue (same as brand/500) |
| `surface/dark` | Dark | Color | `#0A0A0A` | Dark Surface (background) |
| `surface/light` | Light | Color | `#F0F0F0` | Light Surface (background) |

### 2.3 Semantic Colors (from globals.css)

#### Light Mode

| Variable Name | Mode | Type | Value (Hex) | HSL | CSS Variable |
|--------------|------|------|-------------|-----|--------------|
| `background` | Light | Color | `#F0F0F0` | `0 0% 94%` | `--background` |
| `foreground` | Light | Color | `#0A0A0A` | `0 0% 4%` | `--foreground` |
| `card` | Light | Color | `#F0F0F0` | `0 0% 94%` | `--card` |
| `card-foreground` | Light | Color | `#0A0A0A` | `0 0% 3.9%` | `--card-foreground` |
| `primary` | Light | Color | `#171717` | `0 0% 9%` | `--primary` |
| `primary-foreground` | Light | Color | `#FAFAFA` | `0 0% 98%` | `--primary-foreground` |
| `secondary` | Light | Color | `#F4F4F5` | `240 5% 96%` | `--secondary` |
| `secondary-foreground` | Light | Color | `#171717` | `0 0% 9%` | `--secondary-foreground` |
| `muted` | Light | Color | `#F0F0F0` | `0 0% 94%` | `--muted` |
| `muted-foreground` | Light | Color | `#737373` | `0 0% 45.1%` | `--muted-foreground` |
| `accent` | Light | Color | `#E4E4E7` | `240 6% 90%` | `--accent` |
| `accent-foreground` | Light | Color | `#171717` | `0 0% 9%` | `--accent-foreground` |
| `border` | Light | Color | `#E4E4E7` | `240 6% 90%` | `--border` |
| `input` | Light | Color | `#E4E4E7` | `240 6% 90%` | `--input` |
| `destructive` | Light | Color | `#EF4444` | `0 84.2% 60.2%` | `--destructive` |
| `destructive-foreground` | Light | Color | `#FAFAFA` | `0 0% 98%` | `--destructive-foreground` |
| `popover` | Light | Color | `#F0F0F0` | `0 0% 94%` | `--popover` |
| `popover-foreground` | Light | Color | `#0A0A0A` | `0 0% 3.9%` | `--popover-foreground` |

#### Dark Mode

| Variable Name | Mode | Type | Value (Hex) | HSL | CSS Variable |
|--------------|------|------|-------------|-----|--------------|
| `background` | Dark | Color | `#0A0A0A` | `0 0% 4%` | `--background` |
| `foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--foreground` |
| `card` | Dark | Color | `#0A0A0A` | `0 0% 4%` | `--card` |
| `card-foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--card-foreground` |
| `primary` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--primary` |
| `primary-foreground` | Dark | Color | `#171717` | `0 0% 9%` | `--primary-foreground` |
| `secondary` | Dark | Color | `#27272A` | `240 4% 16%` | `--secondary` |
| `secondary-foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--secondary-foreground` |
| `muted` | Dark | Color | `#27272A` | `240 4% 16%` | `--muted` |
| `muted-foreground` | Dark | Color | `#A3A3A3` | `0 0% 63.9%` | `--muted-foreground` |
| `accent` | Dark | Color | `#171717` | `0 0% 9%` | `--accent` |
| `accent-foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--accent-foreground` |
| `border` | Dark | Color | `#27272A` | `240 4% 16%` | `--border` |
| `input` | Dark | Color | `#27272A` | `240 4% 16%` | `--input` |
| `destructive` | Dark | Color | `#7F1D1D` | `0 62.8% 30.6%` | `--destructive` |
| `destructive-foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--destructive-foreground` |
| `popover` | Dark | Color | `#0A0A0A` | `0 0% 4%` | `--popover` |
| `popover-foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--popover-foreground` |

### 2.4 Sidebar Colors

| Variable Name | Mode | Type | Value (Hex) | HSL | CSS Variable |
|--------------|------|------|-------------|-----|--------------|
| `sidebar/background` | Light | Color | `#FAFAFA` | `0 0% 98%` | `--sidebar-background` |
| `sidebar/foreground` | Light | Color | `#404040` | `240 5.3% 26.1%` | `--sidebar-foreground` |
| `sidebar/primary` | Both | Color | `#2845D6` | `230 69% 50%` | `--sidebar-primary` |
| `sidebar/border` | Light | Color | `#E5E7EB` | `220 13% 91%` | `--sidebar-border` |
| `sidebar/background` | Dark | Color | `#0A0A0A` | `0 0% 4%` | `--sidebar-background` |
| `sidebar/foreground` | Dark | Color | `#FAFAFA` | `0 0% 98%` | `--sidebar-foreground` |
| `sidebar/border` | Dark | Color | `#27272A` | `240 4% 16%` | `--sidebar-border` |

## Adım 3: Typography Variables

### 3.1 Font Families (from tailwind.config.ts)

| Variable Name | Type | Value | Usage |
|--------------|------|-------|-------|
| `font/sans` | String | `var(--font-geist-sans), sans-serif` | Primary UI font (Geist Sans) |
| `font/mono` | String | `var(--font-geist-mono), monospace` | Code, data display (Geist Mono) |
| `font/heading` | String | `var(--font-outfit), sans-serif` | Headings (Outfit) |
| `font/serif` | String | `var(--font-playfair), serif` | Serif (Playfair) |

**Not**: Figma'da String variables yerine Text Styles kullanın. Font family'leri Text Style'larda tanımlayın.

### 3.2 Type Scale (from brand page)

Brand sayfasındaki Typography Scale:

| Style Name | Font | Size | Weight | Line Height | Usage |
|-----------|------|------|--------|-------------|-------|
| `H1 Display` | Geist Sans | `30px / 36px` (md) | `600` (Semibold) | `1.2` | Main headlines |
| `H2 Section` | Geist Sans | `24px / 30px` (md) | `600` (Semibold) | `1.2` | Section headers |
| `H3 Title` | Geist Sans | `20px` | `600` (Semibold) | `1.3` | Card titles |
| `Body` | Geist Sans | `16px` (base) | `400` (Regular) | `1.5` | Body text |
| `Body Small` | Geist Sans | `14px` (sm) | `400` (Regular) | `1.5` | UI text, labels |
| `Mono` | Geist Mono | `14px` | `400` (Regular) | `1.5` | Code, data |

**Figma'da Text Styles oluşturun:**
1. Text tool ile bir text seçin
2. Right sidebar → Text → **Create style** (4 nokta icon)
3. Style adını yukarıdaki gibi verin (örn: "H1 Display")
4. Font, size, weight, line height'ı ayarlayın

## Adım 4: Spacing Variables

Tailwind 4px grid sistemine göre:

| Variable Name | Type | Value | Usage |
|--------------|------|-------|-------|
| `spacing/1` | Number | `4px` | Tiny gaps |
| `spacing/2` | Number | `8px` | Small gaps |
| `spacing/3` | Number | `12px` | Medium-small |
| `spacing/4` | Number | `16px` | Default gap |
| `spacing/6` | Number | `24px` | Card padding (default) |
| `spacing/8` | Number | `32px` | Large gaps |
| `spacing/12` | Number | `48px` | Section spacing |
| `spacing/16` | Number | `64px` | Page margins |

**Figma'da Number Variables:**
1. Variables panel → **+** → **Number**
2. Name: `spacing/1`, Value: `4`
3. Mode: "Light" (spacing mode'a göre değişmez)

## Adım 5: Radius Variables

Brand sayfasından: **Standard Radius: 0.375rem (6px)**

| Variable Name | Type | Value | CSS Variable | Usage |
|--------------|------|-------|--------------|-------|
| `radius/sm` | Number | `4px` | `calc(var(--radius) - 4px)` | Small elements |
| `radius/md` | Number | `6px` | `var(--radius)` | **Default** (buttons, inputs) |
| `radius/lg` | Number | `8px` | `calc(var(--radius) - 2px)` | Cards, containers |

**Figma'da:**
1. Variables → **+** → **Number**
2. Name: `radius/md`, Value: `6`
3. Diğer radius değerlerini de ekleyin

## Adım 6: Component-Specific Variables

### 6.1 Button Heights (from button.tsx)

| Variable Name | Type | Value | Usage |
|--------------|------|-------|-------|
| `button/height/default` | Number | `40px` | Default button (`h-10`) |
| `button/height/sm` | Number | `36px` | Small button (`h-9`) |
| `button/height/lg` | Number | `44px` | Large button (`h-11`) |
| `button/height/icon` | Number | `40px` | Icon-only button |

### 6.2 Input Heights

| Variable Name | Type | Value | Usage |
|--------------|------|-------|-------|
| `input/height` | Number | `40px` | Default input (`h-10`) |

## Adım 7: Mode Setup (Light/Dark)

1. Variables panel → **Modes** sekmesi
2. **+** ile yeni mode ekleyin: "Dark"
3. Her color variable için Light ve Dark değerlerini ayarlayın
4. Varsayılan mode: "Light"

## Adım 8: Variable Collections (Organizasyon)

Figma'da variable'ları gruplamak için Collections kullanın:

1. **Brand Colors** collection:
   - `brand/*` (50-950)
   - `brand/main`

2. **Semantic Colors** collection:
   - `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, `destructive`, `popover`

3. **Spacing** collection:
   - `spacing/*`

4. **Radius** collection:
   - `radius/*`

5. **Typography** (Text Styles olarak):
   - `H1 Display`, `H2 Section`, `H3 Title`, `Body`, `Body Small`, `Mono`

## Adım 9: Component Library Mapping

Figma'da component'leri oluştururken:

1. **Button variants** (brand page'den):
   - `default`: `bg-primary text-primary-foreground` (Light: black bg, Dark: white bg)
   - `secondary`: `bg-secondary text-secondary-foreground`
   - `outline`: `border border-input bg-background`
   - `ghost`: `hover:bg-accent`
   - `destructive`: `bg-destructive text-destructive-foreground`

2. **Card**:
   - Background: `card` variable
   - Border: `border` variable
   - Padding: `spacing/6` (24px)
   - Radius: `radius/lg` (8px)

3. **Input**:
   - Height: `input/height` (40px)
   - Border: `border` variable
   - Background: `background` variable
   - Radius: `radius/md` (6px)

## Adım 10: Export & Sync

1. Variables'ları oluşturduktan sonra, Figma file'ınızı **SOCI4L team**'inize paylaşın
2. Design system dokümanını (`docs/FIGMA_DESIGN_SYSTEM_RULES.md`) referans olarak tutun
3. Yeni component'ler oluştururken bu variable'ları kullanın

## Hızlı Referans: Brand Page → Figma Mapping

| Brand Page Section | Figma Variable/Style |
|-------------------|---------------------|
| Brand Blue (#2845D6) | `brand/500` veya `brand/main` |
| Primary Scale (50-950) | `brand/50` ... `brand/950` |
| Dark Surface (#0A0A0A) | `background` (Dark mode) |
| Light Surface (#F0F0F0) | `background` (Light mode) |
| Geist Sans | Text Style: `H1 Display`, `H2 Section`, `Body` |
| Geist Mono | Text Style: `Mono` |
| Standard Radius (6px) | `radius/md` |
| Button variants | Component variants (default, secondary, outline, ghost, destructive) |

## Notlar

- **HSL vs Hex**: Kod tabanında HSL kullanılıyor, Figma'da Hex daha pratik. Dönüşüm için online tool kullanabilirsiniz.
- **Mode Switching**: Figma'da mode'lar arasında geçiş yaparak Light/Dark preview'ı görebilirsiniz.
- **Variable Aliases**: Figma'da bir variable'ı başka bir variable'a referans edebilirsiniz (örn: `brand/main` → `brand/500`).

---

**Son Güncelleme**: Brand page (`/brand`) ve `app/globals.css`'e göre hazırlanmıştır.
