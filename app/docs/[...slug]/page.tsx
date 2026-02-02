import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DocPage({ params }: { params: { slug: string[] } }) {
    // Catch all route logic - for example /docs/something
    // Next.js app router dynamic segment
    const slug = params.slug ? params.slug[0] : ''

    // If root /docs, render index (or find a 'index' slug article)
    if (!slug) {
        return (
            <div className="space-y-6">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Documentation</h1>
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                    Welcome to the SOCI4L documentation. Here you will find everything you need to build on top of our social identity protocol.
                </p>
            </div>
        )
    }

    const article = await prisma.docsArticle.findUnique({
        where: { slug },
        include: { author: true }
    })

    if (!article) {
        return notFound()
    }

    return (
        <div className="space-y-6 mb-20">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{article.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{article.category}</Badge>
                    <span>Last updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
                </div>
                {article.description && (
                    <p className="text-xl text-muted-foreground">{article.description}</p>
                )}
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
        </div>
    )
}
