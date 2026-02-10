import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const address = params.address

    if (!address || !isValidAddress(address)) {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    try {
        const normalizedAddress = address.toLowerCase()

        const interactions = await (prisma as any).billingInteraction.findMany({
            where: { userAddress: normalizedAddress },
            orderBy: { timestamp: 'desc' }
        })

        return NextResponse.json({
            history: interactions.map((item: any) => ({
                id: item.id,
                type: item.type,
                description: item.description,
                amount: item.amount,
                hash: item.txHash,
                timestamp: item.timestamp.toISOString(),
                status: 'CONFIRMED'
            }))
        })
    } catch (error) {
        console.error('Error fetching billing history:', error)
        return NextResponse.json(
            { error: 'An error occurred while fetching billing history' },
            { status: 500 }
        )
    }
}
