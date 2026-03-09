import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { prisma } from '@/lib/prisma'

import { components } from '@/components/docs/mdx-components'
import { Badge } from '@/components/ui/badge'

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug: slugArray } = await params
    // Join slug array to support nested paths (e.g. docs/advanced/setup)
    const slug = slugArray.join('/')

    const article = await prisma.docsArticle.findUnique({
        where: { slug },
        include: { author: true }
    })

    if (!article) {
        return notFound()
    }

    return (
        <div className="space-y-6 mb-20 max-w-4xl mx-auto">
            <div className="space-y-3 border-b pb-4">
                <h1 className="scroll-m-20 text-2xl font-bold tracking-tight lg:text-3xl">{article.title}</h1>
                {article.description && (
                    <p className="text-sm text-muted-foreground">{article.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Badge variant="outline" className="text-xs">{article.category}</Badge>
                    <span>Last updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
                <MDXRemote source={article.content} components={components} />
            </div>
        </div>
    )
}
