import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Geçersiz adres' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Count followers (how many wallets follow this address)
    const followersCount = await prisma.follow.count({
      where: {
        followingAddress: normalizedAddress,
      },
    })

    // Count following (how many wallets this address follows)
    const followingCount = await prisma.follow.count({
      where: {
        followerAddress: normalizedAddress,
      },
    })

    return NextResponse.json({
      followersCount,
      followingCount,
    })
  } catch (error) {
    console.error('Error fetching follow stats:', error)
    return NextResponse.json(
      { error: 'İstatistikler alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
