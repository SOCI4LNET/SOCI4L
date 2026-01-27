import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getSessionAddress } from '@/lib/auth'

// Test mode: allow query param-based follower address for isFollowing
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> | { address: string } }
) {
  try {
    // Handle both sync and async params (Next.js 14+)
    const resolvedParams = await Promise.resolve(params)
    const address = resolvedParams.address

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
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
      // Production: use session if available
      const sessionAddress = await getSessionAddress()
      if (sessionAddress) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerAddress_followingAddress: {
              followerAddress: sessionAddress,
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
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Follow Stats API] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching statistics' },
      { status: 500 }
    )
  }
}
