import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
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

    // Get session address
    const sessionAddress = await getSessionAddress()

    if (!sessionAddress) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı. Lütfen giriş yapın.' },
        { status: 401 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Check if session address follows this address
    const follow = await prisma.follow.findUnique({
      where: {
        followerAddress_followingAddress: {
          followerAddress: sessionAddress,
          followingAddress: normalizedAddress,
        },
      },
    })

    return NextResponse.json({
      isFollowing: !!follow,
    })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json(
      { error: 'Durum kontrol edilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
