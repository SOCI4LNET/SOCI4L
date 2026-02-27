import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { prisma } from '@/lib/prisma'

import { components } from '@/components/docs/mdx-components'
import { Badge } from '@/components/ui/badge'

export default async function DocPage({ params }: { params: { slug: string[] } }) {
    // Join slug array to support nested paths (e.g. docs/advanced/setup)
    const slug = params.slug.join('/')

    const article = await prisma.docsArticle.findUnique({
        where: { slug },
        include: { author: true }
    })

    if (!article) {
        return notFound()
    }

    return (
        <div className="space-y-6 mb-20 max-w-4xl mx-auto">
            <div className="space-y-2 border-b pb-4">
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
                <MDXRemote source={article.content} components={components} />
            </div>
        </div>
    )
}
