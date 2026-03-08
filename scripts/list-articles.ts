import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const articles = await prisma.docsArticle.findMany({
    orderBy: { slug: 'asc' }
  })
  console.log('--- ALL ARTICLES ---')
  articles.forEach(a => {
    console.log(`[${a.category}] ${a.title} -> ${a.slug}`)
  })
  console.log('--- END ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
