import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'
import { isValidAddress } from '@/lib/utils'

// Test mode: allow query param-based follower address
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export const dynamic = 'force-dynamic'

export async function GET(
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

    // Get session address (the authenticated wallet)
    const sessionAddress = await getSessionAddress()

    if (!sessionAddress) {
      // If no session, user cannot be following anyone
      return NextResponse.json({
        isFollowing: false,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      })
    }

    // Get connected wallet address from query param (sent by frontend)
    // This is used to verify that the session matches the connected wallet
    const searchParams = request.nextUrl.searchParams
    const connectedWalletAddress = searchParams.get('connectedAddress')

    // If connected wallet address is provided, verify it matches session
    // This prevents showing wrong follow status when user switches wallets
    if (connectedWalletAddress && isValidAddress(connectedWalletAddress)) {
      const normalizedConnected = connectedWalletAddress.toLowerCase()
      const normalizedSession = sessionAddress.toLowerCase()

      // If connected wallet doesn't match session, return 401 to trigger re-auth
      // This allows the frontend to detect the stale session and prompt for a new signature
      if (normalizedConnected !== normalizedSession) {
        return NextResponse.json(
          { error: 'Session address does not match connected wallet' },
          { status: 401 }
        )
      }
    }

    // Check for blocks
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

    // Use session address as follower address
    const normalizedFollower = sessionAddress.toLowerCase()

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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json(
      { error: 'An error occurred while checking status' },
      { status: 500 }
    )
  }
}
