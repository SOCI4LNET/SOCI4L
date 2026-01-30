import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> | { address: string } }
) {
    try {
        const resolvedParams = (await params) as { address: string }
        const addressStr = resolvedParams.address
        const followerAddress = (typeof addressStr === 'string'
            ? decodeURIComponent(addressStr).toLowerCase()
            : addressStr).toLowerCase()

        if (!followerAddress || !isValidAddress(followerAddress)) {
            return NextResponse.json({ error: 'Invalid follower address' }, { status: 400 })
        }

        const myAddress = await getSessionAddress()
        if (!myAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const normalizedMe = myAddress.toLowerCase()

        // Delete follow relationship where 'followerAddress' is following ME ('normalizedMe')
        const result = await prisma.follow.deleteMany({
            where: {
                followerAddress: followerAddress,
                followingAddress: normalizedMe,
            },
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Follower not found' }, { status: 404 })
        }

        // Log the removal
        const myProfile = await prisma.profile.findUnique({ where: { address: normalizedMe } })
        if (myProfile) {
            await prisma.userActivityLog.create({
                data: {
                    profileId: myProfile.id,
                    action: 'remove_follower',
                    metadata: JSON.stringify({ follower: followerAddress }),
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in remove-follower API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
