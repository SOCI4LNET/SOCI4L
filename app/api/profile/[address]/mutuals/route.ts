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

        const sessionAddress = await getSessionAddress()
        if (!sessionAddress) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const normalizedAddress = address.toLowerCase()

        // Find mutual connections: users where both follow each other
        // Step 1: Get all users this address follows
        const following = await prisma.follow.findMany({
            where: {
                followerAddress: normalizedAddress,
            },
            select: {
                followingAddress: true,
                createdAt: true,
            },
        })

        const followingAddresses = following.map(f => f.followingAddress)

        if (followingAddresses.length === 0) {
            return NextResponse.json({
                mutuals: [],
                count: 0,
            })
        }

        // Step 2: From those, find which ones also follow this address back
        const mutualFollows = await prisma.follow.findMany({
            where: {
                followerAddress: {
                    in: followingAddresses,
                },
                followingAddress: normalizedAddress,
            },
            select: {
                followerAddress: true,
            },
        })

        const mutualAddresses = mutualFollows.map(f => f.followerAddress)

        // Step 3: Get the original follow records for these mutuals
        const mutuals = following.filter(f =>
            mutualAddresses.includes(f.followingAddress)
        )

        // Get profile data for each mutual
        const mutualAddressesForProfiles = mutuals.map((m) => m.followingAddress)
        const profiles = await prisma.profile.findMany({
            where: {
                address: {
                    in: mutualAddresses,
                },
            },
            select: {
                address: true,
                displayName: true,
                slug: true,
                updatedAt: true,
                createdAt: true,
                role: true,
                primaryRole: true,
                statusMessage: true,
            },
        })

        const profileMap = new Map(
            profiles.map((p) => [p.address.toLowerCase(), p])
        )

        const mutualsWithProfile = mutuals.map((m) => {
            const profile = profileMap.get(m.followingAddress.toLowerCase())
            let score = 40 // Base score for mutual
            let reasons: string[] = ['Mutual']

            if (profile?.displayName || profile?.slug) {
                score += 20
            }
            if (profile?.role === 'BUILDER' || profile?.role === 'ADMIN') {
                score += 15
                reasons.map(r => r !== 'Builder' && r !== 'Team' ? reasons.push(profile.role === 'ADMIN' ? 'Team' : 'Builder') : null)
            }
            // Account Age (> 1 year)
            if (profile?.createdAt && (new Date().getTime() - new Date(profile.createdAt).getTime() > 365 * 24 * 60 * 60 * 1000)) {
                score += 10
            }
            // Follow Duration (> 1 month)
            if (new Date().getTime() - new Date(m.createdAt).getTime() > 30 * 24 * 60 * 60 * 1000) {
                score += 10
                reasons.push('Long-term')
            }
            // Activity (updated recently)
            if (profile?.updatedAt && (new Date().getTime() - new Date(profile.updatedAt).getTime() < 30 * 24 * 60 * 60 * 1000)) {
                score += 5
            }

            return {
                address: m.followingAddress,
                createdAt: m.createdAt,
                displayName: profile?.displayName || null,
                slug: profile?.slug || null,
                primaryRole: profile?.primaryRole || null,
                statusMessage: profile?.statusMessage || null,
                score: Math.min(score, 100),
                reason: reasons.length > 0 ? reasons.join(' • ') : undefined
            }
        })

        return NextResponse.json({
            mutuals: mutualsWithProfile,
            count: mutualsWithProfile.length,
        })
    } catch (error) {
        console.error('Error fetching mutuals:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to fetch mutuals', details: errorMessage },
            { status: 500 }
        )
    }
}
