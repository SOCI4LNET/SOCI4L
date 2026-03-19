import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'


export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> | { address: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const address = typeof resolvedParams.address === 'string'
      ? decodeURIComponent(resolvedParams.address)
      : resolvedParams.address

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get connected wallet address from query param (sent by frontend)
    const searchParams = request.nextUrl.searchParams
    const connectedWalletAddress = searchParams.get('connectedAddress')

    // Get follower address from session
    const followerAddress = await getSessionAddress()

    if (!followerAddress) {
      return NextResponse.json(
        { error: 'Session not found. Please log in.' },
        { status: 401 }
      )
    }

    const normalizedFollower = followerAddress.toLowerCase()

    // Verify that session address matches connected wallet address
    // This prevents using wrong session when user switches wallets
    // If mismatch, return 401 to allow frontend to create new session
    if (connectedWalletAddress && isValidAddress(connectedWalletAddress)) {
      const normalizedConnected = connectedWalletAddress.toLowerCase()
      if (normalizedFollower !== normalizedConnected) {
        return NextResponse.json(
          { error: 'Session address does not match connected wallet. Please reconnect.' },
          { status: 401 } // 401 instead of 403 to allow session recreation
        )
      }
    }

    // Prevent self-follow
    if (normalizedFollower === normalizedAddress) {
      return NextResponse.json(
        { error: 'You cannot follow yourself.' },
        { status: 400 }
      )
    }

    // Check if target user has blocked the follower
    const isBlocked = await prisma.block.findUnique({
      where: {
        blockerAddress_blockedAddress: {
          blockerAddress: normalizedAddress, // The person being followed
          blockedAddress: normalizedFollower, // The person trying to follow
        },
      },
    })

    if (isBlocked) {
      return NextResponse.json(
        { error: 'You cannot follow this user.' },
        { status: 403 }
      )
    }

    // Check if follower has blocked the target (unlikely to happen if they are clicking follow, but for consistency)
    const hasBlockedTarget = await prisma.block.findUnique({
      where: {
        blockerAddress_blockedAddress: {
          blockerAddress: normalizedFollower,
          blockedAddress: normalizedAddress,
        },
      },
    })

    if (hasBlockedTarget) {
      return NextResponse.json(
        { error: 'You must remove your block first to follow this user.' },
        { status: 400 }
      )
    }

    // Check if follow relationship already exists (idempotent operation)
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerAddress_followingAddress: {
          followerAddress: normalizedFollower,
          followingAddress: normalizedAddress,
        },
      },
    })

    // Only create if it doesn't exist
    if (!existingFollow) {
      try {
        console.log('[Follow API] Creating follow record:', {
          follower: normalizedFollower,
          following: normalizedAddress,
        })

        await prisma.follow.create({
          data: {
            followerAddress: normalizedFollower,
            followingAddress: normalizedAddress,
          },
        })

        console.log('[Follow API] Follow record created successfully')

        // Verify the record was actually written
        const verifyRecord = await prisma.follow.findUnique({
          where: {
            followerAddress_followingAddress: {
              followerAddress: normalizedFollower,
              followingAddress: normalizedAddress,
            },
          },
        })
        console.log('[Follow API] Verification check - record exists:', !!verifyRecord)

        // Log follow activity for the follower
        const followerProfile = await prisma.profile.findUnique({ where: { address: normalizedFollower } })
        if (followerProfile) {
          await prisma.userActivityLog.create({
            data: {
              profileId: followerProfile.id,
              action: 'follow',
              metadata: JSON.stringify({ target: normalizedAddress }),
              ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            }
          })
        }
      } catch (error: any) {
        console.error('[Follow API] Error creating follow record:', error)
        // If unique constraint violation, another request created it concurrently
        // That's fine, we'll return the current state
        if (error.code !== 'P2002') {
          throw error
        }
        // Double-check: fetch again to ensure we have the latest state
        const doubleCheck = await prisma.follow.findUnique({
          where: {
            followerAddress_followingAddress: {
              followerAddress: normalizedFollower,
              followingAddress: normalizedAddress,
            },
          },
        })
        if (!doubleCheck) {
          // Still doesn't exist after error, something went wrong
          console.error('[Follow API] Double-check failed - record still not found after error')
          throw error
        }
        console.log('[Follow API] Unique constraint violation, but record exists (concurrent request)')
      }
    } else {
      console.log('[Follow API] Follow record already exists, skipping creation')
    }

    // Get updated followers count (always return current state)
    const followersCount = await prisma.follow.count({
      where: {
        followingAddress: normalizedAddress,
      },
    })

    console.log('[Follow API] Final followers count:', followersCount)

    return NextResponse.json({
      followersCount,
      isFollowing: true,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
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
  { params }: { params: Promise<{ address: string }> | { address: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const address = typeof resolvedParams.address === 'string'
      ? decodeURIComponent(resolvedParams.address)
      : resolvedParams.address

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get connected wallet address from query param (sent by frontend)
    const searchParams = request.nextUrl.searchParams
    const connectedWalletAddress = searchParams.get('connectedAddress')

    // Get follower address from session
    const followerAddress = await getSessionAddress()

    if (!followerAddress) {
      return NextResponse.json(
        { error: 'Session not found. Please log in.' },
        { status: 401 }
      )
    }

    const normalizedFollower = followerAddress.toLowerCase()

    // Verify that session address matches connected wallet address
    // If mismatch, return 401 to allow frontend to create new session
    if (connectedWalletAddress && isValidAddress(connectedWalletAddress)) {
      const normalizedConnected = connectedWalletAddress.toLowerCase()
      if (normalizedFollower !== normalizedConnected) {
        return NextResponse.json(
          { error: 'Session address does not match connected wallet. Please reconnect.' },
          { status: 401 } // 401 instead of 403 to allow session recreation
        )
      }
    }

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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error deleting follow:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting follow' },
      { status: 500 }
    )
  }
}
