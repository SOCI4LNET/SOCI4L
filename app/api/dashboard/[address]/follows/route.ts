import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> | { address: string } }
) {
  try {
    // Handle both sync and async params (Next.js 14+)
    const resolvedParams = await Promise.resolve(params)
    const address = resolvedParams.address
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
    let sessionAddress: string | null = null
    try {
      sessionAddress = await getSessionAddress()
    } catch (error) {
      console.error('Error getting session address:', error)
      return NextResponse.json(
        { error: 'Oturum kontrolü sırasında bir hata oluştu', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

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

    let follows: Array<{ address: string; createdAt: Date; displayName?: string | null }> = []

    try {
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

      // Fetch profile data for each follower to get displayName
      const profiles = await prisma.profile.findMany({
        where: {
          address: {
            in: followRecords.map((f) => f.followerAddress),
          },
        },
        select: {
          address: true,
          displayName: true,
        },
      })

      const profileMap = new Map(profiles.map((p) => [p.address.toLowerCase(), p.displayName]))

      follows = followRecords.map((f) => ({
        address: f.followerAddress,
        createdAt: f.createdAt,
        displayName: profileMap.get(f.followerAddress.toLowerCase()) || null,
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

        // Fetch profile data for each following to get displayName
        const profiles = await prisma.profile.findMany({
          where: {
            address: {
              in: followRecords.map((f) => f.followingAddress),
            },
          },
          select: {
            address: true,
            displayName: true,
          },
        })

        const profileMap = new Map(profiles.map((p) => [p.address.toLowerCase(), p.displayName]))

        follows = followRecords.map((f) => ({
          address: f.followingAddress,
          createdAt: f.createdAt,
          displayName: profileMap.get(f.followingAddress.toLowerCase()) || null,
        }))
      }
    } catch (dbError) {
      console.error('Database error fetching follows:', dbError)
      throw dbError
    }

    return NextResponse.json(follows)
  } catch (error) {
    console.error('Error fetching follows:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { error: 'Takip listesi alınırken bir hata oluştu', details: errorMessage },
      { status: 500 }
    )
  }
}
