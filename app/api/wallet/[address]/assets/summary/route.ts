import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { fetchAssetsFromRPC } from '@/lib/rpc-assets'

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
        { error: 'Geçersiz cüzdan adresi' },
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
      
      nftCount = rpcData.nfts.length
      
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
        error: 'Özet verileri alınırken bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
