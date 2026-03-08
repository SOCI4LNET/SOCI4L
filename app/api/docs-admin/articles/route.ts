import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDocsAdminSession } from '@/lib/docs-auth'

export async function POST(request: NextRequest) {
    const session = await getDocsAdminSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { title, slug, description, content, category, published } = body

        const article = await prisma.docsArticle.create({
            data: {
                title,
                slug,
                description,
                content,
                category,
                published,
                authorId: session.id
            }
        })

        return NextResponse.json({ success: true, article })
    } catch (error: any) {
        console.error('Error creating article:', error)
        return NextResponse.json({ error: 'Failed to create article', details: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    // Public or Admin? Let's check session for now if we want "drafts"
    // For simplicity, this endpoint lists all for admin
    const session = await getDocsAdminSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articles = await prisma.docsArticle.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { author: { select: { name: true } } }
    })

    return NextResponse.json({ articles })
}
