import { NextRequest, NextResponse } from 'next/server'
import { getWalletData } from '@/lib/avalanche'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
  }

  try {
    const normalizedAddress = address.toLowerCase()
    
    // Get profile status
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
      include: { showcase: true },
    })

    let profileStatus: 'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE' = 'UNCLAIMED'
    if (profile?.owner) {
      profileStatus = profile.isPublic ? 'CLAIMED+PUBLIC' : 'CLAIMED+PRIVATE'
    }

    // Get wallet data
    const walletData = await getWalletData(address)

    return NextResponse.json({
      walletData,
      profileStatus,
      profile: profile ? {
        slug: profile.slug,
        isPublic: profile.isPublic,
        claimedAt: profile.claimedAt,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching wallet data:', error)
    return NextResponse.json(
      { error: 'Cüzdan verileri alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
