import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'

// WAVAX contract on Avalanche (proxy for native AVAX price)
const WAVAX_ADDRESS = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
const DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex/tokens'
const GECKOTERMINAL_BASE = 'https://api.geckoterminal.com/api/v2'

/**
 * Finds the best Avalanche pool for a given token via DexScreener
 * Returns the pair address of the pool with highest 24h liquidity
 */
async function getTopAvalanchePool(tokenAddress: string): Promise<string | null> {
    try {
        const res = await fetch(`${DEXSCREENER_BASE}/${tokenAddress}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 600 }, // cache 10 min
        })
        if (!res.ok) return null

        const json = await res.json()
        const pairs: any[] = json?.pairs || []

        // Filter to Avalanche pairs only and sort by liquidity descending
        const avalanchePairs = pairs
            .filter((p: any) => p.chainId === 'avalanche')
            .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))

        return avalanchePairs[0]?.pairAddress?.toLowerCase() || null
    } catch {
        return null
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const address = params.address
    const searchParams = request.nextUrl.searchParams
    const days = searchParams.get('days') || '7' // '1', '7', or '30'

    if (!address || (!isValidAddress(address) && address !== 'native')) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    try {
        // Resolve contract address — use WAVAX as proxy for native AVAX
        const contractAddress = (address === 'native' || address === 'avax')
            ? WAVAX_ADDRESS
            : address.toLowerCase()

        // Step 1: Get the best DEX pool for this token from DexScreener
        const poolAddress = await getTopAvalanchePool(contractAddress)

        if (!poolAddress) {
            return NextResponse.json({ data: [] })
        }

        // Step 2: Map days to GeckoTerminal timeframe and limit
        // 1d → hourly last 24 bars, 7d → daily last 7 bars, 30d → daily last 30 bars
        const isIntraday = days === '1'
        const timeframe = isIntraday ? 'hour' : 'day'
        const limit = isIntraday ? 24 : parseInt(days)

        // Step 3: Fetch OHLCV from GeckoTerminal using the pool address (free endpoint)
        const ohlcvUrl = `${GECKOTERMINAL_BASE}/networks/avax/pools/${poolAddress}/ohlcv/${timeframe}?limit=${limit}&currency=usd`

        const res = await fetch(ohlcvUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 300 }, // cache 5 min
        })

        if (!res.ok) {
            console.warn(`[Chart API] GeckoTerminal pool OHLCV ${res.status} for pool ${poolAddress}`)
            return NextResponse.json({ data: [] })
        }

        const json = await res.json()
        const ohlcvList: number[][] = json?.data?.attributes?.ohlcv_list || []

        if (!ohlcvList.length) {
            return NextResponse.json({ data: [] })
        }

        // GeckoTerminal returns: [timestamp_sec, open, high, low, close, volume]
        // We use close price as the chart value
        const formattedData = ohlcvList.map(([ts, , , , close]: number[]) => {
            const date = new Date(ts * 1000)
            return {
                timestamp: ts * 1000,
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                value: close,
            }
        })

        return NextResponse.json(
            { data: formattedData },
            { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
        )
    } catch (error: any) {
        console.error('[Chart API] Error:', error)
        return NextResponse.json({ error: 'Internal server error', data: [] }, { status: 500 })
    }
}
