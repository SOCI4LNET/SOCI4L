import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    const handle = searchParams.get('handle')

    if (!platform || !handle) {
        return NextResponse.json({ error: 'Missing platform or handle' }, { status: 400 })
    }

    // Allow CORS for extension (or any public caller for now - can restrict origin if needed)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    try {
        const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle

        // 1. Find social connection by username/handle
        // Try to match both with and without '@' prefix for maximum compatibility
        const socialConnection = await prisma.socialConnection.findFirst({
            where: {
                platform: platform,
                OR: [
                    { platformUsername: { equals: cleanHandle, mode: 'insensitive' } },
                    { platformUsername: { equals: `@${cleanHandle}`, mode: 'insensitive' } }
                ]
            },
            include: {
                profile: true
            }
        })

        if (!socialConnection) {
            return NextResponse.json({ isVerified: false }, { status: 200, headers })
        }

        // 2. Return profile data if found
        const { profile } = socialConnection

        return NextResponse.json({
            isVerified: true,
            profile: {
                displayName: profile.displayName,
                slug: profile.slug,
                address: profile.address,
                bio: profile.bio,
                avatarUrl: `https://effigy.im/a/${profile.address}.svg`,
                verifiedAt: socialConnection.verifiedAt
            }
        }, { status: 200, headers })

    } catch (error) {
        console.error('[API] Lookup Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
    }
}
export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    })
}
