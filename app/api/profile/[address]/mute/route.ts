import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ address: string }> }
) {
    const params = await props.params
    try {
        const targetAddress = params.address.toLowerCase()

        if (!targetAddress || !isValidAddress(targetAddress)) {
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

        const normalizedSession = sessionAddress.toLowerCase()

        if (normalizedSession === targetAddress) {
            return NextResponse.json(
                { error: 'Cannot mute yourself' },
                { status: 400 }
            )
        }

        // Create mute record
        await prisma.mute.create({
            data: {
                muterAddress: normalizedSession,
                mutedAddress: targetAddress,
            },
        })

        return NextResponse.json({ muted: true })
    } catch (error) {
        console.error('Error muting user:', error)
        // Check for unique constraint violation (already muted)
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ muted: true })
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ address: string }> }
) {
    const params = await props.params
    try {
        const targetAddress = params.address.toLowerCase()

        if (!targetAddress || !isValidAddress(targetAddress)) {
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

        const normalizedSession = sessionAddress.toLowerCase()

        // Delete mute record
        await prisma.mute.deleteMany({
            where: {
                muterAddress: normalizedSession,
                mutedAddress: targetAddress,
            },
        })

        return NextResponse.json({ muted: false })
    } catch (error) {
        console.error('Error unmuting user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ address: string }> }
) {
    const params = await props.params
    try {
        const targetAddress = params.address.toLowerCase()

        if (!targetAddress || !isValidAddress(targetAddress)) {
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

        const normalizedSession = sessionAddress.toLowerCase()

        const mute = await prisma.mute.findUnique({
            where: {
                muterAddress_mutedAddress: {
                    muterAddress: normalizedSession,
                    mutedAddress: targetAddress,
                },
            },
        })

        return NextResponse.json({ muted: !!mute })
    } catch (error) {
        console.error('Error checking mute status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
