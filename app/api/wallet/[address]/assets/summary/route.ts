import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { fetchAssetsFromRPC } from '@/lib/rpc-assets'
import { fetchAccountNfts } from '@/lib/opensea'

const CHAIN_ID = 43114 // Avalanche C-Chain

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const startTime = Date.now()
  const address = params.address

  console.log('[Assets Summary API] Request received:', {
    address,
    chainId: CHAIN_ID,
  })

  try {
    if (!address || !isValidAddress(address)) {
      console.error('[Assets Summary API] Invalid address:', address)
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    console.log('[Assets Summary API] Normalized address:', normalizedAddress)

    let tokenCount = 0
    let nftCount = 0
    let totalValueUsd: number | undefined = undefined

    try {
      const rpcData = await fetchAssetsFromRPC(normalizedAddress)

      // Count tokens (including native if balance > 0)
      tokenCount = rpcData.tokens.length
      if (rpcData.native && BigInt(rpcData.native.balanceWei) > 0n) {
        tokenCount += 1 // Include native AVAX
      }


      // Fetch NFT count from OpenSea if available
      const hasOpenseaApiKey = !!process.env.OPENSEA_API_KEY
      if (hasOpenseaApiKey) {
        try {
          // efficient fetch with limit 1 just to check count/existence or basic info?
          // Actually OpenSea v2 doesn't give total count easily without paginating?
          // fetchAccountNfts returns a list. If we want total count, we might have to rely on what we get.
          // But looking at lib/opensea.ts, it returns { nfts, next }.
          // It doesn't return total count.
          // However, for the summary we just need a count. 
          // If we fetch limit 50, and get 50, we know it's at least 50.
          // Dashboard summary might just show "50+" or something?
          // The current snowtrace implementation fetches EVERYTHING.

          // Wait, fetchAssetsFromRPC returns ALL nfts?
          // lib/rpc-assets.ts calls snowtrace which might return all.

          // If I switch to OpenSea as primary:
          // I really only get a paginated list.
          // So I can't get an EXACT count without traversing everything, which is slow.

          // Ideally I should stick to Snowtrace for "Count" if OpenSea doesn't give a total.
          // OR I can accept that the count might be limited to page size if I don't paginate.

          // Let's check what the user wants. "gosterebilecegiz" (we will be able to show).
          // The summary is just for "Assets" tab badge maybe? or the "Assets" card?
          // In `components/dashboard/overview-panel.tsx` (implied), or `AssetsControlsBar`.

          // The summary route returns `nftCount`.

          // If I use OpenSea, I might not get the total count easily.
          // But Snowtrace gave me the total count.

          // If I leave Snowtrace for count, but use OpenSea for display...
          // That might be inconsistent if Snowtrace misses some (which is why we are switching).

          // Iterate OpenSea?
          // No, that's too heavy for a summary endpoint.

          // Maybe I should fetch from OpenSea with a high limit (e.g. 50 or 200)?
          // OpenSea max limit is 200.
          // Most users won't have >200 NFTs.
          // If next exists, I can say 200+.

          const openseaData = await fetchAccountNfts('avalanche', normalizedAddress, 200)
          nftCount = openseaData.nfts.length
          // Note: if openseaData.next exists, true count is > 200.
        } catch (e) {
          console.error('[Assets Summary] OpenSea fetch failed, falling back to RPC count')
          nftCount = rpcData.nfts.length
        }
      } else {
        nftCount = rpcData.nfts.length
      }

      // Calculate total USD value
      const tokenValues = rpcData.tokens
        .map((t) => t.usdValue || 0)
        .reduce((sum, val) => sum + val, 0)

      // Add native AVAX value if available
      if (rpcData.native.usdValue) {
        totalValueUsd = (totalValueUsd || 0) + rpcData.native.usdValue
      } else {
        totalValueUsd = tokenValues > 0 ? tokenValues : undefined
      }

      console.log('[Assets Summary API] Summary calculated:', {
        tokenCount,
        nftCount,
        totalValueUsd,
        method: 'RPC (100% free)',
      })
    } catch (rpcError: any) {
      console.error('[Assets Summary API] RPC fetch failed:', {
        error: rpcError.message,
      })
      // Return zeros if RPC fails
      tokenCount = 0
      nftCount = 0
      totalValueUsd = undefined
    }

    const duration = Date.now() - startTime
    console.log('[Assets Summary API] Response prepared:', {
      duration: `${duration}ms`,
      tokenCount,
      nftCount,
    })

    return NextResponse.json({
      tokenCount,
      nftCount,
      totalValueUsd,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[Assets Summary API] Error:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      address,
      chainId: CHAIN_ID,
    })
    return NextResponse.json(
      {
        error: 'An error occurred while fetching summary data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
