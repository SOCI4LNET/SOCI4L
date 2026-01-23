import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { fetchAssetsFromRPC } from '@/lib/rpc-assets'
import { avalancheClient } from '@/lib/avalanche'
import { formatEther } from 'viem'
import { getAVAXPrice } from '@/lib/coingecko'

const CHAIN_ID = 43114 // Avalanche C-Chain

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const startTime = Date.now()
  const address = params.address
  const searchParams = request.nextUrl.searchParams
  const tab = searchParams.get('tab') || 'tokens'
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const cursor = searchParams.get('cursor') || '0'

  console.log('[Assets API] Request received:', {
    address,
    tab,
    limit,
    cursor,
    chainId: CHAIN_ID,
  })

  try {
    if (!address || !isValidAddress(address)) {
      console.error('[Assets API] Invalid address:', address)
      return NextResponse.json(
        { error: 'Geçersiz cüzdan adresi' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    console.log('[Assets API] Normalized address:', normalizedAddress)

    // Fetch assets using SnowTrace API + RPC fallback
    let rpcData = null
    let rpcError: any = null
    try {
      rpcData = await fetchAssetsFromRPC(normalizedAddress)
      console.log('[Assets API] Assets fetched successfully:', {
        nativeBalance: rpcData.native.balanceFormatted,
        tokenCount: rpcData.tokens.length,
      })
    } catch (error: any) {
      rpcError = error
      console.error('[Assets API] RPC fetch failed:', {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
      })
      // Continue - we'll use basic RPC fallback for native balance
    }

    const result: {
      tokens?: Array<{
        address: string | null // null for native token
        symbol: string
        name: string
        decimals: number
        balanceRaw: string
        balanceFormatted: string
        priceUsd?: number
        valueUsd?: number
        logoUrl?: string
        isNative?: boolean
      }>
      nfts?: Array<{
        contract: string
        tokenId: string
        name?: string
        collectionName?: string
        imageUrl?: string
        floorUsd?: number
        traitsCount?: number
        chain: string
      }>
      nextCursor?: string
      native?: {
        symbol: string
        name: string
        balanceWei: string
        balanceFormatted: string
        usdValue?: number
        priceUsd?: number
        logoUrl?: string
      }
    } = {}

    // Add native AVAX balance with USD value
    if (rpcData?.native) {
      result.native = {
        symbol: rpcData.native.symbol,
        name: rpcData.native.name,
        balanceWei: rpcData.native.balanceWei,
        balanceFormatted: rpcData.native.balanceFormatted,
        usdValue: rpcData.native.usdValue,
        priceUsd: rpcData.native.priceUsd,
        logoUrl: rpcData.native.logoUrl,
      }
    } else {
      // Fallback: fetch native balance from RPC
      try {
        const balance = await avalancheClient.getBalance({
          address: normalizedAddress as `0x${string}`,
        })
        const balanceFormatted = formatEther(balance)
        
        // Fetch AVAX price and logo from CoinGecko
        let avaxPrice = 0
        let avaxLogoUrl: string | undefined
        try {
          const { getTokenLogoUrl } = await import('@/lib/coingecko')
          const [price, logo] = await Promise.all([
            getAVAXPrice(),
            getTokenLogoUrl('avalanche-2'),
          ])
          avaxPrice = price
          avaxLogoUrl = logo
        } catch (error) {
          console.warn('[Assets API] Failed to fetch AVAX price/logo from CoinGecko:', error)
        }

        const nativeBalance = parseFloat(balanceFormatted)
        const nativeUsdValue = avaxPrice > 0 ? nativeBalance * avaxPrice : undefined

        result.native = {
          symbol: 'AVAX',
          name: 'Avalanche',
          balanceWei: balance.toString(),
          balanceFormatted: balanceFormatted,
          usdValue: nativeUsdValue,
          priceUsd: avaxPrice > 0 ? avaxPrice : undefined,
          logoUrl: avaxLogoUrl, // Only use CoinGecko logo, no fallback
        }
        console.log('[Assets API] Native balance from RPC:', result.native.balanceFormatted)
      } catch (rpcError) {
        console.error('[Assets API] RPC balance fetch failed:', rpcError)
        // Try to get logo from CoinGecko even if balance fetch failed
        let avaxLogoUrl: string | undefined
        try {
          const { getTokenLogoUrl } = await import('@/lib/coingecko')
          avaxLogoUrl = await getTokenLogoUrl('avalanche-2')
        } catch (error) {
          console.warn('[Assets API] Failed to fetch AVAX logo from CoinGecko:', error)
        }

        result.native = {
          symbol: 'AVAX',
          name: 'Avalanche',
          balanceWei: '0',
          balanceFormatted: '0',
          logoUrl: avaxLogoUrl, // Only use CoinGecko logo, no fallback
        }
      }
    }

    if (tab === 'tokens' || tab === 'all') {
      type TokenItem = {
        address: string | null
        symbol: string
        name: string
        decimals: number
        balanceRaw: string
        balanceFormatted: string
        priceUsd?: number
        valueUsd?: number
        logoUrl?: string
        isNative?: boolean
      }
      
      let tokens: TokenItem[] = []

      if (rpcData) {
        // Use RPC data
        tokens = rpcData.tokens.map((token): TokenItem => ({
          address: token.contractAddress,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balanceRaw: token.balanceRaw,
          balanceFormatted: token.balanceFormatted,
          priceUsd: token.priceUsd,
          valueUsd: token.usdValue,
          logoUrl: token.logoUrl,
          isNative: false,
        }))

        console.log('[Assets API] ERC-20 tokens from RPC:', tokens.length)

        // Also include native AVAX as a token if balance > 0
        if (result.native && BigInt(result.native.balanceWei) > BigInt(0)) {
          const nativeToken: TokenItem = {
            address: null,
            symbol: result.native.symbol,
            name: result.native.name,
            decimals: 18,
            balanceRaw: result.native.balanceWei,
            balanceFormatted: result.native.balanceFormatted,
            priceUsd: result.native.priceUsd,
            valueUsd: result.native.usdValue,
            logoUrl: result.native.logoUrl,
            isNative: true,
          }
          tokens.unshift(nativeToken)
          console.log('[Assets API] Native AVAX added to tokens:', result.native.balanceFormatted)
        }
      } else {
        // Fallback: If RPC failed, at least show native AVAX if we have it from basic RPC
        if (result.native && BigInt(result.native.balanceWei) > BigInt(0)) {
          const nativeToken: TokenItem = {
            address: null,
            symbol: result.native.symbol,
            name: result.native.name,
            decimals: 18,
            balanceRaw: result.native.balanceWei,
            balanceFormatted: result.native.balanceFormatted,
            priceUsd: result.native.priceUsd,
            valueUsd: result.native.usdValue,
            logoUrl: result.native.logoUrl,
            isNative: true,
          }
          tokens.push(nativeToken)
          console.log('[Assets API] Native AVAX added from basic RPC fallback:', result.native.balanceFormatted)
        }
      }

      // Sort by USD value (if available) or balance
      tokens.sort((a, b) => {
        if (a.valueUsd !== undefined && b.valueUsd !== undefined) {
          return b.valueUsd - a.valueUsd
        }
        const balanceA = BigInt(a.balanceRaw || '0')
        const balanceB = BigInt(b.balanceRaw || '0')
        if (balanceB > balanceA) return 1
        if (balanceB < balanceA) return -1
        return 0
      })

      console.log('[Assets API] Processed tokens:', {
        total: tokens.length,
        withBalance: tokens.filter((t) => BigInt(t.balanceRaw || '0') > BigInt(0)).length,
      })

      // Pagination
      const startIndex = parseInt(cursor, 10)
      const endIndex = startIndex + limit
      const paginatedTokens = tokens.slice(startIndex, endIndex)

      result.tokens = paginatedTokens
      if (endIndex < tokens.length) {
        result.nextCursor = endIndex.toString()
      }
    }

    if (tab === 'nfts' || tab === 'all') {
      let nfts: Array<{
        contract: string
        tokenId: string
        name?: string
        collectionName?: string
        imageUrl?: string
        floorUsd?: number
        traitsCount?: number
        chain: string
      }> = []

      if (rpcData) {
        nfts = rpcData.nfts.map((nft) => ({
          contract: nft.contractAddress,
          tokenId: nft.tokenId,
          name: nft.name,
          collectionName: undefined,
          imageUrl: nft.imageUrl,
          floorUsd: undefined,
          traitsCount: undefined,
          chain: 'Avalanche C-Chain',
        }))
      }

      console.log('[Assets API] Processed NFTs:', {
        total: nfts.length,
      })

      // Pagination
      const startIndex = parseInt(cursor, 10)
      const endIndex = startIndex + limit
      const paginatedNfts = nfts.slice(startIndex, endIndex)

      result.nfts = paginatedNfts
      if (endIndex < nfts.length) {
        result.nextCursor = endIndex.toString()
      }
    }

    const duration = Date.now() - startTime
    console.log('[Assets API] Response prepared:', {
      duration: `${duration}ms`,
      tokenCount: result.tokens?.length || 0,
      nftCount: result.nfts?.length || 0,
      hasNative: !!result.native,
      nativeBalance: result.native?.balanceFormatted,
      usedRPC: !!rpcData,
      rpcError: rpcError?.message || null,
    })

    // Add error info to response in development mode for debugging
    if (process.env.NODE_ENV === 'development' && rpcError && !rpcData) {
      return NextResponse.json({
        ...result,
        _debug: {
          rpcError: rpcError.message,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[Assets API] Error:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      address,
      chainId: CHAIN_ID,
    })
    return NextResponse.json(
      {
        error: 'Varlık verileri alınırken bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
