import { NextResponse } from 'next/server'
import { getSessionAddress } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    const address = await getSessionAddress()

    if (!address) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ address })
}
