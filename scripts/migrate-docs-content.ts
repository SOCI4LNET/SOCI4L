import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Get the admin to assign as author
    // We need to cast or assume the model exists after generate 
    // @ts-ignore - The model exists after schema update but script runner might not see type definition immediately
    const admin = await prisma.docsAdmin.findFirst()
    if (!admin) {
        console.error('No docs admin found. Run seed-docs-admin.ts first.')
        return
    }

    console.log('Migrating docs content...')

    // 2. Home Page Content (Converted from app/docs/page.tsx)
    const homeContent = `
# Welcome to SOCI4L

The all-in-one Web3 functionality layer. Turn any wallet address into a comprehensive, measurable public profile.

## Quick Start

<div className="grid md:grid-cols-3 gap-6 my-8">
  <Card href="/docs/introduction">
    ### 📖 Introduction
    Learn the basics of SOCI4L architecture.
  </Card>
  <Card href="/docs/project-structure">
    ### 🏗️ Project Structure
    Understand the codebase and components.
  </Card>
  <Card href="/docs/authentication">
    ### 🔑 Authentication
    Deep dive into wallet-based auth.
  </Card>
</div>

## Core Concepts

### 🛡️ Privacy First
We believe your data belongs to you. SOCI4L is built with privacy as a foundational pillar, ensuring you have granular control over what you share.

### 🧩 Modular Design
Built on top of refined shadcn/ui components, our system is designed to be easily extensible and customizable for any Web3 need.

---

<div className="bg-muted/30 p-8 rounded-lg text-center">
  Need help integrating? Check out our community resources.
  <br/>
  [Join our Discord Community →](https://discord.gg/soci4l)
</div>
`

    // @ts-ignore
    await prisma.docsArticle.upsert({
        where: { slug: 'home' },
        update: { content: homeContent, published: true, authorId: admin.id },
        create: {
            slug: 'home',
            title: 'Welcome to SOCI4L',
            content: homeContent,
            category: 'General',
            published: true,
            authorId: admin.id
        }
    })
    console.log('✓ Home page migrated')

    // 3. Rate/Rank System (From DOCS_PLAN.md)
    // Converting the Turkish plan to an English or Turkish article? User spoke Turkish. I'll keep it as is or English?
    // The plan is in Turkish. I will migrate it as "Documentation Plan" in Turkish/English mixed as found.

    const planContent = `
# SOCI4L Platform Documentation Plan

Bu döküman, projenin ileride oluşturulacak resmi dokümantasyonu (Docs) için bir taslak ve not defteri görevi görür.

## 🧠 Optimizasyon Motoru (Optimization Engine)

Platformun kullanıcılara sunduğu "Optimization Suggestions" bölümünün mantığı:

- **Mevcut Durum:** Deterministik algoritmalar (Rule-based) ile çalışır. 
    - *CTR Analizi:* Tıklanma oranı düşükse "Minimal" tasarım önerilir.
    - *Kategori Analizi:* Bir kategori %60+ tıklanma alıyorsa en üste taşınması önerilir.
    - *Etkisiz Linkler:* Hiç tıklanmayan ancak aktif olan linklerin temizlenmesi önerilir.
- **Gelecek Vizyonu:** LLM (AI) entegrasyonu ile kullanıcı davranışlarına göre kişiselleştirilmiş metinler ve büyüme stratejileri sunacak.

## 📚 Önerilen Dokümantasyon Başlıkları

Dökümantasyon (GitBook, Docusaurus veya Mintlify benzeri bir yapıda) şu ana başlıkları içerebilir:

### 1. Başlangıç (Getting Started)
- **Cüzdan Bağlantısı:** Avalanche ağında cüzdan bağlama süreci.
- **Profil Oluşturma:** İlk adımlar ve slug (URL) seçimi. (Detaylar: \`docs/USER_GUIDE.md\`)

### 2. Profil Kişiselleştirme (Customization)
- **Presets & Layouts:** Tek tıkla değişen görünüm şablonları.
- **Görünüm Ayarları:** Renk paletleri, fontlar ve cam (glassmorphism) efektleri.
- **Dynamic Header:** Rollerin, durum mesajının ve avatarın yönetimi.

### 3. İçerik Yönetimi
- **Kategori Sistemi**
- **Sosyal İkonlar**
- **NFT Vitrini**

### 4. Analitik ve Veri
- **KPI Tanımları:** Profile View, Link Click ve CTR metrikleri.
- **Gizlilik Politikası:** Verilerin anonim olarak nasıl tutulduğu.

### 5. Sosyal Etkileşim (Social Layer)
- **Takip Sistemi:** Kullanıcılar arası etkileşim.
- **Repütasyon:** Puanlama, ranklar ve badge (rozet) sistemi.

### 6. Teknik Mimari
- **Teknoloji Yığını:** Next.js, Prisma, Tailwind ve Avalanche entegrasyonu.

### 7. Moderasyon ve Güvenlik
- **Admin View:** İçerik moderasyonu ve log izleme.
`

    // @ts-ignore
    await prisma.docsArticle.upsert({
        where: { slug: 'docs-plan' },
        update: { content: planContent, published: true, authorId: admin.id },
        create: {
            slug: 'docs-plan',
            title: 'Documentation Plan',
            content: planContent,
            category: 'Internal',
            published: true,
            authorId: admin.id
        }
    })
    console.log('✓ Docs Plan migrated')

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
