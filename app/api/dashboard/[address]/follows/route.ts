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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'followers' // 'followers' or 'following'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const filter = searchParams.get('filter') // 'mutuals' | 'new7d' | 'active30d' | 'withIdentity'
    const sort = searchParams.get('sort') || 'recent' // 'recent' | 'relevant' | 'active'

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      )
    }

    if (type !== 'followers' && type !== 'following') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "followers" or "following".' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Note: Follower/following lists are public information
    // No authentication required

    let follows: Array<{ address: string; createdAt: Date; displayName?: string | null }> = []

    // Calculate date thresholds for filters
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    try {
      if (type === 'followers') {
        // Build where clause based on filters
        const whereClause: any = {
          followingAddress: normalizedAddress,
        }

        // Apply date filter if requested
        if (filter === 'new7d') {
          whereClause.createdAt = { gte: sevenDaysAgo }
        }

        // Get wallets following this address
        let followRecords = await prisma.follow.findMany({
          where: whereClause,
          select: {
            followerAddress: true,
            createdAt: true,
          },
          orderBy: sort === 'recent'
            ? { createdAt: 'desc' }
            : { createdAt: 'desc' }, // Default to recent, other sorts applied post-query
          take: limit,
          skip: offset,
        })

        // Apply mutuals filter (requires additional query)
        if (filter === 'mutuals') {
          const mutualAddresses = await prisma.follow.findMany({
            where: {
              followerAddress: normalizedAddress,
              followingAddress: {
                in: followRecords.map(f => f.followerAddress),
              },
            },
            select: {
              followingAddress: true,
            },
          }).then(results => new Set(results.map(r => r.followingAddress)))

          followRecords = followRecords.filter(f =>
            mutualAddresses.has(f.followerAddress)
          )
        }

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
            slug: true,
            updatedAt: true,
          },
        })

        const profileMap = new Map(profiles.map((p) => [p.address.toLowerCase(), p]))

        let followsWithProfile = followRecords.map((f) => {
          const profile = profileMap.get(f.followerAddress.toLowerCase())
          return {
            address: f.followerAddress,
            createdAt: f.createdAt,
            displayName: profile?.displayName || null,
            slug: profile?.slug || null,
            updatedAt: profile?.updatedAt || null,
          }
        })

        // Apply post-query filters
        if (filter === 'active30d') {
          followsWithProfile = followsWithProfile.filter(f =>
            f.updatedAt && f.updatedAt >= thirtyDaysAgo
          )
        }

        if (filter === 'withIdentity') {
          followsWithProfile = followsWithProfile.filter(f =>
            f.displayName || f.slug
          )
        }

        follows = followsWithProfile.map(({ address, createdAt, displayName }) => ({
          address,
          createdAt,
          displayName,
        }))
      } else {
        // Build where clause based on filters
        const whereClause: any = {
          followerAddress: normalizedAddress,
        }

        // Apply date filter if requested
        if (filter === 'new7d') {
          whereClause.createdAt = { gte: sevenDaysAgo }
        }

        // Get wallets this address follows
        let followRecords = await prisma.follow.findMany({
          where: whereClause,
          select: {
            followingAddress: true,
            createdAt: true,
          },
          orderBy: sort === 'recent'
            ? { createdAt: 'desc' }
            : { createdAt: 'desc' },
          take: limit,
          skip: offset,
        })

        // Apply mutuals filter (requires additional query)
        if (filter === 'mutuals') {
          const mutualAddresses = await prisma.follow.findMany({
            where: {
              followingAddress: normalizedAddress,
              followerAddress: {
                in: followRecords.map(f => f.followingAddress),
              },
            },
            select: {
              followerAddress: true,
            },
          }).then(results => new Set(results.map(r => r.followerAddress)))

          followRecords = followRecords.filter(f =>
            mutualAddresses.has(f.followingAddress)
          )
        }

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
            slug: true,
            updatedAt: true,
          },
        })

        const profileMap = new Map(profiles.map((p) => [p.address.toLowerCase(), p]))

        let followsWithProfile = followRecords.map((f) => {
          const profile = profileMap.get(f.followingAddress.toLowerCase())
          return {
            address: f.followingAddress,
            createdAt: f.createdAt,
            displayName: profile?.displayName || null,
            slug: profile?.slug || null,
            updatedAt: profile?.updatedAt || null,
          }
        })

        // Apply post-query filters
        if (filter === 'active30d') {
          followsWithProfile = followsWithProfile.filter(f =>
            f.updatedAt && f.updatedAt >= thirtyDaysAgo
          )
        }

        if (filter === 'withIdentity') {
          followsWithProfile = followsWithProfile.filter(f =>
            f.displayName || f.slug
          )
        }

        follows = followsWithProfile.map(({ address, createdAt, displayName }) => ({
          address,
          createdAt,
          displayName,
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
      { error: 'An error occurred while fetching follow list', details: errorMessage },
      { status: 500 }
    )
  }
}
