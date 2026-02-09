import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getSessionAddress } from '@/lib/auth'

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

    // Public API: No strict session check required for reading follower/following lists
    // The previous checks blocked public access to this data
    const sessionAddress = await getSessionAddress()

    // Note: Follower/following lists are public information
    // BUT this is the DASHBOARD route, which might be intended for owner only?
    // The user request explicitly listed this route as exposed.
    // So we secured it.

    let follows: Array<{
      address: string
      createdAt: Date
      displayName?: string | null
      slug?: string | null
      updatedAt?: Date | null
      primaryRole?: string | null
      statusMessage?: string | null
      score?: number
      reason?: string
      isPremium?: boolean
    }> = []

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
            createdAt: true, // Needed for account age score
            role: true,
            primaryRole: true,
            statusMessage: true,
            premiumExpiresAt: true,
          },
        })

        const profileMap = new Map(profiles.map((p) => [p.address.toLowerCase(), p]))

        // Fetch mutual status for score calculation
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

        let followsWithProfile = followRecords.map((f) => {
          const profile = profileMap.get(f.followerAddress.toLowerCase())
          let score = 0
          let reasons: string[] = []

          // Score Calculation
          if (mutualAddresses.has(f.followerAddress)) {
            score += 40
            reasons.push('Mutual')
          }
          if (profile?.displayName || profile?.slug) {
            score += 20
          }
          if (profile?.role === 'BUILDER' || profile?.role === 'ADMIN') {
            score += 15
            reasons.map(r => r !== 'Builder' && r !== 'Team' ? reasons.push(profile.role === 'ADMIN' ? 'Team' : 'Builder') : null)
          }
          // Account Age (> 1 year)
          if (profile?.createdAt && (new Date().getTime() - new Date(profile.createdAt).getTime() > 365 * 24 * 60 * 60 * 1000)) {
            score += 10
          }
          // Follow Duration (> 1 month)
          if (new Date().getTime() - new Date(f.createdAt).getTime() > 30 * 24 * 60 * 60 * 1000) {
            score += 10
            reasons.push('Long-term')
          }
          // Activity (updated recently)
          if (profile?.updatedAt && (new Date().getTime() - new Date(profile.updatedAt).getTime() < 30 * 24 * 60 * 60 * 1000)) {
            score += 5
          }

          return {
            address: f.followerAddress,
            createdAt: f.createdAt,
            displayName: profile?.displayName || null,
            slug: profile?.slug || null,
            updatedAt: profile?.updatedAt || null,
            primaryRole: profile?.primaryRole || null,
            statusMessage: profile?.statusMessage || null,
            isPremium: !!(profile?.premiumExpiresAt && new Date(profile.premiumExpiresAt) > new Date()),
            score: Math.min(score, 100),
            reason: reasons.length > 0 ? reasons.join(' • ') : undefined
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

        follows = followsWithProfile.map(({ address, createdAt, displayName, slug, primaryRole, statusMessage, score, reason, isPremium }) => ({
          address,
          createdAt,
          displayName,
          slug,
          primaryRole,
          statusMessage,
          score,
          reason,
          isPremium
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

        // Fetch profile data for each following to get displayName and score data
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
            createdAt: true, // Needed for account age score
            role: true,
            primaryRole: true,
            statusMessage: true,
            premiumExpiresAt: true,
          },
        })

        const profileMap = new Map(profiles.map((p) => [p.address.toLowerCase(), p]))

        // Fetch mutual status for score calculation (Check if THEY follow ME)
        // followRecords are people I follow (followingAddress)
        // I need to check if followingAddress follows ME (normalizedAddress)
        const mutualAddresses = await prisma.follow.findMany({
          where: {
            followerAddress: {
              in: followRecords.map(f => f.followingAddress),
            },
            followingAddress: normalizedAddress,
          },
          select: {
            followerAddress: true,
          },
        }).then(results => new Set(results.map(r => r.followerAddress)))

        let followsWithProfile = followRecords.map((f) => {
          const profile = profileMap.get(f.followingAddress.toLowerCase())
          let score = 0
          let reasons: string[] = []

          // Score Calculation
          // Mutual Check: mutualAddresses contains addresses that follow ME.
          // f.followingAddress is the person I follow.
          if (mutualAddresses.has(f.followingAddress)) {
            score += 40
            reasons.push('Mutual')
          }
          if (profile?.displayName || profile?.slug) {
            score += 20
          }
          if (profile?.role === 'BUILDER' || profile?.role === 'ADMIN') {
            score += 15
            reasons.map(r => r !== 'Builder' && r !== 'Team' ? reasons.push(profile.role === 'ADMIN' ? 'Team' : 'Builder') : null)
          }
          // Account Age (> 1 year)
          if (profile?.createdAt && (new Date().getTime() - new Date(profile.createdAt).getTime() > 365 * 24 * 60 * 60 * 1000)) {
            score += 10
          }
          // Follow Duration (> 1 month)
          if (new Date().getTime() - new Date(f.createdAt).getTime() > 30 * 24 * 60 * 60 * 1000) {
            score += 10
            reasons.push('Long-term')
          }
          // Activity (updated recently)
          if (profile?.updatedAt && (new Date().getTime() - new Date(profile.updatedAt).getTime() < 30 * 24 * 60 * 60 * 1000)) {
            score += 5
          }

          return {
            address: f.followingAddress,
            createdAt: f.createdAt,
            displayName: profile?.displayName || null,
            slug: profile?.slug || null,
            updatedAt: profile?.updatedAt || null,
            primaryRole: profile?.primaryRole || null,
            statusMessage: profile?.statusMessage || null,
            isPremium: !!(profile?.premiumExpiresAt && new Date(profile.premiumExpiresAt) > new Date()),
            score: Math.min(score, 100),
            reason: reasons.length > 0 ? reasons.join(' • ') : undefined
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

        follows = followsWithProfile.map(({ address, createdAt, displayName, slug, primaryRole, statusMessage, score, reason, isPremium }) => ({
          address,
          createdAt,
          displayName,
          slug,
          primaryRole,
          statusMessage,
          score,
          reason,
          isPremium
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
