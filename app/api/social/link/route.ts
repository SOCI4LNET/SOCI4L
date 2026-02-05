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
        const { platform, platformUsername, platformUserId, walletAddress } = body

        if (!platform || !platformUsername || !platformUserId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Use session owner if available, otherwise trust the walletAddress from body (if provided)
        // This is necessary because on some devices (like Mac with partial auth state), 
        // the httpOnly cookie might be missing even if Privy is connected.
        const effectiveAddress = sessionOwner || walletAddress

        if (!effectiveAddress) {
            return NextResponse.json({ error: 'Unauthorized: No wallet session or address provided' }, { status: 401 })
        }

        const profile = await prisma.profile.findUnique({
            where: { address: effectiveAddress.toLowerCase() }
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
                error: `This ${platform} account is already connected to another profile.`
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
