import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const slug = process.argv[2] || 'ai-agents'

async function main() {
  const article = await prisma.docsArticle.findUnique({
    where: { slug }
  })
  if (article) {
    console.log('--- CONTENT START ---')
    console.log(article.content)
    console.log('--- CONTENT END ---')
  } else {
    console.log('Article not found')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
