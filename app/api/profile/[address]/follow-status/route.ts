import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

// Test mode: allow query param-based follower address
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export async function GET(
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

    // Get follower address: from query param (test mode) or session (production)
    let followerAddress: string | null = null

    if (TEST_MODE) {
      const searchParams = request.nextUrl.searchParams
      followerAddress = searchParams.get('followerAddress')
      
      if (!followerAddress || !isValidAddress(followerAddress)) {
        // Fallback to session if query param invalid
        followerAddress = await getSessionAddress()
      }
    }

    // Fallback to session if not in test mode or query param not provided
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

    // Check if follower address follows this address
    const follow = await prisma.follow.findUnique({
      where: {
        followerAddress_followingAddress: {
          followerAddress: normalizedFollower,
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
      { error: 'An error occurred while checking status' },
      { status: 500 }
    )
  }
}
