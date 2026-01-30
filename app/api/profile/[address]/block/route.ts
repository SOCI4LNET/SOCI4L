import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> | { address: string } }
) {
    try {
        const resolvedParams = (await params) as { address: string }
        const addressStr = resolvedParams.address
        const targetAddress = (typeof addressStr === 'string'
            ? decodeURIComponent(addressStr).toLowerCase()
            : addressStr).toLowerCase()

        if (!targetAddress || !isValidAddress(targetAddress)) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
        }

        const blockerAddress = await getSessionAddress()
        if (!blockerAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const normalizedBlocker = blockerAddress.toLowerCase()

        if (normalizedBlocker === targetAddress) {
            return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 })
        }

        // Toggle block
        const existingBlock = await prisma.block.findUnique({
            where: {
                blockerAddress_blockedAddress: {
                    blockerAddress: normalizedBlocker,
                    blockedAddress: targetAddress,
                },
            },
        })

        if (existingBlock) {
            // Unblock
            await prisma.block.delete({
                where: { id: existingBlock.id },
            })

            return NextResponse.json({ blocked: false })
        } else {
            // Block
            await prisma.block.create({
                data: {
                    blockerAddress: normalizedBlocker,
                    blockedAddress: targetAddress,
                },
            })

            // When blocking, also remove any follow relationship in BOTH directions
            await prisma.follow.deleteMany({
                where: {
                    OR: [
                        { followerAddress: normalizedBlocker, followingAddress: targetAddress },
                        { followerAddress: targetAddress, followingAddress: normalizedBlocker },
                    ],
                },
            })

            return NextResponse.json({ blocked: true })
        }
    } catch (error) {
        console.error('Error in block API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> | { address: string } }
) {
    try {
        const resolvedParams = (await params) as { address: string }
        const addressStr = resolvedParams.address
        const targetAddress = (typeof addressStr === 'string'
            ? decodeURIComponent(addressStr).toLowerCase()
            : addressStr).toLowerCase()

        const blockerAddress = await getSessionAddress()
        if (!blockerAddress) {
            return NextResponse.json({ blocked: false })
        }

        const normalizedBlocker = blockerAddress.toLowerCase()

        const block = await prisma.block.findUnique({
            where: {
                blockerAddress_blockedAddress: {
                    blockerAddress: normalizedBlocker,
                    blockedAddress: targetAddress,
                },
            },
        })

        return NextResponse.json({ blocked: !!block })
    } catch (error) {
        return NextResponse.json({ blocked: false })
    }
}
