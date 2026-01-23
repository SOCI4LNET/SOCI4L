import { NextRequest, NextResponse } from 'next/server'
import { getWalletData } from '@/lib/avalanche'
import { getProfileByAddress } from '@/lib/db'
import { isValidAddress } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Geçersiz cüzdan adresi' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get profile
    const profile = await getProfileByAddress(normalizedAddress)
    const isClaimed = profile ? (profile.status === 'CLAIMED' || profile.ownerAddress || profile.owner) : false

    // Get wallet data
    const walletData = await getWalletData(normalizedAddress)

    // Check network (Avalanche C-Chain)
    const networkOk = true // Assuming we're always on Avalanche C-Chain

    return NextResponse.json({
      avaxBalance: walletData.nativeBalance,
      txCount: walletData.txCount,
      tokenCount: walletData.tokenBalances?.length || 0,
      nftCount: walletData.nfts?.length || 0,
      claimed: isClaimed,
      visibility: profile?.visibility || 'PUBLIC',
      networkOk,
      profile: profile ? {
        displayName: profile.displayName,
        slug: profile.slug,
        status: profile.status,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching wallet summary:', error)
    return NextResponse.json(
      { error: 'Cüzdan özeti alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
