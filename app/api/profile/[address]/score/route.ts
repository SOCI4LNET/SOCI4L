import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { calculateScore, getScoreTier, type ScoreBreakdown } from '@/lib/score'
import { getProfileByAddress, getFollowersCount, getProfileLinks, getSocialLinks } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address

  if (!address || !isValidAddress(address)) {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 }
    )
  }

  const normalizedAddress = address.toLowerCase()

  try {
    // Fetch all data needed for score calculation
    const [profile, followersCount, profileLinks, socialLinks] = await Promise.all([
      getProfileByAddress(normalizedAddress),
      getFollowersCount(normalizedAddress),
      getProfileLinks(normalizedAddress),
      getSocialLinks(normalizedAddress),
    ])

    // Calculate score
    const isClaimed = Boolean(
      profile && 
      (profile.claimedAt || profile.displayName || profile.slug || profile.status === 'CLAIMED')
    )

    const scoreInput = {
      isClaimed,
      displayName: profile?.displayName || null,
      bio: profile?.bio || null,
      socialLinksCount: socialLinks?.length || 0,
      profileLinksCount: profileLinks?.length || 0,
      followersCount,
    }

    const breakdown: ScoreBreakdown = calculateScore(scoreInput)
    const tier = getScoreTier(breakdown.total)

    return NextResponse.json({
      address: normalizedAddress,
      score: breakdown.total,
      tier: tier.tier,
      tierLabel: tier.label,
      breakdown,
    }, {
      headers: {
        // Cache for 60 seconds
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error: any) {
    console.error('[Score API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    )
  }
}
