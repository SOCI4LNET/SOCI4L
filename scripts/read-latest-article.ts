import { prisma } from "../lib/prisma"

async function main() {
    const article = await prisma.docsArticle.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1
    })
    console.log(JSON.stringify(article, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
