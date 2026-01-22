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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'followers' // 'followers' or 'following'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Geçersiz adres' },
        { status: 400 }
      )
    }

    if (type !== 'followers' && type !== 'following') {
      return NextResponse.json(
        { error: 'Geçersiz tip. "followers" veya "following" olmalı.' },
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

    // Verify ownership: session address must equal [address] (case-insensitive)
    if (sessionAddress !== normalizedAddress) {
      return NextResponse.json(
        { error: 'Bu sayfaya erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    let follows: Array<{ address: string; createdAt: Date }> = []

    if (type === 'followers') {
      // Get wallets following this address
      const followRecords = await prisma.follow.findMany({
        where: {
          followingAddress: normalizedAddress,
        },
        select: {
          followerAddress: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      })

      follows = followRecords.map((f) => ({
        address: f.followerAddress,
        createdAt: f.createdAt,
      }))
    } else {
      // Get wallets this address follows
      const followRecords = await prisma.follow.findMany({
        where: {
          followerAddress: normalizedAddress,
        },
        select: {
          followingAddress: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      })

      follows = followRecords.map((f) => ({
        address: f.followingAddress,
        createdAt: f.createdAt,
      }))
    }

    return NextResponse.json(follows)
  } catch (error) {
    console.error('Error fetching follows:', error)
    return NextResponse.json(
      { error: 'Takip listesi alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
