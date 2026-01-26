import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { fetchActivity, type ActivityTransaction } from '@/lib/activity/fetchActivity'

/**
 * Activity API Route
 * 
 * CACHING:
 * - Server-side caching with revalidate: 30 seconds
 * - Manual refresh via ?t=${Date.now()} query param busts cache
 * - Cache is configured in the fetch call below
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address
    const searchParams = request.nextUrl.searchParams
    
    // Query parameters
    const dateRange = (searchParams.get('dateRange') || 'all') as '24h' | '7d' | '30d' | 'all'
    const type = (searchParams.get('type') || 'all') as 'all' | 'transfer' | 'contract' | 'swap'
    const direction = (searchParams.get('direction') || 'all') as 'all' | 'incoming' | 'outgoing'
    const search = searchParams.get('search') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const cacheBust = searchParams.get('t') // For manual refresh

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Log the address being used for debugging
    console.log('[Activity API] Fetching transactions for address:', normalizedAddress)

    // Fetch transactions with caching
    // Cache for 30 seconds unless manual refresh is requested
    const cacheOptions = cacheBust 
      ? { cache: 'no-store' as const }
      : { next: { revalidate: 30 } }

    const transactions = await fetchActivity({
      address: normalizedAddress,
      dateRange,
      type,
      direction,
      search,
      limit,
      offset,
    })

    // Log the received transactions for debugging
    console.log('[Activity API] Fetched transactions:', {
      count: transactions.length,
      address: normalizedAddress,
      sampleTx: transactions[0] ? {
        hash: transactions[0].hash,
        from: transactions[0].from,
        to: transactions[0].to,
        direction: transactions[0].direction,
      } : null,
    })

    return NextResponse.json({
      items: transactions,
      total: transactions.length,
      hasMore: transactions.length === limit,
    }, {
      headers: {
        'Cache-Control': cacheBust ? 'no-cache' : 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error: any) {
    console.error('[Activity API] Error:', {
      error: error.message,
      stack: error.stack,
      address: params.address,
    })
    return NextResponse.json(
      { 
        error: 'An error occurred while fetching activity data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
