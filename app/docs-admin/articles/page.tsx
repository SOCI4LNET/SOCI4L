'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Article {
    id: string
    title: string
    slug: string
    category: string
    published: boolean
    updatedAt: string
    author: { name: string }
}

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchArticles()
    }, [])

    const fetchArticles = async () => {
        try {
            const res = await fetch('/api/docs-admin/articles')
            if (!res.ok) throw new Error('Failed')
            const data = await res.json()
            setArticles(data.articles)
        } catch (error) {
            toast.error('Failed to load articles')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return
        try {
            const res = await fetch(`/api/docs-admin/articles/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
            toast.success('Article deleted')
            fetchArticles()
        } catch (error) {
            toast.error('Failed to delete article')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
                    <p className="text-muted-foreground">Manage your documentation content.</p>
                </div>
                <Button asChild>
                    <Link href="/docs-admin/editor/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Article
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid gap-4">
                    {articles.map((article) => (
                        <Card key={article.id} className="overflow-hidden">
                            <div className="flex items-center justify-between p-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{article.title}</h3>
                                        <Badge variant={article.published ? 'default' : 'secondary'}>
                                            {article.published ? 'Published' : 'Draft'}
                                        </Badge>
                                        <Badge variant="outline">{article.category}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span>/{article.slug}</span>
                                        <span>•</span>
                                        <span>Last updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/docs/${article.slug}`} target="_blank">
                                            <ExternalLink className="h-4 w-4 mr-2" /> View
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/docs-admin/editor/${article.id}`}>
                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                        </Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {articles.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No articles found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
