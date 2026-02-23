import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'

const SNOWTRACE_API = 'https://api.snowtrace.io/api'

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const tokenAddress = params.address
    const searchParams = request.nextUrl.searchParams
    const wallet = searchParams.get('wallet')

    if (!wallet || !isValidAddress(wallet)) {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    try {
        let firstAcquiredAt: number | null = null

        if (tokenAddress === 'native') {
            // For native AVAX, get the first normal transaction
            const url = `${SNOWTRACE_API}?module=account&action=txlist&address=${wallet}&sort=asc&page=1&offset=1`
            const res = await fetch(url, { next: { revalidate: 3600 } })
            if (res.ok) {
                const data = await res.json()
                const txs: any[] = data?.result || []
                if (txs.length > 0 && txs[0].timeStamp) {
                    firstAcquiredAt = parseInt(txs[0].timeStamp) * 1000
                }
            }
        } else if (isValidAddress(tokenAddress)) {
            // For ERC20 tokens, get first token transfer for this wallet+token combo
            const url = `${SNOWTRACE_API}?module=account&action=tokentx&contractaddress=${tokenAddress}&address=${wallet}&sort=asc&page=1&offset=1`
            const res = await fetch(url, { next: { revalidate: 3600 } })
            if (res.ok) {
                const data = await res.json()
                const txs: any[] = data?.result || []
                if (txs.length > 0 && txs[0].timeStamp) {
                    firstAcquiredAt = parseInt(txs[0].timeStamp) * 1000
                }
            }
        }

        return NextResponse.json(
            { firstAcquiredAt },
            { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
        )
    } catch (error) {
        console.error('[Token History API] Error:', error)
        return NextResponse.json({ firstAcquiredAt: null }, { status: 200 })
    }
}
