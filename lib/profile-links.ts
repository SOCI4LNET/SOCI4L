export type ProfileLink = {
  id: string
  title: string
  url: string
  enabled: boolean
  categoryId?: string | null
  createdAt: string
  updatedAt: string
}

export type StoredProfileLinksState = {
  version: number
  updatedAt: string
  links: ProfileLink[]
}

export const PROFILE_LINKS_PRIMARY_KEY = 'soci4l.links.v1'
export const PROFILE_LINKS_LEGACY_KEY = 'soci4l.profileLinks.v1'

export function loadProfileLinksFromStorage(): ProfileLink[] {
  if (typeof window === 'undefined') return []

  try {
    let raw = window.localStorage.getItem(PROFILE_LINKS_PRIMARY_KEY)
    if (!raw) {
      raw = window.localStorage.getItem(PROFILE_LINKS_LEGACY_KEY)
    }
    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<StoredProfileLinksState> | null
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.links)) return []

    return parsed.links
      .filter(
        (link): link is ProfileLink =>
          !!link &&
          typeof link.id === 'string' &&
          typeof link.url === 'string' &&
          typeof link.enabled === 'boolean'
      )
      .map((link) => ({
        ...link,
        title: link.title || '',
        createdAt: link.createdAt || new Date().toISOString(),
        updatedAt: link.updatedAt || new Date().toISOString(),
      }))
  } catch (error) {
    console.error('[profile-links] Failed to load links from localStorage', error)
    return []
  }
}

