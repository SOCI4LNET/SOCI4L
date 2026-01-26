import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

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

    console.log('[Follow Stats API] Success:', { address: normalizedAddress, followersCount, followingCount })
    
    return NextResponse.json({
      followersCount,
      followingCount,
    })
  } catch (error) {
    console.error('[Follow Stats API] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching statistics' },
      { status: 500 }
    )
  }
}
