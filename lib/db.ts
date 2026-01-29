import { prisma } from './prisma'

export type ProfileStatus = 'UNCLAIMED' | 'CLAIMED'
export type ProfileVisibility = 'PUBLIC' | 'PRIVATE'

export interface ProfileData {
  id: string
  address: string
  slug: string | null
  owner: string | null
  ownerAddress: string | null
  status: ProfileStatus
  visibility: ProfileVisibility
  isBanned: boolean
  claimedAt: Date | null
  createdAt: Date
  updatedAt: Date
  displayName?: string | null
  bio?: string | null
  primaryRole?: string | null
  secondaryRoles?: string[]
  statusMessage?: string | null
  socialLinks?: string | null
}

/**
 * Get profile by address
 * Returns null if profile doesn't exist
 */
export async function getProfileByAddress(address: string): Promise<ProfileData | null> {
  const normalizedAddress = address.toLowerCase()

  const profile = await prisma.profile.findUnique({
    where: { address: normalizedAddress },
  })

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    address: profile.address,
    slug: profile.slug,
    owner: profile.owner,
    ownerAddress: profile.ownerAddress,
    status: (profile.status as ProfileStatus) || (profile.ownerAddress || profile.owner ? 'CLAIMED' : 'UNCLAIMED'),
    visibility: (profile.visibility as ProfileVisibility) || (profile.isPublic ? 'PUBLIC' : 'PRIVATE'),
    isBanned: profile.isBanned || false,
    claimedAt: profile.claimedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    displayName: profile.displayName,
    bio: profile.bio,
    primaryRole: profile.primaryRole,
    secondaryRoles: profile.secondaryRoles,
    statusMessage: profile.statusMessage,
    socialLinks: profile.socialLinks,
  }
}

/**
 * Get followers count for an address
 */
export async function getFollowersCount(address: string): Promise<number> {
  const normalizedAddress = address.toLowerCase()

  const count = await prisma.follow.count({
    where: { followingAddress: normalizedAddress },
  })

  return count
}

/**
 * Get profile links for an address
 */
export async function getProfileLinks(address: string): Promise<Array<{ id: string; title: string; url: string }>> {
  const normalizedAddress = address.toLowerCase()

  const profile = await prisma.profile.findUnique({
    where: { address: normalizedAddress },
    include: {
      links: {
        where: { enabled: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!profile) return []

  return profile.links.map(link => ({
    id: link.id,
    title: link.title,
    url: link.url,
  }))
}

/**
 * Get social links for an address
 * Social links are stored as JSON in profile.socialLinks
 */
export async function getSocialLinks(address: string): Promise<Array<{ platform: string; url: string }>> {
  const normalizedAddress = address.toLowerCase()

  const profile = await prisma.profile.findUnique({
    where: { address: normalizedAddress },
    select: { socialLinks: true },
  })

  if (!profile?.socialLinks) return []

  try {
    const parsed = JSON.parse(profile.socialLinks)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

/**
 * Get profile by slug
 * Returns null if profile doesn't exist
 */
export async function getProfileBySlug(slug: string): Promise<ProfileData | null> {
  const normalizedSlug = slug.toLowerCase().trim()

  const profile = await prisma.profile.findUnique({
    where: { slug: normalizedSlug },
  })

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    address: profile.address,
    slug: profile.slug,
    owner: profile.owner,
    ownerAddress: profile.ownerAddress,
    status: (profile.status as ProfileStatus) || (profile.ownerAddress || profile.owner ? 'CLAIMED' : 'UNCLAIMED'),
    visibility: (profile.visibility as ProfileVisibility) || (profile.isPublic ? 'PUBLIC' : 'PRIVATE'),
    isBanned: profile.isBanned || false,
    claimedAt: profile.claimedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    displayName: profile.displayName,
    bio: profile.bio,
    primaryRole: profile.primaryRole,
    secondaryRoles: profile.secondaryRoles,
    statusMessage: profile.statusMessage,
    socialLinks: profile.socialLinks,
  }
}
