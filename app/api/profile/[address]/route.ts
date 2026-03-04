
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params

    if (!address || !isValidAddress(address)) {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    try {
        const normalizedAddress = address.toLowerCase()

        const profile = await prisma.profile.findUnique({
            where: { address: normalizedAddress },
        })

        if (!profile) {
            // Return 200 with null profile instead of 404 to avoid console errors in admin checks
            return NextResponse.json({ profile: null })
        }

        return NextResponse.json({
            profile: {
                address: profile.address,
                displayName: profile.displayName || null,
                bio: profile.bio || null,
                role: profile.role,
                updatedAt: profile.updatedAt.getTime(),
                premiumExpiresAt: profile.premiumExpiresAt,
            },
        })
    } catch (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json(
            { error: 'An error occurred while fetching profile' },
            { status: 500 }
        )
    }
}
