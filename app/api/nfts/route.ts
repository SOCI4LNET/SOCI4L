import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { fetchAccountNfts, OpenSeaNft } from '@/lib/opensea'

/**
 * Normalized NFT type for API response
 */
export type NormalizedNft = {
  id: string
  name: string | null
  imageUrl: string | null
  collectionName: string | null
  contract: string | null
  tokenId: string | null
}

export type NftResponse = {
  nfts: NormalizedNft[]
  next: string | null
}

/**
 * Normalize OpenSea NFT to our format
 */
function normalizeNft(openseaNft: OpenSeaNft): NormalizedNft {
  return {
    id: `${openseaNft.contract}-${openseaNft.identifier}`,
    name: openseaNft.name,
    imageUrl: openseaNft.image_url,
    collectionName: openseaNft.collection || null,
    contract: openseaNft.contract || null,
    tokenId: openseaNft.identifier || null,
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  const chain = searchParams.get('chain') || 'avalanche'
  const limit = parseInt(searchParams.get('limit') || '24', 10)
  const next = searchParams.get('next') || null

  console.log('[NFTs API] Request received:', {
    address,
    chain,
    limit,
    hasNext: !!next,
  })

  try {
    // Validate address
    if (!address || !isValidAddress(address)) {
      console.error('[NFTs API] Invalid address:', address)
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Validate limit
    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Fetch NFTs from OpenSea
    let openseaData
    try {
      openseaData = await fetchAccountNfts(chain, normalizedAddress, limit, next)
    } catch (error: any) {
      console.error('[NFTs API] OpenSea fetch failed:', {
        error: error.message,
        address: normalizedAddress,
        chain,
      })

      // Check if it's a missing API key error
      if (error.message?.includes('OPENSEA_API_KEY')) {
        return NextResponse.json(
          {
            error: 'OpenSea API key is not configured',
            details: process.env.NODE_ENV === 'development' 
              ? 'Set OPENSEA_API_KEY in .env.local' 
              : undefined,
          },
          { status: 500 }
        )
      }

      // Check if it's a rate limit error
      if (error.message?.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'OpenSea API rate limit exceeded',
            details: 'Please try again in a few moments',
          },
          { status: 429 }
        )
      }

      // Return empty result on other errors (graceful degradation)
      console.warn('[NFTs API] Returning empty result due to error')
      return NextResponse.json({
        nfts: [],
        next: null,
      })
    }

    // Normalize NFTs
    const normalizedNfts: NormalizedNft[] = openseaData.nfts.map(normalizeNft)

    const duration = Date.now() - startTime
    console.log('[NFTs API] Response prepared:', {
      duration: `${duration}ms`,
      nftCount: normalizedNfts.length,
      hasNext: !!openseaData.next,
      chain,
    })

    const response: NftResponse = {
      nfts: normalizedNfts,
      next: openseaData.next,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[NFTs API] Error:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      address,
      chain,
    })
    return NextResponse.json(
      {
        error: 'An error occurred while fetching NFT data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
