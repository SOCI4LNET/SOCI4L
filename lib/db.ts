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
  claimedAt: Date | null
  createdAt: Date
  updatedAt: Date
  displayName?: string | null
  bio?: string | null
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
    claimedAt: profile.claimedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    displayName: profile.displayName,
    bio: profile.bio,
    socialLinks: profile.socialLinks,
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
    claimedAt: profile.claimedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    displayName: profile.displayName,
    bio: profile.bio,
    socialLinks: profile.socialLinks,
  }
}
