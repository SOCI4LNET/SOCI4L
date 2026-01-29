import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

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
            },
        })

        const profileMap = new Map(
            profiles.map((p) => [p.address.toLowerCase(), p])
        )

        const mutualsWithProfile = mutuals.map((m) => {
            const profile = profileMap.get(m.followingAddress.toLowerCase())
            return {
                address: m.followingAddress,
                createdAt: m.createdAt,
                displayName: profile?.displayName || null,
                slug: profile?.slug || null,
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
