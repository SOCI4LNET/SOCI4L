import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const address = searchParams.get('address')
        const limit = parseInt(searchParams.get('limit') || '5')

        if (!address || !isValidAddress(address)) {
            return NextResponse.json(
                { error: 'Invalid address' },
                { status: 400 }
            )
        }

        const normalizedAddress = address.toLowerCase()

        // 1. Get list of addresses already followed by this user
        const existingFollows = await prisma.follow.findMany({
            where: {
                followerAddress: normalizedAddress,
            },
            select: {
                followingAddress: true,
            },
        })

        const excludedAddresses = [
            normalizedAddress, // Exclude self
            ...existingFollows.map(f => f.followingAddress) // Exclude followed
        ]

        // 2. Fetch suggestions: Prioritize Builders/Admins, then recent profiles
        const suggestions = await prisma.profile.findMany({
            where: {
                address: {
                    notIn: excludedAddresses,
                },
                OR: [
                    { role: { in: ['ADMIN', 'BUILDER'] } }, // High quality
                    { isPublic: true } // Or just public profiles
                ]
            },
            take: limit,
            orderBy: [
                { role: 'asc' }, // ADMIN/BUILDER come before USER (alphabetically ADMIN < BUILDER < USER ? No. ADMIN < BUILDER < USER. actually A < B < U. So ADMIN first.)
                { createdAt: 'desc' } // Then newest
            ],
            select: {
                address: true,
                displayName: true,
                bio: true,
                role: true,
                createdAt: true,
            }
        })

        // Enhance with "reason"
        const enhancedSuggestions = suggestions.map(profile => ({
            ...profile,
            reason: profile.role === 'ADMIN' || profile.role === 'BUILDER'
                ? `Recommended ${profile.role.toLowerCase()}`
                : 'Recently joined'
        }))

        return NextResponse.json({
            suggestions: enhancedSuggestions
        })

    } catch (error) {
        console.error('Error fetching suggestions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch suggestions' },
            { status: 500 }
        )
    }
}
