/**
 * SOCI4L Score System
 * 
 * A reputation/activity score for profiles.
 * Scores are designed to be valuable - even 10 points matters.
 * 
 * @see /docs/SCORE_SYSTEM.md for full documentation
 */

export interface ScoreBreakdown {
  // Profile completion
  profileClaimed: number      // +5 for claimed profile
  displayName: number         // +2 for having a display name
  bio: number                 // +3 for having a bio
  socialLinks: number         // +1 per social link (max 5)
  profileLinks: number        // +1 per profile link (max 10)

  // Social & Activity
  verifiedSocials: number     // +3 per verified social (max 9)
  donationsSent: number       // +1 per donation sent (max 10)
  followers: number           // Tiered system (see calculateFollowerScore)

  // Total
  total: number
}

export interface ScoreInput {
  isClaimed?: boolean
  displayName?: string | null
  bio?: string | null
  socialLinksCount?: number
  profileLinksCount?: number
  verifiedSocialsCount?: number
  donationsSentCount?: number
  followersCount?: number
}

// Score constants - easy to adjust
const SCORE_CONFIG = {
  // Profile completion
  PROFILE_CLAIMED: 5,
  DISPLAY_NAME: 2,
  BIO: 3,
  SOCIAL_LINK_EACH: 1,
  SOCIAL_LINK_MAX: 5,
  PROFILE_LINK_EACH: 1,
  PROFILE_LINK_MAX: 10,

  // Activities
  VERIFIED_SOCIAL_EACH: 3,
  VERIFIED_SOCIAL_MAX: 3,
  DONATION_SENT_EACH: 1,
  DONATION_SENT_MAX: 10,

  // Follower tiers (diminishing returns)
  FOLLOWER_TIERS: [
    { upTo: 10, pointsPerFollower: 1 },      // 1-10: 1 point each = max 10
    { upTo: 50, pointsPerFollower: 0.5 },    // 11-50: 0.5 point each = max 20
    { upTo: 200, pointsPerFollower: 0.25 },  // 51-200: 0.25 point each = max 37.5
    { upTo: Infinity, pointsPerFollower: 0.1 }, // 200+: 0.1 point each
  ],
}

/**
 * Calculate follower score using tiered system
 * Early followers are worth more than later ones
 */
function calculateFollowerScore(followersCount: number): number {
  if (followersCount <= 0) return 0

  let score = 0
  let remaining = followersCount
  let previousTierEnd = 0

  for (const tier of SCORE_CONFIG.FOLLOWER_TIERS) {
    const tierSize = tier.upTo - previousTierEnd
    const followersInTier = Math.min(remaining, tierSize)

    score += followersInTier * tier.pointsPerFollower
    remaining -= followersInTier
    previousTierEnd = tier.upTo

    if (remaining <= 0) break
  }

  return Math.round(score * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate complete score breakdown for a profile
 */
export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const {
    isClaimed = false,
    displayName = null,
    bio = null,
    socialLinksCount = 0,
    profileLinksCount = 0,
    verifiedSocialsCount = 0,
    donationsSentCount = 0,
    followersCount = 0,
  } = input

  // Profile completion scores
  const profileClaimed = isClaimed ? SCORE_CONFIG.PROFILE_CLAIMED : 0
  const displayNameScore = displayName && displayName.trim().length > 0 ? SCORE_CONFIG.DISPLAY_NAME : 0
  const bioScore = bio && bio.trim().length > 0 ? SCORE_CONFIG.BIO : 0

  // Links (with caps)
  const socialLinks = Math.min(socialLinksCount, SCORE_CONFIG.SOCIAL_LINK_MAX) * SCORE_CONFIG.SOCIAL_LINK_EACH
  const profileLinks = Math.min(profileLinksCount, SCORE_CONFIG.PROFILE_LINK_MAX) * SCORE_CONFIG.PROFILE_LINK_EACH

  // Activities (with caps)
  const verifiedSocials = Math.min(verifiedSocialsCount, SCORE_CONFIG.VERIFIED_SOCIAL_MAX) * SCORE_CONFIG.VERIFIED_SOCIAL_EACH
  const donationsSent = Math.min(donationsSentCount, SCORE_CONFIG.DONATION_SENT_MAX) * SCORE_CONFIG.DONATION_SENT_EACH

  // Followers (tiered)
  const followers = calculateFollowerScore(followersCount)

  // Total
  const total = Math.round(
    (profileClaimed + displayNameScore + bioScore + socialLinks + profileLinks + verifiedSocials + donationsSent + followers) * 10
  ) / 10

  return {
    profileClaimed,
    displayName: displayNameScore,
    bio: bioScore,
    socialLinks,
    profileLinks,
    verifiedSocials,
    donationsSent,
    followers,
    total,
  }
}

/**
 * Get just the total score (convenience function)
 */
export function getTotalScore(input: ScoreInput): number {
  return calculateScore(input).total
}

/**
 * Get a human-readable score tier/badge
 */
export function getScoreTier(totalScore: number): {
  tier: string
  label: string
  minScore: number
} {
  if (totalScore >= 100) {
    return { tier: 'legendary', label: 'Legendary', minScore: 100 }
  } else if (totalScore >= 50) {
    return { tier: 'elite', label: 'Elite', minScore: 50 }
  } else if (totalScore >= 25) {
    return { tier: 'established', label: 'Established', minScore: 25 }
  } else if (totalScore >= 10) {
    return { tier: 'rising', label: 'Rising', minScore: 10 }
  } else if (totalScore >= 5) {
    return { tier: 'newcomer', label: 'Newcomer', minScore: 5 }
  } else {
    return { tier: 'starter', label: 'Starter', minScore: 0 }
  }
}

// Export config for documentation/debugging
export { SCORE_CONFIG }
