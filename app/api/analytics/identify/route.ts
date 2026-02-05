
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventId, walletAddress } = body

        if (!eventId || !walletAddress) {
            return NextResponse.json(
                { error: 'eventId and walletAddress are required' },
                { status: 400 }
            )
        }

        if (!isValidAddress(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            )
        }

        // Update the existing analytics event
        // We only update if it exists and doesn't already have a wallet (optional safety check, 
        // but maybe we want to allow overwriting if they connect later? For now, just update).
        // Also, we might want to verify ownership if this was critical, but for analytics, 
        // we trust the client-side reported wallet from the tracked page.

        await prisma.analyticsEvent.update({
            where: { id: eventId },
            data: {
                visitorWallet: walletAddress.toLowerCase(),
            },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[Identify API] Error updating visitor identity', error)
        return NextResponse.json(
            { error: 'Failed to update identity' },
            { status: 500 }
        )
    }
}
