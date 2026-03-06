import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDocsAdminSession } from '@/lib/docs-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getDocsAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const article = await prisma.docsArticle.findUnique({
        where: { id }
    })

    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ article })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getDocsAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { title, slug, content, category, published } = body

        const article = await prisma.docsArticle.update({
            where: { id },
            data: {
                title,
                slug,
                content,
                category,
                published,
                authorId: session.id // Keep author as creator or update to editor? Usually keep creator or track last editor.
            }
        })

        return NextResponse.json({ success: true, article })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update', details: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getDocsAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        await prisma.docsArticle.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
