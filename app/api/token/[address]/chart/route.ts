import { NextRequest, NextResponse } from 'next/server'
import { getAvalancheTokenList, getTokenChart } from '@/lib/coingecko'
import { isValidAddress } from '@/lib/utils'

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const address = params.address
    const searchParams = request.nextUrl.searchParams
    const days = searchParams.get('days') || '7' // '1', '7', or '30'
    const symbol = searchParams.get('symbol')

    if (!address || (!isValidAddress(address) && address !== 'native')) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    try {
        const normalizedAddress = address.toLowerCase()

        // Default to AVAX if native
        let coingeckoId = 'avalanche-2'

        if (normalizedAddress !== 'native' && normalizedAddress !== 'avax') {
            const tokenList = await getAvalancheTokenList()
            const tokenInfo = tokenList.get(normalizedAddress)

            if (tokenInfo) {
                coingeckoId = tokenInfo.id
            } else if (symbol) {
                // Normalize symbol for search (remove Avalanche .e suffix)
                let searchSymbol = symbol.toLowerCase().replace(/\.e$/, '')

                // Map known wrapped/bridged tokens to their base CoinGecko IDs to ensure chart data exists
                const manualMap: Record<string, string> = {
                    'weth': 'ethereum',
                    'wbtc': 'bitcoin',
                    'usdc': 'usd-coin',
                    'usdt': 'tether',
                    'dai': 'dai',
                    'joe': 'joe'
                }

                if (manualMap[searchSymbol]) {
                    coingeckoId = manualMap[searchSymbol]
                } else {
                    // Fallback to CoinGecko search API if symbol is not manually mapped
                    const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchSymbol)}`)
                    if (searchRes.ok) {
                        const searchData = await searchRes.json()
                        // Try to find exact symbol match
                        const match = searchData.coins?.find((c: any) => c.symbol.toLowerCase() === searchSymbol)
                        if (match) {
                            coingeckoId = match.id
                        } else {
                            return NextResponse.json({ error: 'Token not found on CoinGecko' }, { status: 404 })
                        }
                    } else {
                        return NextResponse.json({ error: 'Failed to search CoinGecko' }, { status: 404 })
                    }
                }
            } else {
                return NextResponse.json({ error: 'Token not found on CoinGecko' }, { status: 404 })
            }
        }

        const chartData = await getTokenChart(coingeckoId, days)

        // Optional: downsample data for recharts if there are too many points
        // CoinGecko returns roughly hourly data for 7-90 days, minute data for 1 day.
        let sampledData = chartData
        if (sampledData.length > 100) {
            const step = Math.ceil(sampledData.length / 50)
            sampledData = sampledData.filter((_, index) => index % step === 0)
        }

        return NextResponse.json(
            { data: sampledData, id: coingeckoId },
            { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
        )
    } catch (error: any) {
        console.error('[Assets API] Failed to fetch chart data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
