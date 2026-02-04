import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const sessionAddress = await getSessionAddress()
        if (!sessionAddress) {
            return NextResponse.json(
                { unauthorized: true },
                { status: 200 }
            )
        }

        const normalizedSession = sessionAddress.toLowerCase()

        const mutes = await prisma.mute.findMany({
            where: {
                muterAddress: normalizedSession,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Fetch profile details for muted users
        const mutedUsers = await Promise.all(mutes.map(async (mute) => {
            const profile = await prisma.profile.findUnique({
                where: { address: mute.mutedAddress },
                select: {
                    address: true,
                    displayName: true,
                },
            })

            return {
                address: mute.mutedAddress,
                displayName: profile?.displayName || null,
                mutedAt: mute.createdAt,
            }
        }))

        return NextResponse.json({ mutedUsers })
    } catch (error) {
        console.error('Error fetching muted users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
