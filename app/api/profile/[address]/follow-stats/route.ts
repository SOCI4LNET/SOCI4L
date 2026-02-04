import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getSessionAddress } from '@/lib/auth'

// Test mode: allow query param-based follower address for isFollowing
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> | { address: string } }
) {
  try {
    // Handle both sync and async params (Next.js 14+)
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

    // Public API: Optional session for personalized data (isFollowing, blocks)
    const sessionAddress = await getSessionAddress()

    const normalizedAddress = address.toLowerCase()

    // Check for blocks
    // sessionAddress is already verified at the top
    if (sessionAddress) {
      const normalizedSession = sessionAddress.toLowerCase()
      if (normalizedSession !== normalizedAddress) {
        // Only block if viewer is blocked by target
        const block = await prisma.block.findFirst({
          where: {
            blockerAddress: normalizedAddress,
            blockedAddress: normalizedSession,
          },
        })

        if (block) {
          return NextResponse.json({ error: 'Profile is not available' }, { status: 403 })
        }
      }
    }

    // Count followers (how many wallets follow this address)
    const followersCount = await prisma.follow.count({
      where: {
        followingAddress: normalizedAddress,
      },
    })

    console.log('[Follow Stats API] Followers count for', normalizedAddress, ':', followersCount)

    // Count following (how many wallets this address follows)
    const followingCount = await prisma.follow.count({
      where: {
        followerAddress: normalizedAddress,
      },
    })

    // Optional: include isFollowing if follower address is provided (test mode or query param)
    let isFollowing: boolean | undefined = undefined

    if (TEST_MODE) {
      const searchParams = request.nextUrl.searchParams
      const followerAddress = searchParams.get('followerAddress')

      if (followerAddress && isValidAddress(followerAddress)) {
        const normalizedFollower = followerAddress.toLowerCase()
        const follow = await prisma.follow.findUnique({
          where: {
            followerAddress_followingAddress: {
              followerAddress: normalizedFollower,
              followingAddress: normalizedAddress,
            },
          },
        })
        isFollowing = !!follow
      }
    } else {
      // Production: use session if available (normalize for DB lookup)
      // sessionAddress is already available
      if (sessionAddress) {
        const normalizedSession = sessionAddress.toLowerCase()
        const follow = await prisma.follow.findUnique({
          where: {
            followerAddress_followingAddress: {
              followerAddress: normalizedSession,
              followingAddress: normalizedAddress,
            },
          },
        })
        isFollowing = !!follow
      }
    }

    console.log('[Follow Stats API] Success:', { address: normalizedAddress, followersCount, followingCount, isFollowing })

    const response: {
      followersCount: number
      followingCount: number
      isFollowing?: boolean
    } = {
      followersCount: followersCount,
      followingCount: followingCount,
    }

    if (isFollowing !== undefined) {
      response.isFollowing = isFollowing
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[Follow Stats API] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching statistics' },
      { status: 500 }
    )
  }
}
