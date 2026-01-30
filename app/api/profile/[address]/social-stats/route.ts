import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

import { getSessionAddress } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> | { address: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params)
        const address = resolvedParams.address

        if (!address || !isValidAddress(address)) {
            return NextResponse.json(
                { error: 'Invalid address' },
                { status: 400 }
            )
        }

        const normalizedAddress = address.toLowerCase()

        // Check for blocks
        const sessionAddress = await getSessionAddress()
        if (sessionAddress) {
            const normalizedSession = sessionAddress.toLowerCase()
            if (normalizedSession !== normalizedAddress) {
                // Only block if viewer is blocked by target
                const block = await prisma.block.findFirst({
                    where: {
                        blockerAddress: normalizedAddress,
                        blockedAddress: normalizedSession,
                    },
                })

                if (block) {
                    return NextResponse.json({ error: 'Profile is not available' }, { status: 403 })
                }
            }
        }

        // Calculate date thresholds
        const now = new Date()
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(now.getDate() - 7)
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)

        // Parallel queries for performance
        const [
            followingAddresses,
            newFollowers7d,
            newFollowing7d,
            activeFollowers30d,
        ] = await Promise.all([
            // Get addresses this user follows (for mutuals calculation)
            prisma.follow.findMany({
                where: {
                    followerAddress: normalizedAddress,
                },
                select: {
                    followingAddress: true,
                },
            }).then(follows => follows.map(f => f.followingAddress)),

            // New followers in last 7 days
            prisma.follow.count({
                where: {
                    followingAddress: normalizedAddress,
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                },
            }),

            // New following in last 7 days
            prisma.follow.count({
                where: {
                    followerAddress: normalizedAddress,
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                },
            }),
            // Active followers (30d): followers who updated their profile in last 30 days
            prisma.follow.findMany({
                where: {
                    followingAddress: normalizedAddress,
                },
                select: {
                    followerAddress: true,
                },
            }).then(async (followers) => {
                if (followers.length === 0) return 0

                const followerAddresses = followers.map((f) => f.followerAddress)
                const activeProfiles = await prisma.profile.count({
                    where: {
                        address: {
                            in: followerAddresses,
                        },
                        updatedAt: {
                            gte: thirtyDaysAgo,
                        },
                    },
                })
                return activeProfiles
            }),
        ])

        // Calculate mutuals count from followingAddresses
        const mutualsCount = followingAddresses.length === 0
            ? 0
            : await prisma.follow.count({
                where: {
                    followerAddress: {
                        in: followingAddresses,
                    },
                    followingAddress: normalizedAddress,
                },
            })

        // Top interacted is privacy-sensitive, would require user consent
        // For MVP, we'll return null (implement in V2 with proper consent system)
        const topInteracted = null

        return NextResponse.json({
            mutuals: mutualsCount,
            new7d: {
                followers: newFollowers7d,
                following: newFollowing7d,
            },
            active30d: activeFollowers30d,
            topInteracted: topInteracted,
        })
    } catch (error) {
        console.error('Error fetching social stats:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to fetch social stats', details: errorMessage },
            { status: 500 }
        )
    }
}
