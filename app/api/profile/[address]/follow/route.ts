import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

// Test mode: allow body-based follower address
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get follower address: from body (test mode) or session (production)
    let followerAddress: string | null = null

    if (TEST_MODE) {
      try {
        const body = await request.json()
        followerAddress = body.followerAddress || body.address
        const action = body.action

        // If action is "unfollow", use DELETE instead
        if (action === 'unfollow') {
          // Handle unfollow via DELETE method logic
          if (!followerAddress || !isValidAddress(followerAddress)) {
            return NextResponse.json(
              { error: 'Invalid follower address' },
              { status: 400 }
            )
          }

          const normalizedFollower = followerAddress.toLowerCase()

          // Prevent self-unfollow check (optional)
          if (normalizedFollower === normalizedAddress) {
            return NextResponse.json(
              { error: 'Cannot unfollow yourself' },
              { status: 400 }
            )
          }

          // Delete follow relationship
          await prisma.follow.deleteMany({
            where: {
              followerAddress: normalizedFollower,
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
        }

        // Action is "follow" or missing (default to follow)
        if (!followerAddress || !isValidAddress(followerAddress)) {
          return NextResponse.json(
            { error: 'Invalid follower address' },
            { status: 400 }
          )
        }
      } catch (bodyError) {
        // Body parsing failed, try session
        followerAddress = await getSessionAddress()
      }
    }

    // Fallback to session if not in test mode or body parsing failed
    if (!followerAddress) {
      followerAddress = await getSessionAddress()
    }

    if (!followerAddress) {
      return NextResponse.json(
        { error: 'Session not found. Please log in.' },
        { status: 401 }
      )
    }

    const normalizedFollower = followerAddress.toLowerCase()

    // Prevent self-follow
    if (normalizedFollower === normalizedAddress) {
      return NextResponse.json(
        { error: 'Kendinizi takip edemezsiniz' },
        { status: 400 }
      )
    }

    // Create follow relationship (idempotent - ignore if exists)
    try {
      await prisma.follow.create({
        data: {
          followerAddress: normalizedFollower,
          followingAddress: normalizedAddress,
        },
      })
    } catch (error: any) {
      // If unique constraint violation, follow already exists - that's fine
      if (error.code !== 'P2002') {
        throw error
      }
    }

    // Get updated followers count (instant consistency)
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
      { error: 'An error occurred while creating follow' },
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
        { error: 'Invalid address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get follower address: from body (test mode) or session (production)
    let followerAddress: string | null = null

    if (TEST_MODE) {
      try {
        const body = await request.json().catch(() => ({}))
        followerAddress = body.followerAddress || body.address
      } catch (bodyError) {
        // Body parsing failed, try session
        followerAddress = await getSessionAddress()
      }
    }

    // Fallback to session if not in test mode or body parsing failed
    if (!followerAddress) {
      followerAddress = await getSessionAddress()
    }

    if (!followerAddress) {
      return NextResponse.json(
        { error: 'Session not found. Please log in.' },
        { status: 401 }
      )
    }

    const normalizedFollower = followerAddress.toLowerCase()

    // Delete follow relationship
    await prisma.follow.deleteMany({
      where: {
        followerAddress: normalizedFollower,
        followingAddress: normalizedAddress,
      },
    })

    // Get updated followers count (instant consistency)
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
      { error: 'An error occurred while deleting follow' },
      { status: 500 }
    )
  }
}
