/**
 * Score Snapshot System
 * 
 * Creates daily snapshots of profile scores for historical tracking.
 * Used for score trend analysis and reputation history.
 */

import { prisma } from '@/lib/prisma'
import { calculateScore, getScoreTier, type ScoreInput } from '@/lib/score'
import { getFollowersCount} from '@/lib/db'

/**
 * Create a score snapshot for a single profile
 */
export async function createScoreSnapshot(profileAddress: string): Promise<void> {
  const normalizedAddress = profileAddress.toLowerCase()

  // Fetch profile data
  const profile = await prisma.profile.findUnique({
    where: { address: normalizedAddress },
    include: {
      links: {
        where: { enabled: true },
      },
    },
  })

  if (!profile) {
    console.warn(`[score-snapshot] Profile not found: ${normalizedAddress}`)
    return
  }

  // Calculate score input
  const followersCount = await getFollowersCount(normalizedAddress)
  const profileLinksCount = profile.links.length
  let socialLinksCount = 0
  if (profile.socialLinks) {
    try {
      const parsed = JSON.parse(profile.socialLinks)
      if (Array.isArray(parsed)) {
        socialLinksCount = parsed.length
      }
    } catch {
      // ignore parse errors
    }
  }

  const scoreInput: ScoreInput = {
    isClaimed: Boolean(
      profile.claimedAt ||
      profile.displayName ||
      profile.slug ||
      profile.status === 'CLAIMED',
    ),
    displayName: profile.displayName || null,
    bio: profile.bio || null,
    socialLinksCount,
    profileLinksCount,
    followersCount,
  }

  const breakdown = calculateScore(scoreInput)
  const tier = getScoreTier(breakdown.total)

  // Create snapshot
  await prisma.scoreSnapshot.create({
    data: {
      profileId: normalizedAddress,
      score: breakdown.total,
      tier: tier.tier,
      profileClaimed: breakdown.profileClaimed,
      displayName: breakdown.displayName,
      bio: breakdown.bio,
      socialLinks: breakdown.socialLinks,
      profileLinks: breakdown.profileLinks,
      followers: breakdown.followers,
    },
  })
}

/**
 * Create score snapshots for all claimed profiles
 * This should be run daily via cron job
 */
export async function createAllScoreSnapshots(): Promise<{
  success: number
  failed: number
}> {
  const claimedProfiles = await prisma.profile.findMany({
    where: {
      OR: [
        { status: 'CLAIMED' },
        { claimedAt: { not: null } },
        { ownerAddress: { not: null } },
      ],
    },
    select: {
      address: true,
    },
  })

  let success = 0
  let failed = 0

  for (const profile of claimedProfiles) {
    try {
      await createScoreSnapshot(profile.address)
      success++
    } catch (error) {
      console.error(
        `[score-snapshot] Failed to create snapshot for ${profile.address}`,
        error,
      )
      failed++
    }
  }

  console.log(
    `[score-snapshot] Completed: ${success} succeeded, ${failed} failed`,
  )

  return { success, failed }
}

/**
 * Get score history for a profile (last N days)
 */
export async function getScoreHistory(
  profileAddress: string,
  days: number = 30,
): Promise<
  Array<{
    date: string
    score: number
    tier: string
    breakdown: {
      profileClaimed: number
      displayName: number
      bio: number
      socialLinks: number
      profileLinks: number
      followers: number
    }
  }>
> {
  const normalizedAddress = profileAddress.toLowerCase()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const snapshots = await prisma.scoreSnapshot.findMany({
    where: {
      profileId: normalizedAddress,
      createdAt: { gte: cutoffDate },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return snapshots.map((snapshot) => ({
    date: snapshot.createdAt.toISOString().split('T')[0],
    score: snapshot.score,
    tier: snapshot.tier,
    breakdown: {
      profileClaimed: snapshot.profileClaimed,
      displayName: snapshot.displayName,
      bio: snapshot.bio,
      socialLinks: snapshot.socialLinks,
      profileLinks: snapshot.profileLinks,
      followers: snapshot.followers,
    },
  }))
}
