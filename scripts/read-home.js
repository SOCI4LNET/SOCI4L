
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const article = await prisma.docsArticle.findUnique({
        where: { slug: 'home' },
    })
    console.log(article?.content)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
