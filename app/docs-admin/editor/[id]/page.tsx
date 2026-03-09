'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { Save, ArrowLeft, Loader2 } from 'lucide-react'

import { EditorShell } from '@/components/docs-admin/mdx-editor/editor-shell'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ArticleEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    const router = useRouter()
    const isNew = id === 'new'

    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState("General")
    const [content, setContent] = useState('')
    const [initialContent, setInitialContent] = useState('') // Separate initial state to prevent loop

    // Fetch existing article
    useEffect(() => {
        if (isNew) return

        const fetchArticle = async () => {
            try {
                const res = await fetch(`/api/docs-admin/articles/${id}`)
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                if (data.article) {
                    setTitle(data.article.title)
                    setSlug(data.article.slug)
                    setDescription(data.article.description ?? '')
                    setCategory(data.article.category)
                    setContent(data.article.content)
                    setInitialContent(data.article.content)
                }
            } catch (error) {
                toast.error('Failed to load article')
            }
        }
        fetchArticle()
    }, [isNew, id])

    // Auto-generate slug from title if new
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setTitle(val)
        if (isNew) {
            setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
        }
    }

    const handleSave = async () => {
        if (!title || !slug || !content) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(isNew ? '/api/docs-admin/articles' : `/api/docs-admin/articles/${id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: isNew ? undefined : id,
                    title,
                    slug,
                    description,
                    category,
                    content,
                    published: true // auto publishing for demo
                })
            })

            if (!response.ok) throw new Error('Failed to save')

            toast.success('Article saved successfully')
            router.push('/docs-admin/articles')
        } catch (error) {
            toast.error('Error saving article')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/docs-admin/articles"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{isNew ? 'New Article' : 'Edit Article'}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isNew ? 'Create a new documentation page' : `Editing: ${slug}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">Discard</Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Meta Fields */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={handleTitleChange} placeholder="Getting Started" />
                </div>
                <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="getting-started" />
                </div>
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Getting Started">Getting Started</SelectItem>
                            <SelectItem value="Profile">Profile</SelectItem>
                            <SelectItem value="Dashboard">Dashboard</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Account">Account</SelectItem>
                            <SelectItem value="Profile Scoring">Profile Scoring</SelectItem>
                            <SelectItem value="SDK">SDK</SelectItem>
                            <SelectItem value="API Reference">API Reference</SelectItem>
                            <SelectItem value="Integrations">Integrations</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground text-xs">(optional — shown as subtitle under the article title)</span></Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A short summary of what this article covers…"
                    rows={2}
                    className="resize-none"
                />
            </div>

            {/* Editor */}
            <div className="space-y-2">
                <Label>Content (MDX)</Label>
                <EditorShell
                    initialContent={initialContent}
                    onChange={setContent}
                />
            </div>
        </div>
    )
}
