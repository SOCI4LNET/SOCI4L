import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const sessionAddress = await getSessionAddress()
        if (!sessionAddress) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const normalizedSession = sessionAddress.toLowerCase()

        const blocks = await prisma.block.findMany({
            where: {
                blockerAddress: normalizedSession,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Fetch profile details for blocked users
        const blockedUsers = await Promise.all(blocks.map(async (block) => {
            const profile = await prisma.profile.findUnique({
                where: { address: block.blockedAddress },
                select: {
                    address: true,
                    displayName: true,
                    // We don't need full profile data, just enough to show in the list
                },
            })

            return {
                address: block.blockedAddress,
                displayName: profile?.displayName || null,
                blockedAt: block.createdAt,
            }
        }))

        return NextResponse.json({ blockedUsers })
    } catch (error) {
        console.error('Error fetching blocked users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
