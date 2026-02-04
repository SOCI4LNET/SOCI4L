import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const sessionOwner = await getSessionAddress()

        // For now, allow social linking even without explicit session if trusted by client via Privy
        // In production, you'd preferably strictly verify the session owner matches the Privy user 
        // or pass the Privy auth token here to verify on server.
        // For MVP, we will trust the payload but ensure the profile exists.

        const body = await req.json()
        const { platform, platformUsername, platformUserId } = body

        if (!platform || !platformUsername || !platformUserId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // If we have a session owner, use it to find profile
        // If not, we might be in a flow where the user logged in via Privy only (future)
        // But SOCI4L is wallet-first. So we expect a wallet session.

        if (!sessionOwner) {
            return NextResponse.json({ error: 'Unauthorized: No wallet session' }, { status: 401 })
        }

        const profile = await prisma.profile.findUnique({
            where: { address: sessionOwner.toLowerCase() }
        })

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Check if this social account is already linked to ANOTHER profile
        const existing = await prisma.socialConnection.findUnique({
            where: {
                platform_platformUserId: {
                    platform,
                    platformUserId
                }
            },
            include: { profile: true }
        })

        if (existing && existing.profileId !== profile.id) {
            return NextResponse.json({
                error: `This ${platform} account is already connected to another profile (${existing.profile.address})`
            }, { status: 409 })
        }

        // Create or Update the connection
        const connection = await prisma.socialConnection.upsert({
            where: {
                platform_platformUserId: {
                    platform,
                    platformUserId
                }
            },
            update: {
                platformUsername, // Update username in case it changed
                verifiedAt: new Date(),
            },
            create: {
                profileId: profile.id,
                platform,
                platformUsername,
                platformUserId,
                verifiedAt: new Date(),
            }
        })

        return NextResponse.json({ success: true, connection })
    } catch (error) {
        console.error('[API] Social Link Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
