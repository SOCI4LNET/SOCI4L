/**
 * Single source of truth for profile claim status
 * 
 * A profile is considered "claimed" if ANY of the following is true:
 * - profile.status === 'CLAIMED'
 * - profile.claimedAt exists (not null)
 * - profile.slug exists (not null)
 * - profile.displayName exists (not null)
 * 
 * This ensures consistent claim status across all dashboard panels.
 */

export interface ProfileForClaimCheck {
  status?: string | null
  claimedAt?: string | Date | null
  slug?: string | null
  displayName?: string | null
}

export function isProfileClaimed(profile?: ProfileForClaimCheck | null): boolean {
  if (!profile) return false

  return Boolean(
    profile.status === 'CLAIMED' ||
    profile.claimedAt ||
    profile.slug ||
    profile.displayName
  )
}
