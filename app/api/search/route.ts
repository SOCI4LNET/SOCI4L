import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAddress } from 'viem'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] })
    }

    try {
        const lowerQuery = query.toLowerCase()

        // 1. Direct Address Match (Highest Priority)
        if (isAddress(query)) {
            const profile = await prisma.profile.findUnique({
                where: { address: lowerQuery }
            })
            if (profile) {
                return NextResponse.json({ results: [profile] })
            }
        }

        // 2. Slug or Name Search
        const results = await prisma.profile.findMany({
            where: {
                OR: [
                    { slug: { contains: lowerQuery, mode: 'insensitive' } },
                    { displayName: { contains: lowerQuery, mode: 'insensitive' } },
                    { address: { contains: lowerQuery, mode: 'insensitive' } } // Partial address match
                ]
            },
            take: 5,
            select: {
                address: true,
                slug: true,
                displayName: true,
                primaryRole: true
            }
        })

        return NextResponse.json({ results })

    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
