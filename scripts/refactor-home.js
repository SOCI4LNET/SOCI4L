
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const article = await prisma.docsArticle.findUnique({
        where: { slug: 'home' },
    })

    if (!article) {
        console.log('Home article not found')
        return
    }

    let content = article.content

    // 1. Remove Emojis (Keys, Construction, etc.)
    content = content.replace(/🔑|🏗️|🛡️|🧩/g, '')

    // 2. Transform <Card>### Title ...</Card> to <Card title="Title">...</Card>
    // Regex explanation:
    // Matches <Card href="...">
    // Captures the href
    // Matches whitespace and ### (heading)
    // Captures the title text until newline
    // Captures the rest of the text until </Card>

    // This is a bit complex for a single regex, let's try a replacement function strategy

    // Pattern: <Card href="([^"]+)">\s*###\s+(.+?)\n([\s\S]+?)<\/Card>
    // Replacement: <Card href="$1" title="$2">\n$3\n</Card>

    content = content.replace(
        /<Card href="([^"]+)">\s*###\s+(.+?)\n([\s\S]+?)<\/Card>/g,
        (match, href, title, body) => {
            const cleanTitle = title.trim()
            const cleanBody = body.trim()
            return `<Card href="${href}" title="${cleanTitle}">\n${cleanBody}\n</Card>`
        }
    )

    // 3. Clean up extra newlines if needed
    // content = content.replace(/\n{3,}/g, '\n\n')

    console.log('--- NEW CONTENT PREVIEW ---')
    console.log(content)
    console.log('---------------------------')

    await prisma.docsArticle.update({
        where: { slug: 'home' },
        data: { content },
    })

    console.log('Successfully refactored home article.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
