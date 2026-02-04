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
        // 1. Find social connection by username/handle
        // Note: platformUsername in DB should match the handle we are querying (case-insensitive search is better)

        // Prisma case-insensitive search involves mode: 'insensitive'
        const socialConnection = await prisma.socialConnection.findFirst({
            where: {
                platform: platform,
                platformUsername: {
                    equals: handle,
                    mode: 'insensitive'
                }
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

        // Privacy check? 
        // If the profile is verified, we generally want to show it. 
        // But if profile.visibility is PRIVATE, maybe we mask details?
        // For now, let's return basic badge info regardless, as the purpose is verification.

        return NextResponse.json({
            isVerified: true,
            profile: {
                displayName: profile.displayName,
                slug: profile.slug,
                address: profile.address,
                bio: profile.bio, // Optional
                avatarUrl: `https://effigy.im/a/${profile.address}.svg`, // Helper for extension
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
