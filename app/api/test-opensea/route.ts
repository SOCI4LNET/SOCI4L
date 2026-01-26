import { NextRequest, NextResponse } from 'next/server'
import { fetchAccountNfts } from '@/lib/opensea'

/**
 * Test endpoint to check OpenSea API directly
 * Usage: /api/test-opensea?address=0x8ab00455c7a6a6176d9d23f46dc5af8a5d4f1dc7
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address') || '0x8ab00455c7a6a6176d9d23f46dc5af8a5d4f1dc7'
  const chain = searchParams.get('chain') || 'avalanche'
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  try {
    console.log('[Test OpenSea] Testing OpenSea API:', {
      address,
      chain,
      limit,
      hasApiKey: !!process.env.OPENSEA_API_KEY,
    })

    const result = await fetchAccountNfts(chain, address, limit)

    return NextResponse.json({
      success: true,
      address,
      chain,
      nftCount: result.nfts.length,
      hasNext: !!result.next,
      nfts: result.nfts.slice(0, 3), // Return first 3 for testing
      fullResponse: result,
    })
  } catch (error: any) {
    console.error('[Test OpenSea] Error:', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        address,
        chain,
        hasApiKey: !!process.env.OPENSEA_API_KEY,
      },
      { status: 500 }
    )
  }
}
