import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

export async function POST(
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

    // Prevent self-follow
    if (sessionAddress === normalizedAddress) {
      return NextResponse.json(
        { error: 'Kendinizi takip edemezsiniz' },
        { status: 400 }
      )
    }

    // Create follow relationship (idempotent - ignore if exists)
    try {
      await prisma.follow.create({
        data: {
          followerAddress: sessionAddress,
          followingAddress: normalizedAddress,
        },
      })
    } catch (error: any) {
      // If unique constraint violation, follow already exists - that's fine
      if (error.code !== 'P2002') {
        throw error
      }
    }

    // Get updated followers count
    const followersCount = await prisma.follow.count({
      where: {
        followingAddress: normalizedAddress,
      },
    })

    return NextResponse.json({
      followersCount,
      isFollowing: true,
    })
  } catch (error) {
    console.error('Error creating follow:', error)
    return NextResponse.json(
      { error: 'Takip oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete follow relationship
    await prisma.follow.deleteMany({
      where: {
        followerAddress: sessionAddress,
        followingAddress: normalizedAddress,
      },
    })

    // Get updated followers count
    const followersCount = await prisma.follow.count({
      where: {
        followingAddress: normalizedAddress,
      },
    })

    return NextResponse.json({
      followersCount,
      isFollowing: false,
    })
  } catch (error) {
    console.error('Error deleting follow:', error)
    return NextResponse.json(
      { error: 'Takip silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
